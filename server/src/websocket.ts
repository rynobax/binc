import type { ServerWebSocket } from "bun";
import {
  WS_PORT,
  type PubSubTopic,
  type PublishMessage,
  type ServerToClientMessage,
} from "../../shared/shared";
import { generateId } from "./util";

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

export function startServer(
  onOpen: (ws: ServerWebSocket<WSContext>) => void,
  onMessage: (ws: ServerWebSocket<WSContext>, message: string | Buffer) => void
) {
  server = Bun.serve<WSContext>({
    fetch(req, server) {
      if (server.upgrade(req, { data: { userId: generateId() } })) {
        return;
      }
      return new Response("Upgrade failed :(", { status: 500 });
    },
    websocket: {
      open: onOpen,
      message: onMessage,
    },
    port: WS_PORT,
  });

  console.log(`Server running at ws://localhost:${WS_PORT}`);
}

export function sendWSMessage(ws: WS, message: ServerToClientMessage) {
  ws.send(JSON.stringify(message));
}
