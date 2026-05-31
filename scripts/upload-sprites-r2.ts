/**
 * Upload sprite assets to Cloudflare R2 and generate sprite-manifest.json
 *
 * Usage:
 *   OBJECT_STORAGE_KEY=xxx OBJECT_STORAGE_SECRET=yyy CF_ACCOUNT_ID=zzz tsx scripts/upload-sprites-r2.ts
 *
 * Scans extracted craftpix assets from D:\Games\Models\craftpix-assets\
 * - Heroes: Lich, Lizardman, Skeleton, Orc (Without_shadow PNGs)
 * - Enemies: Village, Field, Undead, Medieval, Swamp Bosses, Roguelike, Swordsman
 * - Effects: Slash, Flame, Explosion, Magic/Traps
 * Assigns Grudge UUIDs and uploads to grudge-assets R2 bucket.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const ASSETS_ROOT = 'D:\\Games\\Models\\craftpix-assets';
const BUCKET = 'grudge-assets';
const PUBLIC_URL = 'https://assets.grudge-studio.com';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.OBJECT_STORAGE_KEY!,
    secretAccessKey: process.env.OBJECT_STORAGE_SECRET!,
  },
});

interface SpriteEntry {
  grudgeUuid: string;
  r2Key: string;
  url: string;
  category: 'hero' | 'enemy' | 'effect';
  character?: string;
  tier?: number;
  animation?: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  directions: number;
}

const manifest: SpriteEntry[] = [];

// ── Hero character packs ──
const HEROES: Record<string, { pack: string; prefix: string; tiers: string[] }> = {
  lich: {
    pack: 'craftpix-net-543463-top-down-pixel-lich-character-sprites',
    prefix: 'Lich',
    tiers: ['Lich1', 'Lich2', 'Lich3'],
  },
  lizardman: {
    pack: 'craftpix-net-900504-lizardmen-pixel-art-character-sprite-pack',
    prefix: 'Lizardman',
    tiers: ['Lizardman1', 'Lizardman2', 'Lizardman3'],
  },
  skeleton: {
    pack: 'craftpix-net-870078-top-down-pixel-skeletons-character-sprite-pack',
    prefix: 'Skeleton',
    tiers: ['Skeleton1', 'Skeleton2', 'Skeleton3'],
  },
  orc: {
    pack: 'craftpix-net-363992-free-top-down-orc-game-character-pixel-art',
    prefix: 'Orc',
    tiers: ['Orc1', 'Orc2', 'Orc3'],
  },
};

const ANIMATIONS = ['Attack', 'Death', 'Hurt', 'Idle', 'Run', 'Walk'];
const FRAME_HEIGHT = 64;
const DIRECTIONS = 4; // front, left, back, right

async function uploadFile(localPath: string, r2Key: string, maxRetries = 3): Promise<void> {
  const body = fs.readFileSync(localPath);
  const contentType = localPath.endsWith('.json') ? 'application/json' : 'image/png';
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: body,
        ContentType: contentType,
        CacheControl: contentType === 'application/json' ? 'public, max-age=300' : 'public, max-age=31536000, immutable',
      }));
      console.log(`  ✓ ${r2Key}`);
      return;
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.log(`  ⚠ Retry ${attempt}/${maxRetries} for ${r2Key} (waiting ${delay}ms)`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function getFrameCount(width: number): number {
  return Math.floor(width / FRAME_HEIGHT);
}

async function uploadHeroes() {
  console.log('\n═══ UPLOADING HEROES ═══');
  for (const [charName, cfg] of Object.entries(HEROES)) {
    for (let tierIdx = 0; tierIdx < cfg.tiers.length; tierIdx++) {
      const tierName = cfg.tiers[tierIdx];
      const tierNum = tierIdx + 1;
      const dir = path.join(ASSETS_ROOT, cfg.pack, 'PNG', tierName, 'Without_shadow');

      if (!fs.existsSync(dir)) {
        console.log(`  ⚠ Missing: ${dir}`);
        continue;
      }

      for (const anim of ANIMATIONS) {
        // Find the PNG file (case-insensitive match)
        const files = fs.readdirSync(dir);
        const match = files.find(f =>
          f.toLowerCase().includes(anim.toLowerCase()) &&
          f.toLowerCase().includes('without_shadow') &&
          f.endsWith('.png')
        );

        if (!match) continue;

        const localPath = path.join(dir, match);
        const r2Key = `sprites/characters/${charName}/t${tierNum}/${anim.toLowerCase()}.png`;
        const grudgeUuid = `GRD-SPR-${charName.toUpperCase()}-T${tierNum}-${anim.toUpperCase()}`;

        // Get frame count from image width
        const imageBuffer = fs.readFileSync(localPath);
        // Read PNG width from header (bytes 16-19, big-endian)
        const width = imageBuffer.readUInt32BE(16);
        const height = imageBuffer.readUInt32BE(20);
        const frameCount = getFrameCount(width);

        await uploadFile(localPath, r2Key);

        manifest.push({
          grudgeUuid,
          r2Key,
          url: `${PUBLIC_URL}/${r2Key}`,
          category: 'hero',
          character: charName,
          tier: tierNum,
          animation: anim.toLowerCase(),
          frameWidth: FRAME_HEIGHT,
          frameHeight: FRAME_HEIGHT,
          frameCount,
          directions: DIRECTIONS,
        });
      }
    }
  }
}

// ── Enemy packs ──
const ENEMY_PACKS: Record<string, { pack: string; scanDir: string }> = {
  village: { pack: 'craftpix-net-414584-pixel-village-enemies-for-top-down-tower-defense', scanDir: '' },
  field: { pack: 'craftpix-net-255707-free-field-enemies-pixel-art-for-tower-defense', scanDir: '' },
  undead: { pack: 'craftpix-net-665477-undead-enemies-pixel-art-for-tower-defense', scanDir: '' },
  medieval: { pack: 'craftpix-net-907280-medieval-enemy-for-td-pixel-asset-pack', scanDir: '' },
  swamp_boss: { pack: 'craftpix-net-271069-top-down-swamp-bosses-tower-defense-pixel-art', scanDir: '' },
  roguelike: { pack: 'craftpix-net-814823-free-roguelike-shoot-em-up-pixel-art-game-kit', scanDir: '' },
  swordsman: { pack: 'craftpix-net-180537-free-swordsman-1-3-level-pixel-top-down-sprite-character', scanDir: '' },
};

async function uploadEnemies() {
  console.log('\n═══ UPLOADING ENEMIES ═══');
  for (const [enemyName, cfg] of Object.entries(ENEMY_PACKS)) {
    const baseDir = path.join(ASSETS_ROOT, cfg.pack);
    if (!fs.existsSync(baseDir)) {
      console.log(`  ⚠ Missing pack: ${enemyName}`);
      continue;
    }

    // Find all PNGs recursively, excluding __MACOSX and COUPON
    const pngs = findPngs(baseDir);
    let uploadCount = 0;

    for (const localPath of pngs) {
      const relPath = path.relative(baseDir, localPath).replace(/\\/g, '/');
      const r2Key = `sprites/enemies/${enemyName}/${relPath}`;
      const grudgeUuid = `GRD-SPR-ENEMY-${enemyName.toUpperCase()}-${String(uploadCount).padStart(3, '0')}`;

      await uploadFile(localPath, r2Key);

      // Read dimensions
      const buf = fs.readFileSync(localPath);
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);

      manifest.push({
        grudgeUuid,
        r2Key,
        url: `${PUBLIC_URL}/${r2Key}`,
        category: 'enemy',
        character: enemyName,
        frameWidth: Math.min(64, width),
        frameHeight: Math.min(64, height),
        frameCount: Math.max(1, Math.floor(width / Math.min(64, height))),
        directions: height > 64 ? Math.floor(height / 64) : 1,
      });
      uploadCount++;
    }
    console.log(`  ${enemyName}: ${uploadCount} files`);
  }
}

// ── Effect packs ──
const EFFECT_PACKS: Record<string, string> = {
  slash: 'craftpix-net-501088-free-slash-sprite-cartoon-effects',
  slash2: 'craftpix-net-825597-free-slash-effects-sprite-pack',
  flame: 'craftpix-net-460474-free-flame-effects-sprite-pack',
  explosion: 'craftpix-net-358572-explosion-vector-sprite-effects',
  magic: 'craftpix-net-805745-free-magic-and-traps-top-down-pixel-art-asset',
};

async function uploadEffects() {
  console.log('\n═══ UPLOADING EFFECTS ═══');
  for (const [fxName, packName] of Object.entries(EFFECT_PACKS)) {
    const baseDir = path.join(ASSETS_ROOT, packName);
    if (!fs.existsSync(baseDir)) {
      console.log(`  ⚠ Missing pack: ${fxName}`);
      continue;
    }

    const pngs = findPngs(baseDir);
    let uploadCount = 0;

    for (const localPath of pngs) {
      const relPath = path.relative(baseDir, localPath).replace(/\\/g, '/');
      const r2Key = `sprites/effects/${fxName}/${relPath}`;
      const grudgeUuid = `GRD-SPR-FX-${fxName.toUpperCase()}-${String(uploadCount).padStart(3, '0')}`;

      await uploadFile(localPath, r2Key);

      manifest.push({
        grudgeUuid,
        r2Key,
        url: `${PUBLIC_URL}/${r2Key}`,
        category: 'effect',
        character: fxName,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 1,
        directions: 1,
      });
      uploadCount++;
    }
    console.log(`  ${fxName}: ${uploadCount} files`);
  }
}

function findPngs(dir: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__MACOSX') continue;
        walk(full);
      } else if (
        entry.name.endsWith('.png') &&
        !entry.name.includes('COUPON') &&
        !entry.name.startsWith('Font') &&
        !entry.name.startsWith('.')
      ) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

async function uploadManifest() {
  console.log('\n═══ UPLOADING MANIFEST ═══');
  const json = JSON.stringify(manifest, null, 2);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: 'manifests/sprite-manifest.json',
    Body: json,
    ContentType: 'application/json',
    CacheControl: 'public, max-age=300',
  }));
  // Also save locally
  fs.writeFileSync(path.join('F:\\GrudgeStudio\\grudge-studio\\scripts', 'sprite-manifest.json'), json);
  console.log(`  ✓ manifests/sprite-manifest.json (${manifest.length} entries)`);
}

async function main() {
  console.log('Grudge Studio — R2 Sprite Upload');
  console.log(`Bucket: ${BUCKET}`);
  console.log(`CDN: ${PUBLIC_URL}`);

  await uploadHeroes();
  await uploadEnemies();
  await uploadEffects();
  await uploadManifest();

  console.log(`\n✅ Done! ${manifest.length} sprites uploaded.`);
}

main().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
