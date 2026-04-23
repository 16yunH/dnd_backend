export interface EmbeddingClient {
  readonly provider: string;
  readonly model: string;
  readonly dimensions: number;
  embed(input: string | string[]): Promise<number[][]>;
}
