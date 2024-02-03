import type { ServerWebSocket } from "bun";
import {
  WS_PORT,
  type ClientToServerMessage,
  type CreateRoomMessage,
  type ConnectRoomMessage,
} from "../shared/shared";

function generateId() {
  return Math.random().toString(36).slice(2);
}

interface Room {
  name: string;
  playlistIds: string[];
  users: ServerWebSocket<unknown>[];
}

const rooms = new Map<string, Room>();

function handleCreateRoom(message: CreateRoomMessage) {
  const roomId = generateId();
  if (rooms.has(roomId)) throw new Error("Room ID collision");
  rooms.set(roomId, {
    name: message.name,
    playlistIds: message.playlistIds,
    users: [],
  });
}

function handleConnectRoom(
  message: ConnectRoomMessage,
  ws: ServerWebSocket<unknown>
) {
  const room = rooms.get(message.roomId);
  if (!room) throw new Error("Room not found");
  room.users.push(ws);
}

Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    message(ws, message) {
      const data: ClientToServerMessage = JSON.parse(message.toString());
      console.log(data);
      switch (data.type) {
        case "create-room":
          handleCreateRoom(data);
          break;
        case "connect-room":
          handleConnectRoom(data, ws);
          break;
        default:
          console.error("Unknown message type: ", data);
      }
    },
  },
  port: WS_PORT,
});

console.log(`Server running at ws://localhost:${WS_PORT}`);
