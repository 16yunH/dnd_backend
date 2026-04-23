export interface RuleChunk {
  id: string;
  source: string;
  section?: string;
  content: string;
  tokens?: number;
  metadata?: Record<string, unknown>;
}

export interface StoredChunk extends RuleChunk {
  embedding: number[];
}

export interface SearchHit extends RuleChunk {
  score: number;
}

export interface VectorStore {
  readonly dimensions: number;
  upsert(chunks: StoredChunk[]): Promise<void>;
  search(
    queryVector: number[],
    topK: number,
    filter?: { source?: string }
  ): Promise<SearchHit[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
  /** Optional: snapshot to disk (used by InMemoryVectorStore). */
  dump?(filePath: string): Promise<void>;
  load?(filePath: string): Promise<number>;
}
