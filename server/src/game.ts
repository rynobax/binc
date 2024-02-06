import { shuffle, type GameState, type GameScore } from "../../shared/shared";
import { songs } from "./songs";
import type { SongInfo } from "./types";
import { wait } from "./util";

const GAME_LENGTH = 15;
const ROUND_LENGTH = 30000;

interface GameUser {
  id: string;
  name: string;
  ready: boolean;
  score: number;
}

interface Guess {
  title: number;
  artist: number;
}

const NEW_GUESS = (): Guess => ({
  title: 0,
  artist: 0,
});

export class Game {
  public users: GameUser[] = [];
  private songIds: Set<string> = new Set();
  private broadcast: () => void;
  private songState: "queued" | "playing" | "paused" = "paused";
  private currentSong: SongInfo | null = null;
  private previousSongs: SongInfo[] = [];
  private guesses = new Map<string, Guess>();
  private roundStartTime = 0;

  constructor(broadcast: () => void) {
    this.broadcast = broadcast;
  }

  private numPeopleWhoGuessedBefore(guessTime: number) {
    return this.users.reduce((total, user) => {
      const guess = this.guesses.get(user.id);
      if (!guess) return total;
      const lastGuessTime = Math.max(guess.title, guess.artist);
      if (guess.title && guess.artist && lastGuessTime < guessTime)
        return total + 1;
      return total;
    }, 0);
  }

  private getUserRoundScore(userId: string) {
    const guess = this.guesses.get(userId);
    if (!guess) return 0;
    if (guess.title && guess.artist) {
      const penalty = this.numPeopleWhoGuessedBefore(
        Math.max(guess.title, guess.artist)
      );
      const bonus = Math.max(0, 3 - penalty);
      return 3 + bonus;
    }
    if (guess.title || guess.artist) return 1;
    return 0;
  }

  private getScores(): GameScore[] {
    return this.users
      .sort((a, b) => b.score - a.score)
      .map<GameScore>((u) => {
        const guess = this.guesses.get(u.id) || NEW_GUESS();
        return {
          name: u.name,
          score: u.score + this.getUserRoundScore(u.id),
          guesses: guess,
        };
      });
  }

  public getState(): GameState {
    if (this.songState === "paused") {
      const previousGameScores = this.getScores();
      const previousGameScoresAreAllZero = previousGameScores.every(
        (s) => s.score === 0
      );
      return {
        type: "paused",
        previousGameScores: previousGameScoresAreAllZero
          ? null
          : this.getScores(),
      };
    }
    if (!this.currentSong) throw new Error("No current song");
    return {
      type: this.songState,
      artistNames: this.currentSong.artists,
      songTitle: this.currentSong.title,
      previousSongs: this.previousSongs.map((s) => ({
        artistNames: s.artists,
        albumArt: s.albumCover,
        title: s.title,
        promotionalLink: s.promotionalLink,
      })),
      scores: this.getScores(),
      songUrl: this.currentSong.previewUrl,
      roundStartTime: this.roundStartTime,
      totalRounds: GAME_LENGTH,
      currentRound: this.previousSongs.length + 1,
    };
  }

  public addUser(user: Omit<GameUser, "ready" | "score">) {
    const userIsAlreadyInGame = this.users.some((u) => u.id === user.id);
    if (userIsAlreadyInGame) return;
    this.users.push({ ...user, ready: false, score: 0 });
  }

  public removeUser(userId: string) {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  public readyUser(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.ready = true;
    }
    this.startIfNeeded();
  }

  public addSongs(songIds: string[]) {
    for (const songId of songIds) {
      this.songIds.add(songId);
    }
  }

  private startIfNeeded() {
    if (this.users.length > 0 && this.users.every((u) => u.ready)) {
      this.start();
    }
  }

  private resetScores() {
    this.users.forEach((u) => {
      u.ready = false;
      u.score = 0;
    });
  }

  private resetGame() {
    this.songState = "paused";
    this.previousSongs = [];
    this.currentSong = null;
  }

  private resetRound() {
    this.guesses.clear();
  }

  public submitUserGuess(userId: string, guess: "title" | "artist") {
    const newGuess: Guess = this.guesses.get(userId) || NEW_GUESS();
    newGuess[guess] = Date.now();
    this.guesses.set(userId, newGuess);
    this.broadcast();
  }

  private async start() {
    this.resetScores();
    const songsToUse = shuffle(Array.from(this.songIds)).slice(0, GAME_LENGTH);
    console.log("Starting game with songs: ", songsToUse);
    for (const songId of songsToUse) {
      // broad cast next song with queued
      this.songState = "queued";
      const song = songs.get(songId);
      if (!song) throw new Error("Song not found");
      this.currentSong = song;
      this.broadcast();
      await wait(5000);

      // broadcast next song with playing
      this.songState = "playing";
      this.roundStartTime = Date.now();
      this.broadcast();
      await wait(ROUND_LENGTH);
      this.previousSongs.unshift(song);

      // score round
      for (const user of this.users) {
        user.score += this.getUserRoundScore(user.id);
      }
      this.resetRound();
    }

    // reset
    this.resetGame();
    this.broadcast();
  }
}
