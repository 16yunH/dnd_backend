import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SearchHit, StoredChunk, VectorStore } from "./types.js";

const cosine = (a: number[], b: number[]): number => {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
};

/**
 * Zero-dependency vector store. Used for CI, dev without Postgres, and
 * small corpora (< ~50k chunks). For production scale, swap to
 * PgvectorStore behind the same interface.
 */
export class InMemoryVectorStore implements VectorStore {
  public readonly dimensions: number;
  private chunks: StoredChunk[] = [];

  constructor(dimensions: number) {
    this.dimensions = dimensions;
  }

  public async upsert(chunks: StoredChunk[]): Promise<void> {
    for (const chunk of chunks) {
      if (chunk.embedding.length !== this.dimensions) {
        throw new Error(
          `embedding dim mismatch: expected ${this.dimensions}, got ${chunk.embedding.length} (id=${chunk.id})`
        );
      }
      const idx = this.chunks.findIndex((c) => c.id === chunk.id);
      if (idx >= 0) this.chunks[idx] = chunk;
      else this.chunks.push(chunk);
    }
  }

  public async search(
    queryVector: number[],
    topK: number,
    filter?: { source?: string }
  ): Promise<SearchHit[]> {
    const scored: SearchHit[] = [];
    for (const chunk of this.chunks) {
      if (filter?.source && chunk.source !== filter.source) continue;
      scored.push({
        id: chunk.id,
        source: chunk.source,
        section: chunk.section,
        content: chunk.content,
        tokens: chunk.tokens,
        metadata: chunk.metadata,
        score: cosine(queryVector, chunk.embedding)
      });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  public async count(): Promise<number> {
    return this.chunks.length;
  }

  public async clear(): Promise<void> {
    this.chunks = [];
  }

  public async dump(filePath: string): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(
      filePath,
      JSON.stringify({ dimensions: this.dimensions, chunks: this.chunks }),
      "utf-8"
    );
  }

  public async load(filePath: string): Promise<number> {
    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as {
        dimensions: number;
        chunks: StoredChunk[];
      };
      if (parsed.dimensions !== this.dimensions) {
        throw new Error(
          `dimension mismatch in dump file: ${parsed.dimensions} vs ${this.dimensions}`
        );
      }
      this.chunks = parsed.chunks;
      return this.chunks.length;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return 0;
      throw err;
    }
  }
}
