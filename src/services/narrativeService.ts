import { logger } from "../lib/logger.js";
import type { CharacterRecord, RoomMessageRecord, RoomRecord } from "../types/domain.js";
import { rollD20Check, type Advantage, type CheckResult } from "../lib/dice.js";
import type {
  ChatMessage,
  LLMClient,
  ToolSchema
} from "./llm/index.js";
import type { Store } from "./store.js";

/**
 * Narrative orchestration for the AI DM.
 *
 * Given a player action, we:
 *  1. Assemble a compact prompt (system directive + recent transcript
 *     + optional character sheet context).
 *  2. Ask the LLM to narrate. The model may request a skill check via
 *     a tool call; dice are ALWAYS rolled server-side (`lib/dice`).
 *  3. If a check was requested, we feed the result back and ask the
 *     model for the follow-up narration.
 *
 * The service is pure: it returns the DM narration string plus any
 * check metadata, and the caller (RoomService) decides how to persist
 * and publish it.
 */

export interface NarrativeTurn {
  narration: string;
  check?: CheckResult;
  /** Skill id the model asked to resolve, if any. */
  requestedSkill?: string;
  /** Tokens consumed across the LLM calls, if the provider reported them. */
  totalTokens?: number;
}

const TOOL_REQUIRE_CHECK: ToolSchema = {
  name: "require_skill_check",
  description:
    "Request a d20 skill check. Only call this when the action's outcome is uncertain and a rule-backed check is appropriate.",
  parameters: {
    type: "object",
    required: ["skill", "dc"],
    properties: {
      skill: {
        type: "string",
        description:
          "Skill id in snake_case (e.g. perception, stealth, persuasion, insight, athletics)."
      },
      ability: {
        type: "string",
        enum: ["str", "dex", "con", "int", "wis", "cha"],
        description: "Optional ability override; defaults to the skill's canonical ability."
      },
      dc: {
        type: "integer",
        minimum: 5,
        maximum: 30,
        description: "Difficulty class (10 easy, 15 medium, 20 hard)."
      },
      advantage: {
        type: "string",
        enum: ["normal", "advantage", "disadvantage"],
        default: "normal"
      },
      reason: { type: "string", description: "One-sentence justification." }
    }
  }
};

const SKILL_STAT: Record<string, "str" | "dex" | "con" | "int" | "wis" | "cha"> = {
  athletics: "str",
  acrobatics: "dex",
  sleight_of_hand: "dex",
  stealth: "dex",
  arcana: "int",
  history: "int",
  investigation: "int",
  nature: "int",
  religion: "int",
  animal_handling: "wis",
  insight: "wis",
  medicine: "wis",
  perception: "wis",
  survival: "wis",
  deception: "cha",
  intimidation: "cha",
  performance: "cha",
  persuasion: "cha"
};

const SYSTEM_PROMPT = `你是一位专业的 D&D 5e 规则持中立的 DM（Dungeon Master）。
你只负责生成叙事与规则判断，**不要自己掷骰子**；当玩家的行动需要检定时，必须调用工具 \`require_skill_check\` 指定 skill / dc / advantage，由后端掷骰并将结果回喂给你再做续写。

写作风格：
- 中文，三到六句话，像小说叙述而不是规则手册；
- 不替玩家做决定，只呈现事件后果与环境反应；
- 遇到战斗 / 受伤 / 发现等状态变化时，清楚列出事实，避免模糊表述。

当收到 [判定结果] 时，请基于该结果继续叙事：成功给予推进，失败给出代价或新的阻碍，但不要突然让玩家无故死亡。`;

const recentToChatMessages = (
  room: RoomRecord,
  history: RoomMessageRecord[],
  maxMessages = 20
): ChatMessage[] => {
  const trimmed = history.slice(-maxMessages);
  return trimmed.map((m) => ({
    role: m.role === "player" ? "user" : "assistant",
    content:
      m.role === "player"
        ? `【${m.senderName ?? "玩家"}】${m.content}`
        : m.role === "system"
          ? `【系统】${m.content}`
          : m.content
  }));
};

const describeCharacter = (character: CharacterRecord): string => {
  const { basic, derived } = character;
  const mods = derived.modifiers;
  return [
    `角色：${basic.name}（${basic.race} ${basic.charClass} Lv${basic.level}，背景：${basic.background}）`,
    `AC ${derived.ac} / HP ${derived.hp} / 熟练 +${derived.profBonus} / 被动察觉 ${derived.passivePerception}`,
    `属性调整值：力 ${mods.str} 敏 ${mods.dex} 体 ${mods.con} 智 ${mods.int} 感 ${mods.wis} 魅 ${mods.cha}`
  ].join("\n");
};

const describeCampaign = (room: RoomRecord): string =>
  `战役：${room.config.campaign}（扩展：${room.config.expansion}）。房间 ${room.id}，当前玩家 ${room.players.length} 人。`;

export class NarrativeService {
  constructor(
    private readonly llm: LLMClient,
    private readonly store: Store
  ) {}

  public async respondToAction(params: {
    room: RoomRecord;
    character?: CharacterRecord;
    playerContent: string;
    history: RoomMessageRecord[];
  }): Promise<NarrativeTurn> {
    const { room, character, playerContent, history } = params;

    const systemPieces = [SYSTEM_PROMPT, describeCampaign(room)];
    if (character) systemPieces.push(describeCharacter(character));

    const transcript = recentToChatMessages(room, history);
    transcript.push({
      role: "user",
      content: `【${character?.basic.name ?? "玩家"}】${playerContent}`
    });

    let totalTokens: number | undefined;

    const first = await this.llm.complete({
      system: systemPieces.join("\n\n"),
      messages: transcript,
      tools: [TOOL_REQUIRE_CHECK],
      toolChoice: "auto",
      temperature: 0.8,
      meta: { roomId: room.id }
    });
    totalTokens = first.usage?.totalTokens ?? undefined;

    const toolCall = first.toolCalls.find((c) => c.name === TOOL_REQUIRE_CHECK.name);
    if (!toolCall || !toolCall.arguments) {
      return {
        narration: first.content.trim() || "（DM 沉默不语。）",
        totalTokens
      };
    }

    const args = toolCall.arguments as {
      skill?: string;
      ability?: keyof typeof SKILL_STAT extends never ? string : string;
      dc?: number;
      advantage?: Advantage;
    };
    const skill = (args.skill ?? "").toLowerCase();
    const ability = args.ability ?? SKILL_STAT[skill] ?? "wis";
    const dc = Math.max(5, Math.min(30, Number(args.dc ?? 12)));
    const advantage: Advantage =
      args.advantage === "advantage" || args.advantage === "disadvantage"
        ? args.advantage
        : "normal";

    let bonus = 0;
    let bonusLabel = skill ? `${skill}` : "基础检定";
    if (character) {
      const statMod = character.derived.modifiers[ability] ?? 0;
      const hasProf = Boolean(
        skill && character.proficiencies.skills?.[skill]
      );
      bonus = statMod + (hasProf ? character.derived.profBonus : 0);
      if (hasProf) bonusLabel += "(熟练)";
    }

    const check = rollD20Check({ bonus, dc, advantage, bonusLabel });

    logger.info(
      {
        provider: this.llm.provider,
        model: this.llm.model,
        roomId: room.id,
        skill,
        dc,
        advantage,
        result: check.success,
        latencyMs: first.latencyMs
      },
      "narrative: resolved skill check"
    );

    // Feed the check result back for follow-up narration.
    const followup = await this.llm.complete({
      system: systemPieces.join("\n\n"),
      messages: [
        ...transcript,
        {
          role: "assistant",
          content: first.content || "（请求检定中）"
        },
        {
          role: "tool",
          toolCallId: toolCall.id,
          name: TOOL_REQUIRE_CHECK.name,
          content: JSON.stringify({
            skill,
            ability,
            dc,
            advantage,
            roll: check.kept?.[0] ?? check.rolls[0],
            bonus,
            total: check.total,
            success: check.success,
            isCrit: check.isCrit,
            isFumble: check.isFumble
          })
        },
        {
          role: "user",
          content:
            "请基于上面的 [判定结果] 继续叙事，三到六句话，展示成功或失败的具体后果。"
        }
      ],
      temperature: 0.8,
      meta: { roomId: room.id, phase: "followup" }
    });

    totalTokens =
      (totalTokens ?? 0) + (followup.usage?.totalTokens ?? 0) || undefined;

    return {
      narration: followup.content.trim() || first.content.trim() || "（DM 在沉思。）",
      check,
      requestedSkill: skill,
      totalTokens
    };
  }
}
