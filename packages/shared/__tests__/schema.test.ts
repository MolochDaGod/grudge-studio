import { describe, it, expect } from 'vitest';
import {
  insertCharacterSchema,
  insertInventoryItemSchema,
  insertCraftedItemSchema,
  recipeSchema,
  calculatePrice,
  calculateSellPrice,
  validateTier,
  getStarterRecipeIds,
} from '../src/schema';
import { z } from 'zod';

/**
 * Test shared schemas and utilities
 */

describe('Shared - Character Schema', () => {
  it('should validate valid character data', () => {
    const validData = {
      userId: 'user-123',
      name: 'My Hero',
      classId: 'Warrior',
      raceId: 'Human',
      level: 1,
      gold: 0,
    };

    const result = insertCharacterSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should require userId and name', () => {
    const invalidData = {
      // missing userId and name
      classId: 'Warrior',
    };

    const result = insertCharacterSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should have default values', () => {
    const minimalData = {
      userId: 'user-123',
      name: 'Hero',
    };

    const result = insertCharacterSchema.parse(minimalData);
    expect(result.level).toBe(1);
    expect(result.gold).toBe(0);
    expect(result.health).toBe(100);
  });
});

describe('Shared - Inventory Item Schema', () => {
  it('should validate inventory item', () => {
    const validItem = {
      characterId: 'char-123',
      itemType: 'material',
      itemName: 'Iron Ore',
      quantity: 10,
    };

    const result = insertInventoryItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('should require positive quantity', () => {
    const invalidItem = {
      characterId: 'char-123',
      itemType: 'material',
      itemName: 'Iron Ore',
      quantity: 0, // Invalid: must be positive
    };

    const result = insertInventoryItemSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });
});

describe('Shared - Crafted Item Schema', () => {
  it('should validate crafted item', () => {
    const validItem = {
      characterId: 'char-123',
      itemName: 'Iron Sword',
      profession: 'Blacksmith',
      itemType: 'weapon',
      tier: 1,
      equipped: false,
    };

    const result = insertCraftedItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('should enforce tier bounds', () => {
    const itemWithInvalidTier = {
      characterId: 'char-123',
      itemName: 'Iron Sword',
      profession: 'Blacksmith',
      itemType: 'weapon',
      tier: 10, // Invalid: max is 8
      equipped: false,
    };

    const result = insertCraftedItemSchema.safeParse(itemWithInvalidTier);
    expect(result.success).toBe(false);
  });
});

describe('Shared - Recipe Schema', () => {
  it('should validate recipe', () => {
    const validRecipe = {
      id: 'recipe-1',
      name: 'Iron Ingot',
      category: 'material',
      tier: 1,
      basePrice: 100,
      profession: 'Miner',
      materials: [{ name: 'Iron Ore', quantity: 3 }],
      time: 30,
      yield: 1,
    };

    const result = recipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });
});

describe('Shared - Pricing Utilities', () => {
  it('should calculate base price correctly', () => {
    const basePrice = 100;

    expect(calculatePrice(basePrice, 1)).toBe(100);
    expect(calculatePrice(basePrice, 2)).toBe(250);
    expect(calculatePrice(basePrice, 3)).toBe(500);
    expect(calculatePrice(basePrice, 4)).toBe(1000);
  });

  it('should calculate sell price as 30% of buy price', () => {
    const buyPrice = 100;
    const sellPrice = calculateSellPrice(buyPrice);

    expect(sellPrice).toBe(30);
  });

  it('should validate and clamp tier', () => {
    expect(validateTier(0)).toBe(1); // Clamp to min 1
    expect(validateTier(5)).toBe(5);
    expect(validateTier(10)).toBe(8); // Clamp to max 8
  });

  it('should handle negative tier', () => {
    expect(validateTier(-5)).toBe(1);
  });
});

describe('Shared - Profession Recipes', () => {
  it('should include starter recipes', () => {
    const starterIds = getStarterRecipeIds();

    expect(starterIds).toContain('parchment');
    expect(starterIds).toContain('ink');
    expect(starterIds).toContain('simple-thread');
  });

  it('should include profession-specific recipes', () => {
    const starterIds = getStarterRecipeIds();

    // Check some profession recipes are included
    expect(starterIds).toContain('scrap-metal'); // Miner
    expect(starterIds).toContain('rotted-wood'); // Forester
    expect(starterIds).toContain('torn-rag'); // Mystic
  });
});
