import { z } from 'zod';

// ============================================
// ITEM SCHEMAS
// ============================================

export const itemTypeSchema = z.enum([
  'weapon',
  'armor',
  'material',
  'consumable',
  'quest',
  'decoration',
]);

export type ItemType = z.infer<typeof itemTypeSchema>;

export const itemSchema = z.object({
  id: z.string().min(1),
  grudgeUuid: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  itemType: itemTypeSchema,
  tier: z.number().int().min(0).max(8).default(1),
  basePrice: z.number().positive(),
  sellPrice: z.number().nonnegative(),
  
  // Combat stats
  damage: z.number().int().nonnegative().optional(),
  defense: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  
  // Material info
  material: z.string().optional(),
  rarity: z.string().optional(),
  
  // Crafting
  craftableBy: z.array(z.string()).optional(),
  harvestedFrom: z.array(z.string()).optional(),
  
  // Visual/Game
  spriteId: z.string().optional(),
  spriteSheetCoords: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Item = z.infer<typeof itemSchema>;

// ============================================
// RECIPE SCHEMAS
// ============================================

export const materialRequirementSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['weapon', 'armor', 'material', 'consumable', 'potion']),
  tier: z.number().int().min(0).max(8),
  basePrice: z.number().positive(),
  profession: z.string(),
  materials: z.array(materialRequirementSchema),
  time: z.number().positive(), // in seconds
  yield: z.number().int().positive(),
  goldCost: z.number().nonnegative().optional(),
  itemType: z.string().optional(),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type MaterialRequirement = z.infer<typeof materialRequirementSchema>;

// ============================================
// CHARACTER & PROFESSION SCHEMAS
// ============================================

export const professionNameSchema = z.enum([
  'Miner',
  'Forester',
  'Mystic',
  'Chef',
  'Engineer',
]);

export type ProfessionName = z.infer<typeof professionNameSchema>;

export const professionProgressionSchema = z.record(
  professionNameSchema,
  z.object({
    level: z.number().int().min(1).max(100),
    xp: z.number().int().nonnegative(),
    pointsSpent: z.number().int().nonnegative(),
  })
);

export type ProfessionProgression = z.infer<typeof professionProgressionSchema>;

export const DEFAULT_PROFESSION_PROGRESSION: ProfessionProgression = {
  Miner: { level: 1, xp: 0, pointsSpent: 0 },
  Forester: { level: 1, xp: 0, pointsSpent: 0 },
  Mystic: { level: 1, xp: 0, pointsSpent: 0 },
  Chef: { level: 1, xp: 0, pointsSpent: 0 },
  Engineer: { level: 1, xp: 0, pointsSpent: 0 },
};

export const insertCharacterSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(50),
  classId: z.string().optional(),
  raceId: z.string().optional(),
  level: z.number().int().min(1).default(1),
  experience: z.number().int().nonnegative().default(0),
  health: z.number().int().positive().default(100),
  maxHealth: z.number().int().positive().default(100),
  mana: z.number().int().nonnegative().default(0),
  maxMana: z.number().int().nonnegative().default(0),
  gold: z.number().int().nonnegative().default(0),
  professionProgression: professionProgressionSchema.optional(),
});

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

// ============================================
// INVENTORY SCHEMAS
// ============================================

export const insertInventoryItemSchema = z.object({
  characterId: z.string().min(1),
  itemType: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
});

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

// ============================================
// CRAFTED ITEM SCHEMAS
// ============================================

export const insertCraftedItemSchema = z.object({
  characterId: z.string().min(1),
  itemName: z.string().min(1),
  profession: z.string().min(1),
  itemType: z.string().min(1),
  tier: z.number().int().min(1).max(8),
  equipped: z.boolean().default(false),
});

export type InsertCraftedItem = z.infer<typeof insertCraftedItemSchema>;

// ============================================
// RECIPE UNLOCK SCHEMAS
// ============================================

export const insertUnlockedRecipeSchema = z.object({
  characterId: z.string().min(1),
  recipeId: z.string().min(1),
});

export type InsertUnlockedRecipe = z.infer<typeof insertUnlockedRecipeSchema>;

// ============================================
// SKILL SCHEMAS
// ============================================

export const insertUnlockedSkillSchema = z.object({
  characterId: z.string().min(1),
  nodeId: z.string().min(1),
  profession: professionNameSchema,
  skillName: z.string().min(1),
  tier: z.number().int().min(1).max(5),
});

export type InsertUnlockedSkill = z.infer<typeof insertUnlockedSkillSchema>;

// ============================================
// SHOP TRANSACTION SCHEMAS
// ============================================

export const insertShopTransactionSchema = z.object({
  characterId: z.string().min(1),
  transactionType: z.enum(['buy', 'sell']),
  itemCategory: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  tier: z.number().int().min(0).max(8).nullable(),
});

export type InsertShopTransaction = z.infer<typeof insertShopTransactionSchema>;

// ============================================
// GAME SESSION SCHEMAS
// ============================================

export const insertGameSessionSchema = z.object({
  userId: z.string().min(1),
  islandId: z.string().min(1),
  characterId: z.string().optional(),
  checkpoint: z.record(z.unknown()).optional(),
  pendingResources: z.record(z.unknown()).optional(),
});

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

// ============================================
// AFK JOB SCHEMAS
// ============================================

export const insertAfkJobSchema = z.object({
  userId: z.string().min(1),
  islandId: z.string().min(1),
  sessionId: z.string().optional(),
  characterId: z.string().optional(),
  jobType: z.string().min(1),
  targetNodeId: z.string().optional(),
  targetBuildingId: z.string().optional(),
  projectedYield: z.record(z.unknown()).optional(),
  startedAt: z.date(),
  endsAt: z.date().nullable(),
});

export type InsertAfkJob = z.infer<typeof insertAfkJobSchema>;

// ============================================
// PROFESSION PROGRESSION HELPERS
// ============================================

// NOTE: Profession progression utilities moved to @grudge/shared/utils/profession
// Import from there instead: import { calculateProfessionPoints, getAvailableProfessionPoints } from '@grudge/shared/utils';
