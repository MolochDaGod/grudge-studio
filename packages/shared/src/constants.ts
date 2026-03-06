// ============================================
// TIER PRICING SYSTEM
// ============================================

export const TIER_PRICE_MULTIPLIERS: Record<number, number> = {
  1: 1,
  2: 2.5,
  3: 5,
  4: 10,
  5: 20,
  6: 40,
  7: 80,
  8: 160,
};

// Base prices by category (server-side authoritative)
export const DEFAULT_RECIPE_PRICE = 500;
export const RECIPE_PRICE_BY_CATEGORY: Record<string, number> = {
  weapon: 750,
  armor: 600,
  consumable: 400,
  material: 300,
};

export const MATERIAL_BASE_PRICE = 50;
export const CRAFTED_ITEM_BASE_PRICE = 200;

/**
 * Calculate price for an item based on tier
 */
export function calculatePrice(basePrice: number, tier: number = 1): number {
  const validTier = Math.max(1, Math.min(8, tier));
  return Math.floor(basePrice * (TIER_PRICE_MULTIPLIERS[validTier] || 1));
}

/**
 * Calculate sell price (30% of buy price)
 */
export function calculateSellPrice(buyPrice: number): number {
  return Math.floor(buyPrice * 0.3);
}

/**
 * Validate and clamp tier to valid range (1-8)
 */
export function validateTier(tier: number): number {
  return Math.max(1, Math.min(8, Math.floor(tier)));
}

// ============================================
// CRAFTING CONSTANTS
// ============================================

// T0 Universal starter recipes - basics everyone gets
export const T0_UNIVERSAL_RECIPE_IDS = [
  'parchment', 'ink', 'simple-thread', 'blank-scroll',
];

// Profession-specific starter recipes (T0 + T1)
export const PROFESSION_STARTER_RECIPES: Record<string, string[]> = {
  Miner: ['scrap-metal', 'copper-ingot', 'broken-blade', 'bloodfeud-blade'],
  Forester: ['rotted-wood', 'pine-plank', 'warped-bow', 'wraithbone-bow'],
  Mystic: ['torn-rag', 'linen-cloth', 'cracked-rod', 'emberwrath-staff'],
  Chef: ['charcoal', 'grilled-fish', 'simple-bread', 'salted-jerky'],
  Engineer: ['copper-gear', 'jammed-crossbow', 'ironveil', 'basic-trap'],
};

// Class-specific bonus recipes
export const CLASS_BONUS_RECIPES: Record<string, string[]> = {
  Warrior: ['warrior-repair-kit'],
  Worg: ['worg-leather-patch'],
  Mage: ['mage-mana-vial'],
  Ranger: ['ranger-arrow-bundle'],
};

// Race-specific bonus recipes
export const RACE_BONUS_RECIPES: Record<string, string[]> = {
  Orc: ['orc-metal-salvage'],
  Elf: ['elf-lumber-efficiency'],
  Human: ['human-ink-economy'],
  Undead: ['undead-essence-transmute'],
};

// XP awarded per tier when crafting
export const CRAFT_XP_BY_TIER: Record<number, number> = {
  0: 10,
  1: 25,
  2: 50,
  3: 100,
  4: 200,
  5: 400,
  6: 800,
  7: 1600,
  8: 3200,
};

/**
 * Get XP required to level up profession
 */
export function getXpForProfessionLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Get all starter recipe IDs for a character (all professions)
 */
export function getStarterRecipeIds(): string[] {
  const allRecipeIds = new Set<string>(T0_UNIVERSAL_RECIPE_IDS);
  Object.values(PROFESSION_STARTER_RECIPES).forEach(recipes => {
    recipes.forEach(id => allRecipeIds.add(id));
  });
  return Array.from(allRecipeIds);
}

/**
 * Get class-specific bonus recipe IDs
 */
export function getClassBonusRecipeIds(classId: string): string[] {
  return CLASS_BONUS_RECIPES[classId] || [];
}

/**
 * Get race-specific bonus recipe IDs
 */
export function getRaceBonusRecipeIds(raceId: string): string[] {
  return RACE_BONUS_RECIPES[raceId] || [];
}

// ============================================
// SPRITE MAPPING
// ============================================

export const SPRITE_MAPPING = {
  items: {
    'iron-ore': {
      spriteId: 'GRD-SPR-001-00-001',
      sheet: 'materials.png',
      coords: { x: 0, y: 0 },
    },
    'copper-ore': {
      spriteId: 'GRD-SPR-001-00-002',
      sheet: 'materials.png',
      coords: { x: 32, y: 0 },
    },
    'wooden-plank': {
      spriteId: 'GRD-SPR-002-00-001',
      sheet: 'materials.png',
      coords: { x: 64, y: 0 },
    },
  },
  equipment: {
    'iron-sword': {
      spriteId: 'GRD-EQP-001-01-001',
      sheet: 'weapons.png',
      coords: { x: 0, y: 0 },
    },
  },
};
