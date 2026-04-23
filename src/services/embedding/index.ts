import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { EchoEmbeddingClient } from "./echoEmbedding.js";
import { HttpEmbeddingClient } from "./httpEmbedding.js";
import type { EmbeddingClient } from "./types.js";

export * from "./types.js";

interface ProviderDefaults {
  baseUrl: string;
  model: string;
  dialect: "openai" | "ollama";
  dimensions: number;
  requiresKey: boolean;
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  ollama: {
    baseUrl: "http://127.0.0.1:11434",
    model: "bge-m3",
    dialect: "ollama",
    dimensions: 1024,
    requiresKey: false
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "text-embedding-3-small",
    dialect: "openai",
    dimensions: 1536,
    requiresKey: true
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-embedding",
    dialect: "openai",
    dimensions: 1024,
    requiresKey: true
  },
  zhipu: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "embedding-3",
    dialect: "openai",
    dimensions: 2048,
    requiresKey: true
  }
};

export const createEmbeddingClient = (): EmbeddingClient => {
  const provider = (env.EMBEDDING_PROVIDER || "").toLowerCase();
  const defaults = PROVIDER_DEFAULTS[provider];

  if (!defaults) {
    logger.warn({ provider }, "unknown EMBEDDING_PROVIDER — using echo fallback");
    return new EchoEmbeddingClient();
  }
  if (defaults.requiresKey && !env.EMBEDDING_API_KEY) {
    logger.warn({ provider }, "EMBEDDING_API_KEY missing — using echo fallback");
    return new EchoEmbeddingClient();
  }

  return new HttpEmbeddingClient({
    provider,
    model: env.EMBEDDING_MODEL || defaults.model,
    baseUrl: env.EMBEDDING_BASE_URL || defaults.baseUrl,
    apiKey: env.EMBEDDING_API_KEY || undefined,
    dimensions: defaults.dimensions,
    dialect: defaults.dialect
  });
};
