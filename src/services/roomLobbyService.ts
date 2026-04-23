import { randomUUID } from "node:crypto";
import { HttpError } from "../lib/httpError.js";
import type {
  GridToken,
  RoomMessageRecord,
  RoomPlayer,
  RoomRecord,
  UserRecord
} from "../types/domain.js";
import type { RoomPublisher } from "./roomService.js";
import type { Store } from "./store.js";

const randomRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const cloneRoom = (room: RoomRecord): RoomRecord => {
  return JSON.parse(JSON.stringify(room)) as RoomRecord;
};

export class RoomLobbyService {
  private readonly store: Store;
  private publisher?: RoomPublisher;

  constructor(store: Store, options: { publisher?: RoomPublisher } = {}) {
    this.store = store;
    this.publisher = options.publisher;
  }

  public setPublisher(publisher: RoomPublisher) {
    this.publisher = publisher;
  }

  private publishRoomUpdate(room: RoomRecord, messages: RoomMessageRecord[] = []) {
    if (!this.publisher) {
      return;
    }
    this.publisher.publishRoomSnapshot(room);
    if (messages.length > 0) {
      this.publisher.publishRoomMessages(room.id, messages, room.roomVersion);
    }
  }

  private async uniqueRoomCode(): Promise<string> {
    for (let i = 0; i < 20; i += 1) {
      const candidate = randomRoomCode();
      const exists = await this.store.getRoomById(candidate);
      if (!exists) {
        return candidate;
      }
    }
    throw new HttpError(500, "生成房间号失败，请重试");
  }

  private getPlayer(room: RoomRecord, userId: string): RoomPlayer | undefined {
    return room.players.find((player) => player.userId === userId);
  }

  private assertVersion(room: RoomRecord, expectedRoomVersion?: number) {
    if (
      typeof expectedRoomVersion === "number" &&
      room.roomVersion !== expectedRoomVersion
    ) {
      throw new HttpError(409, "房间状态已变化，请刷新后重试", {
        roomVersion: room.roomVersion
      });
    }
  }

  private touchRoom(room: RoomRecord): RoomRecord {
    return {
      ...room,
      roomVersion: room.roomVersion + 1,
      updatedAt: new Date().toISOString()
    };
  }

  private publishGridUpdate(room: RoomRecord) {
    if (!this.publisher || !room.grid) {
      return;
    }
    this.publisher.publishGridUpdate(room.id, room.grid);
  }

  public async createRoom(user: UserRecord, input: {
    maxPlayers: number;
    isPrivate: boolean;
    password: string;
    expansion: string;
    campaign: string;
  }): Promise<RoomRecord> {
    const roomId = await this.uniqueRoomCode();
    const now = new Date().toISOString();
    const room: RoomRecord = {
      id: roomId,
      inviteCode: roomId,
      hostUserId: user.id,
      state: "waiting",
      roomVersion: 1,
      config: {
        maxPlayers: input.maxPlayers,
        isPrivate: input.isPrivate,
        password: input.password,
        expansion: input.expansion,
        campaign: input.campaign
      },
      players: [
        {
          id: randomUUID(),
          userId: user.id,
          username: user.nickname,
          isReady: false,
          characterId: null,
          joinedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    await this.store.upsertRoom(room);
    const message = await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[系统] 房间 ${roomId} 已建立，战役主题：${input.campaign}`
    });
    this.publishRoomUpdate(room, [message]);

    return room;
  }

  public async getRoom(roomId: string): Promise<RoomRecord> {
    const room = await this.store.getRoomById(roomId);
    if (!room) {
      throw new HttpError(404, "房间不存在");
    }
    return room;
  }

  public async joinRoom(
    user: UserRecord,
    roomId: string,
    password?: string
  ): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    const next = cloneRoom(room);

    const existing = this.getPlayer(next, user.id);
    if (existing) {
      return room;
    }

    if (next.players.length >= next.config.maxPlayers) {
      throw new HttpError(400, "房间人数已满");
    }

    if (next.config.isPrivate && next.config.password !== (password ?? "")) {
      throw new HttpError(403, "房间口令错误");
    }

    next.players.push({
      id: randomUUID(),
      userId: user.id,
      username: user.nickname,
      isReady: false,
      characterId: null,
      joinedAt: new Date().toISOString()
    });

    const updated = this.touchRoom(next);
    await this.store.upsertRoom(updated);
    const message = await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[系统] ${user.nickname} 加入了房间。`
    });
    this.publishRoomUpdate(updated, [message]);
    return updated;
  }

  public async leaveRoom(user: UserRecord, roomId: string): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    const next = cloneRoom(room);
    const before = next.players.length;
    next.players = next.players.filter((player) => player.userId !== user.id);

    if (next.players.length === before) {
      return room;
    }

    if (next.players.length > 0 && next.hostUserId === user.id) {
      next.hostUserId = next.players[0].userId;
    }

    const updated = this.touchRoom(next);
    await this.store.upsertRoom(updated);
    const message = await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[系统] ${user.nickname} 离开了房间。`
    });
    this.publishRoomUpdate(updated, [message]);
    return updated;
  }

  public async setReady(
    user: UserRecord,
    roomId: string,
    input: {
      isReady: boolean;
      characterId?: string;
      expectedRoomVersion?: number;
    }
  ): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    this.assertVersion(room, input.expectedRoomVersion);
    if (room.state !== "waiting") {
      throw new HttpError(400, "仅等待阶段可切换准备状态");
    }

    const next = cloneRoom(room);
    const player = this.getPlayer(next, user.id);
    if (!player) {
      throw new HttpError(403, "你不在该房间内");
    }

    if (input.isReady && !input.characterId && !player.characterId) {
      throw new HttpError(400, "准备前请先选择角色卡");
    }

    if (input.characterId) {
      const character = await this.store.getCharacterById(user.id, input.characterId);
      if (!character) {
        throw new HttpError(404, "角色不存在或不属于当前用户");
      }
      player.characterId = character.id;
    }

    player.isReady = input.isReady;

    const updated = this.touchRoom(next);
    await this.store.upsertRoom(updated);
    const message = await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[系统] ${user.nickname} ${input.isReady ? "已准备" : "取消准备"}。`
    });
    this.publishRoomUpdate(updated, [message]);
    return updated;
  }

  public async startRoom(
    user: UserRecord,
    roomId: string,
    input: { expectedRoomVersion?: number }
  ): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    this.assertVersion(room, input.expectedRoomVersion);
    if (room.hostUserId !== user.id) {
      throw new HttpError(403, "仅房主可开始战役");
    }
    if (room.state !== "waiting") {
      throw new HttpError(400, "房间已开始");
    }
    if (room.players.length === 0) {
      throw new HttpError(400, "房间为空");
    }
    const allReady = room.players.every((player) => player.isReady && player.characterId);
    if (!allReady) {
      throw new HttpError(400, "并非所有玩家都已准备并锁定角色");
    }

    const updated = this.touchRoom({
      ...cloneRoom(room),
      state: "exploration",
      grid: {
        width: 20,
        height: 20,
        tokens: room.players
          .filter((p) => p.characterId)
          .map((p) => ({
            id: randomUUID(),
            x: 0,
            y: 0,
            kind: "pc" as const,
            characterId: p.characterId!
          }))
      }
    });
    await this.store.upsertRoom(updated);
    const message1 = await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[神谕]：规则约束完毕，位面 ${roomId} 开始远征！`
    });
    const message2 = await this.store.appendRoomMessage({
      roomId,
      role: "dm",
      content:
        "你们穿过雷鸣交加的荒野，来到「沉睡巨人」旅店门前。门扉吱呀而开，烛光与麦酒味迎面而来。老板抬眼打量你们，低声问：住店，还是打酒？"
    });
    this.publishRoomUpdate(updated, [message1, message2]);
    this.publishGridUpdate(updated);

    return updated;
  }

  public async initGrid(roomId: string, width: number, height: number): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    if (room.state === "waiting" || room.state === "ended") {
      throw new HttpError(400, "仅战役进行中可初始化网格");
    }

    const tokens: GridToken[] = [];
    for (const player of room.players) {
      if (player.characterId) {
        tokens.push({
          id: randomUUID(),
          x: 0,
          y: 0,
          kind: "pc",
          characterId: player.characterId
        });
      }
    }

    const updated = this.touchRoom({
      ...cloneRoom(room),
      grid: { width, height, tokens }
    });
    await this.store.upsertRoom(updated);
    this.publishGridUpdate(updated);
    return updated;
  }

  public async moveToken(roomId: string, tokenId: string, x: number, y: number): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    if (!room.grid) {
      throw new HttpError(400, "房间尚未初始化网格");
    }

    const token = room.grid.tokens.find((t) => t.id === tokenId);
    if (!token) {
      throw new HttpError(404, "Token 不存在");
    }

    if (x < 0 || x >= room.grid.width || y < 0 || y >= room.grid.height) {
      throw new HttpError(400, "Token 位置超出网格边界");
    }

    token.x = x;
    token.y = y;

    const updated = this.touchRoom(cloneRoom(room));
    await this.store.upsertRoom(updated);
    this.publishGridUpdate(updated);
    return updated;
  }

  public async addToken(roomId: string, input: Omit<GridToken, "id">): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    if (!room.grid) {
      throw new HttpError(400, "房间尚未初始化网格");
    }

    if (input.x < 0 || input.x >= room.grid.width || input.y < 0 || input.y >= room.grid.height) {
      throw new HttpError(400, "Token 位置超出网格边界");
    }

    const token: GridToken = {
      ...input,
      id: randomUUID()
    };

    const next = cloneRoom(room);
    next.grid!.tokens.push(token);

    const updated = this.touchRoom(next);
    await this.store.upsertRoom(updated);
    this.publishGridUpdate(updated);
    return updated;
  }

  public async removeToken(roomId: string, tokenId: string): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    if (!room.grid) {
      throw new HttpError(400, "房间尚未初始化网格");
    }

    const idx = room.grid.tokens.findIndex((t) => t.id === tokenId);
    if (idx === -1) {
      throw new HttpError(404, "Token 不存在");
    }

    const next = cloneRoom(room);
    next.grid!.tokens.splice(idx, 1);

    const updated = this.touchRoom(next);
    await this.store.upsertRoom(updated);
    this.publishGridUpdate(updated);
    return updated;
  }
}
