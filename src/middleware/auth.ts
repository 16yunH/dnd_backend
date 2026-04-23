import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError.js";
import { AuthService } from "../services/authService.js";

export const requireAuth = (authService: AuthService) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.header("authorization");
      if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
        throw new HttpError(401, "缺少 Bearer Token");
      }

      const token = authHeader.slice(7).trim();
      const user = await authService.verifyToken(token);
      if (!user) {
        throw new HttpError(401, "会话无效或已过期，请重新登录");
      }

      req.auth = {
        token,
        userId: user.id
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};
