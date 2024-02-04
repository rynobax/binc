import { shuffle, type GameState } from "../../shared/shared";
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

export class Game {
  public users: GameUser[] = [];
  private songIds: Set<string> = new Set();
  private broadcast: () => void;
  private songState: "queued" | "playing" | "paused" = "paused";
  private currentSong: SongInfo | null = null;
  private previousSongs: SongInfo[] = [];
  private guesses = new Map<string, { title: boolean; artist: boolean }>();

  constructor(broadcast: () => void) {
    this.broadcast = broadcast;
  }

  private getUserRoundScore(userId: string) {
    const guess = this.guesses.get(userId);
    if (!guess) return 0;
    if (guess.title && guess.artist) return 6;
    if (guess.title || guess.artist) return 1;
    return 0;
  }

  public getState(): GameState {
    if (this.songState === "paused") return { type: "paused" };
    if (!this.currentSong) throw new Error("No current song");
    return {
      type: this.songState,
      artistNames: this.currentSong.artists,
      songTitle: this.currentSong.title,
      previousSongs: this.previousSongs.map((s) => ({
        artistNames: s.artists,
        songUrl: s.previewUrl,
        albumArt: s.albumCover,
      })),
      scores: this.users.map((u) => {
        return {
          name: u.name,
          score: u.score + this.getUserRoundScore(u.id),
        };
      }),
      songUrl: this.currentSong.previewUrl,
    };
  }

  public addUser(user: Omit<GameUser, "ready" | "score">) {
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
    if (this.users.every((u) => u.ready)) {
      this.start();
    }
  }

  private reset() {
    this.songState = "paused";
    this.previousSongs = [];
    this.currentSong = null;
    this.users.forEach((u) => {
      u.ready = false;
      u.score = 0;
    });
  }

  public submitUserGuess(userId: string, guess: "title" | "artist") {
    const newGuess = this.guesses.get(userId) || {
      title: false,
      artist: false,
    };
    newGuess[guess] = true;
    this.guesses.set(userId, newGuess);
    this.broadcast();
  }

  private async start() {
    const songsToUse = shuffle(Array.from(this.songIds).slice(0, GAME_LENGTH));
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
      this.broadcast();
      await wait(ROUND_LENGTH);
      this.previousSongs.push(song);

      // score round
      for (const user of this.users) {
        user.score += this.getUserRoundScore(user.id);
      }
    }

    // reset
    this.reset();
    this.broadcast();
  }
}
