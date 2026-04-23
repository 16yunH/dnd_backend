import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { SocketHub } from "./realtime/socketHub.js";

const { app, services } = createApp();
const httpServer = createServer(app);

const socketHub = new SocketHub(httpServer, {
  authService: services.authService,
  roomService: services.roomService
});
services.roomService.setPublisher(socketHub);

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "dnd-backend listening");
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "shutting down");
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
