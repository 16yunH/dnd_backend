import { describe, expect, it } from "vitest";
import { NarrativeService } from "../src/services/narrativeService.js";
import type {
  LLMClient,
  LLMCompleteRequest,
  LLMResponse
} from "../src/services/llm/types.js";
import { makeTempStore } from "./helpers/tempStore.js";
import type {
  CharacterRecord,
  RoomMessageRecord,
  RoomRecord
} from "../src/types/domain.js";

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

const makeRoom = (): RoomRecord => ({
  id: "ABC123",
  inviteCode: "ABC123",
  hostUserId: "u1",
  state: "playing",
  roomVersion: 1,
  config: {
    maxPlayers: 4,
    isPrivate: false,
    password: "",
    expansion: "PHB基础",
    campaign: "沉睡巨人"
  },
  players: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const makeCharacter = (): CharacterRecord => ({
  id: "c1",
  ownerUserId: "u1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  basic: {
    name: "暗影",
    race: "half-elf",
    charClass: "rogue",
    background: "江湖客",
    level: 3
  },
  statMethod: "pointBuy",
  baseStats: { str: 10, dex: 16, con: 12, int: 12, wis: 13, cha: 11 },
  proficiencies: { skills: { stealth: true, perception: true } },
  equipment: { armor: "none", shield: false, weapons: "" },
  spells: "",
  specialAttrs: "",
  derived: {
    profBonus: 2,
    initiative: 3,
    ac: 13,
    hp: 24,
    spellDC: 10,
    passivePerception: 13,
    finalStats: { str: 10, dex: 16, con: 12, int: 12, wis: 13, cha: 11 },
    modifiers: { str: 0, dex: 3, con: 1, int: 1, wis: 1, cha: 0 }
  }
});

const makeHistory = (): RoomMessageRecord[] => [
  {
    id: "m1",
    roomId: "ABC123",
    seq: 1,
    role: "dm",
    content: "旅店老板打量着你们。",
    createdAt: new Date().toISOString()
  }
];

describe("NarrativeService", () => {
  it("returns plain narration when the model does not request a check", async () => {
    const llm = new FakeLLM([
      {
        content: "老板点了点头。",
        toolCalls: [],
        provider: "fake",
        model: "fake-1",
        latencyMs: 1
      }
    ]);
    const { store, cleanup } = makeTempStore();
    try {
      const svc = new NarrativeService(llm, store);
      const turn = await svc.respondToAction({
        room: makeRoom(),
        character: makeCharacter(),
        playerContent: "我问他黑森林的传闻。",
        history: makeHistory()
      });
      expect(turn.narration).toBe("老板点了点头。");
      expect(turn.check).toBeUndefined();
      expect(llm.calls).toHaveLength(1);
    } finally {
      cleanup();
    }
  });

  it("rolls dice server-side when the model asks for a check and feeds the result back", async () => {
    const llm = new FakeLLM([
      {
        content: "",
        toolCalls: [
          {
            id: "tc1",
            name: "require_skill_check",
            argumentsRaw: '{"skill":"stealth","dc":15}',
            arguments: { skill: "stealth", dc: 15 }
          }
        ],
        provider: "fake",
        model: "fake-1",
        latencyMs: 1
      },
      {
        content: "你悄无声息地溜过转角。",
        toolCalls: [],
        provider: "fake",
        model: "fake-1",
        latencyMs: 1
      }
    ]);
    const { store, cleanup } = makeTempStore();
    try {
      const svc = new NarrativeService(llm, store);
      const turn = await svc.respondToAction({
        room: makeRoom(),
        character: makeCharacter(),
        playerContent: "我躲到柱子后面偷听。",
        history: makeHistory()
      });
      expect(turn.check).toBeDefined();
      expect(turn.requestedSkill).toBe("stealth");
      // stealth proficient rogue: dex mod 3 + prof 2 = +5
      expect(turn.check!.bonus).toBe(5);
      expect(turn.check!.dc).toBe(15);
      expect(turn.narration).toBe("你悄无声息地溜过转角。");
      expect(llm.calls).toHaveLength(2);

      // follow-up call must include a tool message with the roll payload
      const followup = llm.calls[1];
      const toolMsg = followup.messages.find((m) => m.role === "tool");
      expect(toolMsg).toBeDefined();
      const payload = JSON.parse(toolMsg!.content);
      expect(payload.skill).toBe("stealth");
      expect(typeof payload.roll).toBe("number");
    } finally {
      cleanup();
    }
  });
});
