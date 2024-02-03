import ReconnectingWebSocket from "reconnecting-websocket";
import {
  ClientToServerMessage,
  ServerToClientMessage,
  WS_PORT,
} from "../../shared/shared";
import { lobbySlice, store } from "./store";

interface SocketConnection {
  send: (msg: ClientToServerMessage) => void;
}

const connect = (function () {
  return new Promise<SocketConnection>((resolve) => {
    const socket = new ReconnectingWebSocket(`ws://localhost:${WS_PORT}`);

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
            store.dispatch(lobbySlice.actions.updateLobby(data.lobby));
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

export async function startRoom(playlistIds: string[]) {
  const socket = await connect;
  socket.send({
    name: "My Room",
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
