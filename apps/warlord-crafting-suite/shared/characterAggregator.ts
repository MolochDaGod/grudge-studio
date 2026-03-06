/**
 * GRUDGE Warlords - Character Stats Aggregator
 * 
 * Single source of truth for all character statistics.
 * Aggregates bonuses from: Attributes, Equipment, Profession Skills, Class Skills, Buffs, Potions, etc.
 * 
 * This ensures consistent math across the entire game.
 */

import { 
  AttributePoints, 
  DerivedStats, 
  EquipmentStats,
  calculateDerivedStats,
  ATTRIBUTE_DEFINITIONS,
  applyDiminishingReturns,
  getTotalPointsForLevel,
  getDefaultAttributes
} from './statCalculator';

// ===== SOURCE TYPES =====

export type BonusSource = 
  | 'base'           // Character base stats
  | 'attributes'     // Attribute points
  | 'equipment'      // Equipped gear
  | 'profession'     // Profession skill tree bonuses
  | 'class'          // Class skill tree bonuses  
  | 'buff'           // Active buffs/debuffs
  | 'potion'         // Active potion effects
  | 'set_bonus'      // Equipment set bonuses
  | 'enchantment'    // Gear enchantments
  | 'gem'            // Socketed gems
  | 'title'          // Achievement titles
  | 'guild'          // Guild bonuses
  | 'event';         // Temporary event bonuses

export interface StatModifier {
  source: BonusSource;
  sourceId: string;        // Specific identifier (e.g., "miner_node_1", "iron_helmet")
  sourceName: string;      // Display name
  stat: string;            // Which stat this affects
  flatBonus: number;       // Flat value added
  percentBonus: number;    // Percentage modifier (0.10 = 10%)
  duration?: number;       // Duration in ms (for temporary effects)
  expiresAt?: number;      // Timestamp when effect expires
}

export interface CraftingModifier {
  source: BonusSource;
  sourceId: string;
  sourceName: string;
  bonusType: string;       // qualityBoost, successChance, etc.
  value: number;
  target?: string;         // Specific item/profession target
}

export interface EquippedItem {
  slot: string;
  itemId: string;
  itemName: string;
  tier: number;
  stats: EquipmentStats;
  setId?: string;
  enchantments?: StatModifier[];
  gems?: StatModifier[];
}

export interface ActiveBuff {
  id: string;
  name: string;
  icon?: string;
  source: 'potion' | 'skill' | 'buff' | 'event';
  modifiers: StatModifier[];
  duration: number;
  appliedAt: number;
  expiresAt: number;
}

export interface ProfessionProgress {
  profession: string;
  level: number;
  experience: number;
  experienceToNext: number;
  unlockedNodeIds: string[];
}

export interface ClassProgress {
  classId: string;
  level: number;
  skillPoints: number;
  unlockedNodeIds: string[];
}

// ===== AGGREGATED CHARACTER STATE =====

export interface AggregatedCharacterState {
  // Identity
  id: string;
  name: string;
  classId: string | null;
  raceId: string | null;
  faction: 'Order' | 'Chaos' | 'Neutral' | null;
  avatarUrl: string | null;
  
  // Progression
  level: number;
  experience: number;
  experienceToNextLevel: number;
  gold: number;
  
  // Attribute System
  totalAttributePoints: number;
  usedAttributePoints: number;
  availableAttributePoints: number;
  baseAttributes: AttributePoints;
  bonusAttributes: AttributePoints;       // From gear, buffs, etc.
  effectiveAttributes: AttributePoints;   // After diminishing returns
  
  // Derived Combat Stats
  finalStats: DerivedStats;
  
  // Current Resources
  currentHealth: number;
  currentMana: number;
  currentStamina: number;
  maxHealth: number;
  maxMana: number;
  maxStamina: number;
  
  // Equipment
  equipment: Record<string, EquippedItem | null>;
  activeSets: { setId: string; setName: string; piecesEquipped: number; bonusesActive: string[] }[];
  
  // Professions
  professions: ProfessionProgress[];
  craftingBonuses: CraftingModifier[];
  
  // Class
  classProgress: ClassProgress | null;
  classBonuses: StatModifier[];
  
  // Active Effects
  activeBuffs: ActiveBuff[];
  activePotions: ActiveBuff[];
  
  // All modifiers (for transparency)
  allStatModifiers: StatModifier[];
  
  // Computed breakdown for UI
  statBreakdown: Record<string, StatBreakdownEntry>;
}

export interface StatBreakdownEntry {
  statName: string;
  baseValue: number;
  sources: {
    source: BonusSource;
    sourceName: string;
    flatBonus: number;
    percentBonus: number;
    contribution: number;  // Actual value contributed
  }[];
  totalFlat: number;
  totalPercent: number;
  finalValue: number;
}

// ===== CRAFTING BONUS TYPES =====

export const CRAFTING_BONUS_TYPES = {
  qualityBoost: { name: 'Quality Boost', icon: '✨', unit: '%' },
  successChance: { name: 'Success Rate', icon: '🎯', unit: '%' },
  materialReduction: { name: 'Material Cost', icon: '📦', unit: '%', isReduction: true },
  speedBoost: { name: 'Crafting Speed', icon: '⚡', unit: '%' },
  tierUnlock: { name: 'Tier Unlock', icon: '🔓', unit: '' },
  doubleYield: { name: 'Double Yield', icon: '×2', unit: '%' },
  socketChance: { name: 'Socket Chance', icon: '💎', unit: '%' },
  enchantPower: { name: 'Enchant Power', icon: '🔮', unit: '%' },
  essenceEfficiency: { name: 'Essence Efficiency', icon: '💫', unit: '%' },
  gemQuality: { name: 'Gem Quality', icon: '💠', unit: '%' },
} as const;

// ===== EXPERIENCE TABLES =====

export const EXPERIENCE_TABLE: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 900,
  6: 1500,
  7: 2400,
  8: 3800,
  9: 5900,
  10: 9000,
  11: 13500,
  12: 20000,
  13: 29000,
  14: 42000,
  15: 60000,
  16: 85000,
  17: 120000,
  18: 170000,
  19: 240000,
  20: 340000,
};

export function getExperienceForLevel(level: number): number {
  return EXPERIENCE_TABLE[level] || 0;
}

export function getExperienceToNextLevel(level: number, currentExp: number): number {
  if (level >= 20) return 0;
  const nextLevelExp = EXPERIENCE_TABLE[level + 1] || 0;
  return Math.max(0, nextLevelExp - currentExp);
}

// ===== AGGREGATOR CLASS =====

export class CharacterAggregator {
  private modifiers: StatModifier[] = [];
  private craftingModifiers: CraftingModifier[] = [];
  
  constructor(
    private characterData: {
      id: string;
      name: string;
      classId: string | null;
      raceId: string | null;
      level: number;
      experience: number;
      gold: number;
      attributes: AttributePoints;
      currentHealth: number | null;
      currentMana: number | null;
      currentStamina: number | null;
      avatarUrl: string | null;
    }
  ) {}
  
  addStatModifier(modifier: StatModifier): this {
    // Check if temporary and expired
    if (modifier.expiresAt && modifier.expiresAt < Date.now()) {
      return this;
    }
    this.modifiers.push(modifier);
    return this;
  }
  
  addCraftingModifier(modifier: CraftingModifier): this {
    this.craftingModifiers.push(modifier);
    return this;
  }
  
  addProfessionBonuses(profession: string, unlockedNodeIds: string[], nodeData: any[]): this {
    for (const nodeId of unlockedNodeIds) {
      const node = nodeData.find(n => n.id === nodeId);
      if (!node?.bonuses) continue;
      
      for (const bonus of node.bonuses) {
        this.addCraftingModifier({
          source: 'profession',
          sourceId: `${profession}_${nodeId}`,
          sourceName: node.n || node.name || nodeId,
          bonusType: bonus.type,
          value: bonus.value,
          target: bonus.target,
        });
      }
    }
    return this;
  }
  
  addEquipmentStats(slot: string, item: EquippedItem): this {
    if (!item.stats) return this;
    
    const stats = item.stats;
    const addStat = (stat: string, value: number | undefined) => {
      if (value) {
        this.addStatModifier({
          source: 'equipment',
          sourceId: item.itemId,
          sourceName: item.itemName,
          stat,
          flatBonus: value,
          percentBonus: 0,
        });
      }
    };
    
    addStat('health', stats.health);
    addStat('mana', stats.mana);
    addStat('stamina', stats.stamina);
    addStat('damage', stats.damage);
    addStat('defense', stats.defense);
    addStat('blockChance', stats.blockChance);
    addStat('blockFactor', stats.blockFactor);
    addStat('criticalChance', stats.criticalChance);
    addStat('criticalFactor', stats.criticalFactor);
    addStat('accuracy', stats.accuracy);
    addStat('resistance', stats.resistance);
    
    // Add attribute bonuses from equipment
    if (stats.attributes) {
      for (const [attr, value] of Object.entries(stats.attributes)) {
        if (value) {
          this.addStatModifier({
            source: 'equipment',
            sourceId: item.itemId,
            sourceName: item.itemName,
            stat: `attr_${attr}`,
            flatBonus: value,
            percentBonus: 0,
          });
        }
      }
    }
    
    return this;
  }
  
  addBuff(buff: ActiveBuff): this {
    if (buff.expiresAt < Date.now()) return this;
    
    for (const mod of buff.modifiers) {
      this.addStatModifier({
        ...mod,
        expiresAt: buff.expiresAt,
      });
    }
    return this;
  }
  
  aggregate(): AggregatedCharacterState {
    const { characterData } = this;
    const now = Date.now();
    
    // Filter expired modifiers
    const activeModifiers = this.modifiers.filter(m => !m.expiresAt || m.expiresAt > now);
    
    // Calculate bonus attributes from gear/buffs
    const bonusAttributes = getDefaultAttributes();
    for (const mod of activeModifiers) {
      if (mod.stat.startsWith('attr_')) {
        const attrName = mod.stat.replace('attr_', '') as keyof AttributePoints;
        if (attrName in bonusAttributes) {
          bonusAttributes[attrName] += mod.flatBonus;
        }
      }
    }
    
    // Combine base + bonus attributes
    const totalAttributes: AttributePoints = {
      Strength: characterData.attributes.Strength + bonusAttributes.Strength,
      Vitality: characterData.attributes.Vitality + bonusAttributes.Vitality,
      Endurance: characterData.attributes.Endurance + bonusAttributes.Endurance,
      Intellect: characterData.attributes.Intellect + bonusAttributes.Intellect,
      Wisdom: characterData.attributes.Wisdom + bonusAttributes.Wisdom,
      Dexterity: characterData.attributes.Dexterity + bonusAttributes.Dexterity,
      Agility: characterData.attributes.Agility + bonusAttributes.Agility,
      Tactics: characterData.attributes.Tactics + bonusAttributes.Tactics,
    };
    
    // Calculate effective attributes (after diminishing returns)
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
    
    // Calculate equipment stats for derived stats calculation
    const equipmentStats: EquipmentStats = {};
    for (const mod of activeModifiers.filter(m => m.source === 'equipment')) {
      if (!mod.stat.startsWith('attr_')) {
        (equipmentStats as any)[mod.stat] = ((equipmentStats as any)[mod.stat] || 0) + mod.flatBonus;
      }
    }
    
    // Calculate traits/buffs stats
    const traitStats: Partial<DerivedStats> = {};
    for (const mod of activeModifiers.filter(m => ['buff', 'potion', 'title', 'guild', 'event'].includes(m.source))) {
      if (!mod.stat.startsWith('attr_')) {
        (traitStats as any)[mod.stat] = ((traitStats as any)[mod.stat] || 0) + mod.flatBonus;
      }
    }
    
    // Calculate derived stats using the stat calculator
    const derivedStats = calculateDerivedStats({
      level: characterData.level,
      attributes: characterData.attributes,
      equipment: equipmentStats,
      traits: traitStats,
    });
    
    // Calculate attribute points
    const totalAttributePoints = getTotalPointsForLevel(characterData.level);
    const usedAttributePoints = Object.values(characterData.attributes).reduce((a, b) => a + b, 0);
    
    // Build stat breakdown for UI
    const statBreakdown = this.buildStatBreakdown(derivedStats, activeModifiers);
    
    // Aggregate crafting bonuses by type
    const craftingBonusesByType: Record<string, number> = {};
    for (const mod of this.craftingModifiers) {
      const key = mod.target ? `${mod.bonusType}_${mod.target}` : mod.bonusType;
      craftingBonusesByType[key] = (craftingBonusesByType[key] || 0) + mod.value;
    }
    
    return {
      id: characterData.id,
      name: characterData.name,
      classId: characterData.classId,
      raceId: characterData.raceId,
      faction: null, // TODO: derive from race
      avatarUrl: characterData.avatarUrl,
      
      level: characterData.level,
      experience: characterData.experience,
      experienceToNextLevel: getExperienceToNextLevel(characterData.level, characterData.experience),
      gold: characterData.gold,
      
      totalAttributePoints,
      usedAttributePoints,
      availableAttributePoints: totalAttributePoints - usedAttributePoints,
      baseAttributes: characterData.attributes,
      bonusAttributes,
      effectiveAttributes,
      
      finalStats: derivedStats,
      
      currentHealth: characterData.currentHealth || derivedStats.health,
      currentMana: characterData.currentMana || derivedStats.mana,
      currentStamina: characterData.currentStamina || derivedStats.stamina,
      maxHealth: derivedStats.health,
      maxMana: derivedStats.mana,
      maxStamina: derivedStats.stamina,
      
      equipment: {},
      activeSets: [],
      
      professions: [],
      craftingBonuses: this.craftingModifiers,
      
      classProgress: null,
      classBonuses: activeModifiers.filter(m => m.source === 'class'),
      
      activeBuffs: [],
      activePotions: [],
      
      allStatModifiers: activeModifiers,
      statBreakdown,
    };
  }
  
  private buildStatBreakdown(
    finalStats: DerivedStats,
    modifiers: StatModifier[]
  ): Record<string, StatBreakdownEntry> {
    const breakdown: Record<string, StatBreakdownEntry> = {};
    
    const statNames = ['health', 'mana', 'stamina', 'damage', 'defense', 
      'blockChance', 'blockFactor', 'criticalChance', 'criticalFactor',
      'accuracy', 'resistance'];
    
    for (const statName of statNames) {
      const relevantMods = modifiers.filter(m => m.stat === statName);
      const sources = relevantMods.map(m => ({
        source: m.source,
        sourceName: m.sourceName,
        flatBonus: m.flatBonus,
        percentBonus: m.percentBonus,
        contribution: m.flatBonus, // Simplified - could be more complex
      }));
      
      breakdown[statName] = {
        statName,
        baseValue: (finalStats as any)[statName] || 0,
        sources,
        totalFlat: sources.reduce((sum, s) => sum + s.flatBonus, 0),
        totalPercent: sources.reduce((sum, s) => sum + s.percentBonus, 0),
        finalValue: (finalStats as any)[statName] || 0,
      };
    }
    
    return breakdown;
  }
  
  // Get total crafting bonus for a specific type
  getCraftingBonus(bonusType: string, target?: string): number {
    return this.craftingModifiers
      .filter(m => m.bonusType === bonusType && (!target || !m.target || m.target === target))
      .reduce((sum, m) => sum + m.value, 0);
  }
}

// ===== HELPER FUNCTIONS =====

export function createCharacterAggregator(characterData: {
  id: string;
  name: string;
  classId: string | null;
  raceId: string | null;
  level: number;
  experience: number;
  gold: number;
  attributes: AttributePoints;
  currentHealth: number | null;
  currentMana: number | null;
  currentStamina: number | null;
  avatarUrl: string | null;
}): CharacterAggregator {
  return new CharacterAggregator(characterData);
}

export function formatStatValue(stat: string, value: number): string {
  const percentStats = ['blockChance', 'blockFactor', 'criticalChance', 'accuracy', 'resistance', 'defenseReduction'];
  
  if (percentStats.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`;
  }
  
  if (stat === 'criticalFactor') {
    return `${(value * 100).toFixed(0)}%`;
  }
  
  return Math.round(value).toString();
}

export function getStatDisplayName(stat: string): string {
  const names: Record<string, string> = {
    health: 'Health',
    mana: 'Mana',
    stamina: 'Stamina',
    damage: 'Damage',
    defense: 'Defense',
    blockChance: 'Block Chance',
    blockFactor: 'Block Amount',
    criticalChance: 'Critical Chance',
    criticalFactor: 'Critical Damage',
    accuracy: 'Accuracy',
    resistance: 'Resistance',
    defenseReduction: 'Damage Reduction',
    drainHealth: 'Life Steal',
    drainMana: 'Mana Steal',
    reflectFactor: 'Damage Reflect',
    absorbHealth: 'Health Absorb',
    absorbMana: 'Mana Absorb',
  };
  return names[stat] || stat;
}

export function getStatIcon(stat: string): string {
  const icons: Record<string, string> = {
    health: '❤️',
    mana: '💙',
    stamina: '💚',
    damage: '⚔️',
    defense: '🛡️',
    blockChance: '🛡️',
    blockFactor: '🛡️',
    criticalChance: '💥',
    criticalFactor: '💥',
    accuracy: '🎯',
    resistance: '✨',
    defenseReduction: '🛡️',
    drainHealth: '🩸',
    drainMana: '💧',
  };
  return icons[stat] || '📊';
}
