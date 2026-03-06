/**
 * Sync Routes
 * Handles synchronization between GrudgePuter client, Puter cloud, and Grudge Studio.
 */

import { Router } from 'express';

const router = Router();

// In-memory sync state (replace with DB for persistence)
const syncState = {
  lastSync: null,
  pending: [],
  completed: [],
  failed: []
};

/**
 * GET /api/v1/sync/status
 * Get current sync status
 */
router.get('/status', (req, res) => {
  res.json({
    lastSync: syncState.lastSync,
    pending: syncState.pending.length,
    completed: syncState.completed.length,
    failed: syncState.failed.length,
    total: syncState.pending.length + syncState.completed.length + syncState.failed.length
  });
});

/**
 * POST /api/v1/sync
 * Submit a sync batch from GrudgePuter client
 * Body: { assets: [...], direction: 'push' | 'pull', source: 'puter' | 'local' }
 */
router.post('/', async (req, res) => {
  const { assets, direction = 'push', source = 'puter' } = req.body;

  if (!assets || !Array.isArray(assets)) {
    return res.status(400).json({
      error: 'invalid_payload',
      message: 'Assets array is required'
    });
  }

  const syncId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const results = [];

  for (const asset of assets) {
    const syncItem = {
      syncId,
      assetId: asset.id || asset.name,
      assetName: asset.name,
      direction,
      source,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    try {
      // In production: validate, transform, and store the asset
      // For now, mark as synced
      syncItem.status = 'completed';
      syncState.completed.push(syncItem);
    } catch (err) {
      syncItem.status = 'failed';
      syncItem.error = err.message;
      syncState.failed.push(syncItem);
    }

    results.push(syncItem);
  }

  syncState.lastSync = new Date().toISOString();

  res.json({
    syncId,
    direction,
    source,
    total: assets.length,
    completed: results.filter(r => r.status === 'completed').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
    timestamp: syncState.lastSync
  });
});

/**
 * POST /api/v1/sync/pull
 * Pull assets from studio to client
 */
router.post('/pull', async (req, res) => {
  const { assetIds, since } = req.body;

  // In production: query DB for assets modified since timestamp
  // or filter by specific IDs
  res.json({
    assets: [],
    count: 0,
    since: since || null,
    message: 'Pull endpoint ready. Connect database for persistent asset storage.',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/sync/history
 * Get sync history
 */
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  const history = [
    ...syncState.completed.slice(-limit),
    ...syncState.failed.slice(-limit)
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  res.json({
    history,
    count: history.length
  });
});

/**
 * DELETE /api/v1/sync/history
 * Clear sync history
 */
router.delete('/history', (req, res) => {
  syncState.completed = [];
  syncState.failed = [];
  syncState.pending = [];
  res.json({ success: true, message: 'Sync history cleared' });
});

export default router;
