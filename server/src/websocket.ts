import type { ServerWebSocket } from "bun";
import {
  type PubSubTopic,
  type PublishMessage,
  type ServerToClientMessage,
} from "../../shared/shared";
import { generateId } from "./util";

const { VITE_WS_SERVER_PORT: PORT } = process.env;

interface WSContext {
  userId: string;
}

export type WS = ServerWebSocket<WSContext>;

let server: ReturnType<typeof Bun.serve>;

export function publish<T extends PubSubTopic>(
  topic: T,
  message: Extract<PublishMessage, { topic: T }>
) {
  server.publish(topic, JSON.stringify(message));
}

export function startServer(handlers: {
  onClose: (ws: ServerWebSocket<WSContext>) => void;
  onMessage: (ws: ServerWebSocket<WSContext>, message: string | Buffer) => void;
  onOpen: (ws: ServerWebSocket<WSContext>) => void;
}) {
  server = Bun.serve<WSContext>({
    fetch(req, server) {
      if (server.upgrade(req, { data: { userId: generateId() } })) {
        return;
      }
      return new Response("Upgrade failed :(", { status: 500 });
    },
    websocket: {
      close: handlers.onClose,
      message: handlers.onMessage,
      open: handlers.onOpen,
    },
    port: PORT,
  });

  console.log(`Server running at ws://localhost:${PORT}`);
}

export function sendWSMessage(ws: WS, message: ServerToClientMessage) {
  ws.send(JSON.stringify(message));
}
