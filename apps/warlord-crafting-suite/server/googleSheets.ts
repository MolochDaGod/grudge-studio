// Google Sheets data service for GRUDGE Warlords
// Fetches game data and syncs account data with shared Google Sheets

import { sheets } from '@googleapis/sheets';
import { GoogleAuth } from 'google-auth-library';

// Account schema columns for GOOGLE_SHEET_ACCOUNT
// Column A: id (UUID)
// Column B: username (unique, required)
// Column C: email (optional)
// Column D: displayName (optional)
// Column E: puterId (for Puter SSO)
// Column F: avatarUrl (profile picture)
// Column G: isPremium (TRUE/FALSE)
// Column H: premiumUntil (ISO date or empty)
// Column I: createdAt (ISO date)
// Column J: lastLoginAt (ISO date)
// Column K: settings (JSON string)
// Note: password is NOT stored in sheets (only in PostgreSQL)

interface WeaponRow {
  type: string;
  name: string;
  lore: string;
  tierProgression: string;
  damage: string;
  hp: string;
  mana: string;
  crit: string;
  block: string;
  defense: string;
  hotkey1: string;
  hotkey2Options: string[];
  hotkey3Options: string[];
  hotkey4: string;
  hotkey5Options: string[];
}

interface ArmorRow {
  itemType: string;
  material: string;
  name: string;
  lore: string;
  tierProgression: string;
  hp: string;
  mana: string;
  crit: string;
  block: string;
  defense: string;
  passive: string;
  attribute: string;
  effect: string;
  proc: string;
  setBonus: string;
}

interface ChefRow {
  category: string;
  name: string;
  description: string;
  tier: string;
  ingredients: string[];
  effects: string[];
  duration: string;
  cooldown: string;
}

interface ItemRow {
  category: string;
  name: string;
  description: string;
  tier: string;
  rarity: string;
  source: string;
  usedFor: string;
  stackable: string;
  value: string;
}

interface CraftingRow {
  profession: string;
  recipeName: string;
  category: string;
  tier: string;
  ingredients: string[];
  craftTime: string;
  xpReward: string;
  acquisition: string;
  description: string;
}

interface AccountRow {
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

// Cache for sheet data (refreshes every 5 minutes)
let weaponsCache: WeaponRow[] | null = null;
let armorCache: ArmorRow[] | null = null;
let chefCache: ChefRow[] | null = null;
let itemsCache: ItemRow[] | null = null;
let craftingCache: CraftingRow[] | null = null;
let accountsCache: AccountRow[] | null = null;
let weaponsCacheTime = 0;
let armorCacheTime = 0;
let chefCacheTime = 0;
let itemsCacheTime = 0;
let craftingCacheTime = 0;
let accountsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function extractSheetId(urlOrId: string): string {
  // If it's already just an ID, return it
  if (!urlOrId.includes('/')) {
    return urlOrId;
  }
  // Extract from URL like https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}

async function fetchSheetAsCSV(sheetUrl: string): Promise<string> {
  const sheetId = extractSheetId(sheetUrl);
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseCSV(csv: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentCell.trim());
        if (currentLine.some(cell => cell.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentCell = '';
        if (char === '\r') i++;
      } else {
        currentCell += char;
      }
    }
  }
  
  // Handle last line
  if (currentCell || currentLine.length > 0) {
    currentLine.push(currentCell.trim());
    if (currentLine.some(cell => cell.length > 0)) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

function parseWeaponsSheet(rows: string[][]): WeaponRow[] {
  if (rows.length < 2) return [];
  
  const weapons: WeaponRow[] = [];
  
  // Skip header rows (first 2 rows typically)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) continue; // Skip empty rows
    
    weapons.push({
      type: row[0] || '',
      name: row[1] || '',
      lore: row[2] || '',
      tierProgression: row[3] || 'T1-T8',
      damage: row[4] || '50 +10',
      hp: row[5] || '100 +20',
      mana: row[6] || '0 +0',
      crit: row[7] || '3 +0.5',
      block: row[8] || '5 +1',
      defense: row[9] || '20 +5',
      hotkey1: row[10] || '',
      hotkey2Options: [row[11], row[12], row[13]].filter(Boolean),
      hotkey3Options: [row[14], row[15], row[16], row[17]].filter(Boolean),
      hotkey4: row[18] || '',
      hotkey5Options: [row[19], row[20], row[21]].filter(Boolean),
    });
  }
  
  return weapons;
}

function parseArmorSheet(rows: string[][]): ArmorRow[] {
  if (rows.length < 2) return [];
  
  const armor: ArmorRow[] = [];
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[2]) continue; // Skip empty rows
    
    armor.push({
      itemType: row[0] || '',
      material: row[1] || '',
      name: row[2] || '',
      lore: row[3] || '',
      tierProgression: row[4] || 'T1-T8',
      hp: row[5] || '50 +10',
      mana: row[6] || '50 +10',
      crit: row[7] || '5 +0.5',
      block: row[8] || '2 +0.2',
      defense: row[9] || '10 +2',
      passive: row[10] || '',
      attribute: row[11] || '',
      effect: row[12] || '',
      proc: row[13] || '',
      setBonus: row[14] || '',
    });
  }
  
  return armor;
}

export async function fetchWeaponsFromSheet(): Promise<WeaponRow[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (weaponsCache && (now - weaponsCacheTime) < CACHE_DURATION) {
    return weaponsCache;
  }
  
  const sheetUrl = process.env.GOOGLE_SHEET_WEAPONS;
  if (!sheetUrl) {
    console.log('GOOGLE_SHEET_WEAPONS not configured');
    return [];
  }
  
  try {
    const csv = await fetchSheetAsCSV(sheetUrl);
    const rows = parseCSV(csv);
    weaponsCache = parseWeaponsSheet(rows);
    weaponsCacheTime = now;
    console.log(`Fetched ${weaponsCache.length} weapons from Google Sheet`);
    return weaponsCache;
  } catch (error) {
    console.error('Error fetching weapons sheet:', error);
    return weaponsCache || [];
  }
}

export async function fetchArmorFromSheet(): Promise<ArmorRow[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (armorCache && (now - armorCacheTime) < CACHE_DURATION) {
    return armorCache;
  }
  
  const sheetUrl = process.env.GOOGLE_SHEET_ARMOR;
  if (!sheetUrl) {
    console.log('GOOGLE_SHEET_ARMOR not configured');
    return [];
  }
  
  try {
    const csv = await fetchSheetAsCSV(sheetUrl);
    const rows = parseCSV(csv);
    armorCache = parseArmorSheet(rows);
    armorCacheTime = now;
    console.log(`Fetched ${armorCache.length} armor pieces from Google Sheet`);
    return armorCache;
  } catch (error) {
    console.error('Error fetching armor sheet:', error);
    return armorCache || [];
  }
}

function parseChefSheet(rows: string[][]): ChefRow[] {
  if (rows.length < 2) return [];
  
  const items: ChefRow[] = [];
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) continue; // Skip empty rows
    
    items.push({
      category: row[0] || '',
      name: row[1] || '',
      description: row[2] || '',
      tier: row[3] || 'T1',
      ingredients: (row[4] || '').split(',').map(s => s.trim()).filter(Boolean),
      effects: (row[5] || '').split(',').map(s => s.trim()).filter(Boolean),
      duration: row[6] || '',
      cooldown: row[7] || '',
    });
  }
  
  return items;
}

function parseItemsSheet(rows: string[][]): ItemRow[] {
  if (rows.length < 2) return [];
  
  const items: ItemRow[] = [];
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) continue; // Skip empty rows
    
    items.push({
      category: row[0] || '',
      name: row[1] || '',
      description: row[2] || '',
      tier: row[3] || 'T1',
      rarity: row[4] || 'Common',
      source: row[5] || '',
      usedFor: row[6] || '',
      stackable: row[7] || 'Yes',
      value: row[8] || '0',
    });
  }
  
  return items;
}

export async function fetchChefFromSheet(): Promise<ChefRow[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (chefCache && (now - chefCacheTime) < CACHE_DURATION) {
    return chefCache;
  }
  
  const sheetUrl = process.env.GOOGLE_SHEET_CHEF;
  if (!sheetUrl) {
    console.log('GOOGLE_SHEET_CHEF not configured');
    return [];
  }
  
  try {
    const csv = await fetchSheetAsCSV(sheetUrl);
    const rows = parseCSV(csv);
    chefCache = parseChefSheet(rows);
    chefCacheTime = now;
    console.log(`Fetched ${chefCache.length} chef items from Google Sheet`);
    return chefCache;
  } catch (error) {
    console.error('Error fetching chef sheet:', error);
    return chefCache || [];
  }
}

export async function fetchItemsFromSheet(): Promise<ItemRow[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (itemsCache && (now - itemsCacheTime) < CACHE_DURATION) {
    return itemsCache;
  }
  
  const sheetUrl = process.env.GOOGLE_SHEET_ITEMS;
  if (!sheetUrl) {
    console.log('GOOGLE_SHEET_ITEMS not configured');
    return [];
  }
  
  try {
    const csv = await fetchSheetAsCSV(sheetUrl);
    const rows = parseCSV(csv);
    itemsCache = parseItemsSheet(rows);
    itemsCacheTime = now;
    console.log(`Fetched ${itemsCache.length} items from Google Sheet`);
    return itemsCache;
  } catch (error) {
    console.error('Error fetching items sheet:', error);
    return itemsCache || [];
  }
}

function parseCraftingSheet(rows: string[][]): CraftingRow[] {
  if (rows.length < 2) return [];
  
  const items: CraftingRow[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) continue;
    
    items.push({
      profession: row[0] || '',
      recipeName: row[1] || '',
      category: row[2] || '',
      tier: row[3] || 'T1',
      ingredients: (row[4] || '').split(',').map(s => s.trim()).filter(Boolean),
      craftTime: row[5] || '',
      xpReward: row[6] || '',
      acquisition: row[7] || 'purchasable',
      description: row[8] || '',
    });
  }
  
  return items;
}

export async function fetchCraftingFromSheet(): Promise<CraftingRow[]> {
  const now = Date.now();
  
  if (craftingCache && (now - craftingCacheTime) < CACHE_DURATION) {
    return craftingCache;
  }
  
  const sheetUrl = process.env.GOOGLE_CRAFTING_SHEETS;
  if (!sheetUrl) {
    console.log('GOOGLE_CRAFTING_SHEETS not configured');
    return [];
  }
  
  try {
    const csv = await fetchSheetAsCSV(sheetUrl);
    const rows = parseCSV(csv);
    craftingCache = parseCraftingSheet(rows);
    craftingCacheTime = now;
    console.log(`Fetched ${craftingCache.length} crafting recipes from Google Sheet`);
    return craftingCache;
  } catch (error) {
    console.error('Error fetching crafting sheet:', error);
    return craftingCache || [];
  }
}

function parseAccountsSheet(rows: string[][]): AccountRow[] {
  if (rows.length < 2) return [];
  
  const accounts: AccountRow[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) continue;
    
    accounts.push({
      id: row[0] || '',
      username: row[1] || '',
      email: row[2] || '',
      displayName: row[3] || '',
      puterId: row[4] || '',
      avatarUrl: row[5] || '',
      isPremium: row[6] || 'FALSE',
      premiumUntil: row[7] || '',
      createdAt: row[8] || '',
      lastLoginAt: row[9] || '',
      settings: row[10] || '{}',
    });
  }
  
  return accounts;
}

export async function fetchAccountsFromSheet(): Promise<AccountRow[]> {
  const now = Date.now();
  
  if (accountsCache && (now - accountsCacheTime) < CACHE_DURATION) {
    return accountsCache;
  }
  
  const sheetUrl = process.env.GOOGLE_SHEET_ACCOUNT;
  if (!sheetUrl) {
    console.log('GOOGLE_SHEET_ACCOUNT not configured');
    return [];
  }
  
  try {
    const csv = await fetchSheetAsCSV(sheetUrl);
    const rows = parseCSV(csv);
    accountsCache = parseAccountsSheet(rows);
    accountsCacheTime = now;
    console.log(`Fetched ${accountsCache.length} accounts from Google Sheet`);
    return accountsCache;
  } catch (error) {
    console.error('Error fetching accounts sheet:', error);
    return accountsCache || [];
  }
}

export function getAccountSheetConfigured(): boolean {
  return !!process.env.GOOGLE_SHEET_ACCOUNT;
}

// Clear cache to force refresh
export function clearSheetsCache() {
  weaponsCache = null;
  armorCache = null;
  chefCache = null;
  itemsCache = null;
  craftingCache = null;
  accountsCache = null;
  weaponsCacheTime = 0;
  armorCacheTime = 0;
  chefCacheTime = 0;
  itemsCacheTime = 0;
  craftingCacheTime = 0;
  accountsCacheTime = 0;
}

// Get cache status
export function getCacheStatus() {
  const now = Date.now();
  return {
    weapons: {
      cached: !!weaponsCache,
      count: weaponsCache?.length || 0,
      ageMs: weaponsCacheTime ? now - weaponsCacheTime : null,
      fresh: weaponsCacheTime ? (now - weaponsCacheTime) < CACHE_DURATION : false,
    },
    armor: {
      cached: !!armorCache,
      count: armorCache?.length || 0,
      ageMs: armorCacheTime ? now - armorCacheTime : null,
      fresh: armorCacheTime ? (now - armorCacheTime) < CACHE_DURATION : false,
    },
    chef: {
      cached: !!chefCache,
      count: chefCache?.length || 0,
      ageMs: chefCacheTime ? now - chefCacheTime : null,
      fresh: chefCacheTime ? (now - chefCacheTime) < CACHE_DURATION : false,
    },
    items: {
      cached: !!itemsCache,
      count: itemsCache?.length || 0,
      ageMs: itemsCacheTime ? now - itemsCacheTime : null,
      fresh: itemsCacheTime ? (now - itemsCacheTime) < CACHE_DURATION : false,
    },
    crafting: {
      cached: !!craftingCache,
      count: craftingCache?.length || 0,
      ageMs: craftingCacheTime ? now - craftingCacheTime : null,
      fresh: craftingCacheTime ? (now - craftingCacheTime) < CACHE_DURATION : false,
    },
    accounts: {
      cached: !!accountsCache,
      count: accountsCache?.length || 0,
      ageMs: accountsCacheTime ? now - accountsCacheTime : null,
      fresh: accountsCacheTime ? (now - accountsCacheTime) < CACHE_DURATION : false,
      configured: !!process.env.GOOGLE_SHEET_ACCOUNT,
    },
  };
}

// ============================================
// GOOGLE SHEETS WRITE OPERATIONS (Accounts)
// ============================================

// Get authenticated Sheets client
async function getSheetsClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  }
  
  const auth = new GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  return sheets({ version: 'v4', auth });
}

// Account data for write operations
export interface AccountWriteData {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  puterId?: string;
  avatarUrl?: string;
  isPremium?: boolean;
  premiumUntil?: string;
  createdAt?: string;
  lastLoginAt?: string;
  settings?: Record<string, any>;
}

// Convert account data to sheet row values
function accountToRowValues(account: AccountWriteData): string[] {
  return [
    account.id,
    account.username,
    account.email || '',
    account.displayName || '',
    account.puterId || '',
    account.avatarUrl || '',
    account.isPremium ? 'TRUE' : 'FALSE',
    account.premiumUntil || '',
    account.createdAt || new Date().toISOString(),
    account.lastLoginAt || new Date().toISOString(),
    account.settings ? JSON.stringify(account.settings) : '{}',
  ];
}

// Append new account row to sheet (for registration)
export async function appendAccountToSheet(account: AccountWriteData): Promise<{ success: boolean; error?: string }> {
  const sheetUrl = process.env.GOOGLE_SHEET_ACCOUNT;
  if (!sheetUrl) {
    return { success: false, error: 'GOOGLE_SHEET_ACCOUNT not configured' };
  }
  
  try {
    const sheetsClient = await getSheetsClient();
    const sheetId = extractSheetId(sheetUrl);
    
    const values = [accountToRowValues(account)];
    
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });
    
    // Clear cache to reflect new data
    accountsCache = null;
    accountsCacheTime = 0;
    
    return { success: true };
  } catch (error) {
    console.error('Error appending account to sheet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to write to sheet' };
  }
}

// Update existing account row in sheet
export async function updateAccountInSheet(accountId: string, updates: Partial<AccountWriteData>): Promise<{ success: boolean; error?: string }> {
  const sheetUrl = process.env.GOOGLE_SHEET_ACCOUNT;
  if (!sheetUrl) {
    return { success: false, error: 'GOOGLE_SHEET_ACCOUNT not configured' };
  }
  
  try {
    const sheetsClient = await getSheetsClient();
    const sheetId = extractSheetId(sheetUrl);
    
    // First, find the row with this account ID
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:K',
    });
    
    const rows = response.data.values || [];
    let rowIndex = -1;
    
    for (let i = 1; i < rows.length; i++) { // Skip header row
      if (rows[i][0] === accountId) {
        rowIndex = i + 1; // 1-indexed for Sheets API
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, error: 'Account not found in sheet' };
    }
    
    // Merge existing data with updates
    const existingRow = rows[rowIndex - 1];
    const mergedAccount: AccountWriteData = {
      id: accountId,
      username: updates.username || existingRow[1] || '',
      email: updates.email !== undefined ? updates.email : existingRow[2],
      displayName: updates.displayName !== undefined ? updates.displayName : existingRow[3],
      puterId: updates.puterId !== undefined ? updates.puterId : existingRow[4],
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : existingRow[5],
      isPremium: updates.isPremium !== undefined ? updates.isPremium : existingRow[6] === 'TRUE',
      premiumUntil: updates.premiumUntil !== undefined ? updates.premiumUntil : existingRow[7],
      createdAt: existingRow[8] || new Date().toISOString(),
      lastLoginAt: updates.lastLoginAt || new Date().toISOString(),
      settings: updates.settings !== undefined ? updates.settings : (existingRow[10] ? JSON.parse(existingRow[10]) : {}),
    };
    
    const values = [accountToRowValues(mergedAccount)];
    
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Sheet1!A${rowIndex}:K${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    
    // Clear cache to reflect updated data
    accountsCache = null;
    accountsCacheTime = 0;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating account in sheet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update sheet' };
  }
}

// Check if Google Sheets write is configured (requires service account)
export function isSheetWriteConfigured(): boolean {
  return !!process.env.GOOGLE_SHEET_ACCOUNT && !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

// Get account schema info for documentation
export function getAccountSheetSchema() {
  return {
    sheetName: 'GOOGLE_SHEET_ACCOUNT',
    columns: [
      { column: 'A', field: 'id', type: 'UUID', description: 'Unique account identifier', required: true },
      { column: 'B', field: 'username', type: 'string', description: 'Unique login name', required: true },
      { column: 'C', field: 'email', type: 'string', description: 'Email address', required: false },
      { column: 'D', field: 'displayName', type: 'string', description: 'Public display name', required: false },
      { column: 'E', field: 'puterId', type: 'string', description: 'Puter.com account ID for SSO', required: false },
      { column: 'F', field: 'avatarUrl', type: 'URL', description: 'Profile picture URL', required: false },
      { column: 'G', field: 'isPremium', type: 'boolean', description: 'TRUE or FALSE', required: false },
      { column: 'H', field: 'premiumUntil', type: 'ISO date', description: 'Premium expiration date', required: false },
      { column: 'I', field: 'createdAt', type: 'ISO date', description: 'Account creation timestamp', required: true },
      { column: 'J', field: 'lastLoginAt', type: 'ISO date', description: 'Last login timestamp', required: false },
      { column: 'K', field: 'settings', type: 'JSON', description: 'User preferences as JSON string', required: false },
    ],
    notes: [
      'Password is NOT stored in Google Sheets (only in PostgreSQL for security)',
      'Requires GOOGLE_SERVICE_ACCOUNT_JSON for write operations',
      'Sheet must be shared with the service account email for write access',
    ],
  };
}
