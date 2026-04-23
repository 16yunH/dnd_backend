import type {
  CharacterRecord,
  RoomMessageRecord,
  RoomRecord,
  RoomSummaryRecord,
  UserRecord
} from "../types/domain.js";

/**
 * Persistence abstraction. The current in-process JSON store and the
 * future Postgres/Prisma store both satisfy this interface.
 *
 * Keeping this contract narrow lets services stay backend-agnostic.
 */
export interface Store {
  // users
  getOrCreateUser(nickname: string): Promise<UserRecord>;
  getUserById(userId: string): Promise<UserRecord | undefined>;

  // characters
  listCharactersByUser(userId: string): Promise<CharacterRecord[]>;
  getCharacterById(
    userId: string,
    characterId: string
  ): Promise<CharacterRecord | undefined>;
  upsertCharacter(record: CharacterRecord): Promise<CharacterRecord>;
  deleteCharacter(userId: string, characterId: string): Promise<boolean>;

  // rooms
  getRoomById(roomId: string): Promise<RoomRecord | undefined>;
  upsertRoom(room: RoomRecord): Promise<RoomRecord>;

  // room messages
  listRoomMessages(
    roomId: string,
    afterSeq?: number,
    limit?: number
  ): Promise<RoomMessageRecord[]>;
  appendRoomMessage(input: {
    roomId: string;
    role: RoomMessageRecord["role"];
    senderUserId?: string;
    senderName?: string;
    content: string;
    meta?: Record<string, unknown>;
  }): Promise<RoomMessageRecord>;

  appendRoomSummary(input: {
    roomId: string;
    upToSeq: number;
    summary: string;
  }): Promise<RoomSummaryRecord>;

  getLatestSummary(roomId: string): Promise<RoomSummaryRecord | undefined>;
}
