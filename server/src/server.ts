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
  type PubSubTopic,
  type ClientRoom,
} from "../../shared/shared";
import { getPlaylistSongInfo } from "./spotify";
import type { SongInfo } from "./types";

interface WSContext {
  userId: string;
}

let server: ReturnType<typeof Bun.serve>;

function publish<T extends PubSubTopic>(
  topic: T,
  message: Extract<PublishMessage, { topic: T }>
) {
  server.publish(topic, JSON.stringify(message));
}

let id = 1000;

function generateId() {
  const strID = id.toString();
  id++;
  return strID;
}

type WS = ServerWebSocket<WSContext>;

interface ServerRoom {
  id: string;
  name: string;
  playlistIds: string[];
  songIds: Set<string>;
  users: { id: string; name: string; ws: WS; ready: boolean }[];
  status: RoomStatus;
}

const rooms = new Map<string, ServerRoom>();
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

function getClientRoom(roomId: string): ClientRoom {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  const sortedUsers = room.users.sort((a, b) => a.name.localeCompare(b.name));
  return {
    id: roomId,
    name: room.name,
    users: sortedUsers.map((u) => ({ id: u.id, name: u.name, ready: u.ready })),
    status: room.status,
    gameState: { type: "paused" },
  };
}

function globalUpdateLobby() {
  publish("lobby-update", {
    type: "lobby-update",
    topic: "lobby-update",
    lobby: getLobby(),
  });
}

function globalUpdateRoom(roomId: string) {
  publish(`room-update-${roomId}`, {
    type: "room-update",
    topic: `room-update-${roomId}`,
    room: getClientRoom(roomId),
  });
}

function subscribeToTopic(ws: WS, topic: PubSubTopic) {
  ws.subscribe(topic);
}

function unsubscribeToTopic(ws: WS, topic: PubSubTopic) {
  ws.unsubscribe(topic);
}

async function handleCreateRoom(message: CreateRoomMessage) {
  const roomId = generateId();
  if (rooms.has(roomId)) throw new Error("Room ID collision");
  try {
    const room: ServerRoom = {
      id: roomId,
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
  handleLeaveRoom(ws);
  const room = rooms.get(message.roomId);
  if (!room) throw new Error("Room not found");
  room.users.push({ ws, name: message.name, id: ws.data.userId, ready: false });
  subscribeToTopic(ws, `room-update-${message.roomId}`);
  globalUpdateLobby();
  globalUpdateRoom(message.roomId);
}

function handleLeaveRoom(ws: WS) {
  for (const room of rooms.values()) {
    const index = room.users.findIndex((u) => u.id === ws.data.userId);
    if (index !== -1) {
      room.users.splice(index, 1);
      unsubscribeToTopic(ws, `room-update-${room.id}`);
      sendWSMessage(ws, {
        type: "room-update",
        topic: `room-update-${room.id}`,
        room: null,
      });
      globalUpdateRoom(room.id);
    }
  }
  globalUpdateLobby();
}

function handleReady(ws: WS) {
  const room = Array.from(rooms.values()).find((r) =>
    r.users.some((u) => u.id === ws.data.userId)
  );
  if (!room) throw new Error("Room not found");
  const user = room.users.find((u) => u.id === ws.data.userId);
  if (!user) throw new Error("User not found");
  user.ready = true;
  globalUpdateRoom(room.id);
}

function sendWSMessage(ws: WS, message: ServerToClientMessage) {
  ws.send(JSON.stringify(message));
}

export function start() {
  server = Bun.serve<WSContext>({
    fetch(req, server) {
      if (server.upgrade(req, { data: { userId: generateId() } })) {
        return;
      }
      return new Response("Upgrade failed :(", { status: 500 });
    },
    websocket: {
      open(ws) {
        sendWSMessage(ws, {
          type: "lobby-update",
          topic: "lobby-update",
          lobby: getLobby(),
        });
        subscribeToTopic(ws, "lobby-update");
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
            handleLeaveRoom(ws);
            break;
          case "ready":
            handleReady(ws);
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
