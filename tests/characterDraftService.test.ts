import { describe, expect, it } from "vitest";
import { CharacterDraftService } from "../src/services/characterDraftService.js";
import { RulesDataService } from "../src/services/rulesData.js";
import type {
  LLMClient,
  LLMCompleteRequest,
  LLMResponse
} from "../src/services/llm/types.js";

class FakeLLM implements LLMClient {
  public readonly provider = "fake";
  public readonly model = "fake-1";
  public calls: LLMCompleteRequest[] = [];
  constructor(private readonly queue: LLMResponse[]) {}
  async complete(req: LLMCompleteRequest): Promise<LLMResponse> {
    this.calls.push(req);
    const next = this.queue.shift();
    if (!next) throw new Error("FakeLLM: queue exhausted");
    return next;
  }
}

const validDraftJson = {
  basic: {
    name: "艾尔文",
    race: "elf",
    charClass: "wizard",
    background: "acolyte",
    level: 1
  },
  baseStats: {
    str: 8,
    dex: 14,
    con: 12,
    int: 16,
    wis: 13,
    cha: 10
  },
  proficiencies: { skills: { arcana: true, history: true } },
  equipment: { armor: "none", shield: false, weapons: "quarterstaff" },
  spells: "fire bolt, mage hand",
  specialAttrs: ""
};

describe("CharacterDraftService", () => {
  describe("generate", () => {
    it("parses draft correctly when LLM returns valid JSON", async () => {
      const llm = new FakeLLM([
        {
          content: JSON.stringify(validDraftJson),
          json: validDraftJson,
          toolCalls: [],
          provider: "fake",
          model: "fake-1",
          latencyMs: 1
        }
      ]);
      const rules = new RulesDataService();
      const svc = new CharacterDraftService(llm, rules);

      const result = await svc.generate("我想创建一个精灵法师");

      expect(result.draft.basic.name).toBe("艾尔文");
      expect(result.draft.basic.race).toBe("elf");
      expect(result.draft.basic.charClass).toBe("wizard");
      expect(result.draft.baseStats.int).toBe(16);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.issues).toHaveLength(0);
      expect(llm.calls).toHaveLength(1);
    });

    it("returns fallback draft when LLM returns invalid JSON", async () => {
      const llm = new FakeLLM([
        {
          content: "this is not json at all",
          toolCalls: [],
          provider: "fake",
          model: "fake-1",
          latencyMs: 1
        }
      ]);
      const rules = new RulesDataService();
      const svc = new CharacterDraftService(llm, rules);

      const result = await svc.generate("创建一个角色");

      expect(result.draft.basic.name).toBe("未命名角色");
      expect(result.draft.basic.race).toBe("human");
      expect(result.validation.valid).toBe(false);
      expect(result.validation.issues.length).toBeGreaterThan(0);
    });

    it("flags issues when race or class is not in rules", async () => {
      const invalidDraftJson = {
        basic: {
          name: "测试角色",
          race: "unknown_race",
          charClass: "unknown_class",
          background: "unknown_bg",
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
        specialAttrs: ""
      };

      const llm = new FakeLLM([
        {
          content: JSON.stringify(invalidDraftJson),
          json: invalidDraftJson,
          toolCalls: [],
          provider: "fake",
          model: "fake-1",
          latencyMs: 1
        }
      ]);
      const rules = new RulesDataService();
      const svc = new CharacterDraftService(llm, rules);

      const result = await svc.generate("创建一个奇怪的角色");

      expect(result.validation.valid).toBe(false);

      const fields = result.validation.issues.map((i) => i.field);
      expect(fields).toContain("basic.race");
      expect(fields).toContain("basic.charClass");
      expect(fields).toContain("basic.background");
    });
  });
});
