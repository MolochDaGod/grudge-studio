/**
 * ObjectStore Loader
 * Fetches and caches game data JSON from GitHub Pages ObjectStore.
 * Ported from apps/api-server/lib/object-store.js
 */

const OBJECT_STORE_BASE = process.env.OBJECT_STORE_URL || 'https://molochdagod.github.io/ObjectStore';

// All available ObjectStore datasets
export const DATASETS = [
  'weapons', 'equipment', 'armor', 'materials', 'consumables',
  'skills', 'professions', 'spriteMaps', 'classes', 'races',
  'factions', 'attributes', 'enemies', 'bosses', 'sprites',
  'ai', 'animations', 'controllers', 'ecs', 'factionUnits',
  'nodeUpgrades', 'rendering', 'terrain', 'tileMaps'
];

// In-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch a single dataset from ObjectStore with caching
 */
export async function fetchDataset(name: string): Promise<any> {
  if (!DATASETS.includes(name)) {
    return null;
  }

  const cached = cache.get(name);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const url = `${OBJECT_STORE_BASE}/api/v1/${name}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ObjectStore fetch failed: ${res.status} for ${name}`);
    }

    const data = await res.json();
    cache.set(name, { data, timestamp: Date.now() });
    return data;
  } catch (err: any) {
    // Return stale cache if available
    if (cached) {
      console.warn(`[ObjectStore] Using stale cache for ${name}: ${err.message}`);
      return cached.data;
    }
    throw err;
  }
}

/**
 * Preload all datasets into cache
 */
export async function preloadAll(): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  const promises = DATASETS.map(async (name) => {
    try {
      results[name] = await fetchDataset(name);
    } catch (err: any) {
      console.error(`[ObjectStore] Failed to preload ${name}:`, err.message);
      results[name] = null;
    }
  });

  await Promise.allSettled(promises);
  return results;
}

/**
 * Extract flat item array from various dataset shapes
 */
function extractItems(data: any, _datasetName: string): any[] {
  if (data.categories) {
    return Object.values(data.categories).flatMap((cat: any) =>
      Array.isArray(cat.items) ? cat.items : (Array.isArray(cat) ? cat : [cat])
    );
  }
  if (Array.isArray(data)) return data;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (typeof data === 'object') {
    return Object.values(data).filter((v: any) => typeof v === 'object' && v !== null);
  }
  return [];
}

/**
 * Search across all cached datasets
 */
export async function searchAll(
  query: string,
  options: { type?: string | null; limit?: number } = {}
): Promise<Array<{ source: string; item: any; relevance: number }>> {
  const q = query.toLowerCase();
  const typeFilter = options.type;
  const limit = options.limit || 50;
  const results: Array<{ source: string; item: any; relevance: number }> = [];

  const datasetsToSearch = typeFilter
    ? [typeFilter]
    : ['weapons', 'equipment', 'materials', 'consumables', 'skills', 'enemies', 'bosses'];

  for (const dsName of datasetsToSearch) {
    try {
      const data = await fetchDataset(dsName);
      if (!data) continue;

      const items = extractItems(data, dsName);

      for (const item of items) {
        const searchable = JSON.stringify(item).toLowerCase();
        if (searchable.includes(q)) {
          results.push({
            source: dsName,
            item,
            relevance: searchable.split(q).length - 1
          });
        }
        if (results.length >= limit) break;
      }
    } catch (err: any) {
      console.warn(`[ObjectStore] Search skip ${dsName}:`, err.message);
    }
    if (results.length >= limit) break;
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, limit);
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  const stats: Record<string, { age: number; stale: boolean }> = {};
  for (const [key, value] of cache) {
    stats[key] = {
      age: Math.round((Date.now() - value.timestamp) / 1000),
      stale: Date.now() - value.timestamp > CACHE_TTL
    };
  }
  return {
    datasets: DATASETS,
    totalDatasets: DATASETS.length,
    cachedCount: cache.size,
    cacheEntries: stats
  };
}

/**
 * Clear cache (force re-fetch)
 */
export function clearCache() {
  cache.clear();
}

export { OBJECT_STORE_BASE };
