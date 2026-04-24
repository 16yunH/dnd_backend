import type {
  CharacterRecord,
  RoomMessageRecord,
  RoomRecord,
  RoomSummaryRecord,
  UserRecord
} from "../types/domain.js";
import type { Store } from "./store.js";
import { getPrismaClient } from "../db/prismaClient.js";

type PrismaClient = any;

function mapUserRecord(row: { id: string; nickname: string; createdAt: Date }): UserRecord {
  return {
    id: row.id,
    nickname: row.nickname,
    createdAt: row.createdAt.toISOString()
  };
}

function mapCharacterRecord(row: {
  id: string;
  ownerUserId: string;
  name: string;
  basic: unknown;
  statMethod: string;
  baseStats: unknown;
  proficiencies: unknown;
  equipment: unknown;
  derived: unknown;
  spells: string;
  specialAttrs: string;
  createdAt: Date;
  updatedAt: Date;
}): CharacterRecord {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    basic: row.basic as CharacterRecord["basic"],
    statMethod: row.statMethod as CharacterRecord["statMethod"],
    baseStats: row.baseStats as CharacterRecord["baseStats"],
    proficiencies: row.proficiencies as CharacterRecord["proficiencies"],
    equipment: row.equipment as CharacterRecord["equipment"],
    derived: row.derived as CharacterRecord["derived"],
    spells: row.spells,
    specialAttrs: row.specialAttrs,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

interface RoomRow {
  id: string;
  inviteCode: string;
  hostUserId: string;
  state: string;
  roomVersion: number;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
  players: {
    id: string;
    userId: string;
    characterId: string | null;
    isReady: boolean;
    joinedAt: Date;
    user: { nickname: string };
  }[];
}

function mapRoomRecord(row: RoomRow): RoomRecord {
  const config = (row.config as Record<string, unknown>) ?? {};
  const { grid, combat, ...roomConfig } = config;
  return {
    id: row.id,
    inviteCode: row.inviteCode,
    hostUserId: row.hostUserId,
    state: row.state as RoomRecord["state"],
    roomVersion: row.roomVersion,
    config: roomConfig as unknown as RoomRecord["config"],
    players: row.players.map((p) => ({
      id: p.id,
      userId: p.userId,
      username: p.user.nickname,
      isReady: p.isReady,
      characterId: p.characterId,
      joinedAt: p.joinedAt.toISOString()
    })),
    grid: grid as RoomRecord["grid"],
    combat: combat as RoomRecord["combat"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function buildRoomConfig(room: RoomRecord): Record<string, unknown> {
  return {
    ...room.config,
    grid: room.grid ?? null,
    combat: room.combat ?? null
  };
}

export class PrismaStore implements Store {
  private prisma!: PrismaClient;
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    this.prisma = await getPrismaClient();
    this.ready = true;
  }

  private ensure(): PrismaClient {
    if (!this.ready) throw new Error("PrismaStore not initialized");
    return this.prisma;
  }

  async getOrCreateUser(nickname: string): Promise<UserRecord> {
    const db = this.ensure();
    const normalized = nickname.trim();
    try {
      const existing = await db.user.findFirst({
        where: { nickname: { equals: normalized, mode: "insensitive" } }
      });
      if (existing) return mapUserRecord(existing);

      const created = await db.user.create({ data: { nickname: normalized } });
      return mapUserRecord(created);
    } catch (err) {
      const existing = await db.user.findFirst({
        where: { nickname: { equals: normalized, mode: "insensitive" } }
      });
      if (existing) return mapUserRecord(existing);
      throw err;
    }
  }

  async getUserById(userId: string): Promise<UserRecord | undefined> {
    const db = this.ensure();
    try {
      const row = await db.user.findUnique({ where: { id: userId } });
      return row ? mapUserRecord(row) : undefined;
    } catch {
      return undefined;
    }
  }

  async listCharactersByUser(userId: string): Promise<CharacterRecord[]> {
    const db = this.ensure();
    try {
      const rows = await db.character.findMany({
        where: { ownerUserId: userId },
        orderBy: { updatedAt: "desc" }
      });
      return rows.map(mapCharacterRecord);
    } catch {
      return [];
    }
  }

  async getCharacterById(userId: string, characterId: string): Promise<CharacterRecord | undefined> {
    const db = this.ensure();
    try {
      const row = await db.character.findFirst({
        where: { id: characterId, ownerUserId: userId }
      });
      return row ? mapCharacterRecord(row) : undefined;
    } catch {
      return undefined;
    }
  }

  async upsertCharacter(record: CharacterRecord): Promise<CharacterRecord> {
    const db = this.ensure();
    const json = (v: unknown): any => v;
    const data = {
      ownerUserId: record.ownerUserId,
      name: record.basic.name,
      basic: json(record.basic),
      statMethod: record.statMethod,
      baseStats: json(record.baseStats),
      proficiencies: json(record.proficiencies),
      equipment: json(record.equipment),
      derived: json(record.derived),
      spells: record.spells,
      specialAttrs: record.specialAttrs
    };
    const row = await db.character.upsert({
      where: { id: record.id },
      update: data,
      create: { id: record.id, ...data }
    });
    return mapCharacterRecord(row);
  }

  async deleteCharacter(userId: string, characterId: string): Promise<boolean> {
    const db = this.ensure();
    try {
      const result = await db.character.deleteMany({
        where: { id: characterId, ownerUserId: userId }
      });
      return result.count > 0;
    } catch {
      return false;
    }
  }

  async getRoomById(roomId: string): Promise<RoomRecord | undefined> {
    const db = this.ensure();
    try {
      const row = await db.room.findUnique({
        where: { id: roomId },
        include: { players: { include: { user: { select: { nickname: true } } } } }
      });
      return row ? mapRoomRecord(row as unknown as RoomRow) : undefined;
    } catch {
      return undefined;
    }
  }

  async upsertRoom(room: RoomRecord): Promise<RoomRecord> {
    const db = this.ensure();
    const configJson: any = buildRoomConfig(room);

    await db.$transaction(async (tx: any) => {
      await tx.room.upsert({
        where: { id: room.id },
        update: {
          inviteCode: room.inviteCode,
          hostUserId: room.hostUserId,
          state: room.state,
          roomVersion: room.roomVersion,
          config: configJson
        },
        create: {
          id: room.id,
          inviteCode: room.inviteCode,
          hostUserId: room.hostUserId,
          state: room.state,
          roomVersion: room.roomVersion,
          config: configJson
        }
      });

      const existingPlayers = await tx.roomPlayer.findMany({
        where: { roomId: room.id },
        select: { id: true }
      });
      const existingIds: Set<string> = new Set(existingPlayers.map((p: { id: string }) => p.id));
      const incomingIds = new Set(room.players.map((p) => p.id));

      for (const id of existingIds) {
        if (!incomingIds.has(id)) {
          await tx.roomPlayer.delete({ where: { id } });
        }
      }

      for (const p of room.players) {
        await tx.roomPlayer.upsert({
          where: { id: p.id },
          update: {
            userId: p.userId,
            characterId: p.characterId,
            isReady: p.isReady,
            joinedAt: new Date(p.joinedAt)
          },
          create: {
            id: p.id,
            roomId: room.id,
            userId: p.userId,
            characterId: p.characterId,
            isReady: p.isReady,
            joinedAt: new Date(p.joinedAt)
          }
        });
      }
    });

    return (await this.getRoomById(room.id))!;
  }

  async listRoomMessages(roomId: string, afterSeq?: number, limit?: number): Promise<RoomMessageRecord[]> {
    const db = this.ensure();
    try {
      const rows = await db.roomMessage.findMany({
        where: {
          roomId,
          ...(afterSeq != null ? { seq: { gt: afterSeq } } : {})
        },
        orderBy: { seq: "asc" },
        take: limit ?? 100
      });
      return rows.map((r: any) => ({
        id: r.id,
        roomId: r.roomId,
        seq: r.seq,
        role: r.role as RoomMessageRecord["role"],
        senderUserId: r.senderUserId ?? undefined,
        senderName: r.senderName ?? undefined,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        meta: (r.meta as Record<string, unknown>) ?? undefined
      }));
    } catch {
      return [];
    }
  }

  async appendRoomMessage(input: {
    roomId: string;
    role: RoomMessageRecord["role"];
    senderUserId?: string;
    senderName?: string;
    content: string;
    meta?: Record<string, unknown>;
  }): Promise<RoomMessageRecord> {
    const db = this.ensure();
    return db.$transaction(async (tx: any) => {
      const maxRow = await tx.roomMessage.findFirst({
        where: { roomId: input.roomId },
        orderBy: { seq: "desc" },
        select: { seq: true }
      });
      const nextSeq = (maxRow?.seq ?? 0) + 1;

      const row = await tx.roomMessage.create({
        data: {
          roomId: input.roomId,
          seq: nextSeq,
          role: input.role,
          senderUserId: input.senderUserId ?? null,
          senderName: input.senderName ?? null,
          content: input.content,
          meta: (input.meta as any) ?? undefined
        }
      });

      return {
        id: row.id,
        roomId: row.roomId,
        seq: row.seq,
        role: row.role as RoomMessageRecord["role"],
        senderUserId: row.senderUserId ?? undefined,
        senderName: row.senderName ?? undefined,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
        meta: (row.meta as Record<string, unknown>) ?? undefined
      };
    });
  }

  async appendRoomSummary(input: {
    roomId: string;
    upToSeq: number;
    summary: string;
  }): Promise<RoomSummaryRecord> {
    const db = this.ensure();
    const row = await db.roomSummary.create({
      data: {
        roomId: input.roomId,
        upToSeq: input.upToSeq,
        summary: input.summary
      }
    });
    return {
      id: row.id,
      roomId: row.roomId,
      upToSeq: row.upToSeq,
      summary: row.summary,
      createdAt: row.createdAt.toISOString()
    };
  }

  async getLatestSummary(roomId: string): Promise<RoomSummaryRecord | undefined> {
    const db = this.ensure();
    try {
      const row = await db.roomSummary.findFirst({
        where: { roomId },
        orderBy: { upToSeq: "desc" }
      });
      return row
        ? {
            id: row.id,
            roomId: row.roomId,
            upToSeq: row.upToSeq,
            summary: row.summary,
            createdAt: row.createdAt.toISOString()
          }
        : undefined;
    } catch {
      return undefined;
    }
  }
}
