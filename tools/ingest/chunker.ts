import { createHash } from "node:crypto";
import path from "node:path";

export interface RawChunk {
  id: string;
  source: string;
  section?: string;
  content: string;
  tokens: number;
}

const MAX_CHARS = 1200;
const MIN_CHARS = 120;

/** Loose token estimator — close enough for budgeting. */
const estimateTokens = (text: string): number =>
  Math.max(1, Math.round(text.length / 3));

const stableId = (source: string, section: string, content: string): string => {
  const h = createHash("sha1");
  h.update(source);
  h.update("\0");
  h.update(section);
  h.update("\0");
  h.update(content);
  return h.digest("hex").slice(0, 16);
};

/**
 * Split a markdown doc into roughly-fixed-size chunks. We cut on:
 *  1. Top-level (`#`) or section (`##` / `###`) headings.
 *  2. If a section is still too long, on blank lines.
 *  3. Finally, hard char limit as a fallback.
 *
 * Enough for 5e rulebook-style content without a heavy NLP dependency.
 */
export const chunkMarkdown = (source: string, text: string): RawChunk[] => {
  const basename = path.basename(source);
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const sections: Array<{ heading: string; body: string[] }> = [];
  let current: { heading: string; body: string[] } = {
    heading: basename,
    body: []
  };

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current.body.length > 0 || sections.length === 0) sections.push(current);
      current = { heading: m[2].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.length > 0) sections.push(current);

  const chunks: RawChunk[] = [];

  for (const section of sections) {
    const raw = section.body.join("\n").trim();
    if (!raw) continue;

    const paragraphs = raw.split(/\n{2,}/);
    let buffer = "";
    const flush = () => {
      const content = buffer.trim();
      if (content.length < MIN_CHARS && chunks.length > 0) {
        // merge tiny tail into previous chunk from the same section
        const prev = chunks[chunks.length - 1];
        if (prev.section === section.heading) {
          prev.content = `${prev.content}\n\n${content}`;
          prev.tokens = estimateTokens(prev.content);
          buffer = "";
          return;
        }
      }
      if (content.length === 0) {
        buffer = "";
        return;
      }
      chunks.push({
        id: stableId(basename, section.heading, content),
        source: basename,
        section: section.heading,
        content,
        tokens: estimateTokens(content)
      });
      buffer = "";
    };

    for (const para of paragraphs) {
      const candidate = buffer ? `${buffer}\n\n${para}` : para;
      if (candidate.length > MAX_CHARS && buffer) {
        flush();
        buffer = para;
      } else {
        buffer = candidate;
      }
    }
    flush();
  }

  return chunks;
};
