import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { buildAuthRouter } from "./routes/auth.js";
import { buildCharactersRouter } from "./routes/characters.js";
import { buildHealthRouter } from "./routes/health.js";
import { buildRoomsRouter } from "./routes/rooms.js";
import { buildRulesRouter } from "./routes/rules.js";
import { AuthService } from "./services/authService.js";
import { JsonStore } from "./services/jsonStore.js";
import { createLLMClient, type LLMClient } from "./services/llm/index.js";
import { NarrativeService } from "./services/narrativeService.js";
import type { Store } from "./services/store.js";
import { RoomService } from "./services/roomService.js";
import { RulesDataService } from "./services/rulesData.js";

export interface CreateAppOptions {
  store?: Store;
  llm?: LLMClient;
  /** Set false to skip NarrativeService (useful for route smoke tests). */
  enableNarrative?: boolean;
}

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  const store: Store = options.store ?? new JsonStore();
  const rules = new RulesDataService();
  const authService = new AuthService(store);

  const llm = options.enableNarrative === false ? undefined : options.llm ?? createLLMClient();
  const narrative = llm ? new NarrativeService(llm, store) : undefined;
  const roomService = new RoomService(store, { narrative });

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

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
