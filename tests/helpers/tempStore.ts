import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { JsonStore } from "../../src/services/jsonStore.js";

export const makeTempStore = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "dnd-"));
  const dbPath = path.join(dir, "dev-db.json");
  const store = new JsonStore(dbPath);
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  return { store, dir, dbPath, cleanup };
};
