// Puter Cloud Storage Sync Service for GRUDGE Warlords
// Syncs all Google Sheets data to Puter FS for cloud backup and cross-app access

import { 
  fetchWeaponsFromSheet, 
  fetchArmorFromSheet, 
  fetchChefFromSheet, 
  fetchItemsFromSheet, 
  fetchCraftingFromSheet,
  fetchAccountsFromSheet,
  getCacheStatus
} from './googleSheets';

// Puter API configuration
const PUTER_API_BASE = 'https://api.puter.com';

interface PuterSyncConfig {
  basePath: string;
  sheetsToSync: string[];
}

const DEFAULT_CONFIG: PuterSyncConfig = {
  basePath: 'grudge/sheets',
  sheetsToSync: ['weapons', 'armor', 'chef', 'items', 'crafting', 'accounts']
};

// Sync status tracking
interface SyncStatus {
  lastSync: string | null;
  sheets: Record<string, {
    lastSync: string | null;
    itemCount: number;
    error: string | null;
  }>;
}

let syncStatus: SyncStatus = {
  lastSync: null,
  sheets: {}
};

// In-memory storage for synced data (for apps without Puter access)
let puterDataStore: Record<string, any[]> = {};

// Valid sheet names
export const VALID_SHEET_NAMES = ['weapons', 'armor', 'chef', 'items', 'crafting', 'accounts'] as const;
export type SheetName = typeof VALID_SHEET_NAMES[number];

// Validate sheet name
export function isValidSheetName(name: string): name is SheetName {
  return VALID_SHEET_NAMES.includes(name as SheetName);
}

// Fetch data from Google Sheets and prepare for Puter storage
async function fetchSheetData(sheetName: SheetName): Promise<any[]> {
  switch (sheetName) {
    case 'weapons':
      return await fetchWeaponsFromSheet();
    case 'armor':
      return await fetchArmorFromSheet();
    case 'chef':
      return await fetchChefFromSheet();
    case 'items':
      return await fetchItemsFromSheet();
    case 'crafting':
      return await fetchCraftingFromSheet();
    case 'accounts':
      return await fetchAccountsFromSheet();
  }
}

// Sync a single sheet to in-memory store
// Note: Puter FS writes require client-side authentication. The backend provides
// data export endpoints that Puter apps can use to store data in Puter FS.
export async function syncSheetToStore(sheetName: string): Promise<{ success: boolean; count: number; error?: string }> {
  // Validate sheet name
  if (!isValidSheetName(sheetName)) {
    return { success: false, count: 0, error: `Invalid sheet name: ${sheetName}. Valid names: ${VALID_SHEET_NAMES.join(', ')}` };
  }
  
  try {
    const data = await fetchSheetData(sheetName);
    puterDataStore[sheetName] = data;
    
    syncStatus.sheets[sheetName] = {
      lastSync: new Date().toISOString(),
      itemCount: data.length,
      error: null
    };
    
    console.log(`Synced ${data.length} items from ${sheetName} to store`);
    return { success: true, count: data.length };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    syncStatus.sheets[sheetName] = {
      lastSync: syncStatus.sheets[sheetName]?.lastSync || null,
      itemCount: syncStatus.sheets[sheetName]?.itemCount || 0,
      error: errorMsg
    };
    console.error(`Failed to sync ${sheetName}:`, error);
    return { success: false, count: 0, error: errorMsg };
  }
}

// Sync all sheets to store
export async function syncAllSheetsToStore(): Promise<{
  success: boolean;
  results: Record<string, { success: boolean; count: number; error?: string }>;
}> {
  const results: Record<string, { success: boolean; count: number; error?: string }> = {};
  
  for (const sheetName of DEFAULT_CONFIG.sheetsToSync) {
    results[sheetName] = await syncSheetToStore(sheetName);
  }
  
  syncStatus.lastSync = new Date().toISOString();
  
  const allSuccess = Object.values(results).every(r => r.success);
  return { success: allSuccess, results };
}

// Get synced data from store
export function getStoredSheetData(sheetName: string): any[] | null {
  return puterDataStore[sheetName] || null;
}

// Get sync status
export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

// Generate Puter FS-compatible JSON export for client-side upload
export async function generatePuterExport(): Promise<{
  timestamp: string;
  sheets: Record<string, any[]>;
  meta: {
    totalItems: number;
    sheetCounts: Record<string, number>;
  };
}> {
  // Ensure all sheets are synced
  await syncAllSheetsToStore();
  
  const sheetCounts: Record<string, number> = {};
  let totalItems = 0;
  
  for (const [name, data] of Object.entries(puterDataStore)) {
    sheetCounts[name] = data.length;
    totalItems += data.length;
  }
  
  return {
    timestamp: new Date().toISOString(),
    sheets: { ...puterDataStore },
    meta: {
      totalItems,
      sheetCounts
    }
  };
}

// GrudgeAccount schema for Puter KV and Google Sheets sync
export const GRUDGE_ACCOUNT_SCHEMA = {
  columns: [
    { key: 'id', column: 'A', type: 'UUID', required: true, description: 'Unique account ID (gen_random_uuid)' },
    { key: 'username', column: 'B', type: 'string', required: true, description: 'Unique login username' },
    { key: 'email', column: 'C', type: 'string', required: false, description: 'Email address' },
    { key: 'displayName', column: 'D', type: 'string', required: false, description: 'Public display name' },
    { key: 'puterId', column: 'E', type: 'string', required: false, description: 'Puter.com user ID for SSO' },
    { key: 'avatarUrl', column: 'F', type: 'URL', required: false, description: 'Profile picture URL' },
    { key: 'isPremium', column: 'G', type: 'boolean', required: false, description: 'Premium subscription status' },
    { key: 'premiumUntil', column: 'H', type: 'ISO date', required: false, description: 'Premium expiration date' },
    { key: 'createdAt', column: 'I', type: 'ISO date', required: true, description: 'Account creation timestamp' },
    { key: 'lastLoginAt', column: 'J', type: 'ISO date', required: false, description: 'Last login timestamp' },
    { key: 'settings', column: 'K', type: 'JSON', required: false, description: 'User preferences as JSON' }
  ],
  notes: [
    'Password is NEVER stored in Google Sheets (only in PostgreSQL with bcrypt)',
    'Column order matches GrudgeAccount database schema',
    'isPremium uses TRUE/FALSE strings in sheets',
    'settings is a JSON string in sheets, parsed as object in app'
  ]
};

// Generate header row for new Google Sheet
export function generateAccountSheetHeader(): string[] {
  return GRUDGE_ACCOUNT_SCHEMA.columns.map(col => col.key);
}

// Convert DB account to sheet row
export function accountToSheetRow(account: {
  id: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  puterId?: string | null;
  avatarUrl?: string | null;
  isPremium?: boolean;
  premiumUntil?: Date | null;
  createdAt?: Date;
  lastLoginAt?: Date | null;
  settings?: Record<string, any> | null;
}): string[] {
  return [
    account.id,
    account.username,
    account.email || '',
    account.displayName || '',
    account.puterId || '',
    account.avatarUrl || '',
    account.isPremium ? 'TRUE' : 'FALSE',
    account.premiumUntil ? account.premiumUntil.toISOString() : '',
    account.createdAt ? account.createdAt.toISOString() : new Date().toISOString(),
    account.lastLoginAt ? account.lastLoginAt.toISOString() : '',
    account.settings ? JSON.stringify(account.settings) : '{}'
  ];
}

// Parse sheet row to account object
export function sheetRowToAccount(row: string[]): {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  puterId: string | null;
  avatarUrl: string | null;
  isPremium: boolean;
  premiumUntil: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  settings: Record<string, any>;
} {
  return {
    id: row[0] || '',
    username: row[1] || '',
    email: row[2] || null,
    displayName: row[3] || null,
    puterId: row[4] || null,
    avatarUrl: row[5] || null,
    isPremium: row[6] === 'TRUE',
    premiumUntil: row[7] ? new Date(row[7]) : null,
    createdAt: row[8] ? new Date(row[8]) : new Date(),
    lastLoginAt: row[9] ? new Date(row[9]) : null,
    settings: row[10] ? JSON.parse(row[10]) : {}
  };
}

// Puter client-side code generator for syncing
export function generatePuterSyncCode(): string {
  return `
// Puter FS Sync Client for GRUDGE Warlords
// Run this in a Puter app to sync sheets data

const BACKEND_URL = localStorage.getItem('grudge_backend_url') || 'https://grudge-warlords.replit.app';
const SHEETS_PATH = 'grudge/sheets';

async function fetchAndStoreSheets() {
    try {
        // Fetch export from backend
        const response = await fetch(BACKEND_URL + '/api/puter/export');
        const data = await response.json();
        
        // Create base directory
        try {
            await puter.fs.mkdir(SHEETS_PATH, { createMissingParents: true });
        } catch (e) { /* exists */ }
        
        // Store each sheet as JSON
        for (const [sheetName, sheetData] of Object.entries(data.sheets)) {
            const path = SHEETS_PATH + '/' + sheetName + '.json';
            await puter.fs.write(path, JSON.stringify(sheetData, null, 2));
            console.log('Stored ' + sheetName + ': ' + sheetData.length + ' items');
        }
        
        // Store metadata
        await puter.fs.write(SHEETS_PATH + '/meta.json', JSON.stringify({
            lastSync: new Date().toISOString(),
            source: BACKEND_URL,
            ...data.meta
        }, null, 2));
        
        console.log('Sync complete! Total items:', data.meta.totalItems);
        return { success: true, ...data.meta };
    } catch (error) {
        console.error('Sync failed:', error);
        return { success: false, error: error.message };
    }
}

async function loadSheetFromPuter(sheetName) {
    try {
        const blob = await puter.fs.read(SHEETS_PATH + '/' + sheetName + '.json');
        const content = await blob.text();
        return JSON.parse(content);
    } catch (e) {
        console.log('Sheet not cached, fetching from backend...');
        const response = await fetch(BACKEND_URL + '/api/sheets/' + sheetName);
        return await response.json();
    }
}

// Export for use
window.GrudgeSync = { fetchAndStoreSheets, loadSheetFromPuter };
`;
}
