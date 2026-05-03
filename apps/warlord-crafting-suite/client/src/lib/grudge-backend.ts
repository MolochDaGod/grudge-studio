/**
 * GRUDGE Backend API Client
 *
 * Connects WCS to the VPS game-api at api.grudge-studio.com
 * for real game data: characters, economy, crafting, islands.
 */

const GAME_API = import.meta.env.VITE_GAME_API_URL || 'https://api.grudge-studio.com';
const AUTH_API = import.meta.env.VITE_AUTH_API_URL || 'https://id.grudge-studio.com';

// The callback page that receives the grudge_token after OAuth
const OAUTH_CALLBACK = `${window.location.origin}/auth-callback.html`;

// ── Helpers ──────────────────────────────────

const TOKEN_KEY = 'grudge_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
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

export async function authLogin(username: string, password: string) {
  const res = await fetch(`${AUTH_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function authRegister(username: string, password: string) {
  const res = await fetch(`${AUTH_API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function authGuest(deviceId?: string) {
  const id = deviceId || crypto.randomUUID().slice(0, 12);
  const res = await fetch(`${AUTH_API}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ deviceId: id }),
  });
  return res.json();
}

export async function authWallet(walletAddress: string, email?: string, name?: string) {
  const res = await fetch(`${AUTH_API}/api/auth/wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ walletAddress, email, name }),
  });
  return res.json();
}

export async function authPuter(puterUuid: string, puterUsername: string) {
  const res = await fetch(`${AUTH_API}/api/auth/puter-sso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ puterId: puterUuid, puterUsername }),
  });
  return res.json();
}

export async function verifyToken(token: string) {
  const res = await fetch(`${AUTH_API}/api/auth/session/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function getMyIdentity() {
  const res = await fetch(`${AUTH_API}/api/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Identity fetch failed');
  return res.json();
}

// ── OAuth redirect flows ─────────────────────
// The login buttons redirect to id.grudge-studio.com/auth/<provider>/start
// which handles the provider OAuth and redirects back to /auth-callback.html
// with ?grudge_token=<jwt>&auth=<provider>&new=<0|1>.
// The ?next= param saved in sessionStorage is read by auth-callback.html.

/** Redirect to Discord OAuth via Grudge auth hub */
export function loginWithDiscord(next?: string) {
  try { sessionStorage.setItem('gw_auth_next', next || window.location.pathname); } catch {}
  window.location.href =
    `${AUTH_API}/auth/discord/start?redirect=${encodeURIComponent(OAUTH_CALLBACK)}`;
}

/** Redirect to Google OAuth via Grudge auth hub */
export function loginWithGoogle(next?: string) {
  try { sessionStorage.setItem('gw_auth_next', next || window.location.pathname); } catch {}
  window.location.href =
    `${AUTH_API}/auth/google/start?redirect=${encodeURIComponent(OAUTH_CALLBACK)}`;
}

/** Redirect to GitHub OAuth via Grudge auth hub */
export function loginWithGitHub(next?: string) {
  try { sessionStorage.setItem('gw_auth_next', next || window.location.pathname); } catch {}
  window.location.href =
    `${AUTH_API}/auth/github/start?redirect=${encodeURIComponent(OAUTH_CALLBACK)}`;
}

// ── OAuth callback capture (legacy + grudge_token) ───────────────

/**
 * Capture auth data from URL params after OAuth redirect.
 * Handles both the old ?token=... format and the new ?grudge_token=... format.
 * auth-callback.html handles the full exchange for the new format;
 * this is a fallback for deep-links that land directly on the React app.
 */
export function captureAuthCallback(): { token: string; grudgeId: string; provider?: string } | null {
  const params = new URLSearchParams(window.location.search);

  // New format: grudge_token (5-min launch JWT from The-ENGINE)
  const grudgeToken = params.get('grudge_token');
  if (grudgeToken) {
    // Store it temporarily; AuthContext will exchange it via verifyToken()
    setToken(grudgeToken);
    const provider = params.get('auth') || undefined;

    const cleanUrl = new URL(window.location.href);
    ['grudge_token', 'auth', 'new', 'next', 'redirect'].forEach((k) =>
      cleanUrl.searchParams.delete(k),
    );
    window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);

    return { token: grudgeToken, grudgeId: '', provider };
  }

  // Legacy format: ?token=...&grudge_id=...
  const token = params.get('token');
  const grudgeId = params.get('grudge_id');
  const provider = params.get('provider');

  if (!token) return null;

  setToken(token);

  const cleanUrl = new URL(window.location.href);
  ['token', 'grudge_id', 'provider', 'username', 'displayName', 'isNew'].forEach(
    (k) => cleanUrl.searchParams.delete(k),
  );
  window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);

  return { token, grudgeId: grudgeId || '', provider: provider || undefined };
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
  auth: {
    login: authLogin,
    register: authRegister,
    guest: authGuest,
    wallet: authWallet,
    puter: authPuter,
    verify: verifyToken,
    me: getMyIdentity,
    setToken,
    getToken,
    loginWithDiscord,
    loginWithGoogle,
    loginWithGitHub,
    captureAuthCallback,
  },
};
