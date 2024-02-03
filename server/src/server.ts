import type { ServerWebSocket } from "bun";
import {
  WS_PORT,
  type ClientToServerMessage,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type ServerToClientMessage,
  type PublishMessage,
  type Lobby,
  type RoomStatus,
} from "../../shared/shared";
import { getPlaylistSongInfo } from "./spotify";
import type { SongInfo } from "./types";

let server: ReturnType<typeof Bun.serve>;

function publish(message: PublishMessage) {
  server.publish(message.type, JSON.stringify(message));
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

type WS = ServerWebSocket<unknown>;

interface Room {
  name: string;
  playlistIds: string[];
  songIds: Set<string>;
  users: { name: string; ws: WS }[];
  status: RoomStatus;
}

const rooms = new Map<string, Room>();
const songs = new Map<string, SongInfo>();

function getLobby(): Lobby {
  return {
    rooms: Array.from(rooms).map(([id, room]) => ({
      id,
      name: room.name,
      players: room.users.length,
      status: room.status,
    })),
  };
}

function globalUpdateLobby() {
  publish({ type: "lobby-update", lobby: getLobby() });
}

async function handleCreateRoom(message: CreateRoomMessage) {
  const roomId = generateId();
  if (rooms.has(roomId)) throw new Error("Room ID collision");
  try {
    const room: Room = {
      name: message.name,
      playlistIds: message.playlistIds,
      users: [],
      songIds: new Set(),
      status: "creating",
    };
    rooms.set(roomId, room);

    // Notify of new room
    globalUpdateLobby();

    const songIds = new Set<string>();
    for (const playlist of message.playlistIds) {
      const tracks = await getPlaylistSongInfo(playlist);
      for (const track of tracks) {
        songs.set(track.id, track);
        songIds.add(track.id);
      }
    }
    room.songIds = songIds;
    room.status = "ready";
    rooms.set(roomId, room);

    // Notify of ready room
    globalUpdateLobby();
  } catch (err) {
    console.error(err);
    rooms.delete(roomId);
    globalUpdateLobby();
  }
}

function handleJoinRoom(message: JoinRoomMessage, ws: WS) {
  const room = rooms.get(message.roomId);
  if (!room) throw new Error("Room not found");
  room.users.push({ ws, name: message.name });
  globalUpdateLobby();
}

function sendWSMessage(ws: WS, message: ServerToClientMessage) {
  ws.send(JSON.stringify(message));
}

export function start() {
  server = Bun.serve({
    fetch(req, server) {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("Upgrade failed :(", { status: 500 });
    },
    websocket: {
      open(ws) {
        sendWSMessage(ws, { type: "lobby-update", lobby: getLobby() });
      },
      message(ws, message) {
        const data: ClientToServerMessage = JSON.parse(message.toString());
        console.log(data);
        switch (data.type) {
          case "create-room":
            handleCreateRoom(data);
            break;
          case "join-room":
            handleJoinRoom(data, ws);
            break;
          case "leave-room":
            // TODO
            break;
          default:
            console.error("Unknown message type: ", data);
        }
      },
    },
    port: WS_PORT,
  });

  console.log(`Server running at ws://localhost:${WS_PORT}`);
}
