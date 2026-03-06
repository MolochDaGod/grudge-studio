/**
 * Profession Progression Utilities
 * 
 * Professions (Miner, Forester, Mystic, Chef, Engineer) level 1-100
 * through crafting and harvesting activities.
 */

export const PROFESSION_NAMES = ['Miner', 'Forester', 'Mystic', 'Chef', 'Engineer'] as const;

export interface ProfessionProgressionEntry {
  level: number;
  xp: number;
  pointsSpent: number;
}

/**
 * Calculate total skill points earned for a profession at a given level.
 * 
 * Milestone-based system for 100 levels:
 * - 1 point at level 1 (start)
 * - 1 point every 5 levels from 5-45 (9 points: levels 5,10,15,20,25,30,35,40,45)
 * - 1 point every 10 levels from 50-100 (6 points: levels 50,60,70,80,90,100)
 * 
 * Total at level 100 = 1 + 9 + 6 = 16 skill points
 * 
 * Level breakdown:
 *   1: 1 point  |  5: 2   | 10: 3  | 15: 4  | 20: 5  | 25: 6
 *  30: 7       | 35: 8   | 40: 9  | 45: 10 | 50: 11 | 60: 12
 *  70: 13      | 80: 14  | 90: 15 | 100: 16
 */
export function calculateProfessionPoints(level: number): number {
  if (level < 1) return 0;
  if (level > 100) level = 100;
  
  // Start with 1 point at level 1
  let points = 1;
  
  // Points from levels 5-45 (every 5 levels)
  if (level >= 5) {
    const earlyMilestones = Math.min(Math.floor(level / 5), 9);
    points += earlyMilestones;
  }
  
  // Points from levels 50-100 (every 10 levels)
  if (level >= 50) {
    const lateMilestones = Math.min(Math.floor((level - 40) / 10), 6);
    points += lateMilestones;
  }
  
  return points;
}

/**
 * Get available (unspent) skill points for a profession.
 */
export function getAvailableProfessionPoints(entry: ProfessionProgressionEntry): number {
  const total = calculateProfessionPoints(entry.level);
  return Math.max(0, total - entry.pointsSpent);
}

/**
 * Calculate XP required for next level.
 * Exponential curve for 100 levels.
 */
export function getProfessionXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 100) return Infinity;
  // Base 100 XP, exponential growth: 100 * 1.5^(level-1)
  return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

/**
 * Calculate total XP required to reach a specific level from level 1.
 */
export function getTotalXpForLevel(targetLevel: number): number {
  let totalXp = 0;
  for (let level = 1; level < targetLevel; level++) {
    totalXp += getProfessionXpForNextLevel(level);
  }
  return totalXp;
}

/**
 * Add XP to profession and calculate level-ups.
 * Returns updated progression entry.
 */
export function addProfessionXp(
  entry: ProfessionProgressionEntry,
  xpGained: number
): ProfessionProgressionEntry {
  let { level, xp, pointsSpent } = entry;
  xp += xpGained;

  // Check for level-ups
  while (level < 100) {
    const xpNeeded = getProfessionXpForNextLevel(level);
    if (xp >= xpNeeded) {
      xp -= xpNeeded;
      level += 1;
    } else {
      break;
    }
  }

  // Cap at level 100
  if (level > 100) {
    level = 100;
    xp = 0;
  }

  return { level, xp, pointsSpent };
}
