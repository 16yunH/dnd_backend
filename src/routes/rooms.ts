import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AuthService } from "../services/authService.js";
import { JsonStore } from "../services/jsonStore.js";
import { RoomService } from "../services/roomService.js";
import { HttpError } from "../lib/httpError.js";

const createRoomSchema = z.object({
  maxPlayers: z.number().int().min(2).max(10).default(4),
  isPrivate: z.boolean().default(false),
  password: z.string().max(64).default(""),
  expansion: z.string().trim().min(1).max(64).default("PHB基础"),
  campaign: z.string().trim().min(1).max(128).default("费伦大陆：被遗忘的国度")
});

const joinRoomSchema = z.object({
  password: z.string().max(64).optional().default("")
});

const readySchema = z.object({
  isReady: z.boolean(),
  characterId: z.string().uuid().optional(),
  expectedRoomVersion: z.number().int().positive().optional()
});

const startSchema = z.object({
  expectedRoomVersion: z.number().int().positive().optional()
});

const actionSchema = z.object({
  content: z.string().trim().min(1).max(1000)
});

const messagesQuerySchema = z.object({
  afterSeq: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100)
});

export const buildRoomsRouter = (deps: {
  authService: AuthService;
  store: JsonStore;
  roomService: RoomService;
}) => {
  const router = Router();

  router.use(requireAuth(deps.authService));

  router.post("/", async (req, res, next) => {
    try {
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }

      const payload = createRoomSchema.parse(req.body ?? {});
      const room = await deps.roomService.createRoom(user, payload);
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:roomId", async (req, res, next) => {
    try {
      const room = await deps.roomService.getRoom(req.params.roomId.toUpperCase());
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/join", async (req, res, next) => {
    try {
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }

      const payload = joinRoomSchema.parse(req.body ?? {});
      const room = await deps.roomService.joinRoom(
        user,
        req.params.roomId.toUpperCase(),
        payload.password
      );
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/leave", async (req, res, next) => {
    try {
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      const room = await deps.roomService.leaveRoom(user, req.params.roomId.toUpperCase());
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/ready", async (req, res, next) => {
    try {
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      const payload = readySchema.parse(req.body ?? {});
      const room = await deps.roomService.setReady(
        user,
        req.params.roomId.toUpperCase(),
        payload
      );
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/start", async (req, res, next) => {
    try {
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      const payload = startSchema.parse(req.body ?? {});
      const room = await deps.roomService.startRoom(
        user,
        req.params.roomId.toUpperCase(),
        payload
      );
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:roomId/messages", async (req, res, next) => {
    try {
      const query = messagesQuerySchema.parse(req.query ?? {});
      const roomId = req.params.roomId.toUpperCase();
      const room = await deps.roomService.getRoom(roomId);
      const messages = await deps.roomService.listMessages(
        roomId,
        query.afterSeq,
        query.limit
      );
      res.json({
        roomVersion: room.roomVersion,
        messages
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/actions", async (req, res, next) => {
    try {
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }

      const payload = actionSchema.parse(req.body ?? {});
      const result = await deps.roomService.submitAction(
        user,
        req.params.roomId.toUpperCase(),
        payload
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
