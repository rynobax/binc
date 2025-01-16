import ReconnectingWebSocket from "reconnecting-websocket";
import {
  ClientToServerMessage,
  ServerToClientMessage,
} from "../../shared/shared";
import { lobbySlice, roomSlice, store } from "./store";
import env from "./env";

interface SocketConnection {
  send: (msg: ClientToServerMessage) => void;
}

const connect = (function () {
  return new Promise<SocketConnection>((resolve) => {
    const socket = new ReconnectingWebSocket(
      `wss://${env.VITE_SERVER_HOST}}/ws`
    );

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
  const accessToken = "youtube";
  // const accessToken = store.getState().user.spotifyToken?.token;
  // if (!accessToken) throw new Error("No access token found");
  socket.send({
    name,
    playlistIds,
    type: "create-room",
    accessToken,
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

export async function submitCorrectGuess(
  songId: string,
  guess: "title" | "artist"
) {
  const socket = await connect;
  socket.send({
    type: "guess",
    songId,
    guess,
  });
}
