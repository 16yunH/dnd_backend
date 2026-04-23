import { randomUUID } from "node:crypto";
import { HttpError } from "../lib/httpError.js";
import type {
  CharacterRecord,
  RoomMessageRecord,
  RoomPlayer,
  RoomRecord,
  UserRecord
} from "../types/domain.js";
import { JsonStore } from "./jsonStore.js";

export interface RoomPublisher {
  publishRoomSnapshot(room: RoomRecord): void;
  publishRoomMessages(
    roomId: string,
    messages: RoomMessageRecord[],
    roomVersion: number
  ): void;
}

const KEYWORD_SKILL_MAP: Array<{
  keywords: string[];
  skillId: string;
  stat: "str" | "dex" | "con" | "int" | "wis" | "cha";
}> = [
  { keywords: ["洞察"], skillId: "insight", stat: "wis" },
  { keywords: ["察觉", "观察"], skillId: "perception", stat: "wis" },
  { keywords: ["威吓"], skillId: "intimidation", stat: "cha" },
  { keywords: ["游说", "说服"], skillId: "persuasion", stat: "cha" },
  { keywords: ["隐匿", "潜行"], skillId: "stealth", stat: "dex" },
  { keywords: ["运动"], skillId: "athletics", stat: "str" },
  { keywords: ["体操"], skillId: "acrobatics", stat: "dex" },
  { keywords: ["调查"], skillId: "investigation", stat: "int" }
];

const randomRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const rollD20 = (): number => {
  return Math.floor(Math.random() * 20) + 1;
};

const cloneRoom = (room: RoomRecord): RoomRecord => {
  return JSON.parse(JSON.stringify(room)) as RoomRecord;
};

export class RoomService {
  private readonly store: JsonStore;
  private publisher?: RoomPublisher;

  constructor(store: JsonStore, publisher?: RoomPublisher) {
    this.store = store;
    this.publisher = publisher;
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
      state: "playing"
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

    return updated;
  }

  public async listMessages(
    roomId: string,
    afterSeq = 0,
    limit = 100
  ): Promise<RoomMessageRecord[]> {
    await this.getRoom(roomId);
    return this.store.listRoomMessages(roomId, afterSeq, limit);
  }

  private resolveActionCheck(content: string, character?: CharacterRecord) {
    const normalized = content.toLowerCase();
    const match = KEYWORD_SKILL_MAP.find((item) =>
      item.keywords.some((keyword) => content.includes(keyword))
    );

    if (!match && !normalized.includes("检定") && !normalized.includes("d20")) {
      return null;
    }

    const roll = rollD20();
    const dc = content.includes("非常困难") ? 18 : content.includes("困难") ? 15 : 12;

    let bonus = 0;
    let bonusLabel = "基础检定";
    if (match && character) {
      const statMod = character.derived.modifiers[match.stat] ?? 0;
      const hasProf = Boolean(character.proficiencies.skills[match.skillId]);
      bonus = statMod + (hasProf ? character.derived.profBonus : 0);
      bonusLabel = `${match.skillId}${hasProf ? "(熟练)" : ""}`;
    }

    const total = roll + bonus;
    const success = total >= dc;

    return {
      roll,
      bonus,
      total,
      dc,
      success,
      bonusLabel
    };
  }

  public async submitAction(
    user: UserRecord,
    roomId: string,
    input: { content: string }
  ): Promise<{
    room: RoomRecord;
    messages: RoomMessageRecord[];
  }> {
    const room = await this.getRoom(roomId);
    if (room.state !== "playing") {
      throw new HttpError(400, "房间尚未开始战役");
    }

    const player = this.getPlayer(room, user.id);
    if (!player) {
      throw new HttpError(403, "你不在该房间内");
    }

    let character: CharacterRecord | undefined;
    if (player.characterId) {
      character = await this.store.getCharacterById(user.id, player.characterId);
    }

    const created: RoomMessageRecord[] = [];
    created.push(
      await this.store.appendRoomMessage({
        roomId,
        role: "player",
        senderUserId: user.id,
        senderName: character?.basic.name ?? user.nickname,
        content: input.content
      })
    );

    const check = this.resolveActionCheck(input.content, character);
    if (check) {
      created.push(
        await this.store.appendRoomMessage({
          roomId,
          role: "system",
          content: `[判定] d20=${check.roll}，加值=${check.bonus >= 0 ? "+" : ""}${check.bonus}（${check.bonusLabel}），总值=${check.total}，DC=${check.dc}，结果=${check.success ? "成功" : "失败"}`,
          meta: {
            check
          }
        })
      );
      created.push(
        await this.store.appendRoomMessage({
          roomId,
          role: "dm",
          content: check.success
            ? "你行动得当，局势向有利方向倾斜。旅店老板的语气明显缓和下来，似乎愿意透露更多信息。"
            : "你的尝试并未达到预期。旅店老板警惕地后退半步，目光在你们的武器与门口之间来回游移。"
        })
      );
    } else {
      created.push(
        await this.store.appendRoomMessage({
          roomId,
          role: "dm",
          content:
            "老板听完你的话，皱眉片刻后点了点头：\n“继续说下去，旅人。你们想从我这里打听什么？”"
        })
      );
    }

    const latestRoom = await this.getRoom(roomId);
    this.publishRoomUpdate(latestRoom, created);
    return {
      room: latestRoom,
      messages: created
    };
  }
}
