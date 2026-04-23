import { z } from "zod";
import { logger } from "../lib/logger.js";
import type { LLMClient } from "./llm/types.js";
import { RulesDataService } from "./rulesData.js";

const draftBasicSchema = z.object({
  name: z.string().min(1).max(64),
  race: z.string().min(1),
  charClass: z.string().min(1),
  background: z.string().min(1),
  level: z.number().int().min(1).max(20)
});

const draftBaseStatsSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30)
});

const draftProficienciesSchema = z.object({
  skills: z.record(z.string(), z.boolean())
});

const draftEquipmentSchema = z.object({
  armor: z.string(),
  shield: z.boolean(),
  weapons: z.string()
});

const draftSpellsSchema = z.string();

const draftSpecialAttrsSchema = z.string();

const draftSchema = z.object({
  basic: draftBasicSchema,
  baseStats: draftBaseStatsSchema,
  proficiencies: draftProficienciesSchema.default({ skills: {} }),
  equipment: draftEquipmentSchema.default({ armor: "none", shield: false, weapons: "" }),
  spells: draftSpellsSchema.default(""),
  specialAttrs: draftSpecialAttrsSchema.default("")
});

export type CharacterDraft = z.infer<typeof draftSchema>;

export interface DraftValidation {
  valid: boolean;
  issues: DraftValidationIssue[];
}

export interface DraftValidationIssue {
  field: string;
  value: unknown;
  reason: string;
}

export interface AiDraftResult {
  draft: CharacterDraft;
  validation: DraftValidation;
}

const buildPrompt = (rules: RulesDataService, userPrompt: string): string => {
  const payload = rules.getBootstrapPayload();

  const raceList = payload.races
    .map((r: any) => `${r.id}(${r.name})`)
    .join("、");

  const classList = payload.classes
    .map((c: any) => `${c.id}(${c.name})`)
    .join("、");

  const backgroundList = payload.backgrounds
    .map((b: any) => `${b.id}(${b.name})`)
    .join("、");

  const skillList = payload.skills
    .map((s: any) => `${s.id}(${s.name})`)
    .join("、");

  const armorList = payload.armours
    .map((a: any) => `${a.id}(${a.name})`)
    .join("、");

  return `你是一个D&D 5e角色创建助手。用户会用自然语言描述想要创建的角色，你需要根据描述生成一份结构化的角色草案。

## 可用种族
${raceList}

## 可用职业
${classList}

## 可用背景
${backgroundList}

## 可用技能
${skillList}

## 可用护甲
${armorList}

## 输出要求
请严格按照以下JSON格式输出，不要输出任何其他内容：
{
  "basic": {
    "name": "角色名称",
    "race": "种族ID（必须使用上面列出的ID，如human、elf、dwarf）",
    "charClass": "职业ID（必须使用上面列出的ID，如fighter、wizard、rogue）",
    "background": "背景ID（必须使用上面列出的ID，如acolyte、soldier）",
    "level": 1
  },
  "baseStats": {
    "str": 10,
    "dex": 10,
    "con": 10,
    "int": 10,
    "wis": 10,
    "cha": 10
  },
  "proficiencies": {
    "skills": {
      "技能ID": true
    }
  },
  "equipment": {
    "armor": "护甲ID或none",
    "shield": false,
    "weapons": "武器描述文本"
  },
  "spells": "法术描述文本，如无则留空",
  "specialAttrs": "特殊属性描述，如无则留空"
}

## 规则提示
- 属性值范围1-30，普通1级角色通常在8-18之间
- 种族和职业必须使用上面列出的ID，不要使用中文名称
- 背景必须使用上面列出的ID
- 技能熟练项使用技能ID，值为true表示熟练
- 根据种族和职业合理分配属性值和技能
- 等级范围1-20

## 用户描述
${userPrompt}`;
};

const validateDraft = (
  draft: CharacterDraft,
  rules: RulesDataService
): DraftValidation => {
  const issues: DraftValidationIssue[] = [];

  const race = rules.findRace(draft.basic.race);
  if (!race) {
    issues.push({
      field: "basic.race",
      value: draft.basic.race,
      reason: `种族 "${draft.basic.race}" 不在规则数据中`
    });
  }

  const charClass = rules.findClass(draft.basic.charClass);
  if (!charClass) {
    issues.push({
      field: "basic.charClass",
      value: draft.basic.charClass,
      reason: `职业 "${draft.basic.charClass}" 不在规则数据中`
    });
  }

  const payload = rules.getBootstrapPayload();
  const backgroundMatch = payload.backgrounds.find(
    (b: any) => b.id === draft.basic.background || b.name === draft.basic.background
  );
  if (!backgroundMatch) {
    issues.push({
      field: "basic.background",
      value: draft.basic.background,
      reason: `背景 "${draft.basic.background}" 不在规则数据中`
    });
  }

  const statIds = ["str", "dex", "con", "int", "wis", "cha"] as const;
  for (const stat of statIds) {
    const val = draft.baseStats[stat];
    if (val < 1 || val > 30) {
      issues.push({
        field: `baseStats.${stat}`,
        value: val,
        reason: `属性值 ${stat}=${val} 超出合法范围 [1, 30]`
      });
    }
  }

  if (draft.basic.level < 1 || draft.basic.level > 20) {
    issues.push({
      field: "basic.level",
      value: draft.basic.level,
      reason: `等级 ${draft.basic.level} 超出合法范围 [1, 20]`
    });
  }

  const validSkillIds = new Set(payload.skills.map((s: any) => s.id));
  for (const [skillId, proficient] of Object.entries(draft.proficiencies.skills)) {
    if (!validSkillIds.has(skillId)) {
      issues.push({
        field: `proficiencies.skills.${skillId}`,
        value: skillId,
        reason: `技能 "${skillId}" 不在规则数据中`
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
};

const buildFallbackDraft = (userPrompt: string): CharacterDraft => ({
  basic: {
    name: "未命名角色",
    race: "human",
    charClass: "fighter",
    background: "folk_hero",
    level: 1
  },
  baseStats: {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10
  },
  proficiencies: { skills: {} },
  equipment: { armor: "none", shield: false, weapons: "" },
  spells: "",
  specialAttrs: `（AI不可用，原始描述：${userPrompt.slice(0, 100)}）`
});

export class CharacterDraftService {
  constructor(
    private readonly llm: LLMClient,
    private readonly rules: RulesDataService
  ) {}

  public async generate(userPrompt: string): Promise<AiDraftResult> {
    const prompt = buildPrompt(this.rules, userPrompt);

    try {
      const response = await this.llm.complete({
        system:
          "你是一个D&D 5e角色创建助手。请严格按照用户要求的JSON格式输出角色草案，不要输出任何其他内容。",
        messages: [{ role: "user", content: prompt }],
        jsonMode: true,
        temperature: 0.7,
        maxTokens: 2048
      });

      const raw = response.json ?? JSON.parse(response.content);

      const parsed = draftSchema.safeParse(raw);
      if (!parsed.success) {
        logger.warn(
          { errors: parsed.error.flatten() },
          "AI draft: LLM output failed Zod validation"
        );
        const fallback = buildFallbackDraft(userPrompt);
        return {
          draft: fallback,
          validation: {
            valid: false,
            issues: [
              {
                field: "_llm_output",
                value: undefined,
                reason: `LLM 输出格式校验失败: ${parsed.error.issues.map((i) => i.message).join("; ")}`
              }
            ]
          }
        };
      }

      const draft = parsed.data;
      const validation = validateDraft(draft, this.rules);
      return { draft, validation };
    } catch (err) {
      logger.error({ err }, "AI draft: LLM call failed");
      const fallback = buildFallbackDraft(userPrompt);
      return {
        draft: fallback,
        validation: {
          valid: false,
          issues: [
            {
              field: "_llm_call",
              value: undefined,
              reason: "LLM 调用失败，已返回回退草案"
            }
          ]
        }
      };
    }
  }
}
