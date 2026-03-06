/**
 * Puter Sprite Worker Client
 * Connects to the deployed Puter worker for AI sprite generation and cloud storage
 */

export const WORKER_URL = 'https://grudge-sprites.puter.work';

interface SpriteGenerateRequest {
  id: string;
  name: string;
  category: string;
}

interface SpriteGenerateResponse {
  success: boolean;
  id: string;
  name: string;
  category: string;
  path: string;
  prompt: string;
  timestamp: string;
}

interface SpriteBatchResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    id: string;
    name: string;
    status: 'success' | 'failed';
    path?: string;
    error?: string;
  }>;
  timestamp: string;
}

interface SpriteManifest {
  success: boolean;
  totalSprites: number;
  categories: number;
  manifest: Record<string, string[]>;
  timestamp: string;
}

interface SpriteListResponse {
  success: boolean;
  category: string;
  count: number;
  sprites: Array<{
    id: string;
    filename: string;
    path: string;
    downloadUrl: string;
  }>;
}

export async function checkWorkerHealth(): Promise<{ status: string; version: string }> {
  try {
    const response = await fetch(`${WORKER_URL}/api/health`);
    return await response.json();
  } catch (error) {
    return { status: 'offline', version: 'unknown' };
  }
}

export async function getCloudManifest(): Promise<SpriteManifest> {
  try {
    const response = await fetch(`${WORKER_URL}/api/manifest`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      totalSprites: 0,
      categories: 0,
      manifest: {},
      timestamp: new Date().toISOString()
    };
  }
}

export async function getCloudSprites(category: string): Promise<SpriteListResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/api/sprites/${category}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      category,
      count: 0,
      sprites: []
    };
  }
}

export async function generateSprite(
  item: SpriteGenerateRequest,
  authToken?: string
): Promise<SpriteGenerateResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${WORKER_URL}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(item)
  });
  
  return await response.json();
}

export async function generateBatch(
  items: SpriteGenerateRequest[],
  delayMs = 2500,
  authToken?: string
): Promise<SpriteBatchResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${WORKER_URL}/api/generate-batch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ items, delayMs })
  });
  
  return await response.json();
}

export function getCloudSpriteUrl(category: string, id: string): string {
  return `${WORKER_URL}/api/sprite/${category}/${id}`;
}

export async function syncCloudSprites(category: string): Promise<SpriteListResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/api/sync/${category}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      category,
      count: 0,
      sprites: []
    };
  }
}

export const WORKER_ENDPOINT = WORKER_URL;

// Puter KV keys for sprite management
const SPRITE_ASSIGNMENTS_KEY = 'grudge_sprite_assignments';
const SPRITE_MANIFEST_KEY = 'grudge_sprite_manifest';

export interface SpriteAssignment {
  spriteId: string;
  spriteCategory: string;
  spritePath: string;
  spriteSource: 'local' | 'cloud';
  assignmentType: 'item' | 'ability' | 'skill' | 'ui' | 'other';
  assignmentName: string;
  assignmentId?: string;
  assignedAt: string;
}

// Check if Puter is available
function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).puter !== 'undefined';
}

// Get Puter instance
function getPuter() {
  if (!isPuterAvailable()) {
    throw new Error('Puter is not available');
  }
  return (window as any).puter;
}

export interface SaveResult {
  success: boolean;
  cloudSync: boolean;
  error?: string;
}

// Save sprite assignment to Puter KV with localStorage fallback
export async function saveSpriteAssignment(assignment: SpriteAssignment): Promise<SaveResult> {
  // Always save to localStorage as backup
  try {
    const stored = localStorage.getItem(SPRITE_ASSIGNMENTS_KEY);
    const assignments: SpriteAssignment[] = stored ? JSON.parse(stored) : [];
    
    const filteredAssignments = assignments.filter(
      a => !(a.spriteId === assignment.spriteId && a.spriteCategory === assignment.spriteCategory)
    );
    filteredAssignments.push(assignment);
    
    localStorage.setItem(SPRITE_ASSIGNMENTS_KEY, JSON.stringify(filteredAssignments));
  } catch {
    // localStorage failed
    return { success: false, cloudSync: false, error: 'Failed to save locally' };
  }

  // Try Puter cloud sync
  if (!isPuterAvailable()) {
    return { success: true, cloudSync: false };
  }

  try {
    const puter = getPuter();
    const existing = await puter.kv.get(SPRITE_ASSIGNMENTS_KEY) as SpriteAssignment[] || [];
    
    const filteredAssignments = existing.filter(
      (a: SpriteAssignment) => !(a.spriteId === assignment.spriteId && a.spriteCategory === assignment.spriteCategory)
    );
    filteredAssignments.push(assignment);
    
    await puter.kv.set(SPRITE_ASSIGNMENTS_KEY, filteredAssignments);
    return { success: true, cloudSync: true };
  } catch (error) {
    console.error('Failed to sync to Puter cloud:', error);
    return { success: true, cloudSync: false, error: 'Cloud sync failed - saved locally' };
  }
}

// Get all sprite assignments
export async function getSpriteAssignments(): Promise<SpriteAssignment[]> {
  if (!isPuterAvailable()) {
    try {
      const stored = localStorage.getItem(SPRITE_ASSIGNMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  try {
    const puter = getPuter();
    const assignments = await puter.kv.get(SPRITE_ASSIGNMENTS_KEY) as SpriteAssignment[];
    return assignments || [];
  } catch (error) {
    console.error('Failed to get sprite assignments:', error);
    return [];
  }
}

// Delete sprite assignment
export async function deleteSpriteAssignment(spriteId: string, spriteCategory: string): Promise<boolean> {
  if (!isPuterAvailable()) {
    try {
      const stored = localStorage.getItem(SPRITE_ASSIGNMENTS_KEY);
      const assignments: SpriteAssignment[] = stored ? JSON.parse(stored) : [];
      const filteredAssignments = assignments.filter(
        a => !(a.spriteId === spriteId && a.spriteCategory === spriteCategory)
      );
      localStorage.setItem(SPRITE_ASSIGNMENTS_KEY, JSON.stringify(filteredAssignments));
      return true;
    } catch {
      return false;
    }
  }

  try {
    const puter = getPuter();
    const existing = await puter.kv.get(SPRITE_ASSIGNMENTS_KEY) as SpriteAssignment[] || [];
    const filteredAssignments = existing.filter(
      (a: SpriteAssignment) => !(a.spriteId === spriteId && a.spriteCategory === spriteCategory)
    );
    await puter.kv.set(SPRITE_ASSIGNMENTS_KEY, filteredAssignments);
    return true;
  } catch (error) {
    console.error('Failed to delete sprite assignment:', error);
    return false;
  }
}

// Upload sprite to Puter cloud storage
export async function uploadSpriteToPuter(
  file: File,
  category: string,
  spriteId: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  if (!isPuterAvailable()) {
    return { success: false, error: 'Puter is not available' };
  }

  try {
    const puter = getPuter();
    
    // Create directory path
    const dirPath = `/grudge-sprites/${category}`;
    
    // Ensure directory exists
    try {
      await puter.fs.mkdir(dirPath);
    } catch {
      // Directory might already exist
    }
    
    // Upload file
    const filePath = `${dirPath}/${spriteId}.png`;
    const result = await puter.fs.write(filePath, file, { createMissingParents: true });
    
    // Update local manifest
    await updateLocalManifest(category, spriteId);
    
    return { success: true, path: result.path };
  } catch (error) {
    console.error('Failed to upload sprite:', error);
    return { success: false, error: String(error) };
  }
}

// Update local sprite manifest in KV
async function updateLocalManifest(category: string, spriteId: string): Promise<void> {
  if (!isPuterAvailable()) return;

  try {
    const puter = getPuter();
    const manifest = await puter.kv.get(SPRITE_MANIFEST_KEY) as Record<string, string[]> || {};
    
    if (!manifest[category]) {
      manifest[category] = [];
    }
    
    if (!manifest[category].includes(spriteId)) {
      manifest[category].push(spriteId);
      await puter.kv.set(SPRITE_MANIFEST_KEY, manifest);
    }
  } catch (error) {
    console.error('Failed to update manifest:', error);
  }
}

// Get local Puter sprite manifest
export async function getLocalPuterManifest(): Promise<Record<string, string[]>> {
  if (!isPuterAvailable()) {
    try {
      const stored = localStorage.getItem(SPRITE_MANIFEST_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  try {
    const puter = getPuter();
    const manifest = await puter.kv.get(SPRITE_MANIFEST_KEY) as Record<string, string[]>;
    return manifest || {};
  } catch (error) {
    console.error('Failed to get manifest:', error);
    return {};
  }
}
