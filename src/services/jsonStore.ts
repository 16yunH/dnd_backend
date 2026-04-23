import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  CharacterRecord,
  DbFile,
  RoomMessageRecord,
  RoomRecord,
  RoomSummaryRecord,
  UserRecord
} from "../types/domain.js";
import type { Store } from "./store.js";

const DEFAULT_DB: DbFile = {
  users: [],
  characters: [],
  rooms: [],
  roomMessages: [],
  roomSeqById: {},
  roomSummaries: []
};

/**
 * Dev-only persistence: one JSON file read + rewritten per mutation.
 * Mutations are serialized through `queue` so concurrent writes don't
 * clobber each other; this is adequate for a single-node dev server
 * but will be replaced by a real DB in phase 2.
 */
export class JsonStore implements Store {
  private readonly dbPath: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dbPath = path.join(process.cwd(), "storage", "dev-db.json")) {
    this.dbPath = dbPath;
  }

  private async readDb(): Promise<DbFile> {
    try {
      const content = await readFile(this.dbPath, "utf-8");
      const parsed = JSON.parse(content) as DbFile;
      return {
        users: parsed.users ?? [],
        characters: parsed.characters ?? [],
        rooms: parsed.rooms ?? [],
        roomMessages: parsed.roomMessages ?? [],
        roomSeqById: parsed.roomSeqById ?? {},
        roomSummaries: parsed.roomSummaries ?? []
      };
    } catch {
      await this.writeDb(DEFAULT_DB);
      return {
        users: [],
        characters: [],
        rooms: [],
        roomMessages: [],
        roomSeqById: {},
        roomSummaries: []
      };
    }
  }

  private async writeDb(db: DbFile): Promise<void> {
    await mkdir(path.dirname(this.dbPath), { recursive: true });
    await writeFile(this.dbPath, JSON.stringify(db, null, 2), "utf-8");
  }

  /** Run `work` serialized against all other mutations on this store. */
  private mutate<T>(work: (db: DbFile) => Promise<T> | T): Promise<T> {
    const next = this.queue.then(async () => {
      const db = await this.readDb();
      const result = await work(db);
      await this.writeDb(db);
      return result;
    });
    // keep queue alive but swallow errors so one failure doesn't kill subsequent ops
    this.queue = next.catch(() => undefined);
    return next;
  }

  public async getOrCreateUser(nickname: string): Promise<UserRecord> {
    const normalized = nickname.trim();
    return this.mutate((db) => {
      const existing = db.users.find(
        (user) => user.nickname.toLowerCase() === normalized.toLowerCase()
      );
      if (existing) return existing;
      const user: UserRecord = {
        id: randomUUID(),
        nickname: normalized,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      return user;
    });
  }

  public async getUserById(userId: string): Promise<UserRecord | undefined> {
    const db = await this.readDb();
    return db.users.find((user) => user.id === userId);
  }

  public async listCharactersByUser(userId: string): Promise<CharacterRecord[]> {
    const db = await this.readDb();
    return db.characters
      .filter((record) => record.ownerUserId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public async getCharacterById(
    userId: string,
    characterId: string
  ): Promise<CharacterRecord | undefined> {
    const db = await this.readDb();
    return db.characters.find(
      (record) => record.ownerUserId === userId && record.id === characterId
    );
  }

  public async upsertCharacter(record: CharacterRecord): Promise<CharacterRecord> {
    return this.mutate((db) => {
      const index = db.characters.findIndex((item) => item.id === record.id);
      if (index >= 0) db.characters[index] = record;
      else db.characters.push(record);
      return record;
    });
  }

  public async deleteCharacter(userId: string, characterId: string): Promise<boolean> {
    return this.mutate((db) => {
      const before = db.characters.length;
      db.characters = db.characters.filter(
        (record) => !(record.ownerUserId === userId && record.id === characterId)
      );
      return db.characters.length !== before;
    });
  }

  public async getRoomById(roomId: string): Promise<RoomRecord | undefined> {
    const db = await this.readDb();
    return db.rooms.find((room) => room.id === roomId);
  }

  public async upsertRoom(room: RoomRecord): Promise<RoomRecord> {
    return this.mutate((db) => {
      const index = db.rooms.findIndex((item) => item.id === room.id);
      if (index >= 0) db.rooms[index] = room;
      else db.rooms.push(room);
      return room;
    });
  }

  public async listRoomMessages(
    roomId: string,
    afterSeq = 0,
    limit = 100
  ): Promise<RoomMessageRecord[]> {
    const db = await this.readDb();
    return db.roomMessages
      .filter((message) => message.roomId === roomId && message.seq > afterSeq)
      .sort((a, b) => a.seq - b.seq)
      .slice(0, limit);
  }

  public async appendRoomMessage(input: {
    roomId: string;
    role: RoomMessageRecord["role"];
    senderUserId?: string;
    senderName?: string;
    content: string;
    meta?: Record<string, unknown>;
  }): Promise<RoomMessageRecord> {
    return this.mutate((db) => {
      const nextSeq = (db.roomSeqById[input.roomId] ?? 0) + 1;
      db.roomSeqById[input.roomId] = nextSeq;

      const record: RoomMessageRecord = {
        id: randomUUID(),
        roomId: input.roomId,
        seq: nextSeq,
        role: input.role,
        senderUserId: input.senderUserId,
        senderName: input.senderName,
        content: input.content,
        createdAt: new Date().toISOString(),
        meta: input.meta
      };
      db.roomMessages.push(record);
      return record;
    });
  }

  public async appendRoomSummary(input: {
    roomId: string;
    upToSeq: number;
    summary: string;
  }): Promise<RoomSummaryRecord> {
    return this.mutate((db) => {
      const record: RoomSummaryRecord = {
        id: randomUUID(),
        roomId: input.roomId,
        upToSeq: input.upToSeq,
        summary: input.summary,
        createdAt: new Date().toISOString()
      };
      db.roomSummaries.push(record);
      return record;
    });
  }

  public async getLatestSummary(roomId: string): Promise<RoomSummaryRecord | undefined> {
    const db = await this.readDb();
    const summaries = db.roomSummaries.filter((s) => s.roomId === roomId);
    return summaries.sort((a, b) => b.upToSeq - a.upToSeq)[0];
  }
}
