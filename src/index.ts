import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { SocketHub } from "./realtime/socketHub.js";

const { app, services } = createApp();
const httpServer = createServer(app);

const socketHub = new SocketHub(httpServer, {
  authService: services.authService,
  roomService: services.roomService
});
services.roomService.setPublisher(socketHub);

httpServer.listen(env.PORT, () => {
  console.log(`[dnd-backend] running on port ${env.PORT}`);
});
