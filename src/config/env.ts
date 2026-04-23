import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined, fallback = 4100): number => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const parseList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const str = (value: string | undefined, fallback = ""): string =>
  (value ?? fallback).trim();

export const env = {
  PORT: parsePort(process.env.PORT),
  NODE_ENV: str(process.env.NODE_ENV, "development"),
  LOG_LEVEL: str(process.env.LOG_LEVEL, "info"),
  CORS_ORIGINS: parseList(process.env.CORS_ORIGINS),

  DATABASE_URL: str(process.env.DATABASE_URL),

  LLM_PROVIDER: str(process.env.LLM_PROVIDER, "deepseek"),
  LLM_MODEL: str(process.env.LLM_MODEL),
  LLM_API_KEY: str(process.env.LLM_API_KEY),
  LLM_BASE_URL: str(process.env.LLM_BASE_URL),

  EMBEDDING_PROVIDER: str(process.env.EMBEDDING_PROVIDER, "ollama"),
  EMBEDDING_MODEL: str(process.env.EMBEDDING_MODEL, "bge-m3"),
  EMBEDDING_API_KEY: str(process.env.EMBEDDING_API_KEY),
  EMBEDDING_BASE_URL: str(process.env.EMBEDDING_BASE_URL, "http://127.0.0.1:11434")
} as const;

export const isProduction = () => env.NODE_ENV === "production";
export const isTest = () => env.NODE_ENV === "test";
