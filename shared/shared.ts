export interface Env {
  VITE_SERVER_HOST: string;
  VITE_WEB_SERVER_PORT: string;
  VITE_WS_SERVER_PORT: string;
  VITE_SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
}

export type RoomStatus = "creating" | "ready" | "playing";

export interface LobbyRoom {
  id: string;
  name: string;
  players: number;
  status: RoomStatus;
}

export interface Lobby {
  rooms: LobbyRoom[];
}

export type GameState =
  | {
      type: "paused";
      previousGameScores: { name: string; score: number }[] | null;
    }
  | {
      type: "queued" | "playing";
      songUrl: string;
      songTitle: string;
      artistNames: string[];
      previousSongs: {
        title: string;
        artistNames: string[];
        albumArt: string;
        promotionalLink: string;
      }[];
      scores: {
        name: string;
        score: number;
        guesses: {
          title: boolean;
          artist: boolean;
        };
      }[];
      currentRound: number;
      totalRounds: number;
    };

export interface ClientRoom {
  id: string;
  name: string;
  users: {
    id: string;
    name: string;
    ready: boolean;
  }[];
  status: RoomStatus;
  gameState: GameState;
}

export type ClientToServerMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | ReadyMessage
  | GuessMessage;

export interface CreateRoomMessage {
  type: "create-room";
  name: string;
  playlistIds: string[];
  accessToken: string;
}

export interface JoinRoomMessage {
  type: "join-room";
  roomId: string;
  name: string;
}

export interface LeaveRoomMessage {
  type: "leave-room";
}

export interface ReadyMessage {
  type: "ready";
}

export interface GuessMessage {
  type: "guess";
  guess: "title" | "artist";
}

export type ServerToClientMessage = LobbyUpdateMessage | RoomUpdateMessage;

export type PublishMessage = LobbyUpdateMessage | RoomUpdateMessage;

export type PubSubTopic = PublishMessage["topic"];

export interface LobbyUpdateMessage {
  topic: "lobby-update";
  type: "lobby-update";
  lobby: Lobby;
}

export interface RoomUpdateMessage {
  topic: `room-update-${string}`;
  type: "room-update";
  room: ClientRoom | null;
}

export function shuffle<T>(arr: T[]) {
  const length = arr.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  const result = [...arr];
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result;
}
