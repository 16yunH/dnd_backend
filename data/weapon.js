export const WEAPONS = [
  {
    id: "club",
    name: "短棒",
    category: "简易近战武器",
    cost: { quantity: 1, unit: "sp" },
    damage: { dice: "1d4", type: "钝击" },
    weight: 2,
    properties: ["light"],
    range: null,
    notes: {}
  },
  {
    id: "dagger",
    name: "匕首",
    category: "简易近战武器",
    cost: { quantity: 2, unit: "gp" },
    damage: { dice: "1d4", type: "穿刺" },
    weight: 1,
    properties: ["finesse", "light", "thrown"],
    range: { normal: 20, long: 60 },
    notes: {}
  },
  {
    id: "greatclub",
    name: "巨棒",
    category: "简易近战武器",
    cost: { quantity: 2, unit: "sp" },
    damage: { dice: "1d8", type: "钝击" },
    weight: 10,
    properties: ["twoHanded"],
    range: null,
    notes: {}
  },
  {
    id: "handaxe",
    name: "手斧",
    category: "简易近战武器",
    cost: { quantity: 5, unit: "gp" },
    damage: { dice: "1d6", type: "挥砍" },
    weight: 2,
    properties: ["light", "thrown"],
    range: { normal: 20, long: 60 },
    notes: {}
  },
  {
    id: "javelin",
    name: "标枪",
    category: "简易近战武器",
    cost: { quantity: 5, unit: "sp" },
    damage: { dice: "1d6", type: "穿刺" },
    weight: 2,
    properties: ["thrown"],
    range: { normal: 30, long: 120 },
    notes: {}
  },
  {
    id: "light_hammer",
    name: "轻锤",
    category: "简易近战武器",
    cost: { quantity: 2, unit: "gp" },
    damage: { dice: "1d4", type: "钝击" },
    weight: 2,
    properties: ["light", "thrown"],
    range: { normal: 20, long: 60 },
    notes: {}
  },
  {
    id: "mace",
    name: "硬头锤",
    category: "简易近战武器",
    cost: { quantity: 5, unit: "gp" },
    damage: { dice: "1d6", type: "钝击" },
    weight: 4,
    properties: [],
    range: null,
    notes: {}
  },
  {
    id: "quarterstaff",
    name: "长棍",
    category: "简易近战武器",
    cost: { quantity: 2, unit: "sp" },
    damage: { dice: "1d6", type: "钝击" },
    weight: 4,
    properties: ["versatile"],
    range: null,
    notes: {
      versatileDamage: "1d8"
    }
  },
  {
    id: "sickle",
    name: "镰刀",
    category: "简易近战武器",
    cost: { quantity: 1, unit: "gp" },
    damage: { dice: "1d4", type: "挥砍" },
    weight: 2,
    properties: ["light"],
    range: null,
    notes: {}
  },
  {
    id: "spear",
    name: "矛",
    category: "简易近战武器",
    cost: { quantity: 1, unit: "gp" },
    damage: { dice: "1d6", type: "穿刺" },
    weight: 3,
    properties: ["thrown", "versatile"],
    range: { normal: 20, long: 60 },
    notes: {
      versatileDamage: "1d8"
    }
  },

  {
    id: "light_crossbow",
    name: "轻弩",
    category: "简易远程武器",
    cost: { quantity: 25, unit: "gp" },
    damage: { dice: "1d8", type: "穿刺" },
    weight: 5,
    properties: ["ammunition", "loading", "twoHanded"],
    range: { normal: 80, long: 320 },
    notes: {}
  },
  {
    id: "dart",
    name: "飞镖",
    category: "简易远程武器",
    cost: { quantity: 5, unit: "cp" },
    damage: { dice: "1d4", type: "穿刺" },
    weight: 0.25,
    properties: ["finesse", "thrown"],
    range: { normal: 20, long: 60 },
    notes: {}
  },
  {
    id: "shortbow",
    name: "短弓",
    category: "简易远程武器",
    cost: { quantity: 25, unit: "gp" },
    damage: { dice: "1d6", type: "穿刺" },
    weight: 2,
    properties: ["ammunition", "twoHanded"],
    range: { normal: 80, long: 320 },
    notes: {}
  },
  {
    id: "sling",
    name: "投石索",
    category: "简易远程武器",
    cost: { quantity: 1, unit: "sp" },
    damage: { dice: "1d4", type: "钝击" },
    weight: 0,
    properties: ["ammunition"],
    range: { normal: 30, long: 120 },
    notes: {}
  },

  {
    id: "battleaxe",
    name: "战斧",
    category: "军用近战武器",
    cost: { quantity: 10, unit: "gp" },
    damage: { dice: "1d8", type: "挥砍" },
    weight: 4,
    properties: ["versatile"],
    range: null,
    notes: {
      versatileDamage: "1d10"
    }
  },
  {
    id: "flail",
    name: "链枷",
    category: "军用近战武器",
    cost: { quantity: 10, unit: "gp" },
    damage: { dice: "1d8", type: "钝击" },
    weight: 2,
    properties: [],
    range: null,
    notes: {}
  },
  {
    id: "glaive",
    name: "长柄刀",
    category: "军用近战武器",
    cost: { quantity: 20, unit: "gp" },
    damage: { dice: "1d10", type: "挥砍" },
    weight: 6,
    properties: ["heavy", "reach", "twoHanded"],
    range: null,
    notes: {}
  },
  {
    id: "greataxe",
    name: "巨斧",
    category: "军用近战武器",
    cost: { quantity: 30, unit: "gp" },
    damage: { dice: "1d12", type: "挥砍" },
    weight: 7,
    properties: ["heavy", "twoHanded"],
    range: null,
    notes: {}
  },
  {
    id: "greatsword",
    name: "巨剑",
    category: "军用近战武器",
    cost: { quantity: 50, unit: "gp" },
    damage: { dice: "2d6", type: "挥砍" },
    weight: 6,
    properties: ["heavy", "twoHanded"],
    range: null,
    notes: {}
  },
  {
    id: "halberd",
    name: "戟",
    category: "军用近战武器",
    cost: { quantity: 20, unit: "gp" },
    damage: { dice: "1d10", type: "挥砍" },
    weight: 6,
    properties: ["heavy", "reach", "twoHanded"],
    range: null,
    notes: {}
  },
  {
    id: "lance",
    name: "骑枪",
    category: "军用近战武器",
    cost: { quantity: 10, unit: "gp" },
    damage: { dice: "1d12", type: "穿刺" },
    weight: 6,
    properties: ["reach", "special"],
    range: null,
    notes: {
      special: "当你在距离目标5尺内用骑枪攻击时具有劣势。若你未处于骑乘状态，则必须双手使用骑枪。"
    }
  },
  {
    id: "longsword",
    name: "长剑",
    category: "军用近战武器",
    cost: { quantity: 15, unit: "gp" },
    damage: { dice: "1d8", type: "挥砍" },
    weight: 3,
    properties: ["versatile"],
    range: null,
    notes: {
      versatileDamage: "1d10"
    }
  },
  {
    id: "maul",
    name: "巨锤",
    category: "军用近战武器",
    cost: { quantity: 10, unit: "gp" },
    damage: { dice: "2d6", type: "钝击" },
    weight: 10,
    properties: ["heavy", "twoHanded"],
    range: null,
    notes: {}
  },
  {
    id: "morningstar",
    name: "钉头锤",
    category: "军用近战武器",
    cost: { quantity: 15, unit: "gp" },
    damage: { dice: "1d8", type: "穿刺" },
    weight: 4,
    properties: [],
    range: null,
    notes: {}
  },
  {
    id: "pike",
    name: "长矛",
    category: "军用近战武器",
    cost: { quantity: 5, unit: "gp" },
    damage: { dice: "1d10", type: "穿刺" },
    weight: 18,
    properties: ["heavy", "reach", "twoHanded"],
    range: null,
    notes: {}
  },
  {
    id: "rapier",
    name: "刺剑",
    category: "军用近战武器",
    cost: { quantity: 25, unit: "gp" },
    damage: { dice: "1d8", type: "穿刺" },
    weight: 2,
    properties: ["finesse"],
    range: null,
    notes: {}
  },
  {
    id: "scimitar",
    name: "弯刀",
    category: "军用近战武器",
    cost: { quantity: 25, unit: "gp" },
    damage: { dice: "1d6", type: "挥砍" },
    weight: 3,
    properties: ["finesse", "light"],
    range: null,
    notes: {}
  },
  {
    id: "shortsword",
    name: "短剑",
    category: "军用近战武器",
    cost: { quantity: 10, unit: "gp" },
    damage: { dice: "1d6", type: "穿刺" },
    weight: 2,
    properties: ["finesse", "light"],
    range: null,
    notes: {}
  },
  {
    id: "trident",
    name: "三叉戟",
    category: "军用近战武器",
    cost: { quantity: 5, unit: "gp" },
    damage: { dice: "1d6", type: "穿刺" },
    weight: 4,
    properties: ["thrown", "versatile"],
    range: { normal: 20, long: 60 },
    notes: {
      versatileDamage: "1d8"
    }
  },
  {
    id: "war_pick",
    name: "战镐",
    category: "军用近战武器",
    cost: { quantity: 5, unit: "gp" },
    damage: { dice: "1d8", type: "穿刺" },
    weight: 2,
    properties: [],
    range: null,
    notes: {}
  },
  {
    id: "warhammer",
    name: "战锤",
    category: "军用近战武器",
    cost: { quantity: 15, unit: "gp" },
    damage: { dice: "1d8", type: "钝击" },
    weight: 2,
    properties: ["versatile"],
    range: null,
    notes: {
      versatileDamage: "1d10"
    }
  },
  {
    id: "whip",
    name: "鞭",
    category: "军用近战武器",
    cost: { quantity: 2, unit: "gp" },
    damage: { dice: "1d4", type: "挥砍" },
    weight: 3,
    properties: ["finesse", "reach"],
    range: null,
    notes: {}
  },

  {
    id: "blowgun",
    name: "吹箭筒",
    category: "军用远程武器",
    cost: { quantity: 10, unit: "gp" },
    damage: { dice: "1", type: "穿刺" },
    weight: 1,
    properties: ["ammunition", "loading"],
    range: { normal: 25, long: 100 },
    notes: {}
  },
  {
    id: "hand_crossbow",
    name: "手弩",
    category: "军用远程武器",
    cost: { quantity: 75, unit: "gp" },
    damage: { dice: "1d6", type: "穿刺" },
    weight: 3,
    properties: ["ammunition", "light", "loading"],
    range: { normal: 30, long: 120 },
    notes: {}
  },
  {
    id: "heavy_crossbow",
    name: "重弩",
    category: "军用远程武器",
    cost: { quantity: 50, unit: "gp" },
    damage: { dice: "1d10", type: "穿刺" },
    weight: 18,
    properties: ["ammunition", "heavy", "loading", "twoHanded"],
    range: { normal: 100, long: 400 },
    notes: {}
  },
  {
    id: "longbow",
    name: "长弓",
    category: "军用远程武器",
    cost: { quantity: 50, unit: "gp" },
    damage: { dice: "1d8", type: "穿刺" },
    weight: 2,
    properties: ["ammunition", "heavy", "twoHanded"],
    range: { normal: 150, long: 600 },
    notes: {}
  },
  {
    id: "net",
    name: "捕网",
    category: "军用远程武器",
    cost: { quantity: 1, unit: "gp" },
    damage: { dice: null, type: null },
    weight: 3,
    properties: ["special", "thrown"],
    range: { normal: 5, long: 15 },
    notes: {
      special: "大型或更小体型的生物被捕网命中时陷入受拘束状态。生物可以用动作进行 DC10 力量检定挣脱，或对网造成 5 点挥砍伤害将其破坏（AC 10）。无论你通常能进行几次攻击，当你用动作、附赠动作或反应攻击时，都只能用捕网进行一次攻击。"
    }
  }
];

export const WEAPON_CATEGORIES = {
  simpleMelee: "简易近战武器",
  simpleRanged: "简易远程武器",
  martialMelee: "军用近战武器",
  martialRanged: "军用远程武器"
};

export const WEAPON_PROPERTIES = {
  ammunition: "弹药",
  finesse: "灵巧",
  heavy: "重型",
  light: "轻型",
  loading: "装填",
  reach: "触及",
  special: "特殊",
  thrown: "投掷",
  twoHanded: "双手",
  versatile: "两用"
};

export const WEAPON_MAP = Object.fromEntries(
  WEAPONS.map(weapon => [weapon.id, weapon])
);