import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AuthService } from "../services/authService.js";
import { CombatService } from "../services/combatService.js";
import type { Store } from "../services/store.js";
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

const gridInitSchema = z.object({
  width: z.number().int().min(5).max(100),
  height: z.number().int().min(5).max(100)
});

const gridMoveSchema = z.object({
  tokenId: z.string().uuid(),
  x: z.number().int().min(0),
  y: z.number().int().min(0)
});

const gridTokenSchema = z.object({
  kind: z.enum(["pc", "npc", "object"]),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  characterId: z.string().uuid().optional(),
  label: z.string().max(64).optional(),
  color: z.string().max(16).optional()
});

const messagesQuerySchema = z.object({
  afterSeq: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100)
});

const combatStartSchema = z.object({
  participants: z.array(z.object({
    name: z.string().min(1).max(64),
    type: z.enum(["pc", "npc"]),
    characterId: z.string().uuid().optional(),
    dexModifier: z.number().int().optional(),
    maxHp: z.number().int().min(1),
    ac: z.number().int().min(0)
  })).min(1)
});

const combatDamageSchema = z.object({
  combatantId: z.string().uuid(),
  amount: z.number().int().min(1),
  type: z.string().max(32).optional()
});

const combatHealSchema = z.object({
  combatantId: z.string().uuid(),
  amount: z.number().int().min(1)
});

const combatTempHpSchema = z.object({
  combatantId: z.string().uuid(),
  amount: z.number().int().min(1)
});

const combatConditionSchema = z.object({
  combatantId: z.string().uuid(),
  condition: z.string().min(1).max(64)
});

export const buildRoomsRouter = (deps: {
  authService: AuthService;
  store: Store;
  roomService: RoomService;
  combatService: CombatService;
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

  router.post("/:roomId/grid/init", async (req, res, next) => {
    try {
      const payload = gridInitSchema.parse(req.body ?? {});
      const room = await deps.roomService.initGrid(
        req.params.roomId.toUpperCase(),
        payload.width,
        payload.height
      );
      res.json(room.grid);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/grid/move", async (req, res, next) => {
    try {
      const payload = gridMoveSchema.parse(req.body ?? {});
      const room = await deps.roomService.moveToken(
        req.params.roomId.toUpperCase(),
        payload.tokenId,
        payload.x,
        payload.y
      );
      res.json(room.grid);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/grid/token", async (req, res, next) => {
    try {
      const payload = gridTokenSchema.parse(req.body ?? {});
      const room = await deps.roomService.addToken(
        req.params.roomId.toUpperCase(),
        payload
      );
      res.json(room.grid);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:roomId/grid/token/:tokenId", async (req, res, next) => {
    try {
      const room = await deps.roomService.removeToken(
        req.params.roomId.toUpperCase(),
        req.params.tokenId
      );
      res.json(room.grid);
    } catch (error) {
      next(error);
    }
  });

  const assertHostOrCurrentTurn = async (roomId: string, userId: string) => {
    const room = await deps.roomService.getRoom(roomId);
    if (room.hostUserId === userId) return;
    if (room.combat) {
      const current = room.combat.combatants[room.combat.turnIndex];
      if (current?.type === "pc") {
        const player = room.players.find((p) => p.characterId === current.characterId);
        if (player?.userId === userId) return;
      }
    }
    throw new HttpError(403, "仅房主或当前回合玩家可操作");
  };

  router.post("/:roomId/combat/start", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      const room = await deps.roomService.getRoom(roomId);
      if (room.hostUserId !== user.id) {
        throw new HttpError(403, "仅房主可发起战斗");
      }
      const payload = combatStartSchema.parse(req.body ?? {});
      const updated = await deps.combatService.startCombat(roomId, payload.participants);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/combat/next-turn", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      await assertHostOrCurrentTurn(roomId, user.id);
      const updated = await deps.combatService.nextTurn(roomId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/combat/damage", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      await assertHostOrCurrentTurn(roomId, user.id);
      const payload = combatDamageSchema.parse(req.body ?? {});
      const combatant = await deps.combatService.applyDamage(
        roomId,
        payload.combatantId,
        payload.amount,
        payload.type
      );
      res.json(combatant);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/combat/heal", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      await assertHostOrCurrentTurn(roomId, user.id);
      const payload = combatHealSchema.parse(req.body ?? {});
      const combatant = await deps.combatService.heal(
        roomId,
        payload.combatantId,
        payload.amount
      );
      res.json(combatant);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/combat/temp-hp", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      await assertHostOrCurrentTurn(roomId, user.id);
      const payload = combatTempHpSchema.parse(req.body ?? {});
      const combatant = await deps.combatService.addTempHp(
        roomId,
        payload.combatantId,
        payload.amount
      );
      res.json(combatant);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/combat/condition", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      await assertHostOrCurrentTurn(roomId, user.id);
      const payload = combatConditionSchema.parse(req.body ?? {});
      const combatant = await deps.combatService.addCondition(
        roomId,
        payload.combatantId,
        payload.condition
      );
      res.json(combatant);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:roomId/combat/condition", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      await assertHostOrCurrentTurn(roomId, user.id);
      const payload = combatConditionSchema.parse(req.body ?? {});
      const combatant = await deps.combatService.removeCondition(
        roomId,
        payload.combatantId,
        payload.condition
      );
      res.json(combatant);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:roomId/combat/end", async (req, res, next) => {
    try {
      const roomId = req.params.roomId.toUpperCase();
      const user = await deps.store.getUserById(req.auth!.userId);
      if (!user) {
        throw new HttpError(404, "用户不存在");
      }
      const room = await deps.roomService.getRoom(roomId);
      if (room.hostUserId !== user.id) {
        throw new HttpError(403, "仅房主可结束战斗");
      }
      const updated = await deps.combatService.endCombat(roomId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
