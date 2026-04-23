declare module "../../data/stats.js" {
  export const STATS: any[];
}

declare module "../../data/pointBuy.js" {
  export const POINT_BUY_COST: Record<number, number>;
  export const POINT_BUY_MIN: number;
  export const POINT_BUY_MAX: number;
  export const POINT_BUY_TOTAL: number;
  export const DEFAULT_POINT_BUY_STATS: Record<string, number>;
  export const POINT_BUY_PRESETS: Record<string, unknown>;
}

declare module "../../data/races.js" {
  export const RACES: any[];
}

declare module "../../data/class.js" {
  export const CLASSES: any[];
}

declare module "../../data/subclasses.js" {
  export const SUBCLASSES: any[];
}

declare module "../../data/background.js" {
  export const BACKGROUNDS: any[];
}

declare module "../../data/skills.js" {
  export const SKILLS: any[];
}

declare module "../../data/armour.js" {
  export const ARMOURS: any[];
}

declare module "../../data/weapon.js" {
  export const WEAPONS: any[];
}
