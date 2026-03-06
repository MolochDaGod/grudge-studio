/**
 * GRUDGE Warlords - Comprehensive Stats & Attributes System
 * 
 * 8 Primary Attributes: Strength, Vitality, Endurance, Intellect, Wisdom, Dexterity, Agility, Tactics
 * Each attribute provides flat bonuses (fixed amounts) and percentage bonuses (scaling with base stats)
 * 
 * Level System (0-20):
 * - Starting Points: 20 at level 0
 * - Points Per Level: 7
 * - Maximum Points: 160 at level 20
 * 
 * Formulas:
 * - Total Stat = (Flat Bonus × Effective Points) + (Base Stat × Percent Bonus × Effective Points)
 * - Defense Mitigation: Damage Taken = Incoming × (100 - √Defense) / 100
 * - Diminishing Returns: After 25 points, efficiency drops (50% at 26-50, 25% at 51+)
 */

// ===== LEVEL PROGRESSION CONSTANTS =====

export const LEVEL_PROGRESSION = {
  minLevel: 0,
  maxLevel: 20,
  startingPoints: 20,    // Points available at level 0
  pointsPerLevel: 7,     // Points gained per level up
  maxPoints: 160,        // Total at level 20: 20 + (20 × 7)
};

// ===== TYPE DEFINITIONS =====

export type AttributeKey = 'Strength' | 'Vitality' | 'Endurance' | 'Intellect' | 'Wisdom' | 'Dexterity' | 'Agility' | 'Tactics';

export type SecondaryStatKey = 'health' | 'mana' | 'stamina' | 'damage' | 'defense';

export type CombatFactorKey = 
  | 'blockChance' | 'blockFactor' 
  | 'criticalChance' | 'criticalFactor'
  | 'accuracy' | 'resistance'
  | 'drainHealth' | 'drainMana'
  | 'reflectFactor' | 'absorbHealth' | 'absorbMana';

export interface AttributePoints {
  Strength: number;
  Vitality: number;
  Endurance: number;
  Intellect: number;
  Wisdom: number;
  Dexterity: number;
  Agility: number;
  Tactics: number;
}

export interface BaseStats {
  health: number;
  mana: number;
  stamina: number;
  damage: number;
  defense: number;
}

export interface DerivedStats {
  health: number;
  mana: number;
  stamina: number;
  damage: number;
  defense: number;
  blockChance: number;
  blockFactor: number;
  criticalChance: number;
  criticalFactor: number;
  accuracy: number;
  resistance: number;
  drainHealth: number;
  drainMana: number;
  reflectFactor: number;
  absorbHealth: number;
  absorbMana: number;
  defenseReduction: number;
}

export interface EquipmentStats {
  health?: number;
  mana?: number;
  stamina?: number;
  damage?: number;
  defense?: number;
  blockChance?: number;
  blockFactor?: number;
  criticalChance?: number;
  criticalFactor?: number;
  accuracy?: number;
  resistance?: number;
  drainHealth?: number;
  drainMana?: number;
  reflectFactor?: number;
  absorbHealth?: number;
  absorbMana?: number;
  attributes?: Partial<AttributePoints>;
}

// ===== STAT CAPS =====

export const STAT_CAPS = {
  blockChance: 0.75,      // 75%
  blockFactor: 0.90,      // 90%
  criticalChance: 0.75,   // 75%
  criticalFactor: 3.0,    // 300% damage
  accuracy: 0.95,         // 95%
  resistance: 0.95,       // 95%
  drainHealth: 0.50,      // 50%
  drainMana: 0.50,        // 50%
  reflectFactor: 0.50,    // 50%
  absorbHealth: 0.50,     // 50%
  absorbMana: 0.50,       // 50%
};

// ===== DIMINISHING RETURNS CONFIG =====

export const DIMINISHING_RETURNS = {
  enabled: true,
  threshold: 25,          // When DR kicks in
  tier1Efficiency: 0.5,   // 50% efficiency (points 26-50)
  tier2Efficiency: 0.25,  // 25% efficiency (points 51+)
  tier1Cap: 50,           // End of tier 1
};

// ===== ATTRIBUTE BONUS DEFINITIONS =====
// Each attribute provides flat bonuses and percentage bonuses per point

export interface StatBonus {
  flat: number;
  percent: number;
}

export interface AttributeDefinition {
  name: AttributeKey;
  role: string;
  focus: string;
  color: string;
  icon: string;
  bonuses: {
    health?: StatBonus;
    mana?: StatBonus;
    stamina?: StatBonus;
    damage?: StatBonus;
    defense?: StatBonus;
    blockChance?: StatBonus;
    blockFactor?: StatBonus;
    criticalChance?: StatBonus;
    criticalFactor?: StatBonus;
    accuracy?: StatBonus;
    resistance?: StatBonus;
  };
}

export const ATTRIBUTE_DEFINITIONS: Record<AttributeKey, AttributeDefinition> = {
  Strength: {
    name: 'Strength',
    role: 'Tank / Melee DPS',
    focus: 'High health, damage, and defense with strong combat modifiers',
    color: '#e74c3c',
    icon: '💪',
    bonuses: {
      health: { flat: 26, percent: 0.008 },
      damage: { flat: 3, percent: 0.02 },
      defense: { flat: 12, percent: 0.015 },
      blockChance: { flat: 0.005, percent: 0.05 },
      blockFactor: { flat: 0.0085, percent: 0.263 },
      criticalChance: { flat: 0.0032, percent: 0.07 },
      criticalFactor: { flat: 0.011, percent: 0.015 },
    }
  },
  Vitality: {
    name: 'Vitality',
    role: 'Tank / Survivability',
    focus: 'Maximum health, defense, and damage mitigation',
    color: '#27ae60',
    icon: '❤️',
    bonuses: {
      health: { flat: 25, percent: 0.005 },
      mana: { flat: 2, percent: 0.002 },
      stamina: { flat: 5, percent: 0.001 },
      damage: { flat: 2, percent: 0.001 },
      defense: { flat: 12, percent: 0 },
      blockFactor: { flat: 0.003, percent: 0.17 },
      resistance: { flat: 0.005, percent: 0 },
    }
  },
  Endurance: {
    name: 'Endurance',
    role: 'Defensive Specialist',
    focus: 'Defense, block mechanics, and critical evasion',
    color: '#95a5a6',
    icon: '🛡️',
    bonuses: {
      health: { flat: 10, percent: 0.001 },
      stamina: { flat: 1, percent: 0.003 },
      defense: { flat: 12, percent: 0.12 },
      blockChance: { flat: 0.0011, percent: 0.735 },
      blockFactor: { flat: 0.0027, percent: 0 },
      resistance: { flat: 0.0046, percent: 0 },
    }
  },
  Intellect: {
    name: 'Intellect',
    role: 'Mage / Caster',
    focus: 'Mana, magic damage, and spell accuracy',
    color: '#3498db',
    icon: '🧠',
    bonuses: {
      mana: { flat: 5, percent: 0.05 },
      damage: { flat: 4, percent: 0.025 },
      defense: { flat: 2, percent: 0 },
      criticalChance: { flat: 0.0023, percent: 0.001 },
      accuracy: { flat: 0.0012, percent: 0.338 },
      resistance: { flat: 0.0038, percent: 0.17 },
    }
  },
  Wisdom: {
    name: 'Wisdom',
    role: 'Healer / Support',
    focus: 'Mana efficiency, survivability, and spell effectiveness',
    color: '#9b59b6',
    icon: '🔮',
    bonuses: {
      health: { flat: 10, percent: 0 },
      mana: { flat: 20, percent: 0.03 },
      damage: { flat: 2, percent: 0.015 },
      defense: { flat: 2, percent: 0 },
      criticalChance: { flat: 0.005, percent: 0.0015 },
      resistance: { flat: 0.005, percent: 0 },
    }
  },
  Dexterity: {
    name: 'Dexterity',
    role: 'Rogue / Precision Fighter',
    focus: 'Critical strikes, accuracy, and evasion',
    color: '#f39c12',
    icon: '🎯',
    bonuses: {
      damage: { flat: 3, percent: 0.018 },
      defense: { flat: 10, percent: 0.01 },
      blockChance: { flat: 0.0041, percent: 0.01 },
      criticalChance: { flat: 0.005, percent: 0.012 },
      accuracy: { flat: 0.007, percent: 0.015 },
    }
  },
  Agility: {
    name: 'Agility',
    role: 'Mobile DPS / Dodge Tank',
    focus: 'Mobility, critical strikes, and defensive penetration',
    color: '#1abc9c',
    icon: '⚡',
    bonuses: {
      health: { flat: 2, percent: 0.006 },
      stamina: { flat: 5, percent: 0.005 },
      damage: { flat: 3, percent: 0.016 },
      defense: { flat: 5, percent: 0.008 },
      criticalChance: { flat: 0.0042, percent: 0.01 },
    }
  },
  Tactics: {
    name: 'Tactics',
    role: 'Strategic Fighter / Commander',
    focus: 'Balanced combat stats with penetration abilities',
    color: '#34495e',
    icon: '🎲',
    bonuses: {
      health: { flat: 10, percent: 0.084 },
      mana: { flat: 0, percent: 0.082 },
      stamina: { flat: 1, percent: 0 },
      damage: { flat: 3, percent: 0.002 },
      defense: { flat: 5, percent: 0.005 },
      blockChance: { flat: 0.0027, percent: 0.008 },
    }
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Apply diminishing returns to attribute points
 * @param rawPoints - The actual points invested
 * @returns Effective points after diminishing returns
 */
export function applyDiminishingReturns(rawPoints: number): number {
  if (!DIMINISHING_RETURNS.enabled || rawPoints <= DIMINISHING_RETURNS.threshold) {
    return rawPoints;
  }

  const { threshold, tier1Efficiency, tier2Efficiency, tier1Cap } = DIMINISHING_RETURNS;
  
  let effective = threshold; // First 25 points at 100%
  
  if (rawPoints <= tier1Cap) {
    // Tier 1: 50% efficiency for points 26-50
    effective += (rawPoints - threshold) * tier1Efficiency;
  } else {
    // Tier 1 + Tier 2
    effective += (tier1Cap - threshold) * tier1Efficiency;
    effective += (rawPoints - tier1Cap) * tier2Efficiency;
  }
  
  return effective;
}

/**
 * Get effective points for display (shows diminishing returns impact)
 */
export function getEffectivePoints(rawPoints: number): { raw: number; effective: number; efficiency: string } {
  const effective = applyDiminishingReturns(rawPoints);
  let efficiency = '100%';
  
  if (rawPoints > 50) {
    efficiency = '25%';
  } else if (rawPoints > 25) {
    efficiency = '50%';
  }
  
  return { raw: rawPoints, effective: Math.round(effective * 100) / 100, efficiency };
}

/**
 * Calculate a single stat bonus from an attribute
 */
function calculateStatBonus(
  bonus: StatBonus | undefined,
  effectivePoints: number,
  baseStat: number
): number {
  if (!bonus) return 0;
  return (bonus.flat * effectivePoints) + (baseStat * bonus.percent * effectivePoints);
}

/**
 * Clamp a value to a stat cap
 */
function clampToStatCap(value: number, statKey: CombatFactorKey): number {
  const cap = STAT_CAPS[statKey];
  return cap !== undefined ? Math.min(value, cap) : value;
}

// ===== BASE STAT CALCULATIONS =====

/**
 * Base stats - fixed values as per spec documentation
 * Level progression is handled through attribute points (5 per level)
 * NOT through base stat scaling
 */
export const BASE_STATS = {
  health: 100,   // Fixed base as per spec example
  mana: 50,      // Fixed base as per spec example
  stamina: 100,  // Fixed base
  damage: 10,    // Base damage (Level Damage is separate)
  defense: 10,   // Base defense
};

/**
 * Calculate base stats from level
 * @param level - Character level (0-20)
 * Note: Health/Mana/Stamina bases are fixed; only damage scales slightly with level
 */
export function calculateBaseStats(level: number): BaseStats {
  return {
    health: BASE_STATS.health,           // Fixed 100 as per spec
    mana: BASE_STATS.mana,               // Fixed 50 as per spec
    stamina: BASE_STATS.stamina,         // Fixed 100
    damage: BASE_STATS.damage + level,   // Level damage contribution
    defense: BASE_STATS.defense,         // Fixed base
  };
}

// ===== MAIN STAT CALCULATOR =====

export interface CalculateStatsOptions {
  level: number;
  attributes: AttributePoints;
  equipment?: EquipmentStats;
  traits?: Partial<DerivedStats>;
  sets?: Partial<DerivedStats>;
}

/**
 * Calculate all derived stats from attributes, equipment, and other sources
 * 
 * Formula: Total = Base + Attribute Bonuses + Equipment + Traits + Sets
 * Attribute Bonus = Σ(Flat × EffectivePoints) + (Base × Σ(Percent × EffectivePoints))
 */
export function calculateDerivedStats(options: CalculateStatsOptions): DerivedStats {
  const { level, attributes, equipment = {}, traits = {}, sets = {} } = options;
  
  // Calculate base stats from level
  const base = calculateBaseStats(level);
  
  // Add equipment attribute bonuses to attributes
  const totalAttributes = { ...attributes };
  if (equipment.attributes) {
    for (const [key, value] of Object.entries(equipment.attributes)) {
      if (value && key in totalAttributes) {
        totalAttributes[key as AttributeKey] += value;
      }
    }
  }
  
  // Apply diminishing returns to each attribute
  const effectiveAttributes: AttributePoints = {
    Strength: applyDiminishingReturns(totalAttributes.Strength),
    Vitality: applyDiminishingReturns(totalAttributes.Vitality),
    Endurance: applyDiminishingReturns(totalAttributes.Endurance),
    Intellect: applyDiminishingReturns(totalAttributes.Intellect),
    Wisdom: applyDiminishingReturns(totalAttributes.Wisdom),
    Dexterity: applyDiminishingReturns(totalAttributes.Dexterity),
    Agility: applyDiminishingReturns(totalAttributes.Agility),
    Tactics: applyDiminishingReturns(totalAttributes.Tactics),
  };
  
  // Calculate attribute bonuses for each stat
  const attrBonuses = {
    health: 0, mana: 0, stamina: 0, damage: 0, defense: 0,
    blockChance: 0, blockFactor: 0, criticalChance: 0, criticalFactor: 0,
    accuracy: 0, resistance: 0,
  };
  
  for (const [attrKey, attrDef] of Object.entries(ATTRIBUTE_DEFINITIONS)) {
    const effectivePts = effectiveAttributes[attrKey as AttributeKey];
    const bonuses = attrDef.bonuses;
    
    attrBonuses.health += calculateStatBonus(bonuses.health, effectivePts, base.health);
    attrBonuses.mana += calculateStatBonus(bonuses.mana, effectivePts, base.mana);
    attrBonuses.stamina += calculateStatBonus(bonuses.stamina, effectivePts, base.stamina);
    attrBonuses.damage += calculateStatBonus(bonuses.damage, effectivePts, base.damage);
    attrBonuses.defense += calculateStatBonus(bonuses.defense, effectivePts, base.defense);
    attrBonuses.blockChance += calculateStatBonus(bonuses.blockChance, effectivePts, 0);
    attrBonuses.blockFactor += calculateStatBonus(bonuses.blockFactor, effectivePts, 0);
    attrBonuses.criticalChance += calculateStatBonus(bonuses.criticalChance, effectivePts, 0);
    attrBonuses.criticalFactor += calculateStatBonus(bonuses.criticalFactor, effectivePts, 0);
    attrBonuses.accuracy += calculateStatBonus(bonuses.accuracy, effectivePts, 0);
    attrBonuses.resistance += calculateStatBonus(bonuses.resistance, effectivePts, 0);
  }
  
  // Combine: Base + Attribute Bonuses + Equipment + Traits + Sets
  const stats: DerivedStats = {
    health: Math.round(base.health + attrBonuses.health + (equipment.health || 0) + (traits.health || 0) + (sets.health || 0)),
    mana: Math.round(base.mana + attrBonuses.mana + (equipment.mana || 0) + (traits.mana || 0) + (sets.mana || 0)),
    stamina: Math.round(base.stamina + attrBonuses.stamina + (equipment.stamina || 0) + (traits.stamina || 0) + (sets.stamina || 0)),
    damage: Math.round(base.damage + attrBonuses.damage + (equipment.damage || 0) + (traits.damage || 0) + (sets.damage || 0)),
    defense: Math.round(base.defense + attrBonuses.defense + (equipment.defense || 0) + (traits.defense || 0) + (sets.defense || 0)),
    
    // Combat factors with caps
    blockChance: clampToStatCap(attrBonuses.blockChance + (equipment.blockChance || 0) + (traits.blockChance || 0) + (sets.blockChance || 0), 'blockChance'),
    blockFactor: clampToStatCap(attrBonuses.blockFactor + (equipment.blockFactor || 0) + (traits.blockFactor || 0) + (sets.blockFactor || 0), 'blockFactor'),
    criticalChance: clampToStatCap(attrBonuses.criticalChance + (equipment.criticalChance || 0) + (traits.criticalChance || 0) + (sets.criticalChance || 0), 'criticalChance'),
    criticalFactor: 1.0 + clampToStatCap(attrBonuses.criticalFactor + (equipment.criticalFactor || 0) + (traits.criticalFactor || 0) + (sets.criticalFactor || 0), 'criticalFactor'),
    accuracy: clampToStatCap(0.5 + attrBonuses.accuracy + (equipment.accuracy || 0) + (traits.accuracy || 0) + (sets.accuracy || 0), 'accuracy'),
    resistance: clampToStatCap(attrBonuses.resistance + (equipment.resistance || 0) + (traits.resistance || 0) + (sets.resistance || 0), 'resistance'),
    
    // Drain/Reflect/Absorb factors
    drainHealth: clampToStatCap((equipment.drainHealth || 0) + (traits.drainHealth || 0) + (sets.drainHealth || 0), 'drainHealth'),
    drainMana: clampToStatCap((equipment.drainMana || 0) + (traits.drainMana || 0) + (sets.drainMana || 0), 'drainMana'),
    reflectFactor: clampToStatCap((equipment.reflectFactor || 0) + (traits.reflectFactor || 0) + (sets.reflectFactor || 0), 'reflectFactor'),
    absorbHealth: clampToStatCap((equipment.absorbHealth || 0) + (traits.absorbHealth || 0) + (sets.absorbHealth || 0), 'absorbHealth'),
    absorbMana: clampToStatCap((equipment.absorbMana || 0) + (traits.absorbMana || 0) + (sets.absorbMana || 0), 'absorbMana'),
    
    // Calculate defense reduction percentage
    defenseReduction: 0,
  };
  
  // Calculate defense reduction: Damage Taken = Incoming × (100 - √Defense) / 100
  stats.defenseReduction = Math.sqrt(stats.defense) / 100;
  
  return stats;
}

// ===== COMBAT CALCULATIONS =====

export interface DamageCalculationOptions {
  baseDamage: number;
  attacker: DerivedStats;
  defender: DerivedStats;
  isSpell?: boolean;
  enableVariance?: boolean;
}

export interface DamageResult {
  rawDamage: number;
  mitigatedDamage: number;
  finalDamage: number;
  wasBlocked: boolean;
  wasCritical: boolean;
  healthDrained: number;
  manaDrained: number;
  damageReflected: number;
  healthAbsorbed: number;
  manaAbsorbed: number;
}

/**
 * Calculate damage dealt following the 8-step combat pipeline:
 * 1. Calculate Base Damage
 * 2. Apply Defense Break (not implemented - requires attacker defense break stat)
 * 3. Calculate Mitigation (relational damage formula)
 * 4. Apply Random Variance (±25% if enabled)
 * 5. Check Block
 * 6. Check Critical (only if not blocked)
 * 7. Apply Damage
 * 8. Trigger Effects (Drain, Reflect, Absorb)
 */
export function calculateDamage(options: DamageCalculationOptions): DamageResult {
  const { baseDamage, attacker, defender, isSpell = false, enableVariance = true } = options;
  
  let damage = baseDamage + attacker.damage;
  
  // Step 3: Calculate Mitigation using relational damage formula
  // Damage Taken = Incoming × (100 - √Defense) / 100
  const mitigation = (100 - Math.sqrt(defender.defense)) / 100;
  const mitigatedDamage = damage * mitigation;
  damage = mitigatedDamage;
  
  // Step 4: Apply Random Variance (±25%)
  if (enableVariance) {
    const variance = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    damage *= variance;
  }
  
  // Step 5: Check Block
  let wasBlocked = false;
  if (Math.random() < defender.blockChance) {
    wasBlocked = true;
    damage *= (1 - defender.blockFactor);
  }
  
  // Step 6: Check Critical (only if not blocked)
  let wasCritical = false;
  if (!wasBlocked && Math.random() < attacker.criticalChance) {
    wasCritical = true;
    damage *= attacker.criticalFactor;
  }
  
  const finalDamage = Math.round(Math.max(0, damage));
  
  // Step 8: Calculate Effects
  const healthDrained = Math.round(finalDamage * attacker.drainHealth);
  const manaDrained = Math.round(finalDamage * attacker.drainMana);
  const damageReflected = wasBlocked ? 0 : Math.round(finalDamage * defender.reflectFactor);
  const healthAbsorbed = Math.round(finalDamage * defender.absorbHealth);
  const manaAbsorbed = Math.round(finalDamage * defender.absorbMana);
  
  return {
    rawDamage: baseDamage + attacker.damage,
    mitigatedDamage: Math.round(mitigatedDamage),
    finalDamage,
    wasBlocked,
    wasCritical,
    healthDrained,
    manaDrained,
    damageReflected,
    healthAbsorbed,
    manaAbsorbed,
  };
}

/**
 * Check if a debuff lands based on accuracy vs resistance
 * @returns true if debuff lands, false if resisted
 */
export function checkDebuffSuccess(attackerAccuracy: number, defenderResistance: number): boolean {
  // Debuff Success = Attacker Accuracy - Target Resistance
  // Cap: 95% (always 5% minimum chance to resist/land)
  const successChance = Math.max(0.05, Math.min(0.95, attackerAccuracy - defenderResistance));
  return Math.random() < successChance;
}

// ===== DEFAULT ATTRIBUTE POINTS =====

export function getDefaultAttributes(): AttributePoints {
  return {
    Strength: 0,
    Vitality: 0,
    Endurance: 0,
    Intellect: 0,
    Wisdom: 0,
    Dexterity: 0,
    Agility: 0,
    Tactics: 0,
  };
}

export function getTotalAttributePoints(attributes: AttributePoints): number {
  return Object.values(attributes).reduce((sum, val) => sum + val, 0);
}

/**
 * Get total attribute points for a given level
 * @param level Character level (0-20)
 * @returns Total points available: 20 (starting) + level × 7
 * 
 * Examples:
 * - Level 0: 20 points (starting allotment)
 * - Level 5: 55 points (20 + 5×7)
 * - Level 10: 90 points (20 + 10×7)
 * - Level 20: 160 points (20 + 20×7)
 */
export function getTotalPointsForLevel(level: number): number {
  const clampedLevel = Math.max(LEVEL_PROGRESSION.minLevel, Math.min(LEVEL_PROGRESSION.maxLevel, level));
  return LEVEL_PROGRESSION.startingPoints + (clampedLevel * LEVEL_PROGRESSION.pointsPerLevel);
}

/**
 * Get available (unspent) attribute points based on level and used points
 * @param level Character level (0-20)
 * @param usedPoints Points already allocated to attributes
 * @returns Remaining points to allocate
 * 
 * Note: At level 0 with 0 used points, returns 20 (the starting allotment).
 * This is correct per spec - all characters start with 20 points at creation.
 */
export function getAvailableAttributePoints(level: number, usedPoints: number): number {
  const totalPoints = getTotalPointsForLevel(level);
  return Math.max(0, totalPoints - usedPoints);
}
