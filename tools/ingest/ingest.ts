import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createEmbeddingClient } from "../../src/services/embedding/index.js";
import { logger } from "../../src/lib/logger.js";
import { InMemoryVectorStore } from "../../src/services/rag/inMemoryVectorStore.js";
import { RagService } from "../../src/services/rag/ragService.js";
import { chunkMarkdown } from "./chunker.js";

/**
 * CLI: walk a directory of .md files, chunk each, embed, and write a
 * JSON dump that the runtime loads on boot. Swap InMemoryVectorStore
 * for a PgvectorStore when you want real DB-backed search; nothing
 * else in this script would change.
 *
 * Usage:
 *   npx tsx tools/ingest/ingest.ts <corpus-dir> [out-file]
 *
 * Examples:
 *   npx tsx tools/ingest/ingest.ts ./rules-corpus
 *   npx tsx tools/ingest/ingest.ts ./rules-corpus ./storage/rag-dump.json
 */

const walkMarkdown = async (dir: string): Promise<string[]> => {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
};

const main = async () => {
  const [, , corpusArg, outArg] = process.argv;
  if (!corpusArg) {
    console.error(
      "usage: npx tsx tools/ingest/ingest.ts <corpus-dir> [out-file]"
    );
    process.exit(1);
  }
  const corpusDir = path.resolve(corpusArg);
  const outFile = path.resolve(
    outArg ?? path.join("storage", "rag-dump.json")
  );

  const st = await stat(corpusDir).catch(() => null);
  if (!st?.isDirectory()) {
    console.error(`not a directory: ${corpusDir}`);
    process.exit(1);
  }

  const files = await walkMarkdown(corpusDir);
  logger.info({ corpusDir, files: files.length }, "ingest: scanning corpus");

  const embedding = createEmbeddingClient();
  const store = new InMemoryVectorStore(embedding.dimensions);
  const rag = new RagService({ embedding, store });

  let totalChunks = 0;
  for (const file of files) {
    const text = await readFile(file, "utf-8");
    const rel = path.relative(corpusDir, file);
    const chunks = chunkMarkdown(rel, text);
    if (chunks.length === 0) continue;
    const upserted = await rag.ingest(chunks);
    totalChunks += upserted;
    logger.info({ file: rel, chunks: upserted }, "ingest: file done");
  }

  await store.dump!(outFile);
  logger.info(
    {
      outFile,
      chunks: totalChunks,
      provider: embedding.provider,
      model: embedding.model,
      dimensions: embedding.dimensions
    },
    "ingest: dump written"
  );
};

main().catch((err) => {
  logger.error({ err }, "ingest failed");
  process.exit(1);
});
