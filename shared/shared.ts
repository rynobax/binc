export const WS_PORT = 3000;

export type ClientToServerMessage = CreateRoomMessage | ConnectRoomMessage;

export type ServerToClientMessage = SongStartMessage;

export interface CreateRoomMessage {
  type: "create-room";
  name: string;
  playlistIds: string[];
}

export interface ConnectRoomMessage {
  type: "connect-room";
  roomId: string;
}

export interface SongStartMessage {
  type: "song-start";
  url: string;
}
