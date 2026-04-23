import { describe, expect, it } from "vitest";
import { parseNotation, roll, rollD20Check } from "../src/lib/dice.js";

describe("dice notation parser", () => {
  it("parses 1d20 with no modifier", () => {
    expect(parseNotation("1d20")).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  it("parses count-less notation", () => {
    expect(parseNotation("d20")).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  it("parses positive and negative modifiers", () => {
    expect(parseNotation("2d6+3")).toEqual({ count: 2, sides: 6, modifier: 3 });
    expect(parseNotation("4d6-1")).toEqual({ count: 4, sides: 6, modifier: -1 });
  });

  it("rejects garbage", () => {
    expect(() => parseNotation("dog")).toThrow();
    expect(() => parseNotation("1d0")).not.toThrow(); // parser allows; rollOne throws
  });
});

describe("roll()", () => {
  it("produces total in valid range", () => {
    for (let i = 0; i < 200; i += 1) {
      const r = roll("2d6+3");
      expect(r.rolls).toHaveLength(2);
      expect(r.total).toBeGreaterThanOrEqual(5);
      expect(r.total).toBeLessThanOrEqual(15);
    }
  });
});

describe("rollD20Check()", () => {
  it("returns success when bonus+roll >= dc", () => {
    const result = rollD20Check({ bonus: 100, dc: 10 });
    expect(result.success).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(10 + 100 + 1);
  });

  it("marks crits and fumbles on natural 20/1 range", () => {
    let gotCrit = false;
    let gotFumble = false;
    for (let i = 0; i < 500 && !(gotCrit && gotFumble); i += 1) {
      const r = rollD20Check({ bonus: 0, dc: 10 });
      if (r.isCrit) gotCrit = true;
      if (r.isFumble) gotFumble = true;
    }
    expect(gotCrit).toBe(true);
    expect(gotFumble).toBe(true);
  });

  it("advantage keeps the higher of two d20s", () => {
    for (let i = 0; i < 50; i += 1) {
      const r = rollD20Check({ bonus: 0, dc: 10, advantage: "advantage" });
      expect(r.rolls).toHaveLength(2);
      expect(r.kept![0]).toBe(Math.max(...r.rolls));
    }
  });

  it("disadvantage keeps the lower of two d20s", () => {
    for (let i = 0; i < 50; i += 1) {
      const r = rollD20Check({ bonus: 0, dc: 10, advantage: "disadvantage" });
      expect(r.kept![0]).toBe(Math.min(...r.rolls));
    }
  });
});
