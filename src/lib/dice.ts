import { randomInt } from "node:crypto";

export type Advantage = "normal" | "advantage" | "disadvantage";

export interface RollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  kept?: number[];
  dropped?: number[];
  advantage?: Advantage;
  isCrit?: boolean;
  isFumble?: boolean;
}

export interface CheckResult extends RollResult {
  dc: number;
  success: boolean;
  bonus: number;
  bonusLabel?: string;
}

const DICE_NOTATION = /^\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*$/i;

const rollOne = (sides: number): number => {
  if (sides < 1) throw new Error(`invalid die: d${sides}`);
  return randomInt(1, sides + 1);
};

export const rollDie = (sides: number): number => rollOne(sides);

/**
 * Parse notation like "1d20", "2d6+3", "4d6-1". Modifier defaults to 0.
 */
export const parseNotation = (
  notation: string
): { count: number; sides: number; modifier: number } => {
  const match = DICE_NOTATION.exec(notation);
  if (!match) throw new Error(`invalid dice notation: ${notation}`);
  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3].replace(/\s+/g, "")) : 0;
  return { count, sides, modifier };
};

export const roll = (notation: string): RollResult => {
  const { count, sides, modifier } = parseNotation(notation);
  const rolls: number[] = [];
  for (let i = 0; i < count; i += 1) rolls.push(rollOne(sides));
  const sum = rolls.reduce((acc, value) => acc + value, 0);
  return {
    notation,
    rolls,
    modifier,
    total: sum + modifier
  };
};

/**
 * A 5e-style d20 check. Supports advantage/disadvantage and records crit/fumble on the d20 itself.
 */
export const rollD20Check = (options: {
  bonus?: number;
  dc: number;
  advantage?: Advantage;
  bonusLabel?: string;
}): CheckResult => {
  const advantage: Advantage = options.advantage ?? "normal";
  const bonus = options.bonus ?? 0;
  const a = rollOne(20);
  const b = advantage === "normal" ? undefined : rollOne(20);

  let kept = a;
  let rolls = [a];
  let dropped: number[] | undefined;
  if (b !== undefined) {
    rolls = [a, b];
    if (advantage === "advantage") {
      kept = Math.max(a, b);
      dropped = [Math.min(a, b)];
    } else {
      kept = Math.min(a, b);
      dropped = [Math.max(a, b)];
    }
  }

  const total = kept + bonus;
  return {
    notation: advantage === "normal" ? "1d20" : `2d20${advantage === "advantage" ? "kh1" : "kl1"}`,
    rolls,
    kept: [kept],
    dropped,
    modifier: bonus,
    total,
    advantage,
    dc: options.dc,
    success: total >= options.dc,
    bonus,
    bonusLabel: options.bonusLabel,
    isCrit: kept === 20,
    isFumble: kept === 1
  };
};
