import { logger } from "../../lib/logger.js";
import type { EmbeddingClient } from "../embedding/types.js";
import type { SearchHit, StoredChunk, VectorStore } from "./types.js";

export interface RagServiceOptions {
  embedding: EmbeddingClient;
  store: VectorStore;
  defaultTopK?: number;
  /** Max characters of chunk content returned to the model. */
  maxContentPerChunk?: number;
}

export class RagService {
  public readonly embedding: EmbeddingClient;
  public readonly store: VectorStore;
  private readonly defaultTopK: number;
  private readonly maxContentPerChunk: number;

  constructor(opts: RagServiceOptions) {
    if (opts.embedding.dimensions !== opts.store.dimensions) {
      throw new Error(
        `rag: embedding dim (${opts.embedding.dimensions}) != store dim (${opts.store.dimensions})`
      );
    }
    this.embedding = opts.embedding;
    this.store = opts.store;
    this.defaultTopK = opts.defaultTopK ?? 4;
    this.maxContentPerChunk = opts.maxContentPerChunk ?? 800;
  }

  public async retrieve(
    query: string,
    topK: number = this.defaultTopK
  ): Promise<SearchHit[]> {
    if (!query.trim()) return [];
    if ((await this.store.count()) === 0) return [];
    const [vector] = await this.embedding.embed(query);
    return this.store.search(vector, topK);
  }

  /** Ingestion helper: embeds raw chunks then upserts them. */
  public async ingest(chunks: Array<Omit<StoredChunk, "embedding">>): Promise<number> {
    if (chunks.length === 0) return 0;
    const BATCH = 16;
    let total = 0;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      const vectors = await this.embedding.embed(slice.map((c) => c.content));
      const prepared: StoredChunk[] = slice.map((c, idx) => ({
        ...c,
        embedding: vectors[idx]
      }));
      await this.store.upsert(prepared);
      total += prepared.length;
      logger.info({ batch: i / BATCH + 1, upserted: total }, "rag: ingest batch");
    }
    return total;
  }

  /** Render hits into a prompt-ready block. */
  public formatHits(hits: SearchHit[]): string {
    if (hits.length === 0) return "";
    const blocks = hits.map((hit, idx) => {
      const head = hit.section ? `${hit.source} › ${hit.section}` : hit.source;
      const body = hit.content.slice(0, this.maxContentPerChunk);
      return `[#${idx + 1} ${head} | score=${hit.score.toFixed(3)}]\n${body}`;
    });
    return `=== 规则检索片段（供 DM 参考，不要原样复述） ===\n${blocks.join("\n\n")}\n=== 片段结束 ===`;
  }
}
