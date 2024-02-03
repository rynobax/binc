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

export type ClientToServerMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage;

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

export type ServerToClientMessage =
  | SongStartMessage
  | RoomCreatedMessage
  | LobbyUpdateMessage;

export interface SongStartMessage {
  type: "song-start";
  url: string;
}

export interface RoomCreatedMessage {
  type: "room-created";
  roomId: string;
  roomName: string;
}

export type PublishMessage = LobbyUpdateMessage;

export interface LobbyUpdateMessage {
  type: "lobby-update";
  lobby: Lobby;
}
