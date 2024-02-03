import { WS_PORT } from "../../shared/shared";

export function connect() {
  // Create a new WebSocket connection to the specified URL
  const socket = new WebSocket(`ws://localhost:3000${WS_PORT}`);

  // Event listener to be called when the WebSocket connection is opened
  socket.addEventListener("open", function () {
    // Send a message to the WebSocket server
    socket.send("hello");
  });

  // Event listener for receiving messages from the server
  socket.addEventListener("message", function (event) {
    console.log("Message from server ", event.data);
  });

  // Event listener for errors
  socket.addEventListener("error", function (event) {
    console.error("WebSocket error: ", event);
  });

  // Event listener for when the connection is closed
  socket.addEventListener("close", function () {
    console.log("WebSocket connection closed");
  });
}
