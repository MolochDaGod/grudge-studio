import crypto from 'crypto';
import { appendAccountToSheet, updateAccountInSheet, type AccountWriteData } from './googleSheets';

interface AccountChange {
  accountId: string;
  data: Partial<AccountWriteData>;
  isNew: boolean;
  timestamp: number;
}

interface ActivityLogEntry {
  accountId: string;
  action: 'item_acquired' | 'item_sold' | 'equipment_changed' | 'inventory_update' | 'skill_unlocked' | 'level_up';
  details: Record<string, any>;
  timestamp: string;
}

const accountSnapshots = new Map<string, AccountWriteData>();
const accountHashes = new Map<string, string>();
const pendingChanges = new Map<string, AccountChange>();
const activityBuffer: ActivityLogEntry[] = [];
let batchWriteTimer: NodeJS.Timeout | null = null;

const BATCH_DELAY_MS = 30000;
const MAX_BATCH_SIZE = 50;

function generateSHA256(data: AccountWriteData): string {
  const normalized: AccountWriteData = {
    id: data.id || '',
    username: data.username || '',
    email: data.email || '',
    displayName: data.displayName || '',
    puterId: data.puterId || '',
    avatarUrl: data.avatarUrl || '',
    isPremium: data.isPremium || false,
    premiumUntil: data.premiumUntil || '',
    createdAt: data.createdAt || '',
    lastLoginAt: data.lastLoginAt || '',
    settings: data.settings || {},
  };
  const json = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash('sha256').update(json).digest('hex').substring(0, 16);
}

function mergeAccountData(existing: AccountWriteData | undefined, updates: Partial<AccountWriteData>): AccountWriteData {
  return {
    id: updates.id || existing?.id || '',
    username: updates.username || existing?.username || '',
    email: updates.email !== undefined ? updates.email : existing?.email,
    displayName: updates.displayName !== undefined ? updates.displayName : existing?.displayName,
    puterId: updates.puterId !== undefined ? updates.puterId : existing?.puterId,
    avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : existing?.avatarUrl,
    isPremium: updates.isPremium !== undefined ? updates.isPremium : existing?.isPremium,
    premiumUntil: updates.premiumUntil !== undefined ? updates.premiumUntil : existing?.premiumUntil,
    createdAt: existing?.createdAt || updates.createdAt || new Date().toISOString(),
    lastLoginAt: updates.lastLoginAt || new Date().toISOString(),
    settings: updates.settings !== undefined ? updates.settings : existing?.settings,
  };
}

export function setAccountSnapshot(accountId: string, data: AccountWriteData): void {
  accountSnapshots.set(accountId, data);
  const hash = generateSHA256(data);
  accountHashes.set(accountId, hash);
  console.log(`[AccountSync] Set snapshot for account ${accountId} (hash: ${hash})`);
}

export function hasAccountChanged(accountId: string, updates: Partial<AccountWriteData>): boolean {
  const existing = accountSnapshots.get(accountId);
  const merged = mergeAccountData(existing, updates);
  const newHash = generateSHA256(merged);
  const existingHash = accountHashes.get(accountId);
  
  if (existingHash === newHash) {
    console.log(`[AccountSync] No changes detected for account ${accountId} (hash: ${newHash})`);
    return false;
  }
  
  return true;
}

export function updateAccountHash(accountId: string, data: AccountWriteData): void {
  accountSnapshots.set(accountId, data);
  const hash = generateSHA256(data);
  accountHashes.set(accountId, hash);
  console.log(`[AccountSync] Updated hash for account ${accountId}: ${hash}`);
}

function validateAccountData(data: Partial<AccountWriteData>, isNew: boolean): string | null {
  if (isNew) {
    if (!data.id || typeof data.id !== 'string') {
      return 'New account requires id';
    }
    if (!data.username || typeof data.username !== 'string') {
      return 'New account requires username';
    }
  }
  
  if (Object.keys(data).length === 0) {
    return 'No data provided';
  }
  
  return null;
}

export function queueAccountChange(
  accountId: string, 
  data: Partial<AccountWriteData>, 
  isNew: boolean = false
): { queued: boolean; reason: string } {
  const validationError = validateAccountData(data, isNew);
  if (validationError) {
    return { queued: false, reason: validationError };
  }
  
  if (!isNew && !hasAccountChanged(accountId, data)) {
    return { queued: false, reason: 'No changes detected (SHA match)' };
  }
  
  const existing = pendingChanges.get(accountId);
  if (existing) {
    pendingChanges.set(accountId, {
      accountId,
      data: { ...existing.data, ...data },
      isNew: existing.isNew || isNew,
      timestamp: Date.now(),
    });
    console.log(`[AccountSync] Coalesced changes for account ${accountId}`);
  } else {
    pendingChanges.set(accountId, {
      accountId,
      data,
      isNew,
      timestamp: Date.now(),
    });
    console.log(`[AccountSync] Queued ${isNew ? 'new' : 'update'} for account ${accountId}`);
  }
  
  scheduleBatchWrite();
  
  return { queued: true, reason: isNew ? 'New account queued' : 'Update queued' };
}

function scheduleBatchWrite(): void {
  if (batchWriteTimer) return;
  
  batchWriteTimer = setTimeout(async () => {
    batchWriteTimer = null;
    await flushAccountChanges();
  }, BATCH_DELAY_MS);
  
  console.log(`[AccountSync] Batch write scheduled in ${BATCH_DELAY_MS}ms`);
}

export async function flushAccountChanges(): Promise<{ 
  processed: number; 
  success: number; 
  failed: number;
  skipped: number;
  remaining: number;
}> {
  const allChanges = Array.from(pendingChanges.entries());
  
  if (allChanges.length === 0) {
    return { processed: 0, success: 0, failed: 0, skipped: 0, remaining: 0 };
  }
  
  const batch = allChanges.slice(0, MAX_BATCH_SIZE);
  const remaining = allChanges.slice(MAX_BATCH_SIZE);
  
  for (const [id] of batch) {
    pendingChanges.delete(id);
  }
  
  console.log(`[AccountSync] Flushing ${batch.length} account changes (${remaining.length} remaining)...`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const [, change] of batch) {
    try {
      const existing = accountSnapshots.get(change.accountId);
      const mergedData = mergeAccountData(existing, change.data);
      
      if (change.isNew) {
        const result = await appendAccountToSheet(mergedData);
        if (result.success) {
          updateAccountHash(change.accountId, mergedData);
          success++;
        } else {
          console.error(`[AccountSync] Failed to append account ${change.accountId}:`, result.error);
          failed++;
        }
      } else {
        const newHash = generateSHA256(mergedData);
        const existingHash = accountHashes.get(change.accountId);
        
        if (existingHash === newHash) {
          skipped++;
          continue;
        }
        
        const result = await updateAccountInSheet(change.accountId, mergedData);
        if (result.success) {
          updateAccountHash(change.accountId, mergedData);
          success++;
        } else {
          console.error(`[AccountSync] Failed to update account ${change.accountId}:`, result.error);
          failed++;
        }
      }
    } catch (error) {
      console.error(`[AccountSync] Error processing account ${change.accountId}:`, error);
      failed++;
    }
  }
  
  console.log(`[AccountSync] Batch complete: ${success} success, ${failed} failed, ${skipped} skipped, ${remaining.length} remaining`);
  
  if (remaining.length > 0) {
    scheduleBatchWrite();
  }
  
  return { processed: batch.length, success, failed, skipped, remaining: remaining.length };
}

export function logActivity(
  accountId: string,
  action: ActivityLogEntry['action'],
  details: Record<string, any>
): void {
  const entry: ActivityLogEntry = {
    accountId,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  
  activityBuffer.push(entry);
  console.log(`[Activity] ${action} for account ${accountId}:`, details);
  
  if (activityBuffer.length >= 100) {
    const overflow = activityBuffer.splice(0, 50);
    console.log(`[Activity] Buffer overflow, dropped ${overflow.length} oldest entries`);
  }
}

export function getRecentActivity(accountId?: string, limit: number = 50): ActivityLogEntry[] {
  let activities = [...activityBuffer];
  
  if (accountId) {
    activities = activities.filter(a => a.accountId === accountId);
  }
  
  return activities.slice(-limit);
}

export function generatePuterActivityCode(accountId: string): string {
  return `
async function logActivityToPuter(action, details) {
  const entry = {
    accountId: '${accountId}',
    action,
    details,
    timestamp: new Date().toISOString()
  };
  
  const logPath = 'grudge/activity/${accountId}';
  
  try {
    await puter.fs.mkdir(logPath, { createMissingParents: true });
  } catch (e) {}
  
  const filename = \`\${logPath}/\${Date.now()}.json\`;
  await puter.fs.write(filename, JSON.stringify(entry));
  
  const kvKey = 'activity_${accountId}_latest';
  const existing = await puter.kv.get(kvKey) || [];
  existing.push(entry);
  if (existing.length > 100) existing.shift();
  await puter.kv.set(kvKey, existing);
}

async function getActivityFromPuter(limit = 50) {
  const kvKey = 'activity_${accountId}_latest';
  const activities = await puter.kv.get(kvKey) || [];
  return activities.slice(-limit);
}
`;
}

export function getSyncStatus(): {
  pendingChanges: number;
  cachedHashes: number;
  activityBufferSize: number;
  batchPending: boolean;
} {
  return {
    pendingChanges: pendingChanges.size,
    cachedHashes: accountHashes.size,
    activityBufferSize: activityBuffer.length,
    batchPending: batchWriteTimer !== null,
  };
}

export function clearSyncState(): void {
  accountHashes.clear();
  pendingChanges.clear();
  activityBuffer.length = 0;
  if (batchWriteTimer) {
    clearTimeout(batchWriteTimer);
    batchWriteTimer = null;
  }
  console.log('[AccountSync] State cleared');
}
