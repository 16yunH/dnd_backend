import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/httpError.js";
import { requireAuth } from "../middleware/auth.js";
import { AuthService } from "../services/authService.js";
import { JsonStore } from "../services/jsonStore.js";
import { RulesDataService } from "../services/rulesData.js";
import { computeDerivedStats } from "../lib/derivedStats.js";
import type { CharacterInput } from "../types/domain.js";

const scoreSchema = z.number().int().min(1).max(30);

const characterInputSchema = z.object({
  basic: z.object({
    name: z.string().trim().min(1).max(64),
    race: z.string().trim().min(1),
    charClass: z.string().trim().min(1),
    background: z.string().trim().default("平民"),
    level: z.number().int().min(1).max(20),
    customPortrait: z.string().optional().default("")
  }),
  statMethod: z.enum(["pointBuy", "roll"]).default("pointBuy"),
  baseStats: z.object({
    str: scoreSchema,
    dex: scoreSchema,
    con: scoreSchema,
    int: scoreSchema,
    wis: scoreSchema,
    cha: scoreSchema
  }),
  proficiencies: z
    .object({
      skills: z.record(z.string(), z.boolean()).default({})
    })
    .default({ skills: {} }),
  equipment: z
    .object({
      armor: z.string().default("none"),
      shield: z.boolean().default(false),
      weapons: z.string().default("")
    })
    .default({ armor: "none", shield: false, weapons: "" }),
  spells: z.string().default(""),
  specialAttrs: z.string().default("")
});

const characterPatchSchema = z.object({
  basic: z
    .object({
      name: z.string().trim().min(1).max(64),
      race: z.string().trim().min(1),
      charClass: z.string().trim().min(1),
      background: z.string().trim().min(1),
      level: z.number().int().min(1).max(20),
      customPortrait: z.string().optional()
    })
    .partial()
    .optional(),
  statMethod: z.enum(["pointBuy", "roll"]).optional(),
  baseStats: z
    .object({
      str: scoreSchema,
      dex: scoreSchema,
      con: scoreSchema,
      int: scoreSchema,
      wis: scoreSchema,
      cha: scoreSchema
    })
    .partial()
    .optional(),
  proficiencies: z
    .object({
      skills: z.record(z.string(), z.boolean()).optional()
    })
    .optional(),
  equipment: z
    .object({
      armor: z.string().optional(),
      shield: z.boolean().optional(),
      weapons: z.string().optional()
    })
    .optional(),
  spells: z.string().optional(),
  specialAttrs: z.string().optional()
});

type CharacterPatch = z.infer<typeof characterPatchSchema>;

const mergeCharacter = (
  source: CharacterInput,
  patch: CharacterPatch
): CharacterInput => {
  return {
    ...source,
    ...patch,
    basic: {
      ...source.basic,
      ...patch.basic
    },
    baseStats: {
      ...source.baseStats,
      ...patch.baseStats
    },
    proficiencies: {
      ...source.proficiencies,
      ...patch.proficiencies,
      skills: {
        ...source.proficiencies.skills,
        ...patch.proficiencies?.skills
      }
    },
    equipment: {
      ...source.equipment,
      ...patch.equipment
    },
    spells: patch.spells ?? source.spells,
    specialAttrs: patch.specialAttrs ?? source.specialAttrs
  };
};

export const buildCharactersRouter = (deps: {
  authService: AuthService;
  store: JsonStore;
  rules: RulesDataService;
}) => {
  const router = Router();

  router.use(requireAuth(deps.authService));

  router.get("/", async (req, res, next) => {
    try {
      const items = await deps.store.listCharactersByUser(req.auth!.userId);
      res.json({
        items
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const payload = characterInputSchema.parse(req.body ?? {});
      const now = new Date().toISOString();
      const record = {
        ...payload,
        id: randomUUID(),
        ownerUserId: req.auth!.userId,
        createdAt: now,
        updatedAt: now,
        derived: computeDerivedStats(payload, deps.rules)
      };

      await deps.store.upsertCharacter(record);
      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:characterId", async (req, res, next) => {
    try {
      const patch = characterPatchSchema.parse(req.body ?? {});
      const current = await deps.store.getCharacterById(
        req.auth!.userId,
        req.params.characterId
      );

      if (!current) {
        throw new HttpError(404, "角色不存在");
      }

      const merged = mergeCharacter(current, patch);
      const updated = {
        ...current,
        ...merged,
        updatedAt: new Date().toISOString(),
        derived: computeDerivedStats(merged, deps.rules)
      };

      await deps.store.upsertCharacter(updated);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:characterId", async (req, res, next) => {
    try {
      const deleted = await deps.store.deleteCharacter(
        req.auth!.userId,
        req.params.characterId
      );

      if (!deleted) {
        throw new HttpError(404, "角色不存在");
      }

      res.json({
        deleted: true
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
