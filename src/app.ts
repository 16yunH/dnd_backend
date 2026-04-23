import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { buildAuthRouter } from "./routes/auth.js";
import { buildCharactersRouter } from "./routes/characters.js";
import { buildHealthRouter } from "./routes/health.js";
import { buildRoomsRouter } from "./routes/rooms.js";
import { buildRulesRouter } from "./routes/rules.js";
import { AuthService } from "./services/authService.js";
import { CombatService } from "./services/combatService.js";
import { createEmbeddingClient } from "./services/embedding/index.js";
import { JsonStore } from "./services/jsonStore.js";
import { createLLMClient, type LLMClient } from "./services/llm/index.js";
import { MemoryService } from "./services/memoryService.js";
import { NarrativeService } from "./services/narrativeService.js";
import { InMemoryVectorStore } from "./services/rag/inMemoryVectorStore.js";
import { RagService } from "./services/rag/ragService.js";
import type { Store } from "./services/store.js";
import { RoomService } from "./services/roomService.js";
import { RulesDataService } from "./services/rulesData.js";

export interface CreateAppOptions {
  store?: Store;
  llm?: LLMClient;
  rag?: RagService;
  enableNarrative?: boolean;
  enableRag?: boolean;
  enableDb?: boolean;
}

const tryLoadRag = async (): Promise<RagService | undefined> => {
  if (!env.RAG_DUMP_PATH) return undefined;
  try {
    const embedding = createEmbeddingClient();
    const store = new InMemoryVectorStore(embedding.dimensions);
    const count = await store.load(env.RAG_DUMP_PATH);
    if (count === 0) {
      logger.warn({ path: env.RAG_DUMP_PATH }, "rag dump empty or missing");
      return undefined;
    }
    logger.info(
      { path: env.RAG_DUMP_PATH, chunks: count, provider: embedding.provider },
      "rag: dump loaded"
    );
    return new RagService({ embedding, store });
  } catch (err) {
    logger.error({ err }, "rag: failed to load dump, disabling");
    return undefined;
  }
};

export const createApp = async (options: CreateAppOptions = {}) => {
  const app = express();

  let store: Store;
  if (options.store) {
    store = options.store;
  } else if (env.DATABASE_URL && options.enableDb !== false) {
    try {
      const { PrismaStore } = await import("./services/prismaStore.js");
      const prismaStore = new PrismaStore();
      await prismaStore.init();
      store = prismaStore;
      logger.info("store: using PrismaStore (postgresql)");
    } catch (err) {
      logger.warn({ err }, "store: PrismaStore init failed, falling back to JsonStore");
      store = new JsonStore();
    }
  } else {
    store = new JsonStore();
  }

  const rules = new RulesDataService();
  const authService = new AuthService(store);

  const llm =
    options.enableNarrative === false ? undefined : options.llm ?? createLLMClient();
  const rag =
    options.enableRag === false
      ? undefined
      : options.rag ?? (await tryLoadRag());
  const narrative = llm
    ? new NarrativeService(llm, store, {
        rag,
        memory: new MemoryService(llm, store)
      })
    : undefined;
  const roomService = new RoomService(store, { narrative });
  const combatService = new CombatService(store);

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
    buildCharactersRouter({ authService, store, rules, llm })
  );
  app.use(
    "/v1/rooms",
    buildRoomsRouter({ authService, store, roomService, combatService })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return {
    app,
    services: {
      store,
      rules,
      authService,
      roomService,
      combatService,
      llm,
      rag,
      narrative
    }
  };
};
