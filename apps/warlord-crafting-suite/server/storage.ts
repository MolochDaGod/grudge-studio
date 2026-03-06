// Blueprint: javascript_database integration - using DatabaseStorage with Drizzle ORM
import {
  users,
  characters,
  unlockedSkills,
  inventoryItems,
  craftedItems,
  artAssets,
  unlockedRecipes,
  shopTransactions,
  craftingJobs,
  islands,
  aiAgents,
  gameSessions,
  afkJobs,
  resourceLedger,
  uuidLedger,
  type User,
  type InsertUser,
  type Character,
  type InsertCharacter,
  type UnlockedSkill,
  type InsertUnlockedSkill,
  type InventoryItem,
  type InsertInventoryItem,
  type CraftedItem,
  type InsertCraftedItem,
  type ArtAsset,
  type InsertArtAsset,
  type UnlockedRecipe,
  type InsertUnlockedRecipe,
  type ShopTransaction,
  type InsertShopTransaction,
  type CraftingJob,
  type InsertCraftingJob,
  type Island,
  type InsertIsland,
  type AiAgent,
  type InsertAiAgent,
  type GameSession,
  type InsertGameSession,
  type AfkJob,
  type InsertAfkJob,
  type ResourceLedger,
  type InsertResourceLedger,
  type UuidLedger,
  type InsertUuidLedger,
} from "@grudge/database";
import { db } from "./db";
import { eq, and, desc, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserWallet(id: string, walletAddress: string): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;

  // Character operations
  getCharacter(id: string): Promise<Character | undefined>;
  getCharactersByUserId(userId: string): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character>;
  deleteCharacter(id: string): Promise<void>;

  // Skill operations
  unlockSkill(skill: InsertUnlockedSkill): Promise<UnlockedSkill>;
  getUnlockedSkills(characterId: string): Promise<UnlockedSkill[]>;
  isSkillUnlocked(characterId: string, nodeId: string): Promise<boolean>;

  // Inventory operations
  getInventory(characterId: string): Promise<InventoryItem[]>;
  getInventoryItem(characterId: string, itemName: string): Promise<InventoryItem | undefined>;
  addInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryQuantity(characterId: string, itemName: string, quantity: number): Promise<InventoryItem>;
  removeInventoryItem(id: string): Promise<void>;

  // Crafted items operations
  getCraftedItems(characterId: string): Promise<CraftedItem[]>;
  getCraftedItem(id: string): Promise<CraftedItem | undefined>;
  createCraftedItem(item: InsertCraftedItem): Promise<CraftedItem>;
  updateCraftedItem(id: string, updates: Partial<CraftedItem>): Promise<CraftedItem>;
  deleteCraftedItem(id: string): Promise<void>;
  equipItem(characterId: string, itemId: string): Promise<CraftedItem>;

  // Art assets operations
  getArtAssets(): Promise<ArtAsset[]>;
  getArtAssetBySlug(slug: string): Promise<ArtAsset | undefined>;
  getArtAssetsByCategory(category: string): Promise<ArtAsset[]>;
  createArtAsset(asset: InsertArtAsset): Promise<ArtAsset>;
  updateArtAsset(id: string, updates: Partial<ArtAsset>): Promise<ArtAsset>;
  deleteArtAsset(id: string): Promise<void>;

  // Recipe unlock operations
  getUnlockedRecipes(characterId: string): Promise<UnlockedRecipe[]>;
  isRecipeUnlocked(characterId: string, recipeId: string): Promise<boolean>;
  unlockRecipe(recipe: InsertUnlockedRecipe): Promise<UnlockedRecipe>;
  unlockRecipesBulk(characterId: string, recipeIds: string[], source?: string): Promise<void>;

  // Shop transaction operations
  getShopTransactions(characterId: string, limit?: number): Promise<ShopTransaction[]>;
  createShopTransaction(transaction: InsertShopTransaction): Promise<ShopTransaction>;

  // Crafting jobs operations
  getCraftingJobs(characterId: string): Promise<CraftingJob[]>;
  getCraftingJob(id: string): Promise<CraftingJob | undefined>;
  createCraftingJob(job: InsertCraftingJob): Promise<CraftingJob>;
  updateCraftingJob(id: string, updates: Partial<CraftingJob>): Promise<CraftingJob>;
  deleteCraftingJob(id: string): Promise<void>;
  getCompletedJobs(characterId: string): Promise<CraftingJob[]>;
  claimCraftingJob(id: string): Promise<CraftingJob>;

  // Island operations
  getIsland(id: string): Promise<Island | undefined>;
  getIslandsByUserId(userId: string): Promise<Island[]>;
  createIsland(island: InsertIsland): Promise<Island>;
  updateIsland(id: string, updates: Partial<Island>): Promise<Island>;
  deleteIsland(id: string): Promise<void>;

  // AI Agent operations
  getAiAgent(id: string): Promise<AiAgent | undefined>;
  getAiAgentsByUserId(userId: string): Promise<AiAgent[]>;
  getAiAgentsByIslandId(islandId: string): Promise<AiAgent[]>;
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(id: string, updates: Partial<AiAgent>): Promise<AiAgent>;
  deleteAiAgent(id: string): Promise<void>;

  // Game Session operations
  getGameSession(id: string): Promise<GameSession | undefined>;
  getGameSessionsByUserId(userId: string): Promise<GameSession[]>;
  getActiveGameSession(userId: string, islandId: string): Promise<GameSession | undefined>;
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession>;
  endGameSession(id: string): Promise<GameSession>;

  // AFK Job operations
  getAfkJob(id: string): Promise<AfkJob | undefined>;
  getAfkJobsByUserId(userId: string): Promise<AfkJob[]>;
  getActiveAfkJobs(islandId: string): Promise<AfkJob[]>;
  createAfkJob(job: InsertAfkJob): Promise<AfkJob>;
  updateAfkJob(id: string, updates: Partial<AfkJob>): Promise<AfkJob>;
  completeAfkJob(id: string, actualYield: Record<string, number>): Promise<AfkJob>;

  // Resource Ledger operations
  getResourceLedgerByUser(userId: string): Promise<ResourceLedger[]>;
  getUncommittedResources(userId: string): Promise<ResourceLedger[]>;
  createResourceLedgerEntry(entry: InsertResourceLedger): Promise<ResourceLedger>;
  commitResources(userId: string, entryIds: string[]): Promise<void>;

  // UUID Ledger operations
  createUuidLedgerEntry(entry: InsertUuidLedger): Promise<UuidLedger>;
  getUuidHistory(grudgeUuid: string): Promise<UuidLedger[]>;
  getAccountLedgerEvents(accountId: string, limit?: number): Promise<UuidLedger[]>;

  // Health check
  healthCheck(): Promise<boolean>;

  // Admin operations
  getAllCharacters(): Promise<Character[]>;
  getStats(): Promise<{
    users: number;
    characters: number;
    inventory: number;
    craftedItems: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserWallet(id: string, walletAddress: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ walletAddress })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  // Character operations
  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async getCharactersByUserId(userId: string): Promise<Character[]> {
    return await db.select().from(characters).where(eq(characters.userId, userId));
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db.insert(characters).values(insertCharacter).returning();
    return character;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const [character] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, id))
      .returning();
    return character;
  }

  async deleteCharacter(id: string): Promise<void> {
    await db.delete(characters).where(eq(characters.id, id));
  }

  // Skill operations
  async unlockSkill(skill: InsertUnlockedSkill): Promise<UnlockedSkill> {
    const [unlockedSkill] = await db.insert(unlockedSkills).values(skill).returning();
    return unlockedSkill;
  }

  async getUnlockedSkills(characterId: string): Promise<UnlockedSkill[]> {
    return await db.select().from(unlockedSkills).where(eq(unlockedSkills.characterId, characterId));
  }

  async isSkillUnlocked(characterId: string, nodeId: string): Promise<boolean> {
    const [skill] = await db
      .select()
      .from(unlockedSkills)
      .where(and(eq(unlockedSkills.characterId, characterId), eq(unlockedSkills.nodeId, nodeId)));
    return !!skill;
  }

  // Inventory operations
  async getInventory(characterId: string): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(eq(inventoryItems.characterId, characterId));
  }

  async getInventoryItem(characterId: string, itemName: string): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.characterId, characterId), eq(inventoryItems.itemName, itemName)));
    return item || undefined;
  }

  async addInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const existing = await this.getInventoryItem(item.characterId, item.itemName);
    if (existing) {
      const newQuantity = existing.quantity + (item.quantity || 0);
      return await this.updateInventoryQuantity(item.characterId, item.itemName, newQuantity);
    }
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async updateInventoryQuantity(characterId: string, itemName: string, quantity: number): Promise<InventoryItem> {
    const [item] = await db
      .update(inventoryItems)
      .set({ quantity })
      .where(and(eq(inventoryItems.characterId, characterId), eq(inventoryItems.itemName, itemName)))
      .returning();
    return item;
  }

  async removeInventoryItem(id: string): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  // Crafted items operations
  async getCraftedItems(characterId: string): Promise<CraftedItem[]> {
    return await db.select().from(craftedItems).where(eq(craftedItems.characterId, characterId));
  }

  async getCraftedItem(id: string): Promise<CraftedItem | undefined> {
    const [item] = await db.select().from(craftedItems).where(eq(craftedItems.id, id));
    return item || undefined;
  }

  async createCraftedItem(item: InsertCraftedItem): Promise<CraftedItem> {
    const [craftedItem] = await db.insert(craftedItems).values(item).returning();
    return craftedItem;
  }

  async updateCraftedItem(id: string, updates: Partial<CraftedItem>): Promise<CraftedItem> {
    const [item] = await db.update(craftedItems).set(updates).where(eq(craftedItems.id, id)).returning();
    return item;
  }

  async deleteCraftedItem(id: string): Promise<void> {
    await db.delete(craftedItems).where(eq(craftedItems.id, id));
  }

  async equipItem(characterId: string, itemId: string): Promise<CraftedItem> {
    // Unequip all items of the same type first
    const item = await this.getCraftedItem(itemId);
    if (!item) throw new Error("Item not found");

    await db
      .update(craftedItems)
      .set({ equipped: false })
      .where(and(eq(craftedItems.characterId, characterId), eq(craftedItems.itemType, item.itemType)));

    // Equip the selected item
    return await this.updateCraftedItem(itemId, { equipped: true });
  }

  // Art assets operations
  async getArtAssets(): Promise<ArtAsset[]> {
    return await db.select().from(artAssets);
  }

  async getArtAssetBySlug(slug: string): Promise<ArtAsset | undefined> {
    const [asset] = await db.select().from(artAssets).where(eq(artAssets.slug, slug));
    return asset || undefined;
  }

  async getArtAssetsByCategory(category: string): Promise<ArtAsset[]> {
    return await db.select().from(artAssets).where(eq(artAssets.category, category));
  }

  async createArtAsset(asset: InsertArtAsset): Promise<ArtAsset> {
    const [newAsset] = await db.insert(artAssets).values(asset).returning();
    return newAsset;
  }

  async updateArtAsset(id: string, updates: Partial<ArtAsset>): Promise<ArtAsset> {
    const [asset] = await db.update(artAssets).set(updates).where(eq(artAssets.id, id)).returning();
    return asset;
  }

  async deleteArtAsset(id: string): Promise<void> {
    await db.delete(artAssets).where(eq(artAssets.id, id));
  }

  // Recipe unlock operations
  async getUnlockedRecipes(characterId: string): Promise<UnlockedRecipe[]> {
    return await db.select().from(unlockedRecipes).where(eq(unlockedRecipes.characterId, characterId));
  }

  async isRecipeUnlocked(characterId: string, recipeId: string): Promise<boolean> {
    const [recipe] = await db
      .select()
      .from(unlockedRecipes)
      .where(and(eq(unlockedRecipes.characterId, characterId), eq(unlockedRecipes.recipeId, recipeId)));
    return !!recipe;
  }

  async unlockRecipe(recipe: InsertUnlockedRecipe): Promise<UnlockedRecipe> {
    const [unlocked] = await db.insert(unlockedRecipes).values(recipe).returning();
    return unlocked;
  }

  async unlockRecipesBulk(characterId: string, recipeIds: string[], source: string = 'starter'): Promise<void> {
    if (recipeIds.length === 0) return;
    const records = recipeIds.map(recipeId => ({
      characterId,
      recipeId,
      source,
    }));
    await db.insert(unlockedRecipes).values(records);
  }

  // Shop transaction operations
  async getShopTransactions(characterId: string, limit: number = 50): Promise<ShopTransaction[]> {
    return await db
      .select()
      .from(shopTransactions)
      .where(eq(shopTransactions.characterId, characterId))
      .orderBy(desc(shopTransactions.createdAt))
      .limit(limit);
  }

  async createShopTransaction(transaction: InsertShopTransaction): Promise<ShopTransaction> {
    const [newTransaction] = await db.insert(shopTransactions).values(transaction).returning();
    return newTransaction;
  }

  // Crafting jobs operations
  async getCraftingJobs(characterId: string): Promise<CraftingJob[]> {
    return await db
      .select()
      .from(craftingJobs)
      .where(eq(craftingJobs.characterId, characterId))
      .orderBy(desc(craftingJobs.startedAt));
  }

  async getCraftingJob(id: string): Promise<CraftingJob | undefined> {
    const [job] = await db.select().from(craftingJobs).where(eq(craftingJobs.id, id));
    return job || undefined;
  }

  async createCraftingJob(job: InsertCraftingJob): Promise<CraftingJob> {
    const [newJob] = await db.insert(craftingJobs).values(job).returning();
    return newJob;
  }

  async updateCraftingJob(id: string, updates: Partial<CraftingJob>): Promise<CraftingJob> {
    const [job] = await db
      .update(craftingJobs)
      .set(updates)
      .where(eq(craftingJobs.id, id))
      .returning();
    return job;
  }

  async deleteCraftingJob(id: string): Promise<void> {
    await db.delete(craftingJobs).where(eq(craftingJobs.id, id));
  }

  async getCompletedJobs(characterId: string): Promise<CraftingJob[]> {
    const now = new Date();
    return await db
      .select()
      .from(craftingJobs)
      .where(
        and(
          eq(craftingJobs.characterId, characterId),
          lte(craftingJobs.completesAt, now),
          eq(craftingJobs.status, 'pending')
        )
      )
      .orderBy(desc(craftingJobs.completesAt));
  }

  async claimCraftingJob(id: string): Promise<CraftingJob> {
    const [job] = await db
      .update(craftingJobs)
      .set({ 
        status: 'claimed',
        claimedAt: sql`now()` 
      })
      .where(eq(craftingJobs.id, id))
      .returning();
    return job;
  }

  // Island operations
  async getIsland(id: string): Promise<Island | undefined> {
    const [island] = await db.select().from(islands).where(eq(islands.id, id));
    return island || undefined;
  }

  async getIslandsByUserId(userId: string): Promise<Island[]> {
    return await db.select().from(islands).where(eq(islands.userId, userId));
  }

  async createIsland(insertIsland: InsertIsland): Promise<Island> {
    const [island] = await db.insert(islands).values(insertIsland).returning();
    return island;
  }

  async updateIsland(id: string, updates: Partial<Island>): Promise<Island> {
    const [island] = await db
      .update(islands)
      .set(updates)
      .where(eq(islands.id, id))
      .returning();
    return island;
  }

  async deleteIsland(id: string): Promise<void> {
    await db.delete(islands).where(eq(islands.id, id));
  }

  // AI Agent operations
  async getAiAgent(id: string): Promise<AiAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, id));
    return agent || undefined;
  }

  async getAiAgentsByUserId(userId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.userId, userId));
  }

  async getAiAgentsByIslandId(islandId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.islandId, islandId));
  }

  async createAiAgent(agent: InsertAiAgent): Promise<AiAgent> {
    const [newAgent] = await db.insert(aiAgents).values(agent).returning();
    return newAgent;
  }

  async updateAiAgent(id: string, updates: Partial<AiAgent>): Promise<AiAgent> {
    const [agent] = await db
      .update(aiAgents)
      .set(updates)
      .where(eq(aiAgents.id, id))
      .returning();
    return agent;
  }

  async deleteAiAgent(id: string): Promise<void> {
    await db.delete(aiAgents).where(eq(aiAgents.id, id));
  }

  // Game Session operations
  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session || undefined;
  }

  async getGameSessionsByUserId(userId: string): Promise<GameSession[]> {
    return await db.select().from(gameSessions).where(eq(gameSessions.userId, userId)).orderBy(desc(gameSessions.startedAt));
  }

  async getActiveGameSession(userId: string, islandId: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(
      and(
        eq(gameSessions.userId, userId),
        eq(gameSessions.islandId, islandId),
        eq(gameSessions.status, 'active')
      )
    );
    return session || undefined;
  }

  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const [newSession] = await db.insert(gameSessions).values(session).returning();
    return newSession;
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession> {
    const [session] = await db
      .update(gameSessions)
      .set(updates)
      .where(eq(gameSessions.id, id))
      .returning();
    return session;
  }

  async endGameSession(id: string): Promise<GameSession> {
    const [session] = await db
      .update(gameSessions)
      .set({ status: 'ended', endedAt: sql`now()` })
      .where(eq(gameSessions.id, id))
      .returning();
    return session;
  }

  // AFK Job operations
  async getAfkJob(id: string): Promise<AfkJob | undefined> {
    const [job] = await db.select().from(afkJobs).where(eq(afkJobs.id, id));
    return job || undefined;
  }

  async getAfkJobsByUserId(userId: string): Promise<AfkJob[]> {
    return await db.select().from(afkJobs).where(eq(afkJobs.userId, userId)).orderBy(desc(afkJobs.createdAt));
  }

  async getActiveAfkJobs(islandId: string): Promise<AfkJob[]> {
    return await db.select().from(afkJobs).where(
      and(
        eq(afkJobs.islandId, islandId),
        eq(afkJobs.status, 'active')
      )
    );
  }

  async createAfkJob(job: InsertAfkJob): Promise<AfkJob> {
    const [newJob] = await db.insert(afkJobs).values(job).returning();
    return newJob;
  }

  async updateAfkJob(id: string, updates: Partial<AfkJob>): Promise<AfkJob> {
    const [job] = await db
      .update(afkJobs)
      .set(updates)
      .where(eq(afkJobs.id, id))
      .returning();
    return job;
  }

  async completeAfkJob(id: string, actualYield: Record<string, number>): Promise<AfkJob> {
    const [job] = await db
      .update(afkJobs)
      .set({ 
        status: 'completed', 
        actualYield,
        completedAt: sql`now()` 
      })
      .where(eq(afkJobs.id, id))
      .returning();
    return job;
  }

  // Resource Ledger operations
  async getResourceLedgerByUser(userId: string): Promise<ResourceLedger[]> {
    return await db.select().from(resourceLedger).where(eq(resourceLedger.userId, userId)).orderBy(desc(resourceLedger.createdAt));
  }

  async getUncommittedResources(userId: string): Promise<ResourceLedger[]> {
    return await db.select().from(resourceLedger).where(
      and(
        eq(resourceLedger.userId, userId),
        eq(resourceLedger.committed, false)
      )
    );
  }

  async createResourceLedgerEntry(entry: InsertResourceLedger): Promise<ResourceLedger> {
    const [newEntry] = await db.insert(resourceLedger).values(entry).returning();
    return newEntry;
  }

  async commitResources(userId: string, entryIds: string[]): Promise<void> {
    for (const id of entryIds) {
      await db.update(resourceLedger)
        .set({ committed: true, committedAt: sql`now()` })
        .where(and(eq(resourceLedger.id, id), eq(resourceLedger.userId, userId)));
    }
  }

  // UUID Ledger operations
  async createUuidLedgerEntry(entry: InsertUuidLedger): Promise<UuidLedger> {
    const [newEntry] = await db.insert(uuidLedger).values(entry).returning();
    return newEntry;
  }

  async getUuidHistory(grudgeUuid: string): Promise<UuidLedger[]> {
    return await db.select().from(uuidLedger)
      .where(eq(uuidLedger.grudgeUuid, grudgeUuid))
      .orderBy(desc(uuidLedger.createdAt));
  }

  async getAccountLedgerEvents(accountId: string, limit: number = 50): Promise<UuidLedger[]> {
    return await db.select().from(uuidLedger)
      .where(eq(uuidLedger.accountId, accountId))
      .orderBy(desc(uuidLedger.createdAt))
      .limit(limit);
  }

  // Health check - verifies database connection
  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to check database connectivity
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  // Admin: Get all characters
  async getAllCharacters(): Promise<Character[]> {
    return await db.select().from(characters);
  }

  // Admin: Get database statistics
  async getStats(): Promise<{
    users: number;
    characters: number;
    inventory: number;
    craftedItems: number;
  }> {
    try {
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [charCount] = await db.select({ count: sql<number>`count(*)` }).from(characters);
      const [invCount] = await db.select({ count: sql<number>`count(*)` }).from(inventoryItems);
      const [craftCount] = await db.select({ count: sql<number>`count(*)` }).from(craftedItems);

      return {
        users: Number(userCount.count) || 0,
        characters: Number(charCount.count) || 0,
        inventory: Number(invCount.count) || 0,
        craftedItems: Number(craftCount.count) || 0,
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      return {
        users: 0,
        characters: 0,
        inventory: 0,
        craftedItems: 0,
      };
    }
  }
}

export const storage = new DatabaseStorage();
