import { HttpError } from "../../lib/httpError.js";
import { logger } from "../../lib/logger.js";
import type { EmbeddingClient } from "./types.js";

interface HttpEmbeddingOptions {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey?: string;
  dimensions: number;
  timeoutMs?: number;
  dialect: "openai" | "ollama";
}

/**
 * Covers two dialects we actually need:
 *  - OpenAI-compatible /embeddings (OpenAI, DeepSeek, Zhipu, vLLM, ...).
 *  - Ollama /api/embeddings — one prompt per call, so we serialize.
 */
export class HttpEmbeddingClient implements EmbeddingClient {
  public readonly provider: string;
  public readonly model: string;
  public readonly dimensions: number;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly dialect: "openai" | "ollama";
  private readonly timeoutMs: number;

  constructor(opts: HttpEmbeddingOptions) {
    this.provider = opts.provider;
    this.model = opts.model;
    this.dimensions = opts.dimensions;
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.dialect = opts.dialect;
    this.timeoutMs = opts.timeoutMs ?? 60_000;
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    return headers;
  }

  private async postJson(url: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        logger.error(
          { provider: this.provider, status: res.status, body: text.slice(0, 300) },
          "embedding non-2xx"
        );
        throw new HttpError(
          502,
          `Embedding 请求失败 ${res.status}`,
          { status: res.status },
          "embedding_upstream_error"
        );
      }
      return await res.json();
    } catch (err) {
      if (err instanceof HttpError) throw err;
      logger.error({ err, provider: this.provider }, "embedding fetch failed");
      throw new HttpError(502, "Embedding 网络错误", undefined, "embedding_network_error");
    } finally {
      clearTimeout(timeout);
    }
  }

  public async embed(input: string | string[]): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];

    if (this.dialect === "openai") {
      const body: Record<string, unknown> = { model: this.model, input: inputs };
      if (this.dimensions) body.dimensions = this.dimensions;
      const data = (await this.postJson(`${this.baseUrl}/embeddings`, body)) as { data: Array<{ embedding: number[] }> };
      return data.data.map((d) => d.embedding);
    }

    // ollama: one request per input
    const results: number[][] = [];
    for (const prompt of inputs) {
      const data = (await this.postJson(`${this.baseUrl}/api/embeddings`, {
        model: this.model,
        prompt
      })) as { embedding: number[] };
      results.push(data.embedding);
    }
    return results;
  }
}
