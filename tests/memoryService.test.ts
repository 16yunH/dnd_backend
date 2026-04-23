import { describe, expect, it } from "vitest";
import { MemoryService } from "../src/services/memoryService.js";
import type {
  LLMClient,
  LLMCompleteRequest,
  LLMResponse
} from "../src/services/llm/types.js";
import { makeTempStore } from "./helpers/tempStore.js";
import type { RoomMessageRecord } from "../src/types/domain.js";

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

const makeMessages = (count: number, roomId = "room-1"): RoomMessageRecord[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `msg-${i + 1}`,
    roomId,
    seq: i + 1,
    role: i % 3 === 0 ? "system" : "player",
    senderName: i % 3 === 0 ? undefined : "玩家A",
    content: `消息内容 ${i + 1}`,
    createdAt: new Date(Date.now() + i * 1000).toISOString()
  }));

describe("MemoryService", () => {
  describe("summarizeIfNeeded", () => {
    it("does not trigger summarization when message count is below threshold", async () => {
      const llm = new FakeLLM([]);
      const { store, cleanup } = makeTempStore();
      try {
        const svc = new MemoryService(llm, store);
        const messages = makeMessages(10);
        await svc.summarizeIfNeeded("room-1", messages);
        expect(llm.calls).toHaveLength(0);
      } finally {
        cleanup();
      }
    });

    it("triggers LLM call when message count reaches threshold", async () => {
      const llm = new FakeLLM([
        {
          content: '{"summary": "英雄们在旅店相遇，决定一起探索黑森林。"}',
          json: { summary: "英雄们在旅店相遇，决定一起探索黑森林。" },
          toolCalls: [],
          provider: "fake",
          model: "fake-1",
          latencyMs: 1
        }
      ]);
      const { store, cleanup } = makeTempStore();
      try {
        const svc = new MemoryService(llm, store);
        const messages = makeMessages(50);
        await svc.summarizeIfNeeded("room-1", messages);

        expect(llm.calls).toHaveLength(1);
        expect(llm.calls[0].jsonMode).toBe(true);

        const summary = await store.getLatestSummary("room-1");
        expect(summary).toBeDefined();
        expect(summary!.summary).toBe("英雄们在旅店相遇，决定一起探索黑森林。");
        expect(summary!.upToSeq).toBe(20);
      } finally {
        cleanup();
      }
    });
  });

  describe("getSummaryContext", () => {
    it("returns undefined when no summary exists", async () => {
      const llm = new FakeLLM([]);
      const { store, cleanup } = makeTempStore();
      try {
        const svc = new MemoryService(llm, store);
        const result = await svc.getSummaryContext("room-1");
        expect(result).toBeUndefined();
      } finally {
        cleanup();
      }
    });

    it("returns the summary text when a summary exists", async () => {
      const llm = new FakeLLM([]);
      const { store, cleanup } = makeTempStore();
      try {
        await store.appendRoomSummary({
          roomId: "room-1",
          upToSeq: 20,
          summary: "英雄们在旅店相遇。"
        });

        const svc = new MemoryService(llm, store);
        const result = await svc.getSummaryContext("room-1");
        expect(result).toBe("英雄们在旅店相遇。");
      } finally {
        cleanup();
      }
    });
  });
});
