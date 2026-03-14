/**
 * GRUDGE Backend API Client
 *
 * Connects WCS to the VPS game-api at api.grudge-studio.com
 * for real game data: characters, economy, crafting, islands.
 */

const GAME_API = import.meta.env.VITE_GAME_API_URL || 'https://api.grudge-studio.com';
const AUTH_API = import.meta.env.VITE_AUTH_API_URL || 'https://id.grudge-studio.com';

// ── Helpers ──────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('authToken');
}

async function gameApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const url = `${GAME_API}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[game-api ${res.status}] ${body}`);
  }
  return res.json();
}

// ── Health ───────────────────────────────────

export async function checkGameApiHealth() {
  return gameApiFetch<{ status: string; service: string; version: string }>('/health');
}

// ── Characters ───────────────────────────────

export async function getCharacters() {
  return gameApiFetch<any[]>('/characters');
}

export async function getCharacter(id: string | number) {
  return gameApiFetch<any>(`/characters/${id}`);
}

export async function createCharacter(data: {
  name: string;
  race: string;
  class: string;
  faction?: string;
}) {
  return gameApiFetch<any>('/characters', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Economy ──────────────────────────────────

export async function getBalance() {
  return gameApiFetch<{ gold: number; gbux: number }>('/economy/balance');
}

export async function transferGold(to: string, amount: number) {
  return gameApiFetch<any>('/economy/transfer', {
    method: 'POST',
    body: JSON.stringify({ to, amount }),
  });
}

// ── Crafting ─────────────────────────────────

export async function getRecipes() {
  return gameApiFetch<any[]>('/crafting/recipes');
}

export async function craftItem(recipeId: string | number, characterId: string | number) {
  return gameApiFetch<any>('/crafting/craft', {
    method: 'POST',
    body: JSON.stringify({ recipeId, characterId }),
  });
}

// ── Inventory ────────────────────────────────

export async function getInventory(characterId: string | number) {
  return gameApiFetch<any[]>(`/inventory/${characterId}`);
}

// ── Islands ──────────────────────────────────

export async function getIslands() {
  return gameApiFetch<any[]>('/islands');
}

export async function getIsland(id: string | number) {
  return gameApiFetch<any>(`/islands/${id}`);
}

// ── Professions ──────────────────────────────

export async function getProfessions(characterId: string | number) {
  return gameApiFetch<any>(`/professions/${characterId}`);
}

// ── Factions ─────────────────────────────────

export async function getFactions() {
  return gameApiFetch<any[]>('/factions');
}

// ── Missions ─────────────────────────────────

export async function getMissions() {
  return gameApiFetch<any[]>('/missions');
}

export async function completeMission(missionId: string | number) {
  return gameApiFetch<any>(`/missions/${missionId}/complete`, { method: 'POST' });
}

// ── Auth (VPS id.grudge-studio.com) ──────────

export async function verifyToken(token: string) {
  const res = await fetch(`${AUTH_API}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function getMyIdentity() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${AUTH_API}/identity/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Identity fetch failed');
  return res.json();
}

// ── Default export ───────────────────────────

export default {
  health: checkGameApiHealth,
  characters: { list: getCharacters, get: getCharacter, create: createCharacter },
  economy: { balance: getBalance, transfer: transferGold },
  crafting: { recipes: getRecipes, craft: craftItem },
  inventory: { get: getInventory },
  islands: { list: getIslands, get: getIsland },
  professions: { get: getProfessions },
  factions: { list: getFactions },
  missions: { list: getMissions, complete: completeMission },
  auth: { verify: verifyToken, me: getMyIdentity },
};
