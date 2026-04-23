import pino from "pino";
import { env, isProduction, isTest } from "../config/env.js";

export const logger = pino({
  level: isTest() ? "silent" : env.LOG_LEVEL,
  base: { service: "dnd-backend" },
  transport: isProduction()
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss.l" }
      }
});
