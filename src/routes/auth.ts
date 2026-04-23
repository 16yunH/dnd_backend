import { Router } from "express";
import { z } from "zod";
import { AuthService } from "../services/authService.js";
import { JsonStore } from "../services/jsonStore.js";
import { requireAuth } from "../middleware/auth.js";

const guestLoginSchema = z.object({
  nickname: z.string().trim().min(1).max(32)
});

export const buildAuthRouter = (deps: {
  authService: AuthService;
  store: JsonStore;
}) => {
  const router = Router();

  router.post("/guest-login", async (req, res, next) => {
    try {
      const payload = guestLoginSchema.parse(req.body ?? {});
      const session = await deps.authService.issueGuestSession(payload.nickname);

      res.json({
        userId: session.user.id,
        nickname: session.user.nickname,
        accessToken: session.accessToken,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", requireAuth(deps.authService), async (req, res, next) => {
    try {
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        return res.status(404).json({
          message: "用户不存在"
        });
      }

      res.json({
        userId: user.id,
        nickname: user.nickname,
        createdAt: user.createdAt
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
