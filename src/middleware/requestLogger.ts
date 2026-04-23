import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durMs: Math.round(durMs)
      },
      "http"
    );
  });
  next();
};
