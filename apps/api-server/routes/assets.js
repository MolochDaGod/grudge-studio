/**
 * Asset Routes
 * CRUD operations for game assets (3D models, textures, audio, etc.)
 * Assets are stored in-memory for now; swap with DB or Puter FS for persistence.
 */

import { Router } from 'express';

const router = Router();

// In-memory asset store (replace with DB in production)
const assets = new Map();

// Supported asset types
const ASSET_TYPES = {
  model: ['.glb', '.gltf', '.fbx', '.obj', '.3ds'],
  texture: ['.png', '.jpg', '.jpeg', '.webp', '.hdr', '.exr'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
  animation: ['.anim', '.bvh'],
  script: ['.js', '.ts', '.json', '.py']
};

/**
 * GET /api/v1/assets
 * List all assets with optional filtering
 */
router.get('/', (req, res) => {
  const { type, project, search, limit = 100, offset = 0 } = req.query;

  let items = [...assets.values()];

  // Filter by type
  if (type) {
    items = items.filter(a => a.type === type);
  }

  // Filter by project
  if (project) {
    items = items.filter(a => a.project === project);
  }

  // Search by name
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(a => a.name.toLowerCase().includes(q));
  }

  // Sort by creation date (newest first)
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Paginate
  const total = items.length;
  const paged = items.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.set('X-Total-Count', total);
  res.json({
    assets: paged,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

/**
 * GET /api/v1/assets/:id
 * Get a single asset by ID
 */
router.get('/:id', (req, res) => {
  const asset = assets.get(req.params.id);

  if (!asset) {
    return res.status(404).json({
      error: 'asset_not_found',
      message: `No asset found with ID: ${req.params.id}`
    });
  }

  res.json(asset);
});

/**
 * POST /api/v1/assets
 * Create/upload a new asset
 */
router.post('/', (req, res) => {
  const { name, type, data, project, metadata } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'missing_name',
      message: 'Asset name is required'
    });
  }

  // Detect type from extension if not provided
  const ext = '.' + name.split('.').pop().toLowerCase();
  const detectedType = type || detectAssetType(ext);

  const id = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const asset = {
    id,
    name,
    type: detectedType,
    size: data ? Buffer.byteLength(data, 'utf8') : 0,
    project: project || 'default',
    metadata: metadata || {},
    synced: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store data separately (in production, write to storage)
  if (data) {
    asset._hasData = true;
  }

  assets.set(id, asset);

  res.status(201).json(asset);
});

/**
 * PUT /api/v1/assets/:id
 * Update an existing asset
 */
router.put('/:id', (req, res) => {
  const asset = assets.get(req.params.id);

  if (!asset) {
    return res.status(404).json({
      error: 'asset_not_found',
      message: `No asset found with ID: ${req.params.id}`
    });
  }

  const { name, type, project, metadata, synced } = req.body;

  if (name) asset.name = name;
  if (type) asset.type = type;
  if (project) asset.project = project;
  if (metadata) asset.metadata = { ...asset.metadata, ...metadata };
  if (synced !== undefined) asset.synced = synced;
  asset.updatedAt = new Date().toISOString();

  assets.set(req.params.id, asset);
  res.json(asset);
});

/**
 * DELETE /api/v1/assets/:id
 * Delete an asset
 */
router.delete('/:id', (req, res) => {
  const existed = assets.delete(req.params.id);

  if (!existed) {
    return res.status(404).json({
      error: 'asset_not_found',
      message: `No asset found with ID: ${req.params.id}`
    });
  }

  res.json({ success: true, id: req.params.id });
});

/**
 * Detect asset type from file extension
 */
function detectAssetType(ext) {
  for (const [type, exts] of Object.entries(ASSET_TYPES)) {
    if (exts.includes(ext)) return type;
  }
  return 'unknown';
}

export default router;
