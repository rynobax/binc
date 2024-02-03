import { songs } from "./songs";
import { shuffle, wait } from "./util";

const GAME_LENGTH = 15;
const ROUND_LENGTH = 30000;

interface GameUser {
  id: string;
  name: string;
  ready: boolean;
}

export class Game {
  public users: GameUser[] = [];
  private songIds: Set<string> = new Set();

  constructor() {}

  public addUser(user: Omit<GameUser, "ready">) {
    this.users.push({ ...user, ready: false });
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

  private async start() {
    const songsToUse = shuffle(Array.from(this.songIds).slice(0, GAME_LENGTH));
    console.log("Starting game with songs: ", songsToUse);
    await wait(5000);
    for (const songId of songsToUse) {
      const song = songs.get(songId);
      if (!song) throw new Error("Song not found");
      console.log("Playing song: ", songId);
      await wait(ROUND_LENGTH);
    }
  }
}
