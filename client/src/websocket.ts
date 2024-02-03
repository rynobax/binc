import { ClientToServerMessage, WS_PORT } from "../../shared/shared";

interface SocketConnection {
  send: (msg: ClientToServerMessage) => void;
}

const connect = (function () {
  return new Promise<SocketConnection>((resolve) => {
    // Create a new WebSocket connection to the specified URL
    const socket = new WebSocket(`ws://localhost:${WS_PORT}`);

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
  });
})();

export async function startRoom() {
  const socket = await connect;
  socket.send({
    name: "My Room",
    playlistIds: ["1", "2"],
    type: "create-room",
  });
}
