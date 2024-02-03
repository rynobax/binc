import { WS_PORT } from "../shared/shared";

Bun.serve({
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    message(ws, message) {
      ws.send(message); // echo back the message
    },
  }, // handlers
  port: WS_PORT,
});

console.log(`Server running at ws://localhost:${WS_PORT}`);
