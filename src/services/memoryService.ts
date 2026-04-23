import { logger } from "../lib/logger.js";
import type { RoomMessageRecord } from "../types/domain.js";
import type { LLMClient } from "./llm/types.js";
import type { Store } from "./store.js";

const SUMMARY_THRESHOLD = 30;
const SUMMARY_BATCH = 20;

const SUMMARY_SYSTEM_PROMPT = `你是一个对话摘要助手。请根据以下 D&D 游戏对话记录，用 3-5 句中文总结关键事件、角色状态变化和重要决定。
只输出 JSON 对象，格式为 {"summary": "你的摘要内容"}。`;

export class MemoryService {
  constructor(
    private readonly llm: LLMClient,
    private readonly store: Store
  ) {}

  public async summarizeIfNeeded(
    roomId: string,
    messages: RoomMessageRecord[]
  ): Promise<void> {
    if (messages.length < SUMMARY_THRESHOLD) return;

    const latest = await this.store.getLatestSummary(roomId);
    const afterSeq = latest?.upToSeq ?? 0;
    const newMessages = messages.filter((m) => m.seq > afterSeq);

    if (newMessages.length < SUMMARY_BATCH) return;

    const toSummarize = newMessages.slice(0, SUMMARY_BATCH);
    const upToSeq = toSummarize[toSummarize.length - 1].seq;

    try {
      const transcript = toSummarize
        .map((m) => {
          if (m.role === "player") return `【${m.senderName ?? "玩家"}】${m.content}`;
          if (m.role === "system") return `【系统】${m.content}`;
          return m.content;
        })
        .join("\n");

      const res = await this.llm.complete({
        system: SUMMARY_SYSTEM_PROMPT,
        messages: [{ role: "user", content: transcript }],
        jsonMode: true,
        temperature: 0.3,
        meta: { roomId, phase: "summary" }
      });

      const summary =
        (res.json as { summary?: string } | undefined)?.summary ??
        res.content.trim();

      await this.store.appendRoomSummary({ roomId, upToSeq, summary });

      logger.info(
        { roomId, upToSeq, messageCount: toSummarize.length },
        "memory: summary created"
      );
    } catch (err) {
      logger.warn({ err, roomId }, "memory: summarization failed — skipping");
    }
  }

  public async getSummaryContext(roomId: string): Promise<string | undefined> {
    const latest = await this.store.getLatestSummary(roomId);
    return latest?.summary;
  }
}
