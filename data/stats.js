export const STATS = [
  { id: "str", name: "力量", shortName: "STR" },
  { id: "dex", name: "敏捷", shortName: "DEX" },
  { id: "con", name: "体质", shortName: "CON" },
  { id: "int", name: "智力", shortName: "INT" },
  { id: "wis", name: "感知", shortName: "WIS" },
  { id: "cha", name: "魅力", shortName: "CHA" }
];

export const STAT_IDS = STATS.map(stat => stat.id);

export const EMPTY_STATS = {
  str: 0,
  dex: 0,
  con: 0,
  int: 0,
  wis: 0,
  cha: 0
};