import { createHash } from "node:crypto";
import type { EmbeddingClient } from "./types.js";

/**
 * Deterministic hash-based embedding for dev/CI use when no real
 * embedding backend is configured. Not semantic, but stable enough
 * that repeated queries hit the same nearest neighbours in tests.
 */
export class EchoEmbeddingClient implements EmbeddingClient {
  public readonly provider = "echo";
  public readonly model = "echo-embed";
  public readonly dimensions: number;

  constructor(dimensions = 256) {
    this.dimensions = dimensions;
  }

  private embedOne(text: string): number[] {
    const tokens = (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 256);
    const vec = new Array<number>(this.dimensions).fill(0);
    for (const token of tokens) {
      const hash = createHash("sha1").update(token).digest();
      for (let i = 0; i < this.dimensions; i += 1) {
        const byte = hash[i % hash.length];
        vec[i] += (byte - 127.5) / 127.5;
      }
    }
    // normalize for cosine similarity
    const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  public async embed(input: string | string[]): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];
    return inputs.map((text) => this.embedOne(text));
  }
}
