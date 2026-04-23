import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  CharacterRecord,
  DbFile,
  RoomMessageRecord,
  RoomRecord,
  UserRecord
} from "../types/domain.js";

const DEFAULT_DB: DbFile = {
  users: [],
  characters: [],
  rooms: [],
  roomMessages: [],
  roomSeqById: {}
};

export class JsonStore {
  private readonly dbPath: string;

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
        roomSeqById: parsed.roomSeqById ?? {}
      };
    } catch {
      await this.writeDb(DEFAULT_DB);
      return {
        users: [],
        characters: [],
        rooms: [],
        roomMessages: [],
        roomSeqById: {}
      };
    }
  }

  private async writeDb(db: DbFile): Promise<void> {
    await mkdir(path.dirname(this.dbPath), { recursive: true });
    await writeFile(this.dbPath, JSON.stringify(db, null, 2), "utf-8");
  }

  public async getOrCreateUser(nickname: string): Promise<UserRecord> {
    const normalized = nickname.trim();
    const db = await this.readDb();
    const existing = db.users.find(
      (user) => user.nickname.toLowerCase() === normalized.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: randomUUID(),
      nickname: normalized,
      createdAt: now
    };

    db.users.push(newUser);
    await this.writeDb(db);
    return newUser;
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
    const db = await this.readDb();
    const index = db.characters.findIndex((item) => item.id === record.id);

    if (index >= 0) {
      db.characters[index] = record;
    } else {
      db.characters.push(record);
    }

    await this.writeDb(db);
    return record;
  }

  public async deleteCharacter(userId: string, characterId: string): Promise<boolean> {
    const db = await this.readDb();
    const before = db.characters.length;
    db.characters = db.characters.filter(
      (record) => !(record.ownerUserId === userId && record.id === characterId)
    );

    if (db.characters.length === before) {
      return false;
    }

    await this.writeDb(db);
    return true;
  }

  public async getRoomById(roomId: string): Promise<RoomRecord | undefined> {
    const db = await this.readDb();
    return db.rooms.find((room) => room.id === roomId);
  }

  public async upsertRoom(room: RoomRecord): Promise<RoomRecord> {
    const db = await this.readDb();
    const index = db.rooms.findIndex((item) => item.id === room.id);
    if (index >= 0) {
      db.rooms[index] = room;
    } else {
      db.rooms.push(room);
    }
    await this.writeDb(db);
    return room;
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
    const db = await this.readDb();
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
    await this.writeDb(db);
    return record;
  }
}
