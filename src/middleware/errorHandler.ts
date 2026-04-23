import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError.js";
import { logger } from "../lib/logger.js";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    code: "not_found",
    message: "接口不存在"
  });
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      code: "validation_error",
      message: "请求参数校验失败",
      details: error.issues
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details
    });
  }

  logger.error(
    { err: error, path: req.path, method: req.method },
    "unhandled error"
  );
  return res.status(500).json({
    code: "internal_error",
    message: "服务器内部错误"
  });
};
