import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { buildAuthRouter } from "./routes/auth.js";
import { buildCharactersRouter } from "./routes/characters.js";
import { buildHealthRouter } from "./routes/health.js";
import { buildRoomsRouter } from "./routes/rooms.js";
import { buildRulesRouter } from "./routes/rules.js";
import { AuthService } from "./services/authService.js";
import { JsonStore } from "./services/jsonStore.js";
import { RoomService } from "./services/roomService.js";
import { RulesDataService } from "./services/rulesData.js";

export const createApp = () => {
  const app = express();
  const store = new JsonStore();
  const rules = new RulesDataService();
  const authService = new AuthService(store);
  const roomService = new RoomService(store);

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use(buildHealthRouter());
  app.use("/v1/auth", buildAuthRouter({ authService, store }));
  app.use("/v1/rules", buildRulesRouter({ rules }));
  app.use(
    "/v1/characters",
    buildCharactersRouter({ authService, store, rules })
  );
  app.use(
    "/v1/rooms",
    buildRoomsRouter({ authService, store, roomService })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return {
    app,
    services: {
      store,
      rules,
      authService,
      roomService
    }
  };
};
