import ReconnectingWebSocket from "reconnecting-websocket";
import {
  ClientToServerMessage,
  ServerToClientMessage,
} from "../../shared/shared";
import { lobbySlice, roomSlice, store } from "./store";

const { VITE_WS_SERVER_HOST: HOST, VITE_WS_SERVER_PORT: PORT } = import.meta
  .env;

interface SocketConnection {
  send: (msg: ClientToServerMessage) => void;
}

const connect = (function () {
  return new Promise<SocketConnection>((resolve) => {
    const socket = new ReconnectingWebSocket(`ws://${HOST}:${PORT}`);

    // Event listener to be called when the WebSocket connection is opened
    socket.addEventListener("open", function () {
      // Send a message to the WebSocket server
      resolve({ send: (msg) => socket.send(JSON.stringify(msg)) });
    });

    // Event listener for errors
    socket.addEventListener("error", function (event) {
      console.error("WebSocket error: ", event);
    });

    // Event listener for when the connection is closed
    socket.addEventListener("close", function () {
      console.log("WebSocket connection closed");
    });

    socket.addEventListener("message", function (event) {
      console.log("Message from server ", event.data);
      try {
        const data = JSON.parse(event.data) as ServerToClientMessage;
        switch (data.type) {
          case "lobby-update":
            store.dispatch(lobbySlice.actions.setLobby(data.lobby));
            break;
          case "room-update":
            store.dispatch(roomSlice.actions.setRoom(data.room));
            break;
          default:
            console.error("Unknown message type: ", data);
        }
      } catch (err) {
        console.error(err);
      }
    });
  });
})();

export async function startRoom(name: string, playlistIds: string[]) {
  const socket = await connect;
  socket.send({
    name,
    playlistIds,
    type: "create-room",
  });
}

export async function joinRoom(roomId: string, username: string) {
  const socket = await connect;
  socket.send({
    roomId,
    name: username,
    type: "join-room",
  });
}

export async function leaveRoom() {
  const socket = await connect;
  socket.send({
    type: "leave-room",
  });
}

export async function readyUp() {
  const socket = await connect;
  socket.send({
    type: "ready",
  });
}

export async function submitCorrectGuess(guess: "title" | "artist") {
  const socket = await connect;
  socket.send({
    type: "guess",
    guess,
  });
}
