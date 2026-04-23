export const ARMOURS = [
  {
    id: "padded",
    name: "布甲",
    category: "轻甲",
    baseAC: 11,
    dexModifier: "full",
    maxDexBonus: null,
    strengthRequirement: 0,
    stealthDisadvantage: true,
    weight: 8,
    cost: { quantity: 5, unit: "gp" },
    notes: {}
  },
  {
    id: "leather",
    name: "皮甲",
    category: "轻甲",
    baseAC: 11,
    dexModifier: "full",
    maxDexBonus: null,
    strengthRequirement: 0,
    stealthDisadvantage: false,
    weight: 10,
    cost: { quantity: 10, unit: "gp" },
    notes: {}
  },
  {
    id: "studded_leather",
    name: "钉皮甲",
    category: "轻甲",
    baseAC: 12,
    dexModifier: "full",
    maxDexBonus: null,
    strengthRequirement: 0,
    stealthDisadvantage: false,
    weight: 13,
    cost: { quantity: 45, unit: "gp" },
    notes: {}
  },

  {
    id: "hide",
    name: "兽皮甲",
    category: "中甲",
    baseAC: 12,
    dexModifier: "capped",
    maxDexBonus: 2,
    strengthRequirement: 0,
    stealthDisadvantage: false,
    weight: 12,
    cost: { quantity: 10, unit: "gp" },
    notes: {}
  },
  {
    id: "chain_shirt",
    name: "链衣",
    category: "中甲",
    baseAC: 13,
    dexModifier: "capped",
    maxDexBonus: 2,
    strengthRequirement: 0,
    stealthDisadvantage: false,
    weight: 20,
    cost: { quantity: 50, unit: "gp" },
    notes: {}
  },
  {
    id: "scale_mail",
    name: "鳞甲",
    category: "中甲",
    baseAC: 14,
    dexModifier: "capped",
    maxDexBonus: 2,
    strengthRequirement: 0,
    stealthDisadvantage: true,
    weight: 45,
    cost: { quantity: 50, unit: "gp" },
    notes: {}
  },
  {
    id: "breastplate",
    name: "胸甲",
    category: "中甲",
    baseAC: 14,
    dexModifier: "capped",
    maxDexBonus: 2,
    strengthRequirement: 0,
    stealthDisadvantage: false,
    weight: 20,
    cost: { quantity: 400, unit: "gp" },
    notes: {}
  },
  {
    id: "half_plate",
    name: "半身板甲",
    category: "中甲",
    baseAC: 15,
    dexModifier: "capped",
    maxDexBonus: 2,
    strengthRequirement: 0,
    stealthDisadvantage: true,
    weight: 40,
    cost: { quantity: 750, unit: "gp" },
    notes: {}
  },

  {
    id: "ring_mail",
    name: "环甲",
    category: "重甲",
    baseAC: 14,
    dexModifier: "none",
    maxDexBonus: 0,
    strengthRequirement: 0,
    stealthDisadvantage: true,
    weight: 40,
    cost: { quantity: 30, unit: "gp" },
    notes: {}
  },
  {
    id: "chain_mail",
    name: "链甲",
    category: "重甲",
    baseAC: 16,
    dexModifier: "none",
    maxDexBonus: 0,
    strengthRequirement: 13,
    stealthDisadvantage: true,
    weight: 55,
    cost: { quantity: 75, unit: "gp" },
    notes: {}
  },
  {
    id: "splint",
    name: "条板甲",
    category: "重甲",
    baseAC: 17,
    dexModifier: "none",
    maxDexBonus: 0,
    strengthRequirement: 15,
    stealthDisadvantage: true,
    weight: 60,
    cost: { quantity: 200, unit: "gp" },
    notes: {}
  },
  {
    id: "plate",
    name: "板甲",
    category: "重甲",
    baseAC: 18,
    dexModifier: "none",
    maxDexBonus: 0,
    strengthRequirement: 15,
    stealthDisadvantage: true,
    weight: 65,
    cost: { quantity: 1500, unit: "gp" },
    notes: {}
  },

  {
    id: "shield",
    name: "盾牌",
    category: "盾牌",
    acBonus: 2,
    dexModifier: "n/a",
    maxDexBonus: null,
    strengthRequirement: 0,
    stealthDisadvantage: false,
    weight: 6,
    cost: { quantity: 10, unit: "gp" },
    notes: {}
  }
];

export const ARMOUR_CATEGORIES = {
  light: "轻甲",
  medium: "中甲",
  heavy: "重甲",
  shield: "盾牌"
};

export const ARMOUR_MAP = Object.fromEntries(
  ARMOURS.map(armour => [armour.id, armour])
);