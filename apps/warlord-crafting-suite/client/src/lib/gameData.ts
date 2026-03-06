/**
 * GRUDGE Warlords - Game Data Definitions
 * 
 * Contains all game entities: Attributes, Races, Classes, and Factions
 * Re-exports stat calculator functions for client use
 */

import {
  AttributeKey,
  AttributePoints,
  ATTRIBUTE_DEFINITIONS,
  LEVEL_PROGRESSION,
  calculateDerivedStats,
  calculateBaseStats,
  getDefaultAttributes,
  getTotalAttributePoints,
  getTotalPointsForLevel,
  getAvailableAttributePoints,
  applyDiminishingReturns,
  getEffectivePoints,
  STAT_CAPS,
  DIMINISHING_RETURNS,
  type DerivedStats,
  type EquipmentStats,
  type CalculateStatsOptions,
} from '../../../shared/statCalculator';

// Re-export everything from statCalculator for client convenience
export {
  type AttributeKey,
  type AttributePoints,
  type DerivedStats,
  type EquipmentStats,
  type CalculateStatsOptions,
  ATTRIBUTE_DEFINITIONS,
  LEVEL_PROGRESSION,
  calculateDerivedStats,
  calculateBaseStats,
  getDefaultAttributes,
  getTotalAttributePoints,
  getTotalPointsForLevel,
  getAvailableAttributePoints,
  applyDiminishingReturns,
  getEffectivePoints,
  STAT_CAPS,
  DIMINISHING_RETURNS,
};

// ===== ATTRIBUTES (simplified view for UI) =====

export interface AttributeDef {
  key: AttributeKey;
  name: string;
  role: string;
  focus: string;
  color: string;
  icon: string;
  primaryStats: string[];
}

export const ATTRIBUTES: AttributeDef[] = [
  {
    key: 'Strength',
    name: 'Strength',
    role: 'Tank / Melee DPS',
    focus: 'High health, damage, and defense with strong combat modifiers',
    color: '#e74c3c',
    icon: '💪',
    primaryStats: ['Health +26', 'Damage +3', 'Defense +12', 'Block Chance', 'Critical'],
  },
  {
    key: 'Vitality',
    name: 'Vitality',
    role: 'Tank / Survivability',
    focus: 'Maximum health, defense, and damage mitigation',
    color: '#27ae60',
    icon: '❤️',
    primaryStats: ['Health +25', 'Defense +12', 'Block Factor', 'Resistance'],
  },
  {
    key: 'Endurance',
    name: 'Endurance',
    role: 'Defensive Specialist',
    focus: 'Defense, block mechanics, and critical evasion',
    color: '#95a5a6',
    icon: '🛡️',
    primaryStats: ['Defense +12', 'Block Chance', 'Resistance'],
  },
  {
    key: 'Intellect',
    name: 'Intellect',
    role: 'Mage / Caster',
    focus: 'Mana, magic damage, and spell accuracy',
    color: '#3498db',
    icon: '🧠',
    primaryStats: ['Mana +5', 'Damage +4', 'Accuracy', 'Resistance'],
  },
  {
    key: 'Wisdom',
    name: 'Wisdom',
    role: 'Healer / Support',
    focus: 'Mana efficiency, survivability, and spell effectiveness',
    color: '#9b59b6',
    icon: '🔮',
    primaryStats: ['Mana +20', 'Health +10', 'Critical Chance', 'Resistance'],
  },
  {
    key: 'Dexterity',
    name: 'Dexterity',
    role: 'Rogue / Precision Fighter',
    focus: 'Critical strikes, accuracy, and evasion',
    color: '#f39c12',
    icon: '🎯',
    primaryStats: ['Damage +3', 'Defense +10', 'Critical Chance', 'Accuracy'],
  },
  {
    key: 'Agility',
    name: 'Agility',
    role: 'Mobile DPS / Dodge Tank',
    focus: 'Mobility, critical strikes, and defensive penetration',
    color: '#1abc9c',
    icon: '⚡',
    primaryStats: ['Stamina +5', 'Damage +3', 'Defense +5', 'Critical Chance'],
  },
  {
    key: 'Tactics',
    name: 'Tactics',
    role: 'Strategic Fighter / Commander',
    focus: 'Balanced combat stats with penetration abilities',
    color: '#34495e',
    icon: '🎲',
    primaryStats: ['Health +10', 'Damage +3', 'Defense +5', 'Block Chance'],
  },
];

// ===== RACES =====

export interface RaceDef {
  id: string;
  name: string;
  faction: 'Order' | 'Chaos' | 'Neutral';
  description: string;
  lore: string;
  bonuses: Partial<AttributePoints>;
  traits: string[];
  icon: string;
}

export const RACES: RaceDef[] = [
  // Order Faction
  {
    id: 'human',
    name: 'Human',
    faction: 'Order',
    description: 'Versatile and adaptable, humans excel in any role',
    lore: 'The backbone of civilization, humans have built empires through sheer determination.',
    bonuses: { Strength: 1, Intellect: 1, Wisdom: 1, Tactics: 2 },
    traits: ['Adaptable (+5% XP gain)', 'Diplomatic (+10% gold from quests)'],
    icon: '👤',
  },
  {
    id: 'elf',
    name: 'Elf',
    faction: 'Order',
    description: 'Ancient and wise, elves possess innate magical abilities',
    lore: 'Immortal guardians of the ancient forests, elves remember the world before the Grudge.',
    bonuses: { Intellect: 3, Wisdom: 2, Dexterity: 2 },
    traits: ['Keen Senses (+15% Accuracy)', 'Arcane Affinity (+10% Mana)'],
    icon: '🧝',
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    faction: 'Order',
    description: 'Sturdy and resilient, dwarves are master craftsmen and warriors',
    lore: 'From the deepest mountain holds, dwarves forge weapons that can slay gods.',
    bonuses: { Strength: 2, Vitality: 3, Endurance: 3 },
    traits: ['Stoneborn (+20% Defense)', 'Master Craftsman (+1 crafting tier)'],
    icon: '⛏️',
  },
  // Chaos Faction
  {
    id: 'orc',
    name: 'Orc',
    faction: 'Chaos',
    description: 'Brutal and fearless, orcs live for battle and glory',
    lore: 'Born from the blood of war itself, orcs know no fear and seek only conquest.',
    bonuses: { Strength: 4, Vitality: 2, Endurance: 1 },
    traits: ['Bloodrage (+25% damage when below 50% HP)', 'Warborn (+10% Critical)'],
    icon: '👹',
  },
  {
    id: 'demon',
    name: 'Demon',
    faction: 'Chaos',
    description: 'Dark and powerful, demons channel infernal energies',
    lore: 'Escaped from the Abyss, demons seek to corrupt the mortal realm.',
    bonuses: { Intellect: 3, Wisdom: 2, Tactics: 2 },
    traits: ['Hellfire (+15% spell damage)', 'Soul Siphon (+5% lifesteal)'],
    icon: '😈',
  },
  {
    id: 'undead',
    name: 'Undead',
    faction: 'Chaos',
    description: 'Neither living nor dead, undead persist through sheer will',
    lore: 'Raised by dark magic, the undead serve the endless hunger of their masters.',
    bonuses: { Vitality: 2, Endurance: 3, Wisdom: 2 },
    traits: ['Undying (+20% HP)', 'Fear Aura (-10% enemy accuracy)'],
    icon: '💀',
  },
  // Neutral Faction
  {
    id: 'beastkin',
    name: 'Beastkin',
    faction: 'Neutral',
    description: 'Wild and fierce, beastkin are one with nature',
    lore: 'Children of the wild gods, beastkin can take the forms of great beasts.',
    bonuses: { Strength: 2, Agility: 3, Dexterity: 2 },
    traits: ['Primal Form (+15% all stats in combat)', 'Pack Tactics (+10% party damage)'],
    icon: '🐺',
  },
  {
    id: 'golem',
    name: 'Golem',
    faction: 'Neutral',
    description: 'Constructed beings of stone and magic, golems are nigh indestructible',
    lore: 'Created by ancient mages, some golems gained sentience and now seek their own purpose.',
    bonuses: { Vitality: 4, Endurance: 4, Strength: 1 },
    traits: ['Stone Body (+30% Defense, -20% Speed)', 'Tireless (No stamina cost)'],
    icon: '🗿',
  },
];

// ===== CLASSES =====

export interface ClassDef {
  id: string;
  name: string;
  archetype: 'Tank' | 'DPS' | 'Healer' | 'Support' | 'Hybrid';
  description: string;
  primaryAttributes: AttributeKey[];
  startingBonuses: Partial<AttributePoints>;
  abilities: string[];
  icon: string;
  color: string;
}

export const CLASSES: ClassDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    archetype: 'Tank',
    description: 'Fearless fighters who charge into battle with sword and shield',
    primaryAttributes: ['Strength', 'Vitality', 'Endurance'],
    startingBonuses: { Strength: 3, Vitality: 2, Endurance: 1 },
    abilities: ['Shield Bash', 'Battle Cry', 'Charge', 'Last Stand'],
    icon: '⚔️',
    color: '#e74c3c',
  },
  {
    id: 'worg',
    name: 'Worg',
    archetype: 'DPS',
    description: 'Savage beast-warriors who unleash primal fury in combat',
    primaryAttributes: ['Strength', 'Agility', 'Vitality'],
    startingBonuses: { Strength: 2, Agility: 2, Vitality: 2 },
    abilities: ['Savage Bite', 'Howl', 'Pack Hunt', 'Feral Rage'],
    icon: '🐺',
    color: '#7f8c8d',
  },
  {
    id: 'mage',
    name: 'Mage',
    archetype: 'DPS',
    description: 'Wielders of arcane power who devastate enemies with elemental magic',
    primaryAttributes: ['Intellect', 'Wisdom', 'Tactics'],
    startingBonuses: { Intellect: 3, Wisdom: 2, Tactics: 1 },
    abilities: ['Fireball', 'Ice Storm', 'Arcane Blast', 'Meteor'],
    icon: '🔥',
    color: '#9b59b6',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    archetype: 'DPS',
    description: 'Masters of the bow who excel at ranged combat and tracking',
    primaryAttributes: ['Dexterity', 'Agility', 'Wisdom'],
    startingBonuses: { Dexterity: 2, Agility: 2, Wisdom: 2 },
    abilities: ['Aimed Shot', 'Multi-Shot', 'Traps', 'Beast Companion'],
    icon: '🏹',
    color: '#27ae60',
  },
];

// ===== FACTION COLORS =====

export const FACTION_COLORS = {
  Order: { primary: '#3498db', secondary: '#2980b9', accent: '#f1c40f' },
  Chaos: { primary: '#e74c3c', secondary: '#c0392b', accent: '#9b59b6' },
  Neutral: { primary: '#27ae60', secondary: '#1e8449', accent: '#f39c12' },
};

// ===== HELPER FUNCTIONS =====

export function getRaceById(id: string): RaceDef | undefined {
  return RACES.find(r => r.id === id);
}

export function getClassById(id: string): ClassDef | undefined {
  return CLASSES.find(c => c.id === id);
}

export function getAttributeByKey(key: AttributeKey): AttributeDef | undefined {
  return ATTRIBUTES.find(a => a.key === key);
}

/**
 * Calculate starting attributes for a character based on race and class
 */
export function calculateStartingAttributes(raceId: string, classId: string): AttributePoints {
  const race = getRaceById(raceId);
  const cls = getClassById(classId);
  const base = getDefaultAttributes();
  
  if (race?.bonuses) {
    for (const [key, value] of Object.entries(race.bonuses)) {
      if (value && key in base) {
        base[key as AttributeKey] += value;
      }
    }
  }
  
  if (cls?.startingBonuses) {
    for (const [key, value] of Object.entries(cls.startingBonuses)) {
      if (value && key in base) {
        base[key as AttributeKey] += value;
      }
    }
  }
  
  return base;
}
