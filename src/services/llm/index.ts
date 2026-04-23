import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { EchoLLMClient } from "./echoClient.js";
import { OpenAICompatibleClient } from "./openaiCompatible.js";
import type { LLMClient } from "./types.js";

export * from "./types.js";

/** Default base URLs + models per provider (override via env). */
const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  zhipu: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash"
  },
  ollama: {
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:7b-instruct"
  }
};

export const createLLMClient = (): LLMClient => {
  const provider = (env.LLM_PROVIDER || "").toLowerCase();

  if (!env.LLM_API_KEY && provider !== "ollama") {
    logger.warn(
      { provider },
      "LLM_API_KEY not set — falling back to echo client"
    );
    return new EchoLLMClient();
  }

  const defaults = PROVIDER_DEFAULTS[provider];
  if (!defaults) {
    logger.warn({ provider }, "unknown LLM_PROVIDER — falling back to echo client");
    return new EchoLLMClient();
  }

  const baseUrl = env.LLM_BASE_URL || defaults.baseUrl;
  const model = env.LLM_MODEL || defaults.model;
  // Ollama in OpenAI-compat mode needs *some* auth header, tolerates any string.
  const apiKey = env.LLM_API_KEY || (provider === "ollama" ? "ollama" : "");

  return new OpenAICompatibleClient({
    provider,
    model,
    apiKey,
    baseUrl,
    supportsJsonMode: provider !== "ollama",
    supportsTools: provider !== "ollama"
  });
};
