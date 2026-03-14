/**
 * Game Data Routes
 * Serves all ObjectStore JSON datasets through REST endpoints.
 * Ported from apps/api-server/routes/game-data.js
 */

import { Router } from 'express';
import {
  fetchDataset,
  searchAll,
  getCacheStats,
  clearCache,
  DATASETS
} from '../lib/objectStore';

const router = Router();

/** GET /api/game-data — List all available datasets */
router.get('/', (_req, res) => {
  res.json({
    datasets: DATASETS.map(name => ({
      name,
      endpoint: `/api/game-data/${name}`
    })),
    total: DATASETS.length,
    cache: getCacheStats()
  });
});

/** GET /api/game-data/search?q=sword&type=weapons&limit=20 */
router.get('/search', async (req, res) => {
  const { q, type, limit } = req.query;

  if (!q || (q as string).length < 2) {
    return res.status(400).json({
      error: 'invalid_query',
      message: 'Search query (q) must be at least 2 characters'
    });
  }

  try {
    const results = await searchAll(q as string, {
      type: (type as string) || null,
      limit: parseInt(limit as string) || 50
    });

    res.set('X-Total-Count', String(results.length));
    res.json({
      query: q,
      type: type || 'all',
      count: results.length,
      results
    });
  } catch (err: any) {
    console.error('[GameData] Search error:', err);
    res.status(500).json({ error: 'search_failed', message: err.message });
  }
});

/** POST /api/game-data/cache/clear — Force clear ObjectStore cache */
router.post('/cache/clear', (_req, res) => {
  clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

/** GET /api/game-data/:dataset — Get a specific dataset */
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
    const cacheStats = getCacheStats();
    const entry = cacheStats.cacheEntries[dataset];

    res.set('X-Cache-Status', entry?.stale ? 'STALE' : 'HIT');
    res.set('Cache-Control', 'public, max-age=300');

    res.json({
      dataset,
      data,
      _meta: {
        source: 'objectstore',
        cachedAge: entry?.age || 0
      }
    });
  } catch (err: any) {
    console.error(`[GameData] Fetch error for ${dataset}:`, err);
    res.status(502).json({
      error: 'fetch_failed',
      message: `Failed to load ${dataset} from ObjectStore`,
      detail: err.message
    });
  }
});

export default router;
