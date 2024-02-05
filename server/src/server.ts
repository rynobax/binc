import {
  type ClientToServerMessage,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type Lobby,
  type RoomStatus,
  type PubSubTopic,
  type ClientRoom,
  type GuessMessage,
} from "../../shared/shared";
import { getPlaylistSongInfo } from "./spotify";
import { Game } from "./game";
import { songs } from "./songs";
import { publish, sendWSMessage, startServer, type WS } from "./websocket";
import { generateId } from "./util";

interface ServerRoom {
  id: string;
  name: string;
  playlistIds: string[];
  status: RoomStatus;
  game: Game;
  clientAccessToken: string;
}

const rooms = new Map<string, ServerRoom>();

function getLobby(): Lobby {
  return {
    rooms: Array.from(rooms).map(([id, room]) => ({
      id,
      name: room.name,
      players: room.game.users.length,
      status: room.status,
    })),
  };
}

function getClientRoom(roomId: string): ClientRoom {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  const sortedUsers = room.game.users.sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return {
    id: roomId,
    name: room.name,
    users: sortedUsers.map((u) => ({
      id: u.id,
      name: u.name,
      ready: u.ready,
    })),
    status: room.status,
    gameState: room.game.getState(),
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
  if (!message.name) throw new Error("Room name is required");
  try {
    const game = new Game(() => {
      globalUpdateRoom(roomId);
    });
    const room: ServerRoom = {
      id: roomId,
      name: message.name,
      playlistIds: message.playlistIds,
      status: "creating",
      game,
      clientAccessToken: message.accessToken,
    };
    rooms.set(roomId, room);

    // Notify of new room
    globalUpdateLobby();

    for (const playlist of message.playlistIds) {
      const tracks = await getPlaylistSongInfo(playlist, message.accessToken);
      for (const track of tracks) {
        songs.set(track.id, track);
        game.addSongs([track.id]);
      }
    }
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
  room.game.addUser({
    name: message.name,
    id: ws.data.userId,
  });
  subscribeToTopic(ws, `room-update-${message.roomId}`);
  globalUpdateLobby();
  globalUpdateRoom(message.roomId);
}

function handleLeaveRoom(ws: WS) {
  for (const room of rooms.values()) {
    const removed = room.game.removeUser(ws.data.userId);
    if (removed) {
      unsubscribeToTopic(ws, `room-update-${room.id}`);
      sendWSMessage(ws, {
        type: "room-update",
        topic: `room-update-${room.id}`,
        room: null,
      });
      globalUpdateRoom(room.id);

      if (room.game.users.length === 0) {
        rooms.delete(room.id);
      }
    }
  }
  globalUpdateLobby();
}

function handleReady(ws: WS) {
  const room = Array.from(rooms.values()).find((r) =>
    r.game.users.some((u) => u.id === ws.data.userId)
  );
  if (!room) throw new Error("Room not found");
  room.game.readyUser(ws.data.userId);
  globalUpdateRoom(room.id);
}

function handleGuess(data: GuessMessage, ws: WS) {
  const room = Array.from(rooms.values()).find((r) =>
    r.game.users.some((u) => u.id === ws.data.userId)
  );
  if (!room) throw new Error("Room not found");
  room.game.submitUserGuess(ws.data.userId, data.guess);
}

export function start() {
  startServer({
    onClose: (ws) => {
      handleLeaveRoom(ws);
    },
    onMessage: (ws, message) => {
      try {
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
          case "guess":
            handleGuess(data, ws);
            break;
          default:
            console.error("Unknown message type: ", data);
        }
      } catch (err) {
        console.error(err);
      }
    },
    onOpen: (ws) => {
      sendWSMessage(ws, {
        type: "lobby-update",
        topic: "lobby-update",
        lobby: getLobby(),
      });
      subscribeToTopic(ws, "lobby-update");
    },
  });
}
