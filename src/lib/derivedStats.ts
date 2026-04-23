import type { AbilityScores, CharacterInput, StatId } from "../types/domain.js";
import { RulesDataService } from "../services/rulesData.js";

const STAT_IDS: StatId[] = ["str", "dex", "con", "int", "wis", "cha"];

const asScore = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 8;
  }
  return Math.max(1, Math.min(30, Math.floor(value)));
};

const asLevel = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(20, Math.floor(value)));
};

export const getAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const getProfBonus = (level: number): number => {
  return Math.floor((level - 1) / 4) + 2;
};

const normalizeStats = (stats: Partial<AbilityScores> | undefined): AbilityScores => {
  return {
    str: asScore(stats?.str ?? 8),
    dex: asScore(stats?.dex ?? 8),
    con: asScore(stats?.con ?? 8),
    int: asScore(stats?.int ?? 8),
    wis: asScore(stats?.wis ?? 8),
    cha: asScore(stats?.cha ?? 8)
  };
};

export const computeDerivedStats = (input: CharacterInput, rules: RulesDataService) => {
  const level = asLevel(input.basic.level);
  const race = rules.findRace(input.basic.race);
  const cls = rules.findClass(input.basic.charClass);
  const baseStats = normalizeStats(input.baseStats);

  const finalStats: AbilityScores = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0
  };
  const modifiers: AbilityScores = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0
  };

  for (const statId of STAT_IDS) {
    const bonus = (race as any)?.abilityBonus?.[statId] ?? 0;
    finalStats[statId] = baseStats[statId] + bonus;
    modifiers[statId] = getAbilityModifier(finalStats[statId]);
  }

  const profBonus = getProfBonus(level);
  const initiative = modifiers.dex;
  const armor = rules.findArmor(input.equipment.armor);

  let ac = 10 + modifiers.dex;
  if (armor) {
    ac = (armor as any).baseAC;
    if ((armor as any).dexModifier === "full") {
      ac += modifiers.dex;
    } else if ((armor as any).dexModifier === "capped") {
      const maxDex =
        typeof (armor as any).maxDexBonus === "number"
          ? (armor as any).maxDexBonus
          : 0;
      ac += Math.min(maxDex, modifiers.dex);
    }
  }
  if (input.equipment.shield) {
    ac += 2;
  }

  const hitDie = Number((cls as any)?.hitDie ?? 8);
  const hp = Math.floor(
    hitDie + modifiers.con + (hitDie / 2 + 1 + modifiers.con) * (level - 1)
  );

  const spellcastingAbility =
    (cls as any)?.spellcasting?.ability ?? (cls as any)?.primaryAbilities?.[0] ?? "wis";
  const spellAbilityModifier = modifiers[spellcastingAbility as StatId] ?? modifiers.wis;
  const spellDC = 8 + profBonus + spellAbilityModifier;

  const passivePerception =
    10 + modifiers.wis + (input.proficiencies.skills.perception ? profBonus : 0);

  return {
    profBonus,
    initiative,
    ac,
    hp,
    spellDC,
    passivePerception,
    finalStats,
    modifiers
  };
};
