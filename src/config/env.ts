import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value ?? "4100");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 4100;
  }
  return parsed;
};

export const env = {
  PORT: parsePort(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV ?? "development"
};
