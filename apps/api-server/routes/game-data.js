/**
 * Game Data Routes
 * Serves all ObjectStore JSON datasets through proper REST endpoints.
 * Data is fetched from GitHub Pages and cached in memory.
 */

import { Router } from 'express';
import {
  fetchDataset,
  searchAll,
  getCacheStats,
  clearCache,
  DATASETS
} from '../lib/object-store.js';

const router = Router();

/**
 * GET /api/v1/game-data
 * List all available datasets
 */
router.get('/', (req, res) => {
  res.json({
    datasets: DATASETS.map(name => ({
      name,
      endpoint: `/api/v1/game-data/${name}`
    })),
    total: DATASETS.length,
    cache: getCacheStats()
  });
});

/**
 * GET /api/v1/game-data/search?q=sword&type=weapons&limit=20
 * Cross-resource search
 */
router.get('/search', async (req, res) => {
  const { q, type, limit } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      error: 'invalid_query',
      message: 'Search query (q) must be at least 2 characters'
    });
  }

  try {
    const results = await searchAll(q, {
      type: type || null,
      limit: parseInt(limit) || 50
    });

    res.set('X-Total-Count', results.length);
    res.json({
      query: q,
      type: type || 'all',
      count: results.length,
      results
    });
  } catch (err) {
    console.error('[GameData] Search error:', err);
    res.status(500).json({ error: 'search_failed', message: err.message });
  }
});

/**
 * POST /api/v1/game-data/cache/clear
 * Force clear the ObjectStore cache
 */
router.post('/cache/clear', (req, res) => {
  clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

/**
 * GET /api/v1/game-data/:dataset
 * Get a specific dataset (e.g., weapons, armor, materials)
 */
router.get('/:dataset', async (req, res) => {
  const { dataset } = req.params;

  if (!DATASETS.includes(dataset)) {
    return res.status(404).json({
      error: 'dataset_not_found',
      message: `Unknown dataset: ${dataset}`,
      available: DATASETS
    });
  }

  try {
    const data = await fetchDataset(dataset);

    // Set cache header based on freshness
    const cacheStats = getCacheStats();
    const entry = cacheStats.cacheEntries[dataset];
    res.set('X-Cache-Status', entry?.stale ? 'STALE' : 'HIT');
    res.set('Cache-Control', 'public, max-age=300'); // 5 min browser cache

    res.json({
      dataset,
      data,
      _meta: {
        source: 'objectstore',
        cachedAge: entry?.age || 0
      }
    });
  } catch (err) {
    console.error(`[GameData] Fetch error for ${dataset}:`, err);
    res.status(502).json({
      error: 'fetch_failed',
      message: `Failed to load ${dataset} from ObjectStore`,
      detail: err.message
    });
  }
});

export default router;
