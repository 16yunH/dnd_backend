import { describe, expect, it } from "vitest";
import { CombatService, type CombatParticipant } from "../src/services/combatService.js";
import { makeTempStore } from "./helpers/tempStore.js";
import type { RoomRecord } from "../src/types/domain.js";

const makeExplorationRoom = (overrides?: Partial<RoomRecord>): RoomRecord => ({
  id: "room-1",
  inviteCode: "TEST01",
  hostUserId: "u1",
  state: "exploration",
  roomVersion: 1,
  config: {
    maxPlayers: 4,
    isPrivate: false,
    password: "",
    expansion: "PHB基础",
    campaign: "测试战役"
  },
  players: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

const defaultParticipants: CombatParticipant[] = [
  { name: "战士", type: "pc", dexModifier: 1, maxHp: 30, ac: 16 },
  { name: "法师", type: "pc", dexModifier: 2, maxHp: 18, ac: 12 },
  { name: "哥布林", type: "npc", dexModifier: 2, maxHp: 7, ac: 15 }
];

describe("CombatService", () => {
  describe("startCombat", () => {
    it("initializes CombatState with initiative-sorted combatants and sets room state to combat", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const updated = await svc.startCombat(room.id, defaultParticipants);

        expect(updated.state).toBe("combat");
        expect(updated.combat).toBeDefined();
        expect(updated.combat!.round).toBe(1);
        expect(updated.combat!.turnIndex).toBe(0);
        expect(updated.combat!.combatants).toHaveLength(3);

        const initiatives = updated.combat!.combatants.map((c) => c.initiative);
        for (let i = 1; i < initiatives.length; i++) {
          expect(initiatives[i]).toBeLessThanOrEqual(initiatives[i - 1]);
        }

        const first = updated.combat!.combatants[0];
        expect(first.hp).toBe(first.maxHp);
        expect(first.tempHp).toBe(0);
        expect(first.conditions).toEqual([]);
      } finally {
        cleanup();
      }
    });
  });

  describe("nextTurn", () => {
    it("advances turn index within the same round", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        await svc.startCombat(room.id, defaultParticipants);

        const afterNext = await svc.nextTurn(room.id);
        expect(afterNext.combat!.turnIndex).toBe(1);
        expect(afterNext.combat!.round).toBe(1);
      } finally {
        cleanup();
      }
    });

    it("wraps to next round when all combatants have acted", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        await svc.startCombat(room.id, defaultParticipants);

        await svc.nextTurn(room.id);
        await svc.nextTurn(room.id);
        const afterWrap = await svc.nextTurn(room.id);

        expect(afterWrap.combat!.round).toBe(2);
        expect(afterWrap.combat!.turnIndex).toBe(0);
      } finally {
        cleanup();
      }
    });
  });

  describe("applyDamage", () => {
    it("reduces HP by the damage amount", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        const result = await svc.applyDamage(room.id, target.id, 10);
        expect(result.hp).toBe(target.maxHp - 10);
      } finally {
        cleanup();
      }
    });

    it("absorbs damage with temp HP first", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        await svc.addTempHp(room.id, target.id, 5);
        const result = await svc.applyDamage(room.id, target.id, 8);

        expect(result.tempHp).toBe(0);
        expect(result.hp).toBe(target.maxHp - 3);
      } finally {
        cleanup();
      }
    });

    it("does not reduce HP below 0", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        const result = await svc.applyDamage(room.id, target.id, 9999);
        expect(result.hp).toBe(0);
      } finally {
        cleanup();
      }
    });
  });

  describe("heal", () => {
    it("increases HP by the heal amount", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        await svc.applyDamage(room.id, target.id, 15);
        const result = await svc.heal(room.id, target.id, 10);
        expect(result.hp).toBe(target.maxHp - 15 + 10);
      } finally {
        cleanup();
      }
    });

    it("does not exceed maxHp", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        await svc.applyDamage(room.id, target.id, 5);
        const result = await svc.heal(room.id, target.id, 9999);
        expect(result.hp).toBe(target.maxHp);
      } finally {
        cleanup();
      }
    });
  });

  describe("addTempHp", () => {
    it("sets temp HP to the higher of current and new value", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        const r1 = await svc.addTempHp(room.id, target.id, 5);
        expect(r1.tempHp).toBe(5);

        const r2 = await svc.addTempHp(room.id, target.id, 3);
        expect(r2.tempHp).toBe(5);

        const r3 = await svc.addTempHp(room.id, target.id, 10);
        expect(r3.tempHp).toBe(10);
      } finally {
        cleanup();
      }
    });
  });

  describe("addCondition / removeCondition", () => {
    it("adds a condition to a combatant", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        const result = await svc.addCondition(room.id, target.id, "poisoned");
        expect(result.conditions).toContain("poisoned");
      } finally {
        cleanup();
      }
    });

    it("does not add duplicate conditions", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        await svc.addCondition(room.id, target.id, "poisoned");
        const result = await svc.addCondition(room.id, target.id, "poisoned");
        expect(result.conditions.filter((c) => c === "poisoned")).toHaveLength(1);
      } finally {
        cleanup();
      }
    });

    it("removes a condition from a combatant", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        const started = await svc.startCombat(room.id, defaultParticipants);
        const target = started.combat!.combatants[0];

        await svc.addCondition(room.id, target.id, "poisoned");
        await svc.addCondition(room.id, target.id, "blinded");
        const result = await svc.removeCondition(room.id, target.id, "poisoned");
        expect(result.conditions).not.toContain("poisoned");
        expect(result.conditions).toContain("blinded");
      } finally {
        cleanup();
      }
    });
  });

  describe("endCombat", () => {
    it("sets room state back to exploration and clears combat", async () => {
      const { store, cleanup } = makeTempStore();
      try {
        const room = makeExplorationRoom();
        await store.upsertRoom(room);

        const svc = new CombatService(store);
        await svc.startCombat(room.id, defaultParticipants);

        const ended = await svc.endCombat(room.id);
        expect(ended.state).toBe("exploration");
        expect(ended.combat).toBeUndefined();
      } finally {
        cleanup();
      }
    });
  });
});
