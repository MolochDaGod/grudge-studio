/**
 * ObjectStore Loader
 * Fetches and caches game data JSON from GitHub Pages ObjectStore.
 * No data duplication — runtime fetch with in-memory TTL cache.
 */

const OBJECT_STORE_BASE = process.env.OBJECT_STORE_URL || 'https://molochdagod.github.io/ObjectStore';

// All available ObjectStore datasets
const DATASETS = [
  'weapons', 'equipment', 'armor', 'materials', 'consumables',
  'skills', 'professions', 'spriteMaps', 'classes', 'races',
  'factions', 'attributes', 'enemies', 'bosses', 'sprites',
  'ai', 'animations', 'controllers', 'ecs', 'factionUnits',
  'nodeUpgrades', 'rendering', 'terrain', 'tileMaps'
];

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch a single dataset from ObjectStore with caching
 */
export async function fetchDataset(name) {
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
  } catch (err) {
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
export async function preloadAll() {
  const results = {};
  const promises = DATASETS.map(async (name) => {
    try {
      results[name] = await fetchDataset(name);
    } catch (err) {
      console.error(`[ObjectStore] Failed to preload ${name}:`, err.message);
      results[name] = null;
    }
  });

  await Promise.allSettled(promises);
  return results;
}

/**
 * Search across all cached datasets
 */
export async function searchAll(query, options = {}) {
  const q = query.toLowerCase();
  const typeFilter = options.type; // e.g. 'weapons', 'armor'
  const limit = options.limit || 50;
  const results = [];

  const datasetsToSearch = typeFilter
    ? [typeFilter]
    : ['weapons', 'equipment', 'materials', 'consumables', 'skills', 'enemies', 'bosses'];

  for (const dsName of datasetsToSearch) {
    try {
      const data = await fetchDataset(dsName);
      if (!data) continue;

      // Handle different data shapes
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
    } catch (err) {
      console.warn(`[ObjectStore] Search skip ${dsName}:`, err.message);
    }

    if (results.length >= limit) break;
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, limit);
}

/**
 * Extract flat item array from various dataset shapes
 */
function extractItems(data, datasetName) {
  // Most datasets have { categories: { name: { items: [] } } }
  if (data.categories) {
    return Object.values(data.categories).flatMap(cat =>
      Array.isArray(cat.items) ? cat.items : (Array.isArray(cat) ? cat : [cat])
    );
  }

  // Some are flat arrays
  if (Array.isArray(data)) {
    return data;
  }

  // Some have a top-level items array
  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }

  // Fallback: try to extract values
  if (typeof data === 'object') {
    return Object.values(data).filter(v => typeof v === 'object' && v !== null);
  }

  return [];
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  const stats = {};
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

export { DATASETS, OBJECT_STORE_BASE };
