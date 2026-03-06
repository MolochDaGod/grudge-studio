/**
 * GRUDGE Warlords API Client
 * 
 * Complete client for accessing all GRUDGE Warlords API endpoints.
 * Set YOUR_APP_URL environment variable to your published app URL.
 */

const API_BASE = process.env.YOUR_APP_URL || '';

// Account data from shared Google Sheet (for cross-app user sync)
export interface SheetAccount {
  id: string;
  username: string;
  email: string;
  displayName: string;
  puterId: string;
  avatarUrl: string;
  isPremium: string;
  premiumUntil: string;
  createdAt: string;
  lastLoginAt: string;
  settings: string;
}

export class GrudgeAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE;
    if (!this.baseUrl) {
      console.warn('GrudgeAPI: No base URL configured. Set YOUR_APP_URL environment variable.');
    }
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================
  // GAME DATA (Google Sheets - cached 5 min)
  // ============================================

  async getWeapons() {
    return this.fetch<{ success: boolean; count: number; data: any[] }>('/api/sheets/weapons');
  }

  async getArmor() {
    return this.fetch<{ success: boolean; count: number; data: any[] }>('/api/sheets/armor');
  }

  async getChefRecipes() {
    return this.fetch<{ success: boolean; count: number; data: any[] }>('/api/sheets/chef');
  }

  async getItems() {
    return this.fetch<{ success: boolean; count: number; data: any[] }>('/api/sheets/items');
  }

  async getCraftingRecipes() {
    return this.fetch<{ success: boolean; count: number; data: any[] }>('/api/sheets/crafting');
  }

  async getCacheStatus() {
    return this.fetch<{ success: boolean; caches: any }>('/api/sheets/status');
  }

  async refreshCache() {
    return this.fetch('/api/sheets/refresh', { method: 'POST' });
  }

  // ============================================
  // ACCOUNTS (Google Sheets - Cross-App Sync)
  // ============================================

  /**
   * Get all accounts from the shared Google Sheet
   * Returns account data for cross-app user identification
   */
  async getSheetAccounts() {
    return this.fetch<{ success: boolean; count: number; data: SheetAccount[] }>('/api/sheets/accounts');
  }

  /**
   * Get a specific account by ID from the shared Google Sheet
   */
  async getSheetAccount(accountId: string) {
    return this.fetch<{ success: boolean; data: SheetAccount }>(`/api/sheets/accounts/${accountId}`);
  }

  // ============================================
  // AUTHENTICATION (Cross-App Login)
  // ============================================

  /**
   * Exchange a login token for user info.
   * Use this after receiving a token from the /login redirect.
   */
  async exchangeAuthToken(token: string) {
    return this.fetch<{ 
      success: boolean; 
      user: { 
        id: string; 
        username: string; 
        displayName?: string; 
        email?: string;
        avatarUrl?: string;
        isPremium?: boolean;
      } 
    }>('/api/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Verify a token is valid without consuming it
   */
  async verifyAuthToken(token: string) {
    return this.fetch<{ valid: boolean; userId?: string; username?: string; error?: string }>(
      `/api/auth/verify?token=${encodeURIComponent(token)}`
    );
  }

  /**
   * Get the login URL for cross-app authentication.
   * Redirect users here to login, they'll be sent back to returnUrl with a token.
   */
  getLoginUrl(returnUrl: string, appId: string, mode: 'login' | 'register' = 'login'): string {
    const params = new URLSearchParams({
      return_url: returnUrl,
      app_id: appId,
      mode: mode,
    });
    return `${this.baseUrl}/login?${params.toString()}`;
  }

  // ============================================
  // CHARACTERS
  // ============================================

  async getCharacters(userId: string) {
    return this.fetch<any[]>(`/api/characters?userId=${encodeURIComponent(userId)}`);
  }

  async getCharacter(id: string) {
    return this.fetch<any>(`/api/characters/${id}`);
  }

  async createCharacter(data: { userId: string; name: string; profession: string }) {
    return this.fetch<any>('/api/characters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCharacter(id: string, data: Partial<{ name: string; level: number; experience: number; gold: number; skillPoints: number }>) {
    return this.fetch<any>(`/api/characters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // SKILLS
  // ============================================

  async getUnlockedSkills(characterId: string) {
    return this.fetch<any[]>(`/api/skills/${characterId}`);
  }

  async unlockSkill(data: { characterId: string; nodeId: string; profession: string }) {
    return this.fetch<any>('/api/skills/unlock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // SHOP / TRADING POST
  // ============================================

  async buyRecipe(characterId: string, recipeId: string, recipeName: string) {
    return this.fetch<any>('/api/shop/buy-recipe', {
      method: 'POST',
      body: JSON.stringify({ characterId, recipeId, recipeName }),
    });
  }

  async buyMaterial(data: { characterId: string; itemId: string; itemName: string; quantity: number; tier: number }) {
    return this.fetch<any>('/api/shop/buy-material', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sellMaterial(data: { characterId: string; itemName: string; quantity: number; tier: number }) {
    return this.fetch<any>('/api/shop/sell-material', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sellItem(characterId: string, itemId: string) {
    return this.fetch<any>('/api/shop/sell-item', {
      method: 'POST',
      body: JSON.stringify({ characterId, itemId }),
    });
  }

  async getTransactionHistory(characterId: string, limit?: number) {
    const url = limit ? `/api/shop/transactions/${characterId}?limit=${limit}` : `/api/shop/transactions/${characterId}`;
    return this.fetch<any[]>(url);
  }

  // ============================================
  // INVENTORY & CRAFTED ITEMS
  // ============================================

  async getInventory(characterId: string) {
    return this.fetch<any[]>(`/api/inventory/${characterId}`);
  }

  async addInventoryItem(data: { characterId: string; itemType: string; itemName: string; quantity: number }) {
    return this.fetch<any>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCraftedItems(characterId: string) {
    return this.fetch<any[]>(`/api/crafted-items/${characterId}`);
  }

  async getRecipes(characterId: string) {
    return this.fetch<any[]>(`/api/recipes/${characterId}`);
  }

  // ============================================
  // CRAFTING
  // ============================================

  async craftItem(data: { 
    characterId: string; 
    itemName: string; 
    profession: string; 
    recipe: { materials?: { name: string; quantity: number }[]; goldCost?: number; itemType?: string } 
  }) {
    return this.fetch<any>('/api/craft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async upgradeItem(data: { 
    characterId: string; 
    itemId: string; 
    upgradeCost: { gold: number; essences?: Record<string, number> } 
  }) {
    return this.fetch<any>('/api/upgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async equipItem(itemId: string, characterId: string) {
    return this.fetch<any>(`/api/crafted-items/${itemId}/equip`, {
      method: 'POST',
      body: JSON.stringify({ characterId }),
    });
  }

  async deleteCharacter(characterId: string) {
    return this.fetch<any>(`/api/characters/${characterId}`, {
      method: 'DELETE',
    });
  }

  async deleteCraftedItem(itemId: string) {
    return this.fetch<any>(`/api/crafted-items/${itemId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const api = new GrudgeAPI();

// Export types
export interface Weapon {
  id: string;
  name: string;
  type: string;
  damage: number;
  speed: number;
  abilities: string[];
}

export interface Armor {
  id: string;
  name: string;
  type: string;
  defense: number;
  hp: number;
  setBonus: string;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  profession: string;
  level: number;
  experience: number;
  gold: number;
  skillPoints: number;
}
