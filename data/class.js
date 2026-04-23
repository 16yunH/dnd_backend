import { CLASS_FEATURES } from "./classFeatures.js";

const byLevel = (values) =>
  Object.fromEntries(values.map((value, index) => [index + 1, value]));

export const FULL_CASTER_SLOTS = byLevel([
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1]
]);

export const HALF_CASTER_SLOTS = byLevel([
  [0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0],
  [3, 0, 0, 0, 0],
  [3, 0, 0, 0, 0],
  [4, 2, 0, 0, 0],
  [4, 2, 0, 0, 0],
  [4, 3, 0, 0, 0],
  [4, 3, 0, 0, 0],
  [4, 3, 2, 0, 0],
  [4, 3, 2, 0, 0],
  [4, 3, 3, 0, 0],
  [4, 3, 3, 0, 0],
  [4, 3, 3, 1, 0],
  [4, 3, 3, 1, 0],
  [4, 3, 3, 2, 0],
  [4, 3, 3, 2, 0],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2]
]);

export const CLASSES = [
  {
    id: "barbarian",
    name: "野蛮人",
    hitDie: 12,
    primaryAbilities: ["str"],
    savingThrows: ["str", "con"],
    proficiencies: {
      armors: ["轻甲", "中甲", "盾牌"],
      weapons: ["简易武器", "军用武器"],
      tools: []
    },
    skillChoices: {
      choose: 2,
      from: ["animal_handling", "athletics", "intimidation", "nature", "perception", "survival"]
    },
    subclass: {
      name: "原初道途",
      selectAt: 3,
      featureLevels: [3, 6, 10, 14]
    },
    spellcasting: null,
    progression: {
      ragesByLevel: byLevel([2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, "unlimited"]),
      rageDamageByLevel: byLevel([2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4])
    },
    features: CLASS_FEATURES.barbarian
  },

  {
    id: "bard",
    name: "吟游诗人",
    hitDie: 8,
    primaryAbilities: ["cha"],
    savingThrows: ["dex", "cha"],
    proficiencies: {
      armors: ["轻甲"],
      weapons: ["简易武器", "手弩", "长剑", "细剑", "短剑"],
      tools: ["任意三种乐器"]
    },
    skillChoices: {
      choose: 3,
      from: "any"
    },
    subclass: {
      name: "吟游学院",
      selectAt: 3,
      featureLevels: [3, 6, 14]
    },
    spellcasting: {
      kind: "spellcasting",
      progression: "full",
      startsAt: 1,
      ability: "cha",
      preparation: "known",
      ritualCasting: true,
      focus: ["乐器"],
      cantripsKnownByLevel: byLevel([2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
      spellsKnownByLevel: byLevel([4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22]),
      spellSlotsByLevel: FULL_CASTER_SLOTS,
      notes: ["已知施法者", "可将已知且带有仪式标签的吟游诗人法术作为仪式施放"]
    },
    progression: {
      bardicInspirationDieByLevel: byLevel(["d6", "d6", "d6", "d6", "d8", "d8", "d8", "d8", "d8", "d10", "d10", "d10", "d10", "d10", "d12", "d12", "d12", "d12", "d12", "d12"]),
      songOfRestDieByLevel: byLevel([null, "d6", "d6", "d6", "d6", "d6", "d6", "d6", "d8", "d8", "d8", "d8", "d10", "d10", "d10", "d10", "d12", "d12", "d12", "d12"])
    },
    features: CLASS_FEATURES.bard
  },

  {
    id: "cleric",
    name: "牧师",
    hitDie: 8,
    primaryAbilities: ["wis"],
    savingThrows: ["wis", "cha"],
    proficiencies: {
      armors: ["轻甲", "中甲", "盾牌"],
      weapons: ["简易武器"],
      tools: []
    },
    skillChoices: {
      choose: 2,
      from: ["history", "insight", "medicine", "persuasion", "religion"]
    },
    subclass: {
      name: "神圣领域",
      selectAt: 1,
      featureLevels: [1, 2, 6, 8, 17]
    },
    spellcasting: {
      kind: "spellcasting",
      progression: "full",
      startsAt: 1,
      ability: "wis",
      preparation: "prepared",
      preparedFormula: "wis_mod + cleric_level（至少 1）",
      ritualCasting: true,
      focus: ["圣徽"],
      cantripsKnownByLevel: byLevel([3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]),
      spellSlotsByLevel: FULL_CASTER_SLOTS,
      notes: ["准备施法者", "领域法术始终视为已准备，不计入每日准备数量"]
    },
    progression: {
      channelDivinityUsesByLevel: byLevel([0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3]),
      destroyUndeadCrByLevel: byLevel([null, null, null, null, "1/2", "1/2", "1/2", "1", "1", "1", "2", "2", "2", "3", "3", "3", "4", "4", "4", "4"])
    },
    features: CLASS_FEATURES.cleric
  },

  {
    id: "druid",
    name: "德鲁伊",
    hitDie: 8,
    primaryAbilities: ["wis"],
    savingThrows: ["int", "wis"],
    proficiencies: {
      armors: ["轻甲", "中甲", "盾牌"],
      weapons: ["木棍", "匕首", "飞镖", "标枪", "硬头锤", "长棍", "弯刀", "镰刀", "投石索", "长矛"],
      tools: ["草药工具包"]
    },
    skillChoices: {
      choose: 2,
      from: ["arcana", "animal_handling", "insight", "medicine", "nature", "perception", "religion", "survival"]
    },
    subclass: {
      name: "德鲁伊结社",
      selectAt: 2,
      featureLevels: [2, 6, 10, 14]
    },
    spellcasting: {
      kind: "spellcasting",
      progression: "full",
      startsAt: 1,
      ability: "wis",
      preparation: "prepared",
      preparedFormula: "wis_mod + druid_level（至少 1）",
      ritualCasting: true,
      focus: ["德鲁伊法器"],
      cantripsKnownByLevel: byLevel([2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
      spellSlotsByLevel: FULL_CASTER_SLOTS,
      notes: ["准备施法者", "2014 规则通常视德鲁伊不穿金属护甲也不用金属盾牌"]
    },
    progression: {
      wildShapeUsesByLevel: byLevel([0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, "unlimited"]),
      wildShapeMaxCrByLevel: byLevel([null, "1/4", "1/4", "1/2", "1/2", "1/2", "1/2", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1"]),
      wildShapeMovementLimitsByLevel: byLevel([
        null,
        "不能飞、不能游泳",
        "不能飞、不能游泳",
        "可游泳，不能飞",
        "可游泳，不能飞",
        "可游泳，不能飞",
        "可游泳，不能飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞",
        "可游泳，可飞"
      ])
    },
    features: CLASS_FEATURES.druid
  },

  {
    id: "fighter",
    name: "战士",
    hitDie: 10,
    primaryAbilities: ["str", "dex"],
    savingThrows: ["str", "con"],
    proficiencies: {
      armors: ["全部护甲", "盾牌"],
      weapons: ["简易武器", "军用武器"],
      tools: []
    },
    skillChoices: {
      choose: 2,
      from: ["acrobatics", "animal_handling", "athletics", "history", "insight", "intimidation", "perception", "survival"]
    },
    subclass: {
      name: "武术范型",
      selectAt: 3,
      featureLevels: [3, 7, 10, 15, 18]
    },
    spellcasting: null,
    progression: {
      actionSurgeUsesByLevel: byLevel([0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2]),
      indomitableUsesByLevel: byLevel([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
    },
    features: CLASS_FEATURES.fighter
  },

  {
    id: "monk",
    name: "武僧",
    hitDie: 8,
    primaryAbilities: ["dex", "wis"],
    savingThrows: ["str", "dex"],
    proficiencies: {
      armors: [],
      weapons: ["简易武器", "短剑"],
      tools: ["任选一种工匠工具或一种乐器"]
    },
    skillChoices: {
      choose: 2,
      from: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"]
    },
    subclass: {
      name: "武僧之道",
      selectAt: 3,
      featureLevels: [3, 6, 11, 17]
    },
    spellcasting: null,
    progression: {
      martialArtsDieByLevel: byLevel(["d4", "d4", "d4", "d4", "d6", "d6", "d6", "d6", "d6", "d6", "d8", "d8", "d8", "d8", "d8", "d8", "d10", "d10", "d10", "d10"]),
      kiPointsByLevel: byLevel([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
      unarmoredMovementBonusByLevel: byLevel([0, 10, 10, 10, 10, 15, 15, 15, 15, 20, 20, 20, 20, 25, 25, 25, 25, 30, 30, 30])
    },
    features: CLASS_FEATURES.monk
  },

  {
    id: "paladin",
    name: "圣武士",
    hitDie: 10,
    primaryAbilities: ["str", "cha"],
    savingThrows: ["wis", "cha"],
    proficiencies: {
      armors: ["全部护甲", "盾牌"],
      weapons: ["简易武器", "军用武器"],
      tools: []
    },
    skillChoices: {
      choose: 2,
      from: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"]
    },
    subclass: {
      name: "神圣誓言",
      selectAt: 3,
      featureLevels: [3, 7, 15, 20]
    },
    spellcasting: {
      kind: "spellcasting",
      progression: "half",
      startsAt: 2,
      ability: "cha",
      preparation: "prepared",
      preparedFormula: "cha_mod + floor(paladin_level / 2)（至少 1）",
      ritualCasting: false,
      focus: ["圣徽"],
      spellSlotsByLevel: HALF_CASTER_SLOTS,
      notes: ["准备施法者", "从 2 级开始施法"]
    },
    progression: {
      auraOfProtectionRangeByLevel: byLevel([0, 0, 0, 0, 0, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 30, 30, 30]),
      layOnHandsPoolFormula: "5 × paladin level"
    },
    features: CLASS_FEATURES.paladin
  },

  {
    id: "ranger",
    name: "游侠",
    hitDie: 10,
    primaryAbilities: ["dex", "wis"],
    savingThrows: ["str", "dex"],
    proficiencies: {
      armors: ["轻甲", "中甲", "盾牌"],
      weapons: ["简易武器", "军用武器"],
      tools: []
    },
    skillChoices: {
      choose: 3,
      from: ["animal_handling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"]
    },
    subclass: {
      name: "游侠范型",
      selectAt: 3,
      featureLevels: [3, 7, 11, 15]
    },
    spellcasting: {
      kind: "spellcasting",
      progression: "half",
      startsAt: 2,
      ability: "wis",
      preparation: "known",
      ritualCasting: false,
      focus: [],
      spellsKnownByLevel: byLevel([0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11]),
      spellSlotsByLevel: HALF_CASTER_SLOTS,
      notes: ["已知施法者", "从 2 级开始施法", "2014 基础游侠通常使用材料袋，不提供通用施法法器"]
    },
    progression: {},
    features: CLASS_FEATURES.ranger
  },

  {
    id: "rogue",
    name: "游荡者",
    hitDie: 8,
    primaryAbilities: ["dex"],
    savingThrows: ["dex", "int"],
    proficiencies: {
      armors: ["轻甲"],
      weapons: ["简易武器", "手弩", "长剑", "细剑", "短剑"],
      tools: ["盗贼工具"]
    },
    skillChoices: {
      choose: 4,
      from: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleight_of_hand", "stealth"]
    },
    subclass: {
      name: "盗贼范型",
      selectAt: 3,
      featureLevels: [3, 9, 13, 17]
    },
    spellcasting: null,
    progression: {
      sneakAttackByLevel: byLevel(["1d6", "1d6", "2d6", "2d6", "3d6", "3d6", "4d6", "4d6", "5d6", "5d6", "6d6", "6d6", "7d6", "7d6", "8d6", "8d6", "9d6", "9d6", "10d6", "10d6"])
    },
    features: CLASS_FEATURES.rogue
  },

  {
    id: "sorcerer",
    name: "术士",
    hitDie: 6,
    primaryAbilities: ["cha"],
    savingThrows: ["con", "cha"],
    proficiencies: {
      armors: [],
      weapons: ["匕首", "飞镖", "投石索", "长棍", "轻弩"],
      tools: []
    },
    skillChoices: {
      choose: 2,
      from: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"]
    },
    subclass: {
      name: "术法起源",
      selectAt: 1,
      featureLevels: [1, 6, 14, 18]
    },
    spellcasting: {
      kind: "spellcasting",
      progression: "full",
      startsAt: 1,
      ability: "cha",
      preparation: "known",
      ritualCasting: false,
      focus: ["奥术法器"],
      cantripsKnownByLevel: byLevel([4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]),
      spellsKnownByLevel: byLevel([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]),
      spellSlotsByLevel: FULL_CASTER_SLOTS,
      notes: ["已知施法者"]
    },
    progression: {
      sorceryPointsByLevel: byLevel([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
      metamagicOptionsKnownByLevel: byLevel([0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4])
    },
    features: CLASS_FEATURES.sorcerer
  },

  {
    id: "warlock",
    name: "邪术师",
    hitDie: 8,
    primaryAbilities: ["cha"],
    savingThrows: ["wis", "cha"],
    proficiencies: {
      armors: ["轻甲"],
      weapons: ["简易武器"],
      tools: []
    },
    skillChoices: {
      choose: 2,
      from: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"]
    },
    subclass: {
      name: "异界宗主",
      selectAt: 1,
      featureLevels: [1, 6, 10, 14]
    },
    spellcasting: {
      kind: "pact_magic",
      progression: "pact",
      startsAt: 1,
      ability: "cha",
      preparation: "known",
      ritualCasting: false,
      focus: ["奥术法器"],
      cantripsKnownByLevel: byLevel([2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
      spellsKnownByLevel: byLevel([2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]),
      pactSlotsByLevel: byLevel([1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4]),
      pactSlotLevelByLevel: byLevel([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]),
      notes: ["契约魔法：法术位在短休或长休后恢复", "基础职业本身不提供 ritual casting"]
    },
    progression: {
      invocationsKnownByLevel: byLevel([0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8]),
      mysticArcanumByLevel: byLevel([null, null, null, null, null, null, null, null, null, null, 6, null, 7, null, 8, null, 9, null, null, null])
    },
    features: CLASS_FEATURES.warlock
  },

  {
    id: "wizard",
    name: "法师",
    hitDie: 6,
    primaryAbilities: ["int"],
    savingThrows: ["int", "wis"],
    proficiencies: {
      armors: [],
      weapons: ["匕首", "飞镖", "投石索", "长棍", "轻弩"],
      tools: []
    },
    skillChoices: {
      choose: 2,
      from: ["arcana", "history", "insight", "investigation", "medicine", "religion"]
    },
    subclass: {
      name: "奥术传承",
      selectAt: 2,
      featureLevels: [2, 6, 10, 14]
    },
    spellcasting: {
      kind: "spellcasting",
      progression: "full",
      startsAt: 1,
      ability: "int",
      preparation: "prepared",
      preparedFormula: "int_mod + wizard_level（至少 1）",
      ritualCasting: true,
      focus: ["奥术法器"],
      cantripsKnownByLevel: byLevel([3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]),
      spellSlotsByLevel: FULL_CASTER_SLOTS,
      spellbook: {
        initialSpells: 6,
        freeSpellsPerLevel: 2
      },
      notes: ["准备施法者", "法术书初始含 6 个 1 环法术", "每升 1 级可免费向法术书加入 2 个可施放环阶的法术"]
    },
    progression: {},
    features: CLASS_FEATURES.wizard
  }
];

export const CLASS_IDS = CLASSES.map(cls => cls.id);

export const CLASS_MAP = Object.fromEntries(
  CLASSES.map(cls => [cls.id, cls])
);

export const CLASS_NAME_MAP = Object.fromEntries(
  CLASSES.map(cls => [cls.name, cls])
);

export const getClassFeaturesUpToLevel = (classId, level) => {
  const cls = CLASS_MAP[classId];
  if (!cls) return [];

  const results = [];
  for (let lv = 1; lv <= level; lv++) {
    const features = cls.features[lv] || [];
    features.forEach(feature => {
      results.push({ level: lv, ...feature });
    });
  }
  return results;
};