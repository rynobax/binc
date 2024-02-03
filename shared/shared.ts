export const WS_PORT = 3000;

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
  | { type: "paused" }
  | {
      type: "song-queued";
      songUrl: string;
      previousSongs: {
        artistNames: string[];
        songUrl: string;
        albumArt: string;
      }[];
      scores: { name: string; score: number }[];
    }
  | { type: "song-playing"; songUrl: string; albumArt: string };

export interface ClientRoom {
  id: string;
  name: string;
  users: { id: string; name: string; ready: boolean }[];
  status: RoomStatus;
  gameState: GameState;
}

export type ClientToServerMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | ReadyMessage;

export interface CreateRoomMessage {
  type: "create-room";
  name: string;
  playlistIds: string[];
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
