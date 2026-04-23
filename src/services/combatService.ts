import { randomUUID } from "node:crypto";
import { roll } from "../lib/dice.js";
import { HttpError } from "../lib/httpError.js";
import type { Combatant, CombatState, RoomRecord } from "../types/domain.js";
import type { Store } from "./store.js";

export interface CombatParticipant {
  name: string;
  type: "pc" | "npc";
  characterId?: string;
  dexModifier?: number;
  maxHp: number;
  ac: number;
}

export interface CombatPublisher {
  publishCombatUpdate(room: RoomRecord): void;
}

export class CombatService {
  private readonly store: Store;
  private publisher?: CombatPublisher;

  constructor(store: Store, options: { publisher?: CombatPublisher } = {}) {
    this.store = store;
    this.publisher = options.publisher;
  }

  public setPublisher(publisher: CombatPublisher) {
    this.publisher = publisher;
  }

  private async getRoom(roomId: string): Promise<RoomRecord> {
    const room = await this.store.getRoomById(roomId);
    if (!room) {
      throw new HttpError(404, "房间不存在");
    }
    return room;
  }

  private touchRoom(room: RoomRecord): RoomRecord {
    return {
      ...room,
      roomVersion: room.roomVersion + 1,
      updatedAt: new Date().toISOString()
    };
  }

  private assertCombat(room: RoomRecord): CombatState {
    if (room.state !== "combat" || !room.combat) {
      throw new HttpError(400, "当前不在战斗中");
    }
    return room.combat;
  }

  private findCombatant(combat: CombatState, combatantId: string): Combatant {
    const c = combat.combatants.find((c) => c.id === combatantId);
    if (!c) {
      throw new HttpError(404, "参战者不存在");
    }
    return c;
  }

  private async saveAndPublish(room: RoomRecord): Promise<RoomRecord> {
    const updated = this.touchRoom(room);
    await this.store.upsertRoom(updated);
    if (this.publisher) {
      this.publisher.publishCombatUpdate(updated);
    }
    return updated;
  }

  public async startCombat(
    roomId: string,
    participants: CombatParticipant[]
  ): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    if (room.state !== "exploration") {
      throw new HttpError(400, "仅探索阶段可发起战斗");
    }
    if (participants.length === 0) {
      throw new HttpError(400, "至少需要一个参战者");
    }

    const combatants: Combatant[] = participants.map((p) => {
      const dexMod = p.dexModifier ?? 0;
      const initiativeRoll = roll("1d20");
      const initiative = initiativeRoll.total + dexMod;
      return {
        id: randomUUID(),
        name: p.name,
        type: p.type,
        characterId: p.characterId,
        initiative,
        hp: p.maxHp,
        maxHp: p.maxHp,
        tempHp: 0,
        ac: p.ac,
        conditions: []
      };
    });

    combatants.sort((a, b) => b.initiative - a.initiative);

    const combat: CombatState = {
      round: 1,
      turnIndex: 0,
      combatants,
      startedAt: new Date().toISOString()
    };

    const updated = await this.saveAndPublish({
      ...room,
      state: "combat",
      combat
    });

    const message = await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] 战斗开始！先攻顺序：${combatants.map((c) => `${c.name}(${c.initiative})`).join(" > ")}`
    });

    const finalRoom = await this.getRoom(roomId);
    if (this.publisher) {
      this.publisher.publishCombatUpdate(finalRoom);
    }

    return finalRoom;
  }

  public async nextTurn(roomId: string): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    const combat = this.assertCombat(room);

    const nextIndex = combat.turnIndex + 1;
    if (nextIndex >= combat.combatants.length) {
      combat.round += 1;
      combat.turnIndex = 0;
    } else {
      combat.turnIndex = nextIndex;
    }

    const current = combat.combatants[combat.turnIndex];
    const updated = await this.saveAndPublish({ ...room, combat: { ...combat } });

    await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] 第${combat.round}轮 — ${current.name}的回合`
    });

    return await this.getRoom(roomId);
  }

  public async applyDamage(
    roomId: string,
    combatantId: string,
    amount: number,
    type?: string
  ): Promise<Combatant> {
    const room = await this.getRoom(roomId);
    const combat = this.assertCombat(room);
    const combatant = this.findCombatant(combat, combatantId);

    let remaining = amount;
    if (combatant.tempHp > 0) {
      const absorbed = Math.min(combatant.tempHp, remaining);
      combatant.tempHp -= absorbed;
      remaining -= absorbed;
    }
    combatant.hp = Math.max(0, combatant.hp - remaining);

    await this.saveAndPublish({ ...room, combat: { ...combat } });

    const typeLabel = type ? `（${type}）` : "";
    await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] ${combatant.name} 受到 ${amount} 点伤害${typeLabel}，HP: ${combatant.hp}/${combatant.maxHp}${combatant.hp === 0 ? "（倒地）" : ""}`
    });

    return combatant;
  }

  public async heal(
    roomId: string,
    combatantId: string,
    amount: number
  ): Promise<Combatant> {
    const room = await this.getRoom(roomId);
    const combat = this.assertCombat(room);
    const combatant = this.findCombatant(combat, combatantId);

    combatant.hp = Math.min(combatant.maxHp, combatant.hp + amount);

    await this.saveAndPublish({ ...room, combat: { ...combat } });

    await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] ${combatant.name} 恢复 ${amount} 点HP，HP: ${combatant.hp}/${combatant.maxHp}`
    });

    return combatant;
  }

  public async addTempHp(
    roomId: string,
    combatantId: string,
    amount: number
  ): Promise<Combatant> {
    const room = await this.getRoom(roomId);
    const combat = this.assertCombat(room);
    const combatant = this.findCombatant(combat, combatantId);

    combatant.tempHp = Math.max(combatant.tempHp, amount);

    await this.saveAndPublish({ ...room, combat: { ...combat } });

    await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] ${combatant.name} 获得 ${amount} 点临时HP`
    });

    return combatant;
  }

  public async addCondition(
    roomId: string,
    combatantId: string,
    condition: string
  ): Promise<Combatant> {
    const room = await this.getRoom(roomId);
    const combat = this.assertCombat(room);
    const combatant = this.findCombatant(combat, combatantId);

    if (!combatant.conditions.includes(condition)) {
      combatant.conditions.push(condition);
    }

    await this.saveAndPublish({ ...room, combat: { ...combat } });

    await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] ${combatant.name} 获得状态：${condition}`
    });

    return combatant;
  }

  public async removeCondition(
    roomId: string,
    combatantId: string,
    condition: string
  ): Promise<Combatant> {
    const room = await this.getRoom(roomId);
    const combat = this.assertCombat(room);
    const combatant = this.findCombatant(combat, combatantId);

    combatant.conditions = combatant.conditions.filter((c) => c !== condition);

    await this.saveAndPublish({ ...room, combat: { ...combat } });

    await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] ${combatant.name} 移除状态：${condition}`
    });

    return combatant;
  }

  public async endCombat(roomId: string): Promise<RoomRecord> {
    const room = await this.getRoom(roomId);
    this.assertCombat(room);

    const updated = await this.saveAndPublish({
      ...room,
      state: "exploration",
      combat: undefined
    });

    await this.store.appendRoomMessage({
      roomId,
      role: "system",
      content: `[战斗] 战斗结束，回到探索模式`
    });

    return await this.getRoom(roomId);
  }

  public async getCurrentCombatant(roomId: string): Promise<Combatant> {
    const room = await this.getRoom(roomId);
    const combat = this.assertCombat(room);
    return combat.combatants[combat.turnIndex];
  }
}
