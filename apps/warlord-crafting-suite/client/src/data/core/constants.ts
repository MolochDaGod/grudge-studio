export const PROFESSIONS = ['Miner', 'Forester', 'Mystic', 'Chef', 'Engineer'] as const;
export type Profession = typeof PROFESSIONS[number];

export const ARMOR_SLOTS = ['helm', 'shoulder', 'chest', 'hands', 'feet', 'ring', 'necklace', 'relic'] as const;
export type ArmorSlot = typeof ARMOR_SLOTS[number];

export const ARMOR_SETS = ['bloodfeud', 'wraithfang', 'oathbreaker', 'kinrend', 'dusksinger', 'emberclad'] as const;
export type ArmorSet = typeof ARMOR_SETS[number];

export const ARMOR_MATERIALS = ['cloth', 'leather', 'metal', 'gem'] as const;
export type ArmorMaterial = typeof ARMOR_MATERIALS[number];

export const WEAPON_CATEGORIES = {
  melee1h: ['sword', 'axe', 'dagger', 'hammer1h', 'spear', 'mace'],
  melee2h: ['greatsword', 'greataxe', 'hammer2h'],
  ranged: ['bow', 'crossbow', 'gun'],
  magic: ['fireStaff', 'frostStaff', 'natureStaff', 'holyStaff', 'lightningStaff', 'arcaneStaff'],
  offhand: ['fireTome', 'frostTome', 'natureTome', 'holyTome', 'lightningTome', 'arcaneTome'],
} as const;

export const TIERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Tier = typeof TIERS[number];

export const TIER_MATERIALS: Record<number, {
  ore: string;
  wood: string;
  cloth: string;
  essence: string;
  leather: string;
  gem: string;
  goldCost: number;
}> = {
  1: { ore: 'Copper', wood: 'Pine', cloth: 'Linen', essence: 'Minor', leather: 'Rawhide', gem: 'Rough', goldCost: 100 },
  2: { ore: 'Iron', wood: 'Oak', cloth: 'Wool', essence: 'Lesser', leather: 'Thick', gem: 'Flawed', goldCost: 200 },
  3: { ore: 'Steel', wood: 'Maple', cloth: 'Cotton', essence: 'Greater', leather: 'Rugged', gem: 'Standard', goldCost: 400 },
  4: { ore: 'Mithril', wood: 'Ash', cloth: 'Silk', essence: 'Superior', leather: 'Hardened', gem: 'Fine', goldCost: 800 },
  5: { ore: 'Adamantine', wood: 'Ironwood', cloth: 'Moonweave', essence: 'Refined', leather: 'Wyrm', gem: 'Pristine', goldCost: 1600 },
  6: { ore: 'Orichalcum', wood: 'Ebony', cloth: 'Starweave', essence: 'Perfect', leather: 'Infernal', gem: 'Flawless', goldCost: 3200 },
  7: { ore: 'Starmetal', wood: 'Wyrmwood', cloth: 'Voidweave', essence: 'Ancient', leather: 'Titan', gem: 'Radiant', goldCost: 6400 },
  8: { ore: 'Divine', wood: 'Worldtree', cloth: 'Divine', essence: 'Divine', leather: 'Divine', gem: 'Divine', goldCost: 12800 },
};

export const RECIPE_ACQUISITION = ['purchasable', 'skillTree', 'dropOnly'] as const;
export type RecipeAcquisition = typeof RECIPE_ACQUISITION[number];

export const NODE_TYPES = ['stat', 'effect', 'combat', 'recipe'] as const;
export type NodeType = typeof NODE_TYPES[number];

export const STAT_TYPES = [
  'damage', 'speed', 'combo', 'crit', 'block', 'defense',
  'hp', 'mana', 'armor', 'magicResist'
] as const;
export type StatType = typeof STAT_TYPES[number];

export const CRAFTING_BONUS_TYPES = [
  'qualityBoost', 'successChance', 'materialReduction', 'speedBoost',
  'tierUnlock', 'doubleYield', 'socketChance', 'enchantPower',
  'essenceEfficiency', 'gemQuality'
] as const;
export type CraftingBonusType = typeof CRAFTING_BONUS_TYPES[number];
