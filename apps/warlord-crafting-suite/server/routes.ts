import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCharacterSchema,
  insertUnlockedSkillSchema,
  insertInventoryItemSchema,
  insertCraftedItemSchema,
  insertUnlockedRecipeSchema,
  insertShopTransactionSchema,
  insertGameSessionSchema,
  insertAfkJobSchema,
} from "@grudge/shared";
import {
  ProfessionProgression,
  ProfessionName,
  getAvailableProfessionPoints,
  DEFAULT_PROFESSION_PROGRESSION,
} from "@grudge/shared/utils";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import gameDataRoutes from "./routes/gameData";
import githubRoutes from "./routes/github";
import { fetchWeaponsFromSheet, fetchArmorFromSheet, fetchChefFromSheet, fetchItemsFromSheet, fetchCraftingFromSheet, fetchAccountsFromSheet, getAccountSheetConfigured, clearSheetsCache, getCacheStatus, appendAccountToSheet, updateAccountInSheet, isSheetWriteConfigured, getAccountSheetSchema, type AccountWriteData } from "./googleSheets";
import { syncAllSheetsToStore, syncSheetToStore, getSyncStatus, generatePuterExport, getStoredSheetData, GRUDGE_ACCOUNT_SCHEMA, generatePuterSyncCode, isValidSheetName, VALID_SHEET_NAMES } from "./puterSync";
import { queueAccountChange, flushAccountChanges, logActivity, getRecentActivity, getSyncStatus as getAccountSyncStatus, generatePuterActivityCode } from "./accountSync";

// Tier-based price multipliers
const TIER_PRICE_MULTIPLIERS: Record<number, number> = {
  1: 1,
  2: 2.5,
  3: 5,
  4: 10,
  5: 20,
  6: 40,
  7: 80,
  8: 160,
};

// T0 Universal starter recipes - basics everyone gets regardless of profession
const T0_UNIVERSAL_RECIPE_IDS = [
  'parchment', 'ink', 'simple-thread', 'blank-scroll',
];

// Profession-specific starter recipes (T0 + T1)
const PROFESSION_STARTER_RECIPES: Record<string, string[]> = {
  Miner: ['scrap-metal', 'copper-ingot', 'broken-blade', 'bloodfeud-blade'],
  Forester: ['rotted-wood', 'pine-plank', 'warped-bow', 'wraithbone-bow'],
  Mystic: ['torn-rag', 'linen-cloth', 'cracked-rod', 'emberwrath-staff'],
  Chef: ['charcoal', 'grilled-fish', 'simple-bread', 'salted-jerky'],
  Engineer: ['copper-gear', 'jammed-crossbow', 'ironveil', 'basic-trap'],
};

// Class-specific bonus recipes
const CLASS_BONUS_RECIPES: Record<string, string[]> = {
  Warrior: ['warrior-repair-kit'],
  Worg: ['worg-leather-patch'],
  Mage: ['mage-mana-vial'],
  Ranger: ['ranger-arrow-bundle'],
};

// Race-specific bonus recipes  
const RACE_BONUS_RECIPES: Record<string, string[]> = {
  Orc: ['orc-metal-salvage'],
  Elf: ['elf-lumber-efficiency'],
  Human: ['human-ink-economy'],
  Undead: ['undead-essence-transmute'],
};

function getStarterRecipeIdsForCharacter(): string[] {
  // All characters get T0 universal + ALL profession starters (since all chars can use all professions)
  const allRecipeIds = new Set<string>(T0_UNIVERSAL_RECIPE_IDS);
  
  // Add all profession recipes since all characters can use all professions
  Object.values(PROFESSION_STARTER_RECIPES).forEach(recipes => {
    recipes.forEach(id => allRecipeIds.add(id));
  });
  
  return Array.from(allRecipeIds);
}

function getClassBonusRecipeIds(classId: string): string[] {
  return CLASS_BONUS_RECIPES[classId] || [];
}

function getRaceBonusRecipeIds(raceId: string): string[] {
  return RACE_BONUS_RECIPES[raceId] || [];
}

// Calculate price for an item based on tier
function calculatePrice(basePrice: number, tier: number = 1): number {
  return Math.floor(basePrice * (TIER_PRICE_MULTIPLIERS[tier] || 1));
}

// Sell price is 30% of buy price
function calculateSellPrice(buyPrice: number): number {
  return Math.floor(buyPrice * 0.3);
}

// Zod schemas for shop operations
const buyRecipeSchema = z.object({
  characterId: z.string().min(1),
  recipeId: z.string().min(1),
  recipeName: z.string().min(1),
});

// Default recipe base prices by category (server-side authoritative)
const DEFAULT_RECIPE_PRICE = 500;
const RECIPE_PRICE_BY_CATEGORY: Record<string, number> = {
  weapon: 750,
  armor: 600,
  consumable: 400,
  material: 300,
};

const buyMaterialSchema = z.object({
  characterId: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  tier: z.number().int().min(1).max(8),
});

const sellMaterialSchema = z.object({
  characterId: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  tier: z.number().int().min(1).max(8),
});

const sellItemSchema = z.object({
  characterId: z.string().min(1),
  itemId: z.string().min(1),
});

// Server-side authoritative base prices
const MATERIAL_BASE_PRICE = 50;
const CRAFTED_ITEM_BASE_PRICE = 200;

// Tier validation helper - ensures tier is within valid range
function validateTier(tier: number): number {
  return Math.max(1, Math.min(8, Math.floor(tier)));
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// VPS auth verification — replaces local authTokens Map
const VPS_AUTH_URL = process.env.VPS_AUTH_URL || 'https://id.grudge-studio.com';

interface VpsTokenPayload {
  grudge_id: string;
  username: string;
  discord_id?: string;
  wallet_address?: string;
  puter_id?: string;
}

/** Verify a VPS JWT by calling id.grudge-studio.com/auth/verify */
async function verifyVpsToken(token: string): Promise<VpsTokenPayload | null> {
  try {
    const res = await fetch(`${VPS_AUTH_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.valid && data.user) return data.user as VpsTokenPayload;
    return null;
  } catch {
    return null;
  }
}

/** Extract userId from Bearer token via VPS verification */
async function getAuthenticatedUser(authHeader: string | undefined): Promise<VpsTokenPayload | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyVpsToken(token);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint for Kubernetes liveness and readiness probes
  app.get("/api/health", async (_req, res) => {
    try {
      // Check database connection
      const dbHealthy = await storage.healthCheck();

      if (dbHealthy) {
        res.status(200).json({
          status: "healthy",
          app: "grudge-warlords",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          services: {
            database: "operational",
            api: "operational"
          }
        });
      } else {
        res.status(503).json({
          status: "unhealthy",
          app: "grudge-warlords",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          services: {
            database: "error",
            api: "operational"
          }
        });
      }
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        app: "grudge-warlords",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Auth is now handled by VPS at id.grudge-studio.com
  // Client calls VPS directly for login/register/wallet/puter/guest
  // Server verifies VPS JWTs via getAuthenticatedUser() for protected routes

  // Admin authentication route
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: "Incorrect password" });
      }
    } catch {
      res.status(500).json({ success: false, error: "Authentication failed" });
    }
  });

  // Admin: Get all characters
  app.get("/api/admin/characters", async (_req, res) => {
    try {
      // This requires a new storage method to get all characters
      const characters = await storage.getAllCharacters();
      res.json({ success: true, count: characters.length, characters });
    } catch (error) {
      console.error("Error fetching all characters:", error);
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  // Admin: Get database statistics
  app.get("/api/admin/db-stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json({
        success: true,
        users: stats.users || 0,
        characters: stats.characters || 0,
        inventory: stats.inventory || 0,
        craftedItems: stats.craftedItems || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching DB stats:", error);
      res.status(500).json({
        error: "Failed to fetch database statistics",
        users: 0,
        characters: 0,
        inventory: 0,
        craftedItems: 0
      });
    }
  });

  // Character routes
  app.post("/api/characters", async (req, res) => {
    try {
      const data = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(data);
      
      // Auto-assign starter recipes based on class and race
      const starterRecipeIds = getStarterRecipeIdsForCharacter();
      if (starterRecipeIds.length > 0) {
        await storage.unlockRecipesBulk(character.id, starterRecipeIds, 'starter');
      }
      
      // Assign class bonus recipes
      if (character.classId) {
        const classRecipeIds = getClassBonusRecipeIds(character.classId);
        if (classRecipeIds.length > 0) {
          await storage.unlockRecipesBulk(character.id, classRecipeIds, 'class');
        }
      }
      
      // Assign race bonus recipes
      if (character.raceId) {
        const raceRecipeIds = getRaceBonusRecipeIds(character.raceId);
        if (raceRecipeIds.length > 0) {
          await storage.unlockRecipesBulk(character.id, raceRecipeIds, 'race');
        }
      }
      
      res.json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Failed to create character:", error);
        res.status(500).json({ error: "Failed to create character" });
      }
    }
  });

  app.get("/api/characters/:id", async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch character" });
    }
  });

  app.get("/api/characters", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const characters = await storage.getCharactersByUserId(userId);
      res.json(characters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    try {
      const character = await storage.updateCharacter(req.params.id, req.body);
      res.json(character);
    } catch (error) {
      res.status(500).json({ error: "Failed to update character" });
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      await storage.deleteCharacter(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete character" });
    }
  });

  // Skill routes
  app.post("/api/skills/unlock", async (req, res) => {
    try {
      const data = insertUnlockedSkillSchema.parse(req.body);
      const professionName = data.profession as ProfessionName;
      
      // Check if already unlocked
      const isUnlocked = await storage.isSkillUnlocked(data.characterId, data.nodeId);
      if (isUnlocked) {
        return res.status(400).json({ error: "Skill already unlocked" });
      }

      // Get character and check profession-specific skill points
      const character = await storage.getCharacter(data.characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Get profession progression data
      const professionProgression = (character.professionProgression as ProfessionProgression) || DEFAULT_PROFESSION_PROGRESSION;
      const professionData = professionProgression[professionName] || { level: 1, xp: 0, pointsSpent: 0 };
      const availablePoints = getAvailableProfessionPoints(professionData);

      if (availablePoints < 1) {
        return res.status(400).json({ error: `Not enough ${professionName} skill points` });
      }

      // Unlock skill and increment points spent for this profession
      const skill = await storage.unlockSkill(data);
      
      // Update the profession progression to track the spent point
      const updatedProgression = {
        ...professionProgression,
        [professionName]: {
          ...professionData,
          pointsSpent: professionData.pointsSpent + 1,
        },
      };
      
      await storage.updateCharacter(data.characterId, {
        professionProgression: updatedProgression,
      });

      res.json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Failed to unlock skill:", error);
        res.status(500).json({ error: "Failed to unlock skill" });
      }
    }
  });

  app.get("/api/skills/:characterId", async (req, res) => {
    try {
      const skills = await storage.getUnlockedSkills(req.params.characterId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unlocked skills" });
    }
  });

  // Inventory routes
  app.get("/api/inventory/:characterId", async (req, res) => {
    try {
      const inventory = await storage.getInventory(req.params.characterId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const data = insertInventoryItemSchema.parse(req.body);
      const item = await storage.addInventoryItem(data);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to add inventory item" });
      }
    }
  });

  app.patch("/api/inventory/:characterId/:itemName", async (req, res) => {
    try {
      const { quantity } = req.body;
      const item = await storage.updateInventoryQuantity(
        req.params.characterId,
        req.params.itemName,
        quantity
      );
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  });

  // Crafted items routes
  app.get("/api/crafted-items/:characterId", async (req, res) => {
    try {
      const items = await storage.getCraftedItems(req.params.characterId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crafted items" });
    }
  });

  app.post("/api/crafted-items", async (req, res) => {
    try {
      const data = insertCraftedItemSchema.parse(req.body);
      const item = await storage.createCraftedItem(data);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create crafted item" });
      }
    }
  });

  app.patch("/api/crafted-items/:id", async (req, res) => {
    try {
      const item = await storage.updateCraftedItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update crafted item" });
    }
  });

  app.post("/api/crafted-items/:id/equip", async (req, res) => {
    try {
      const { characterId } = req.body;
      const item = await storage.equipItem(characterId, req.params.id);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to equip item" });
    }
  });

  app.delete("/api/crafted-items/:id", async (req, res) => {
    try {
      await storage.deleteCraftedItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete crafted item" });
    }
  });

  // ============================================
  // CRAFTING JOBS (AFK Crafting Queue)
  // ============================================
  
  // Get all crafting jobs for a character
  app.get("/api/crafting-jobs/:characterId", async (req, res) => {
    try {
      const jobs = await storage.getCraftingJobs(req.params.characterId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crafting jobs" });
    }
  });

  // Get completed jobs ready to claim
  app.get("/api/crafting-jobs/:characterId/completed", async (req, res) => {
    try {
      const jobs = await storage.getCompletedJobs(req.params.characterId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch completed jobs" });
    }
  });

  // Start a new crafting job (AFK crafting)
  app.post("/api/crafting-jobs", async (req, res) => {
    try {
      const { characterId, recipeId, quantity, duration, inputItems, stationInstanceId, profession, tier } = req.body;
      
      // Validate character exists
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Calculate completion time
      const startedAt = new Date();
      const completesAt = new Date(startedAt.getTime() + (duration * 1000));

      const job = await storage.createCraftingJob({
        characterId,
        recipeId,
        quantity: quantity || 1,
        duration,
        completesAt,
        status: 'pending',
        inputItems: inputItems || [],
        stationInstanceId: stationInstanceId || null,
        profession: profession || null,
        tier: tier || 0,
      });

      res.json(job);
    } catch (error) {
      console.error("Error creating crafting job:", error);
      res.status(500).json({ error: "Failed to start crafting job" });
    }
  });

  // XP awarded per tier when crafting
  const CRAFT_XP_BY_TIER: Record<number, number> = {
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

  // XP required to level up profession (scales exponentially)
  function getXpForProfessionLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // Claim a completed crafting job
  app.post("/api/crafting-jobs/:id/claim", async (req, res) => {
    try {
      const job = await storage.getCraftingJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if job is completed
      const now = new Date();
      if (new Date(job.completesAt) > now) {
        return res.status(400).json({ error: "Job not yet completed" });
      }

      if (job.status === 'claimed') {
        return res.status(400).json({ error: "Job already claimed" });
      }

      // Award XP to profession if applicable
      if (job.profession && job.profession !== 'All') {
        const character = await storage.getCharacter(job.characterId);
        if (character) {
          const professionProgress = (character.professionProgression || DEFAULT_PROFESSION_PROGRESSION) as ProfessionProgression;
          const profName = job.profession as ProfessionName;
          
          if (professionProgress[profName]) {
            const currentEntry = professionProgress[profName];
            const xpGained = (CRAFT_XP_BY_TIER[job.tier || 0] || 10) * (job.quantity || 1);
            let newXp = currentEntry.xp + xpGained;
            let newLevel = currentEntry.level;
            
            // Check for level ups
            let xpNeeded = getXpForProfessionLevel(newLevel);
            while (newXp >= xpNeeded && newLevel < 100) {
              newXp -= xpNeeded;
              newLevel++;
              xpNeeded = getXpForProfessionLevel(newLevel);
            }
            
            // Update profession progression
            const updatedProgression = {
              ...professionProgress,
              [profName]: {
                ...currentEntry,
                level: newLevel,
                xp: newXp,
              }
            };
            
            await storage.updateCharacter(job.characterId, {
              professionProgression: updatedProgression
            });
          }
        }
      }

      // Mark job as claimed
      const claimedJob = await storage.claimCraftingJob(req.params.id);
      
      res.json(claimedJob);
    } catch (error) {
      console.error("Error claiming crafting job:", error);
      res.status(500).json({ error: "Failed to claim crafting job" });
    }
  });

  // Cancel a crafting job
  app.delete("/api/crafting-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getCraftingJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Only allow cancelling pending jobs
      if (job.status !== 'pending') {
        return res.status(400).json({ error: "Cannot cancel this job" });
      }

      await storage.deleteCraftingJob(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel crafting job" });
    }
  });

  // Crafting route (validates recipe and consumes materials)
  app.post("/api/craft", async (req, res) => {
    try {
      const { characterId, itemName, profession, recipe } = req.body;

      // Get character
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Check gold cost
      if (recipe.goldCost && character.gold < recipe.goldCost) {
        return res.status(400).json({ error: "Not enough gold" });
      }

      // Check materials
      const inventory = await storage.getInventory(characterId);
      for (const material of recipe.materials || []) {
        const inventoryItem = inventory.find((i) => i.itemName === material.name);
        if (!inventoryItem || inventoryItem.quantity < material.quantity) {
          return res.status(400).json({ error: `Not enough ${material.name}` });
        }
      }

      // Consume gold
      if (recipe.goldCost) {
        await storage.updateCharacter(characterId, {
          gold: character.gold - recipe.goldCost,
        });
      }

      // Consume materials
      for (const material of recipe.materials || []) {
        const inventoryItem = inventory.find((i) => i.itemName === material.name);
        if (inventoryItem) {
          await storage.updateInventoryQuantity(
            characterId,
            material.name,
            inventoryItem.quantity - material.quantity
          );
        }
      }

      // Create crafted item
      const craftedItem = await storage.createCraftedItem({
        characterId,
        itemName,
        profession,
        itemType: recipe.itemType || "weapon",
        tier: 1,
        equipped: false,
      });

      res.json(craftedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to craft item" });
    }
  });

  // Upgrade route (handles tier upgrades with costs)
  app.post("/api/upgrade", async (req, res) => {
    try {
      const { characterId, itemId, upgradeCost } = req.body;

      // Get character and item
      const character = await storage.getCharacter(characterId);
      const item = await storage.getCraftedItem(itemId);

      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Check gold cost
      if (character.gold < upgradeCost.gold) {
        return res.status(400).json({ error: "Not enough gold" });
      }

      // Check essences
      const inventory = await storage.getInventory(characterId);
      for (const [essenceName, quantity] of Object.entries(upgradeCost.essences || {})) {
        const inventoryItem = inventory.find((i) => i.itemName === essenceName);
        if (!inventoryItem || inventoryItem.quantity < (quantity as number)) {
          return res.status(400).json({ error: `Not enough ${essenceName}` });
        }
      }

      // Consume gold
      await storage.updateCharacter(characterId, {
        gold: character.gold - upgradeCost.gold,
      });

      // Consume essences
      for (const [essenceName, quantity] of Object.entries(upgradeCost.essences || {})) {
        const inventoryItem = inventory.find((i) => i.itemName === essenceName);
        if (inventoryItem) {
          await storage.updateInventoryQuantity(
            characterId,
            essenceName,
            inventoryItem.quantity - (quantity as number)
          );
        }
      }

      // Upgrade item tier
      const upgradedItem = await storage.updateCraftedItem(itemId, {
        tier: item.tier + 1,
      });

      res.json(upgradedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to upgrade item" });
    }
  });

  // ==================== SHOP ROUTES ====================

  // Get unlocked recipes for a character
  app.get("/api/recipes/:characterId", async (req, res) => {
    try {
      const recipes = await storage.getUnlockedRecipes(req.params.characterId);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unlocked recipes" });
    }
  });

  // Buy a recipe
  app.post("/api/shop/buy-recipe", async (req, res) => {
    try {
      const validated = buyRecipeSchema.parse(req.body);
      const { characterId, recipeId, recipeName } = validated;

      // Get character
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Check if already unlocked
      const isUnlocked = await storage.isRecipeUnlocked(characterId, recipeId);
      if (isUnlocked) {
        return res.status(400).json({ error: "Recipe already unlocked" });
      }

      // Server-side price calculation (authoritative)
      // Extract category from recipeId (format: "recipe-{category}-{name}")
      const recipeCategory = recipeId.includes("weapon") ? "weapon" 
        : recipeId.includes("armor") ? "armor"
        : recipeId.includes("potion") || recipeId.includes("food") ? "consumable"
        : "material";
      const price = RECIPE_PRICE_BY_CATEGORY[recipeCategory] || DEFAULT_RECIPE_PRICE;

      // Check gold
      if (character.gold < price) {
        return res.status(400).json({ error: "Not enough gold" });
      }

      // Deduct gold
      await storage.updateCharacter(characterId, {
        gold: character.gold - price,
      });

      // Unlock recipe
      const unlocked = await storage.unlockRecipe({
        characterId,
        recipeId,
      });

      // Log transaction
      await storage.createShopTransaction({
        characterId,
        transactionType: "buy",
        itemCategory: "recipe",
        itemId: recipeId,
        itemName: recipeName,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
        tier: null,
      });

      res.json({ success: true, unlocked, newGold: character.gold - price });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Buy recipe error:", error);
        res.status(500).json({ error: "Failed to buy recipe" });
      }
    }
  });

  // Buy materials/resources
  app.post("/api/shop/buy-material", async (req, res) => {
    try {
      const validated = buyMaterialSchema.parse(req.body);
      const { characterId, itemId, itemName, quantity, tier } = validated;

      // Get character
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Validate tier is within bounds (1-8)
      const validatedTier = validateTier(tier);

      // Server-side price calculation (authoritative)
      const unitPrice = calculatePrice(MATERIAL_BASE_PRICE, validatedTier);
      const totalPrice = unitPrice * quantity;

      // Check gold
      if (character.gold < totalPrice) {
        return res.status(400).json({ error: "Not enough gold" });
      }

      // Deduct gold
      await storage.updateCharacter(characterId, {
        gold: character.gold - totalPrice,
      });

      // Add to inventory
      await storage.addInventoryItem({
        characterId,
        itemType: "material",
        itemName,
        quantity,
      });

      // Log transaction
      await storage.createShopTransaction({
        characterId,
        transactionType: "buy",
        itemCategory: "material",
        itemId,
        itemName,
        quantity,
        unitPrice,
        totalPrice,
        tier,
      });

      res.json({ success: true, newGold: character.gold - totalPrice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Buy material error:", error);
        res.status(500).json({ error: "Failed to buy material" });
      }
    }
  });

  // Sell materials/resources
  app.post("/api/shop/sell-material", async (req, res) => {
    try {
      const validated = sellMaterialSchema.parse(req.body);
      const { characterId, itemName, quantity, tier } = validated;

      // Get character
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Get inventory item
      const inventoryItem = await storage.getInventoryItem(characterId, itemName);
      if (!inventoryItem || inventoryItem.quantity < quantity) {
        return res.status(400).json({ error: "Not enough items to sell" });
      }

      // Validate tier is within bounds (1-8)
      const validatedTier = validateTier(tier);

      // Server-side price calculation (authoritative)
      const buyPrice = calculatePrice(MATERIAL_BASE_PRICE, validatedTier);
      const unitPrice = calculateSellPrice(buyPrice);
      const totalPrice = unitPrice * quantity;

      // Add gold
      await storage.updateCharacter(characterId, {
        gold: character.gold + totalPrice,
      });

      // Remove from inventory
      const newQuantity = inventoryItem.quantity - quantity;
      if (newQuantity <= 0) {
        await storage.removeInventoryItem(inventoryItem.id);
      } else {
        await storage.updateInventoryQuantity(characterId, itemName, newQuantity);
      }

      // Log transaction
      await storage.createShopTransaction({
        characterId,
        transactionType: "sell",
        itemCategory: "material",
        itemId: itemName,
        itemName,
        quantity,
        unitPrice,
        totalPrice,
        tier,
      });

      res.json({ success: true, newGold: character.gold + totalPrice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Sell material error:", error);
        res.status(500).json({ error: "Failed to sell material" });
      }
    }
  });

  // Sell crafted items (weapons, armor, potions)
  app.post("/api/shop/sell-item", async (req, res) => {
    try {
      const validated = sellItemSchema.parse(req.body);
      const { characterId, itemId } = validated;

      // Get character
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Get crafted item
      const item = await storage.getCraftedItem(itemId);
      if (!item || item.characterId !== characterId) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Server-side price calculation (authoritative)
      const buyPrice = calculatePrice(CRAFTED_ITEM_BASE_PRICE, item.tier);
      const sellPrice = calculateSellPrice(buyPrice);

      // Add gold
      await storage.updateCharacter(characterId, {
        gold: character.gold + sellPrice,
      });

      // Delete item
      await storage.deleteCraftedItem(itemId);

      // Log transaction
      await storage.createShopTransaction({
        characterId,
        transactionType: "sell",
        itemCategory: item.itemType,
        itemId: item.id,
        itemName: item.itemName,
        quantity: 1,
        unitPrice: sellPrice,
        totalPrice: sellPrice,
        tier: item.tier,
      });

      res.json({ success: true, newGold: character.gold + sellPrice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Sell item error:", error);
        res.status(500).json({ error: "Failed to sell item" });
      }
    }
  });

  // Get shop transaction history
  app.get("/api/shop/transactions/:characterId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getShopTransactions(req.params.characterId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // ============================================
  // Google Sheets Sync Endpoints
  // ============================================

  // Fetch weapons from Google Sheet
  app.get("/api/sheets/weapons", async (_req, res) => {
    try {
      const weapons = await fetchWeaponsFromSheet();
      res.json({ success: true, count: weapons.length, data: weapons });
    } catch (error) {
      console.error("Error fetching weapons from sheet:", error);
      res.status(500).json({ error: "Failed to fetch weapons from Google Sheet" });
    }
  });

  // Fetch armor from Google Sheet
  app.get("/api/sheets/armor", async (_req, res) => {
    try {
      const armor = await fetchArmorFromSheet();
      res.json({ success: true, count: armor.length, data: armor });
    } catch (error) {
      console.error("Error fetching armor from sheet:", error);
      res.status(500).json({ error: "Failed to fetch armor from Google Sheet" });
    }
  });

  // Fetch chef items from Google Sheet
  app.get("/api/sheets/chef", async (_req, res) => {
    try {
      const chef = await fetchChefFromSheet();
      res.json({ success: true, count: chef.length, data: chef });
    } catch (error) {
      console.error("Error fetching chef from sheet:", error);
      res.status(500).json({ error: "Failed to fetch chef data from Google Sheet" });
    }
  });

  // Fetch items from Google Sheet
  app.get("/api/sheets/items", async (_req, res) => {
    try {
      const items = await fetchItemsFromSheet();
      res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      console.error("Error fetching items from sheet:", error);
      res.status(500).json({ error: "Failed to fetch items from Google Sheet" });
    }
  });

  // Fetch crafting recipes from Google Sheet
  app.get("/api/sheets/crafting", async (_req, res) => {
    try {
      const crafting = await fetchCraftingFromSheet();
      res.json({ success: true, count: crafting.length, data: crafting });
    } catch (error) {
      console.error("Error fetching crafting from sheet:", error);
      res.status(500).json({ error: "Failed to fetch crafting recipes from Google Sheet" });
    }
  });

  // Fetch accounts from Google Sheet (for cross-app account sharing)
  app.get("/api/sheets/accounts", async (_req, res) => {
    try {
      if (!getAccountSheetConfigured()) {
        return res.status(404).json({ 
          success: false, 
          error: "GOOGLE_SHEET_ACCOUNT not configured",
          configured: false 
        });
      }
      const accounts = await fetchAccountsFromSheet();
      res.json({ success: true, count: accounts.length, data: accounts });
    } catch (error) {
      console.error("Error fetching accounts from sheet:", error);
      res.status(500).json({ error: "Failed to fetch accounts from Google Sheet" });
    }
  });

  // Get specific account by ID from Google Sheet
  app.get("/api/sheets/accounts/:id", async (req, res) => {
    try {
      if (!getAccountSheetConfigured()) {
        return res.status(404).json({ 
          success: false, 
          error: "GOOGLE_SHEET_ACCOUNT not configured",
          configured: false 
        });
      }
      const accounts = await fetchAccountsFromSheet();
      const account = accounts.find(a => a.id === req.params.id);
      if (!account) {
        return res.status(404).json({ success: false, error: "Account not found in sheet" });
      }
      res.json({ success: true, data: account });
    } catch (error) {
      console.error("Error fetching account from sheet:", error);
      res.status(500).json({ error: "Failed to fetch account from Google Sheet" });
    }
  });

  // Get account schema for Google Sheet structure
  app.get("/api/sheets/accounts/schema", async (_req, res) => {
    const schema = getAccountSheetSchema();
    res.json({ 
      success: true, 
      writeConfigured: isSheetWriteConfigured(),
      ...schema 
    });
  });

  // Sync account to Google Sheet (create new row)
  app.post("/api/sheets/accounts/sync", async (req, res) => {
    try {
      if (!isSheetWriteConfigured()) {
        return res.status(400).json({ 
          success: false, 
          error: "Sheet write not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON secret.",
          configured: false 
        });
      }

      const { id, username, email, displayName, puterId, avatarUrl, isPremium, premiumUntil, createdAt, lastLoginAt, settings } = req.body;
      
      if (!id || !username) {
        return res.status(400).json({ success: false, error: "id and username are required" });
      }

      const accountData: AccountWriteData = {
        id,
        username,
        email,
        displayName,
        puterId,
        avatarUrl,
        isPremium: isPremium === true || isPremium === 'TRUE',
        premiumUntil,
        createdAt: createdAt || new Date().toISOString(),
        lastLoginAt: lastLoginAt || new Date().toISOString(),
        settings,
      };

      const result = await appendAccountToSheet(accountData);
      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json({ success: true, message: "Account synced to sheet" });
    } catch (error) {
      console.error("Error syncing account to sheet:", error);
      res.status(500).json({ error: "Failed to sync account to Google Sheet" });
    }
  });

  // Update account in Google Sheet
  app.patch("/api/sheets/accounts/:id", async (req, res) => {
    try {
      if (!isSheetWriteConfigured()) {
        return res.status(400).json({ 
          success: false, 
          error: "Sheet write not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON secret.",
          configured: false 
        });
      }

      const accountId = req.params.id;
      const updates: Partial<AccountWriteData> = req.body;

      const result = await updateAccountInSheet(accountId, updates);
      if (!result.success) {
        return res.status(result.error?.includes('not found') ? 404 : 500).json(result);
      }

      res.json({ success: true, message: "Account updated in sheet" });
    } catch (error) {
      console.error("Error updating account in sheet:", error);
      res.status(500).json({ error: "Failed to update account in Google Sheet" });
    }
  });

  // Get cache status for sheets
  app.get("/api/sheets/status", async (_req, res) => {
    try {
      const status = getCacheStatus();
      res.json({
        success: true,
        weaponsConfigured: !!process.env.GOOGLE_SHEET_WEAPONS,
        armorConfigured: !!process.env.GOOGLE_SHEET_ARMOR,
        chefConfigured: !!process.env.GOOGLE_SHEET_CHEF,
        itemsConfigured: !!process.env.GOOGLE_SHEET_ITEMS,
        accountsConfigured: getAccountSheetConfigured(),
        cache: status,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get sheet status" });
    }
  });

  // Force refresh cache
  app.post("/api/sheets/refresh", async (_req, res) => {
    try {
      clearSheetsCache();
      const [weapons, armor, chef, items] = await Promise.all([
        fetchWeaponsFromSheet(),
        fetchArmorFromSheet(),
        fetchChefFromSheet(),
        fetchItemsFromSheet(),
      ]);
      res.json({
        success: true,
        weapons: { count: weapons.length },
        armor: { count: armor.length },
        chef: { count: chef.length },
        items: { count: items.length },
      });
    } catch (error) {
      console.error("Error refreshing sheets:", error);
      res.status(500).json({ error: "Failed to refresh sheets" });
    }
  });

  // ============================================
  // PUTER CLOUD STORAGE SYNC ENDPOINTS
  // ============================================

  // Get full export for Puter FS storage
  app.get("/api/puter/export", async (_req, res) => {
    try {
      const exportData = await generatePuterExport();
      res.json(exportData);
    } catch (error) {
      console.error("Error generating Puter export:", error);
      res.status(500).json({ error: "Failed to generate export" });
    }
  });

  // Sync all sheets to store
  app.post("/api/puter/sync", async (_req, res) => {
    try {
      const result = await syncAllSheetsToStore();
      res.json(result);
    } catch (error) {
      console.error("Error syncing to Puter store:", error);
      res.status(500).json({ error: "Failed to sync sheets" });
    }
  });

  // Sync single sheet
  app.post("/api/puter/sync/:sheetName", async (req, res) => {
    try {
      const { sheetName } = req.params;
      
      // Validate sheet name
      if (!isValidSheetName(sheetName)) {
        return res.status(400).json({ 
          error: `Invalid sheet name: ${sheetName}`, 
          validNames: VALID_SHEET_NAMES 
        });
      }
      
      const result = await syncSheetToStore(sheetName);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error) {
      console.error("Error syncing sheet:", error);
      res.status(500).json({ error: "Failed to sync sheet" });
    }
  });

  // Get sync status
  app.get("/api/puter/status", async (_req, res) => {
    try {
      const status = getSyncStatus();
      res.json({
        success: true,
        ...status,
        puterCloudUrl: process.env.PUTER_CLOUD_URL || null,
        puterAppId: process.env.PUTER_APP_ID || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });

  // Get stored sheet data (after sync)
  app.get("/api/puter/sheets/:sheetName", async (req, res) => {
    try {
      const { sheetName } = req.params;
      
      // Validate sheet name
      if (!isValidSheetName(sheetName)) {
        return res.status(400).json({ 
          error: `Invalid sheet name: ${sheetName}`, 
          validNames: VALID_SHEET_NAMES 
        });
      }
      
      let data = getStoredSheetData(sheetName);
      
      // If not cached, sync first
      if (!data) {
        const syncResult = await syncSheetToStore(sheetName);
        if (!syncResult.success) {
          return res.status(500).json({ error: syncResult.error });
        }
        data = getStoredSheetData(sheetName);
      }
      
      res.json(data || []);
    } catch (error) {
      console.error("Error getting stored sheet:", error);
      res.status(500).json({ error: "Failed to get sheet data" });
    }
  });

  // Get GrudgeAccount schema
  app.get("/api/puter/account-schema", async (_req, res) => {
    res.json(GRUDGE_ACCOUNT_SCHEMA);
  });

  // Get client-side sync code for Puter apps
  app.get("/api/puter/sync-client.js", async (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(generatePuterSyncCode());
  });

  // ============================================
  // ACCOUNT SYNC WITH SHA CHANGE DETECTION
  // ============================================

  // Queue account update (with SHA-based change detection)
  app.post("/api/sync/account", async (req, res) => {
    try {
      const { accountId, data, isNew } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ error: "accountId is required" });
      }
      
      const result = queueAccountChange(accountId, data, isNew);
      res.json(result);
    } catch (error) {
      console.error("Error queuing account change:", error);
      res.status(500).json({ error: "Failed to queue account change" });
    }
  });

  // Force flush pending account changes
  app.post("/api/sync/flush", async (_req, res) => {
    try {
      const result = await flushAccountChanges();
      res.json(result);
    } catch (error) {
      console.error("Error flushing account changes:", error);
      res.status(500).json({ error: "Failed to flush changes" });
    }
  });

  // Log activity event
  app.post("/api/sync/activity", async (req, res) => {
    try {
      const { accountId, action, details } = req.body;
      
      if (!accountId || !action) {
        return res.status(400).json({ error: "accountId and action are required" });
      }
      
      const validActions = ['item_acquired', 'item_sold', 'equipment_changed', 'inventory_update', 'skill_unlocked', 'level_up'];
      if (!validActions.includes(action)) {
        return res.status(400).json({ error: `Invalid action. Valid: ${validActions.join(', ')}` });
      }
      
      logActivity(accountId, action, details || {});
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging activity:", error);
      res.status(500).json({ error: "Failed to log activity" });
    }
  });

  // Get recent activity
  app.get("/api/sync/activity/:accountId?", async (req, res) => {
    try {
      const { accountId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const activities = getRecentActivity(accountId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error getting activity:", error);
      res.status(500).json({ error: "Failed to get activity" });
    }
  });

  // Get account sync status
  app.get("/api/sync/status", async (_req, res) => {
    try {
      const accountSync = getAccountSyncStatus();
      const puterSync = getSyncStatus();
      
      res.json({
        accountSync,
        puterSync,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });

  // Get Puter activity logging code for client
  app.get("/api/sync/activity-client.js", async (req, res) => {
    const accountId = req.query.accountId as string || 'USER_ACCOUNT_ID';
    res.setHeader('Content-Type', 'application/javascript');
    res.send(generatePuterActivityCode(accountId));
  });

  // ============================================
  // HOME ISLAND TERRAIN GENERATION (Server-side)
  // ============================================

  const TERRAIN_TYPES = {
    WATER: 0,
    SAND: 1,
    GRASS: 2,
    FOREST: 3,
    ROCK: 4,
    BUILDABLE: 5,
  };

  function seededNoise(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  function generateTerrainServerSide(width: number, height: number, seed: number): number[][] {
    const terrain: number[][] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const islandRadius = Math.min(centerX, centerY) * 0.7;
    
    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const noise = seededNoise(x, y, seed);
        const falloff = 1 - (distance / islandRadius);
        const value = falloff + (noise - 0.5) * 0.4;
        
        if (value < 0) {
          terrain[y][x] = TERRAIN_TYPES.WATER;
        } else if (value < 0.15) {
          terrain[y][x] = TERRAIN_TYPES.SAND;
        } else if (value < 0.4) {
          terrain[y][x] = TERRAIN_TYPES.GRASS;
        } else if (value < 0.7) {
          terrain[y][x] = TERRAIN_TYPES.FOREST;
        } else {
          terrain[y][x] = TERRAIN_TYPES.ROCK;
        }
        
        if (value >= 0.2 && value < 0.5 && distance < islandRadius * 0.5) {
          terrain[y][x] = TERRAIN_TYPES.BUILDABLE;
        }
      }
    }
    
    return terrain;
  }

  function generateHarvestNodesServerSide(terrain: number[][], width: number, height: number): any[] {
    const nodes: any[] = [];
    
    for (let i = 0; i < 20; i++) {
      const gridX = Math.floor(Math.random() * width);
      const gridY = Math.floor(Math.random() * height);
      const terrainType = terrain[gridY]?.[gridX];
      
      if (terrainType !== undefined && terrainType !== TERRAIN_TYPES.WATER) {
        let nodeType = 'herbs';
        if (terrainType === TERRAIN_TYPES.ROCK) nodeType = 'ore';
        else if (terrainType === TERRAIN_TYPES.FOREST) nodeType = 'wood';
        else if (terrainType === TERRAIN_TYPES.SAND) nodeType = 'fish';
        
        nodes.push({
          id: `node-${i}`,
          type: nodeType,
          gridX,
          gridY,
          respawnTime: 300,
        });
      }
    }
    
    return nodes;
  }

  // ============================================
  // HOME ISLAND API ROUTES
  // ============================================

  // Get or initialize home island for a character
  app.get("/api/home-island", async (req, res) => {
    try {
      const characterId = req.query.characterId as string;
      const authHeader = req.headers.authorization;
      
      if (!characterId) {
        return res.status(400).json({ error: "characterId is required" });
      }

      // Get character to find userId
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Auth check: verify requesting user owns this character
      const vpsUser = await getAuthenticatedUser(authHeader);
      const authenticatedUserId = vpsUser?.grudge_id || null;
      
      // Verify ownership (allow if character has no userId or if userId matches authenticated user)
      if (character.userId && authenticatedUserId && character.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to access this character's island" });
      }

      // Get user to check hasHomeIsland flag
      const user = character.userId ? await storage.getUser(character.userId) : null;
      const hasHomeIsland = user?.hasHomeIsland || false;

      // Get existing island if user has one
      let island = null;
      if (hasHomeIsland && character.userId) {
        const islands = await storage.getIslandsByUserId(character.userId);
        island = islands.find(i => i.islandType === 'home') || null;
      }

      // If no island yet, generate seed for new island (client will generate terrain from seed)
      const islandSeed = island?.seed || (Date.now() + Math.floor(Math.random() * 1000000));

      res.json({
        island,
        hasHomeIsland,
        isNew: !hasHomeIsland,
        seed: islandSeed,
      });
    } catch (error) {
      console.error("Error fetching home island:", error);
      res.status(500).json({ error: "Failed to fetch home island" });
    }
  });

  // Confirm camp placement and save island
  app.post("/api/home-island/confirm", async (req, res) => {
    try {
      const { characterId, islandName, campPosition, terrain, harvestNodes, seed, width, height } = req.body;
      const authHeader = req.headers.authorization;

      if (!characterId || !campPosition) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Auth check: get authenticated user from VPS token
      const vpsUser = await getAuthenticatedUser(authHeader);
      const authenticatedUserId = vpsUser?.grudge_id || null;

      // Verify character exists and get its owner
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Derive userId from character (don't trust client-provided userId)
      const userId = character.userId;
      if (!userId) {
        return res.status(400).json({ error: "Character has no associated user" });
      }

      // Verify authenticated user owns this character
      if (authenticatedUserId && userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to create island for this character" });
      }

      // Check if user already has a home island
      const user = await storage.getUser(userId);
      if (user?.hasHomeIsland) {
        return res.status(400).json({ error: "User already has a home island" });
      }

      // Generate terrain server-side if not provided
      const islandSeed = seed || Date.now();
      const islandWidth = width || 130;
      const islandHeight = height || 105;
      
      let finalTerrain = terrain;
      let finalHarvestNodes = harvestNodes;
      
      // If terrain not provided or empty, generate server-side
      if (!finalTerrain || finalTerrain.length === 0) {
        finalTerrain = generateTerrainServerSide(islandWidth, islandHeight, islandSeed);
        finalHarvestNodes = generateHarvestNodesServerSide(finalTerrain, islandWidth, islandHeight);
      }

      // Create the island with full terrain data
      const island = await storage.createIsland({
        userId,
        name: islandName || `${character.name}'s Island`,
        islandType: 'home',
        seed: islandSeed,
        width: islandWidth,
        height: islandHeight,
        terrain: finalTerrain,
        buildings: [
          {
            id: `camp-${Date.now()}`,
            type: 'camp',
            gridX: campPosition.x,
            gridY: campPosition.y,
            worldX: campPosition.x * 32 + 16,
            worldY: campPosition.y * 32 + 16,
          }
        ],
        harvestNodes: finalHarvestNodes || [],
        campPosition,
        data: {},
      });

      // Update user's hasHomeIsland flag
      await storage.updateUser(userId, { hasHomeIsland: true });

      res.json({
        success: true,
        island,
        message: "Home island created successfully!",
      });
    } catch (error) {
      console.error("Error confirming home island:", error);
      res.status(500).json({ error: "Failed to create home island" });
    }
  });

  // Update island (save buildings, etc.)
  app.patch("/api/home-island/:islandId", async (req, res) => {
    try {
      const { islandId } = req.params;
      const { buildings, harvestNodes, data } = req.body;

      const island = await storage.getIsland(islandId);
      if (!island) {
        return res.status(404).json({ error: "Island not found" });
      }

      const updatedIsland = await storage.updateIsland(islandId, {
        buildings: buildings !== undefined ? buildings : island.buildings,
        harvestNodes: harvestNodes !== undefined ? harvestNodes : island.harvestNodes,
        data: data !== undefined ? { ...(island.data as object || {}), ...data } : island.data,
        lastVisited: new Date(),
      });

      res.json({ success: true, island: updatedIsland });
    } catch (error) {
      console.error("Error updating island:", error);
      res.status(500).json({ error: "Failed to update island" });
    }
  });

  // ============================================
  // AI AGENT API ROUTES (with auth)
  // ============================================

  // Helper: validate VPS JWT and get userId
  const getAuthenticatedUserId = async (authHeader: string | undefined): Promise<string | null> => {
    const user = await getAuthenticatedUser(authHeader);
    return user?.grudge_id || null;
  };

  // Get AI agents for authenticated user
  app.get("/api/ai-agents", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { islandId } = req.query;
      
      if (islandId) {
        // Verify island ownership
        const island = await storage.getIsland(islandId as string);
        if (!island || island.userId !== authenticatedUserId) {
          return res.status(403).json({ error: "Not authorized to access this island's agents" });
        }
        const agents = await storage.getAiAgentsByIslandId(islandId as string);
        return res.json(agents);
      }
      
      // Default: get user's agents
      const agents = await storage.getAiAgentsByUserId(authenticatedUserId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching AI agents:", error);
      res.status(500).json({ error: "Failed to fetch AI agents" });
    }
  });

  // Get single AI agent (with ownership check)
  app.get("/api/ai-agents/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const agent = await storage.getAiAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "AI agent not found" });
      }

      // Verify ownership
      if (agent.userId && agent.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to access this agent" });
      }

      res.json(agent);
    } catch (error) {
      console.error("Error fetching AI agent:", error);
      res.status(500).json({ error: "Failed to fetch AI agent" });
    }
  });

  // Create AI agent (with auth and validation)
  app.post("/api/ai-agents", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { 
        characterId, islandId, name, agentType,
        personality, systemPrompt, temperature, maxTokens,
        gameKnowledge, behaviorFlags, units, memory
      } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "name is required" });
      }
      if (!personality || typeof personality !== 'string') {
        return res.status(400).json({ error: "personality is required" });
      }
      if (!systemPrompt || typeof systemPrompt !== 'string') {
        return res.status(400).json({ error: "systemPrompt is required" });
      }

      // Verify island ownership if provided
      if (islandId) {
        const island = await storage.getIsland(islandId);
        if (!island || island.userId !== authenticatedUserId) {
          return res.status(403).json({ error: "Not authorized to create agent for this island" });
        }
      }

      // Verify character ownership if provided
      if (characterId) {
        const character = await storage.getCharacter(characterId);
        if (!character || character.userId !== authenticatedUserId) {
          return res.status(403).json({ error: "Not authorized to create agent for this character" });
        }
      }

      const agent = await storage.createAiAgent({
        userId: authenticatedUserId, // Always use authenticated user
        characterId,
        islandId,
        name: name.trim(),
        agentType: agentType || 'npc',
        personality,
        systemPrompt,
        temperature: typeof temperature === 'number' ? Math.min(100, Math.max(10, temperature)) : 70,
        maxTokens: typeof maxTokens === 'number' ? Math.min(500, Math.max(50, maxTokens)) : 150,
        gameKnowledge: Array.isArray(gameKnowledge) ? gameKnowledge : [],
        behaviorFlags: behaviorFlags || { canHarvest: true, canBuild: true, canExplore: true },
        units: Array.isArray(units) ? units : [],
        memory: memory || { shortTerm: [], longTerm: [], goals: [] },
        status: 'idle',
      });

      res.json(agent);
    } catch (error) {
      console.error("Error creating AI agent:", error);
      res.status(500).json({ error: "Failed to create AI agent" });
    }
  });

  // Update AI agent (with ownership check)
  app.patch("/api/ai-agents/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const agent = await storage.getAiAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "AI agent not found" });
      }

      // Verify ownership
      if (agent.userId && agent.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to update this agent" });
      }

      const updates = req.body;
      if (updates.lastActionAt === 'now') {
        updates.lastActionAt = new Date();
      }
      // Prevent userId modification
      delete updates.userId;

      const updatedAgent = await storage.updateAiAgent(req.params.id, updates);
      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating AI agent:", error);
      res.status(500).json({ error: "Failed to update AI agent" });
    }
  });

  // Delete AI agent (with ownership check)
  app.delete("/api/ai-agents/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const agent = await storage.getAiAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "AI agent not found" });
      }

      // Verify ownership
      if (agent.userId && agent.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to delete this agent" });
      }

      await storage.deleteAiAgent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting AI agent:", error);
      res.status(500).json({ error: "Failed to delete AI agent" });
    }
  });

  // ========== Game Session Routes ==========

  // Get active game session for user + island
  app.get("/api/game-sessions/active/:islandId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const session = await storage.getActiveGameSession(authenticatedUserId, req.params.islandId);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching active game session:", error);
      res.status(500).json({ error: "Failed to fetch game session" });
    }
  });

  // Get all sessions for user
  app.get("/api/game-sessions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const sessions = await storage.getGameSessionsByUserId(authenticatedUserId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching game sessions:", error);
      res.status(500).json({ error: "Failed to fetch game sessions" });
    }
  });

  // Start a new game session
  app.post("/api/game-sessions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { islandId, characterId, loadout } = req.body;

      if (!islandId) {
        return res.status(400).json({ error: "islandId is required" });
      }

      // Verify island ownership
      const island = await storage.getIsland(islandId);
      if (!island || island.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to start session on this island" });
      }

      // Verify character ownership if provided
      if (characterId) {
        const character = await storage.getCharacter(characterId);
        if (!character || character.userId !== authenticatedUserId) {
          return res.status(403).json({ error: "Not authorized to use this character" });
        }
      }

      // End any existing active session for this island
      const existingSession = await storage.getActiveGameSession(authenticatedUserId, islandId);
      if (existingSession) {
        await storage.endGameSession(existingSession.id);
      }

      const session = await storage.createGameSession({
        userId: authenticatedUserId,
        islandId,
        characterId,
        checkpoint: { loadout: loadout || {} },
        pendingResources: {},
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).json({ error: "Failed to create game session" });
    }
  });

  // Update session data (checkpoint)
  app.patch("/api/game-sessions/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }

      if (session.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to update this session" });
      }

      const { checkpoint, pendingResources } = req.body;
      const updates: Record<string, unknown> = {};
      if (checkpoint !== undefined) updates.checkpoint = checkpoint;
      if (pendingResources !== undefined) updates.pendingResources = pendingResources;

      const updatedSession = await storage.updateGameSession(req.params.id, updates);
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating game session:", error);
      res.status(500).json({ error: "Failed to update game session" });
    }
  });

  // End game session
  app.post("/api/game-sessions/:id/end", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }

      if (session.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to end this session" });
      }

      const endedSession = await storage.endGameSession(req.params.id);
      res.json(endedSession);
    } catch (error) {
      console.error("Error ending game session:", error);
      res.status(500).json({ error: "Failed to end game session" });
    }
  });

  // ========== AFK Job Routes ==========

  // Get AFK jobs for user
  app.get("/api/afk-jobs", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const jobs = await storage.getAfkJobsByUserId(authenticatedUserId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching AFK jobs:", error);
      res.status(500).json({ error: "Failed to fetch AFK jobs" });
    }
  });

  // Start an AFK job
  app.post("/api/afk-jobs", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { islandId, sessionId, jobType, targetNodeId, targetBuildingId, durationMinutes, projectedYield, characterId } = req.body;

      if (!islandId || !jobType) {
        return res.status(400).json({ error: "islandId and jobType are required" });
      }

      // Verify island ownership
      const island = await storage.getIsland(islandId);
      if (!island || island.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to create job on this island" });
      }

      // Verify session ownership if provided
      if (sessionId) {
        const session = await storage.getGameSession(sessionId);
        if (!session || session.userId !== authenticatedUserId) {
          return res.status(403).json({ error: "Not authorized to use this session" });
        }
      }

      // Verify character ownership if provided
      if (characterId) {
        const character = await storage.getCharacter(characterId);
        if (!character || character.userId !== authenticatedUserId) {
          return res.status(403).json({ error: "Not authorized to use this character" });
        }
      }

      // Calculate end time if duration provided
      const endsAt = durationMinutes 
        ? new Date(Date.now() + durationMinutes * 60 * 1000) 
        : null;

      const job = await storage.createAfkJob({
        userId: authenticatedUserId,
        islandId,
        sessionId,
        characterId,
        jobType,
        targetNodeId,
        targetBuildingId,
        projectedYield: projectedYield || {},
        startedAt: new Date(),
        endsAt,
      });

      res.json(job);
    } catch (error) {
      console.error("Error creating AFK job:", error);
      res.status(500).json({ error: "Failed to create AFK job" });
    }
  });

  // Complete/claim an AFK job
  app.post("/api/afk-jobs/:id/complete", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const job = await storage.getAfkJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "AFK job not found" });
      }

      if (job.userId !== authenticatedUserId) {
        return res.status(403).json({ error: "Not authorized to complete this job" });
      }

      const { actualYield } = req.body;
      const completedJob = await storage.completeAfkJob(req.params.id, actualYield || job.projectedYield || {});
      res.json(completedJob);
    } catch (error) {
      console.error("Error completing AFK job:", error);
      res.status(500).json({ error: "Failed to complete AFK job" });
    }
  });

  // ========== Resource Ledger Routes ==========

  // Get uncommitted resources for user
  app.get("/api/resources/uncommitted", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const resources = await storage.getUncommittedResources(authenticatedUserId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching uncommitted resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // Commit resources to inventory
  app.post("/api/resources/commit", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entryIds } = req.body;
      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return res.status(400).json({ error: "entryIds array is required" });
      }

      await storage.commitResources(authenticatedUserId, entryIds);
      res.json({ success: true, committed: entryIds.length });
    } catch (error) {
      console.error("Error committing resources:", error);
      res.status(500).json({ error: "Failed to commit resources" });
    }
  });

  // ========== Grudge UUID Routes ==========
  
  // Import UUID functions dynamically to avoid circular deps
  const grudgeUUID = await import("../shared/grudgeUUID");

  // Test UUID system
  app.get("/api/uuid/test", (_req, res) => {
    try {
      const samples = [
        grudgeUUID.generateGrudgeUUID('Helm', 1, 42),
        grudgeUUID.generateGrudgeUUID('Weapon', 3, 1),
        grudgeUUID.generateGrudgeUUID('Potion', 'none', 100),
        grudgeUUID.generateSpriteUUID('icons', 5),
        grudgeUUID.generateAbilityUUID(2, 15),
        grudgeUUID.generateSkillUUID(1, 8),
        grudgeUUID.generateUIElementUUID(1),
      ];
      
      res.json({
        samples: samples.map(uuid => ({
          uuid,
          description: grudgeUUID.describeGrudgeUUID(uuid),
          valid: grudgeUUID.isValidGrudgeUUID(uuid),
          parsed: grudgeUUID.parseGrudgeUUID(uuid),
        })),
        slotCodes: grudgeUUID.SLOT_CODES,
        tierCodes: grudgeUUID.TIER_CODES,
      });
    } catch (error) {
      console.error("Error testing UUID:", error);
      res.status(500).json({ error: "UUID test failed" });
    }
  });

  // Generate single UUID
  app.post("/api/uuid/generate", (req, res) => {
    try {
      const { slot, tier, itemId } = req.body;
      
      if (!slot) {
        return res.status(400).json({ error: "slot is required" });
      }
      
      const uuid = grudgeUUID.generateGrudgeUUID(
        slot,
        tier !== undefined ? tier : 'none',
        itemId || 1
      );
      
      res.json({
        uuid,
        description: grudgeUUID.describeGrudgeUUID(uuid),
        parsed: grudgeUUID.parseGrudgeUUID(uuid),
      });
    } catch (error) {
      console.error("Error generating UUID:", error);
      res.status(500).json({ error: "Failed to generate UUID" });
    }
  });

  // Get all slot codes
  app.get("/api/uuid/slots", (_req, res) => {
    res.json({
      slotCodes: grudgeUUID.SLOT_CODES,
      slotNames: grudgeUUID.SLOT_NAMES,
    });
  });

  // Parse a UUID
  app.post("/api/uuid/parse", (req, res) => {
    try {
      const { uuid } = req.body;
      
      if (!uuid) {
        return res.status(400).json({ error: "uuid is required" });
      }
      
      const parsed = grudgeUUID.parseGrudgeUUID(uuid);
      const valid = grudgeUUID.isValidGrudgeUUID(uuid);
      const description = valid ? grudgeUUID.describeGrudgeUUID(uuid) : null;
      
      res.json({ uuid, valid, parsed, description });
    } catch (error) {
      console.error("Error parsing UUID:", error);
      res.status(500).json({ error: "Failed to parse UUID" });
    }
  });

  // ========== UUID Ledger Routes ==========

  // Log a UUID event
  app.post("/api/ledger/log", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      const { grudgeUuid, eventType, characterId, relatedUuids, outputUuid, previousState, newState, metadata } = req.body;
      
      if (!grudgeUuid || !eventType) {
        return res.status(400).json({ error: "grudgeUuid and eventType are required" });
      }
      
      const entry = await storage.createUuidLedgerEntry({
        grudgeUuid,
        eventType,
        accountId: authenticatedUserId || undefined,
        characterId: characterId || undefined,
        relatedUuids: relatedUuids || [],
        outputUuid: outputUuid || undefined,
        previousState: previousState || undefined,
        newState: newState || undefined,
        metadata: metadata || {},
      });
      
      res.json({ success: true, entry });
    } catch (error) {
      console.error("Error logging UUID event:", error);
      res.status(500).json({ error: "Failed to log UUID event" });
    }
  });

  // Get UUID history
  app.get("/api/ledger/history/:grudgeUuid", async (req, res) => {
    try {
      const { grudgeUuid } = req.params;
      const events = await storage.getUuidHistory(grudgeUuid);
      res.json({ grudgeUuid, events, count: events.length });
    } catch (error) {
      console.error("Error fetching UUID history:", error);
      res.status(500).json({ error: "Failed to fetch UUID history" });
    }
  });

  // Get recent ledger events for account
  app.get("/api/ledger/account", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const authenticatedUserId = await getAuthenticatedUserId(authHeader);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getAccountLedgerEvents(authenticatedUserId, limit);
      res.json({ events, count: events.length });
    } catch (error) {
      console.error("Error fetching account ledger:", error);
      res.status(500).json({ error: "Failed to fetch account ledger" });
    }
  });

  // Batch sync ledger events (for Puter Worker)
  app.post("/api/ledger/sync", async (req, res) => {
    try {
      const { events } = req.body;
      
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: "events array is required" });
      }
      
      const results = [];
      for (const event of events) {
        try {
          const entry = await storage.createUuidLedgerEntry(event);
          results.push({ success: true, id: entry.id });
        } catch (err) {
          results.push({ success: false, error: (err as Error).message });
        }
      }
      
      res.json({ synced: results.filter(r => r.success).length, total: events.length, results });
    } catch (error) {
      console.error("Error syncing ledger:", error);
      res.status(500).json({ error: "Failed to sync ledger" });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // ========== Consolidated Routes (from api-server) ==========
  app.use('/api/game-data', gameDataRoutes);
  app.use('/api/github', githubRoutes);

  return httpServer;
}
