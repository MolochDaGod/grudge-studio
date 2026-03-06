/**
 * API Client for Grudge Builder
 * Integrates with main GRUDGE Warlords backend
 */

import { GAME_CONFIG } from '../config/game-config';

export class GameAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = GAME_CONFIG.apiUrl;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Character API
  async getCharacter(characterId: string) {
    return this.request(`/api/characters/${characterId}`);
  }

  async getCharactersByUser(userId: string) {
    return this.request(`/api/characters/user/${userId}`);
  }

  // Inventory API
  async getInventory(characterId: string) {
    return this.request(`/api/inventory/${characterId}`);
  }

  async updateInventory(characterId: string, itemName: string, quantity: number) {
    return this.request(`/api/inventory/${characterId}`, {
      method: 'POST',
      body: JSON.stringify({ itemName, quantity }),
    });
  }

  // Crafting API
  async getRecipes(characterId: string) {
    return this.request(`/api/recipes/unlocked/${characterId}`);
  }

  async craftItem(characterId: string, recipeId: string, quantity: number = 1) {
    return this.request(`/api/crafting/craft`, {
      method: 'POST',
      body: JSON.stringify({ characterId, recipeId, quantity }),
    });
  }

  // Game State API
  async saveGameState(characterId: string, state: any) {
    return this.request(`/api/game/save`, {
      method: 'POST',
      body: JSON.stringify({ characterId, state }),
    });
  }

  async loadGameState(characterId: string) {
    return this.request(`/api/game/load/${characterId}`);
  }

  // Health check
  async checkHealth() {
    return this.request('/api/health');
  }
}

// Singleton instance
export const gameAPI = new GameAPI();

