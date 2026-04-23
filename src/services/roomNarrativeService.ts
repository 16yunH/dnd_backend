import type {
  CharacterRecord,
  RoomMessageRecord,
  RoomPlayer,
  RoomRecord,
  UserRecord
} from "../types/domain.js";
import type { NarrativeService } from "./narrativeService.js";
import type { RoomPublisher } from "./roomService.js";
import type { Store } from "./store.js";

export class RoomNarrativeService {
  private readonly store: Store;
  private readonly narrative?: NarrativeService;
  private publisher?: RoomPublisher;

  constructor(
    store: Store,
    options: { publisher?: RoomPublisher; narrative?: NarrativeService } = {}
  ) {
    this.store = store;
    this.publisher = options.publisher;
    this.narrative = options.narrative;
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

  private async getRoom(roomId: string): Promise<RoomRecord> {
    const room = await this.store.getRoomById(roomId);
    if (!room) {
      throw new Error("房间不存在");
    }
    return room;
  }

  private getPlayer(room: RoomRecord, userId: string): RoomPlayer | undefined {
    return room.players.find((player) => player.userId === userId);
  }

  public async listMessages(
    roomId: string,
    afterSeq = 0,
    limit = 100
  ): Promise<RoomMessageRecord[]> {
    await this.getRoom(roomId);
    return this.store.listRoomMessages(roomId, afterSeq, limit);
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
    if (room.state !== "exploration" && room.state !== "combat") {
      throw new Error("房间尚未开始战役");
    }

    const player = this.getPlayer(room, user.id);
    if (!player) {
      throw new Error("你不在该房间内");
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

    if (this.narrative) {
      const history = await this.store.listRoomMessages(roomId, 0, 50);
      try {
        const turn = await this.narrative.respondToAction({
          room,
          character,
          playerContent: input.content,
          history
        });

        if (turn.check) {
          const c = turn.check;
          created.push(
            await this.store.appendRoomMessage({
              roomId,
              role: "system",
              content: `[判定/${turn.requestedSkill ?? "check"}] d20=${c.kept?.[0] ?? c.rolls[0]}，加值=${c.bonus >= 0 ? "+" : ""}${c.bonus}（${c.bonusLabel}），总值=${c.total}，DC=${c.dc}，结果=${c.success ? "成功" : "失败"}${c.isCrit ? "（大成功）" : c.isFumble ? "（大失败）" : ""}`,
              meta: { check: c, requestedSkill: turn.requestedSkill }
            })
          );
        }

        created.push(
          await this.store.appendRoomMessage({
            roomId,
            role: "dm",
            content: turn.narration,
            meta: turn.totalTokens ? { tokens: turn.totalTokens } : undefined
          })
        );
      } catch {
        created.push(
          await this.store.appendRoomMessage({
            roomId,
            role: "dm",
            content:
              "（DM 暂时失神，无法回应。请稍后重试，或检查 LLM 服务配置。）"
          })
        );
      }
    } else {
      created.push(
        await this.store.appendRoomMessage({
          roomId,
          role: "dm",
          content: "（未接入 DM 引擎。请在后端启用 NarrativeService。）"
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
