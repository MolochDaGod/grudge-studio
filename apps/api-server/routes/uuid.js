/**
 * UUID Routes
 * Server-side Grudge UUID generation and validation.
 * Mirrors the UUID system from ObjectStore's grudge-sdk.js.
 */

import { Router } from 'express';

const router = Router();

// Entity type prefix map (from grudge-sdk.js)
const PREFIX_MAP = {
  hero: 'HERO',
  item: 'ITEM',
  equipment: 'EQIP',
  ability: 'ABIL',
  material: 'MATL',
  recipe: 'RECP',
  node: 'NODE',
  mob: 'MOBS',
  boss: 'BOSS',
  mission: 'MISS',
  infusion: 'INFU',
  loot: 'LOOT',
  consumable: 'CONS',
  quest: 'QUST',
  zone: 'ZONE',
  save: 'SAVE',
  asset: 'ASST',
  sync: 'SYNC'
};

let sequenceCounter = 0;

function fnv1aHash8(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash = hash >>> 0;
  const h2 = (hash ^ (hash >>> 16)) >>> 0;
  return h2.toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

function generateGrudgeUuid(entityType, metadata = '') {
  const prefix = PREFIX_MAP[entityType] || entityType.slice(0, 4).toUpperCase();
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  sequenceCounter++;
  const sequence = sequenceCounter.toString(16).toUpperCase().padStart(6, '0');

  const hashInput = `${prefix}-${timestamp}-${sequence}-${metadata}-${Math.random()}`;
  const hash = fnv1aHash8(hashInput);

  return `${prefix}-${timestamp}-${sequence}-${hash}`;
}

function parseGrudgeUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return null;
  const parts = uuid.split('-');
  if (parts.length !== 4) return null;
  return {
    prefix: parts[0],
    timestamp: parts[1],
    sequence: parts[2],
    hash: parts[3],
    entityType: Object.entries(PREFIX_MAP).find(([, v]) => v === parts[0])?.[0] || 'unknown',
    createdAt: new Date(
      parseInt(parts[1].slice(0, 4)),
      parseInt(parts[1].slice(4, 6)) - 1,
      parseInt(parts[1].slice(6, 8)),
      parseInt(parts[1].slice(8, 10)),
      parseInt(parts[1].slice(10, 12)),
      parseInt(parts[1].slice(12, 14))
    )
  };
}

function isValidGrudgeUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  return /^[A-Z]{4}-\d{14}-[0-9A-F]{6}-[0-9A-F]{8}$/.test(uuid);
}

/**
 * POST /api/v1/uuid/generate
 * Generate one or more Grudge UUIDs
 * Body: { type: 'item', count: 1, metadata: '' }
 */
router.post('/generate', (req, res) => {
  const { type = 'item', count = 1, metadata = '' } = req.body;
  const numCount = Math.min(parseInt(count) || 1, 100);

  const uuids = [];
  for (let i = 0; i < numCount; i++) {
    uuids.push(generateGrudgeUuid(type, metadata));
  }

  res.json({
    type,
    count: uuids.length,
    uuids
  });
});

/**
 * POST /api/v1/uuid/validate
 * Validate and parse a Grudge UUID
 * Body: { uuid: 'ITEM-...' }
 */
router.post('/validate', (req, res) => {
  const { uuid } = req.body;

  if (!uuid) {
    return res.status(400).json({
      error: 'missing_uuid',
      message: 'UUID string is required'
    });
  }

  const valid = isValidGrudgeUuid(uuid);
  const parsed = valid ? parseGrudgeUuid(uuid) : null;

  res.json({
    uuid,
    valid,
    parsed
  });
});

/**
 * GET /api/v1/uuid/types
 * List all available entity types and their prefixes
 */
router.get('/types', (req, res) => {
  res.json({
    types: Object.entries(PREFIX_MAP).map(([type, prefix]) => ({
      type,
      prefix,
      example: generateGrudgeUuid(type, 'example')
    }))
  });
});

export default router;
