import { describe, expect, it } from "vitest";
import {
  computeDerivedStats,
  getAbilityModifier,
  getProfBonus
} from "../src/lib/derivedStats.js";
import { RulesDataService } from "../src/services/rulesData.js";
import type { CharacterInput } from "../src/types/domain.js";

const rules = new RulesDataService();

const baseInput: CharacterInput = {
  basic: {
    name: "Test",
    race: "human",
    charClass: "fighter",
    background: "平民",
    level: 1
  },
  statMethod: "pointBuy",
  baseStats: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
  proficiencies: { skills: {} },
  equipment: { armor: "none", shield: false, weapons: "" },
  spells: "",
  specialAttrs: ""
};

describe("ability modifiers", () => {
  it.each([
    [1, -5],
    [8, -1],
    [10, 0],
    [12, 1],
    [15, 2],
    [20, 5],
    [30, 10]
  ])("score %i -> mod %i", (score, expected) => {
    expect(getAbilityModifier(score)).toBe(expected);
  });
});

describe("proficiency bonus by level", () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [20, 6]
  ])("level %i -> +%i", (level, expected) => {
    expect(getProfBonus(level)).toBe(expected);
  });
});

describe("computeDerivedStats", () => {
  it("returns finite numbers for a minimal character", () => {
    const derived = computeDerivedStats(baseInput, rules);
    expect(Number.isFinite(derived.hp)).toBe(true);
    expect(Number.isFinite(derived.ac)).toBe(true);
    expect(derived.profBonus).toBe(2);
  });

  it("shield adds +2 AC", () => {
    const noShield = computeDerivedStats(baseInput, rules);
    const withShield = computeDerivedStats(
      { ...baseInput, equipment: { ...baseInput.equipment, shield: true } },
      rules
    );
    expect(withShield.ac - noShield.ac).toBe(2);
  });
});
