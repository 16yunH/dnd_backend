export const POINT_BUY_COST = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;
export const POINT_BUY_TOTAL = 27;

export const DEFAULT_POINT_BUY_STATS = {
  str: 8,
  dex: 8,
  con: 8,
  int: 8,
  wis: 8,
  cha: 8
};

export function getAbilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

export function getPointCost(score) {
  return POINT_BUY_COST[score] ?? null;
}

export function calculatePointsSpent(stats) {
  return Object.values(stats).reduce((total, score) => {
    return total + (POINT_BUY_COST[score] ?? 0);
  }, 0);
}

export function calculatePointsRemaining(stats, totalPoints = POINT_BUY_TOTAL) {
  return totalPoints - calculatePointsSpent(stats);
}

export function canIncreaseStat(stats, statId, totalPoints = POINT_BUY_TOTAL) {
  const current = stats[statId];
  if (current == null) return false;
  if (current >= POINT_BUY_MAX) return false;

  const next = current + 1;
  const currentCost = POINT_BUY_COST[current];
  const nextCost = POINT_BUY_COST[next];

  if (currentCost == null || nextCost == null) return false;

  const costDiff = nextCost - currentCost;
  return calculatePointsRemaining(stats, totalPoints) >= costDiff;
}

export function canDecreaseStat(stats, statId) {
  const current = stats[statId];
  if (current == null) return false;
  return current > POINT_BUY_MIN;
}

export function updatePointBuyStat(stats, statId, increment, totalPoints = POINT_BUY_TOTAL) {
  const current = stats[statId];
  if (current == null) return stats;

  const next = current + increment;

  if (next < POINT_BUY_MIN || next > POINT_BUY_MAX) {
    return stats;
  }

  const currentCost = POINT_BUY_COST[current];
  const nextCost = POINT_BUY_COST[next];

  if (currentCost == null || nextCost == null) {
    return stats;
  }

  const costDiff = nextCost - currentCost;
  const remaining = calculatePointsRemaining(stats, totalPoints);

  if (increment > 0 && remaining < costDiff) {
    return stats;
  }

  return {
    ...stats,
    [statId]: next
  };
}

export function resetPointBuyStats() {
  return { ...DEFAULT_POINT_BUY_STATS };
}

export const POINT_BUY_PRESETS = {
  standard: {
    name: "标准数组",
    stats: {
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8
    }
  }
};