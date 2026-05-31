/**
 * Upload Foozle Lucifer + Mythology assets to Cloudflare R2
 *
 * Usage:
 *   OBJECT_STORAGE_KEY=xxx OBJECT_STORAGE_SECRET=yyy CF_ACCOUNT_ID=zzz tsx scripts/upload-foozle-r2.ts
 *
 * Scans extracted Foozle assets from D:\Games\Models\craftpix-assets\foozle-lucifer\
 * - Heroes: Sorceress, Warrior, Skeleton Hunter (48×48 per-dir PNGs)
 * - Golem: (64×64 4-row combined sheets)
 * - Bosses: Anubis, Medusa, Horus (480×480 per-dir spritesheets)
 * - UI: Hotbar, Inventory, Health Bars, Panels, Skill Icons, Character Icons
 * - Effects: Waves, Pickup FX, Rarity FX, Destroy
 * - Equipment: Bottom, Chest, Feet, Head, Misc, Weapons, Rarity Backgrounds
 * - Pickups: Potions, Gems, Gold
 * - Traps: Arrow, Ceiling, Fire Breather + transitions
 * - Tileset: Lava Dungeon tileset + animated tiles
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const FOOZLE_ROOT = 'D:\\Games\\Models\\craftpix-assets\\foozle-lucifer';
const BUCKET = 'grudge-assets';
const PUBLIC_URL = 'https://pub-e7fcf1fd4c9946ecb84b3766bbc7b50d.r2.dev';

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
  category: string;
  character?: string;
  animation?: string;
  direction?: string;
  frameWidth: number;
  frameHeight: number;
}

const manifest: SpriteEntry[] = [];
let uploadCount = 0;

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
      uploadCount++;
      console.log(`  ✓ [${uploadCount}] ${r2Key}`);
      return;
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`  ⚠ Retry ${attempt}/${maxRetries} for ${r2Key} (waiting ${delay}ms)`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function findPngs(dir: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__MACOSX' || entry.name === 'Ase') continue;
        walk(full);
      } else if (
        entry.name.endsWith('.png') &&
        !entry.name.startsWith('.') &&
        !entry.name.includes('COUPON') &&
        !entry.name.startsWith('Font')
      ) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

// ── Foozle Heroes (48×48 per-direction) ──
const FOOZLE_HEROES: Record<string, { pack: string; innerDir: string; prefix: string }> = {
  sorceress: {
    pack: 'Foozle_2DC0011_Lucifer_Sorceress_Pixel_Art',
    innerDir: 'Foozle_2DC0011_Lucifer_Sorceress_Pixel_Art',
    prefix: 'Sorceress',
  },
  warrior: {
    pack: 'Foozle_2DC0009_Lucifer_Warrior_Pixel_Art',
    innerDir: 'Foozle_2DC0009_Lucifer_Warrior_Pixel_Art',
    prefix: 'Warrior',
  },
  skeletonhunter: {
    pack: 'Foozle_2DC0019_Lucifer_Skeleton_Hunter_Pixel_Art',
    innerDir: 'Foozle_2DC0019_Lucifer_Skeleton_Hunter_Pixel_Art',
    prefix: 'SkeletonWithBow',
  },
};

const DIRS = ['Down', 'Up', 'Left', 'Right'];

async function uploadFoozleHeroes() {
  console.log('\n═══ UPLOADING FOOZLE HEROES ═══');
  for (const [charKey, cfg] of Object.entries(FOOZLE_HEROES)) {
    for (const dir of DIRS) {
      const pngDir = path.join(FOOZLE_ROOT, cfg.pack, cfg.innerDir, dir, 'Png');
      if (!fs.existsSync(pngDir)) {
        console.log(`  ⚠ Missing: ${pngDir}`);
        continue;
      }

      const pngs = fs.readdirSync(pngDir).filter(f => f.endsWith('.png'));
      for (const file of pngs) {
        // Extract anim name from filename, e.g. SorceressDownAttack01.png → attack01
        const animMatch = file.replace('.png', '').replace(cfg.prefix, '');
        // Remove direction prefix (Down/Up/Left/Right or Leftt for typos)
        const anim = animMatch
          .replace(/^(Down|Up|Left|Right|Leftt|Righ)/, '')
          .toLowerCase();

        const dirLower = dir.toLowerCase();
        const r2Key = `sprites/foozle/${charKey}/${dirLower}/${anim}.png`;
        const grudgeUuid = `GRD-FOOZLE-${charKey.toUpperCase()}-${dirLower.toUpperCase()}-${anim.toUpperCase()}`;

        await uploadFile(path.join(pngDir, file), r2Key);
        manifest.push({
          grudgeUuid,
          r2Key,
          url: `${PUBLIC_URL}/${r2Key}`,
          category: 'foozle-hero',
          character: charKey,
          animation: anim,
          direction: dirLower,
          frameWidth: 48,
          frameHeight: 48,
        });
      }
    }
    console.log(`  ${charKey}: done`);
  }
}

// ── Golem (64×64, 4-row combined sheets) ──
async function uploadGolem() {
  console.log('\n═══ UPLOADING GOLEM ═══');
  const golemDir = path.join(FOOZLE_ROOT,
    'craftpix-net-625807-golem-pixel-art-top-down-sprite-pack',
    'PNG', 'Golem1', 'Without_shadow');
  if (!fs.existsSync(golemDir)) {
    console.log('  ⚠ Missing golem dir');
    return;
  }

  const pngs = fs.readdirSync(golemDir).filter(f => f.endsWith('.png') && !f.startsWith('.'));
  for (const file of pngs) {
    const anim = file.replace('Golem1_', '').replace('_without_shadow.png', '').toLowerCase();
    const r2Key = `sprites/foozle/golem/${anim}.png`;
    await uploadFile(path.join(golemDir, file), r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-GOLEM-${anim.toUpperCase()}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-hero',
      character: 'golem',
      animation: anim,
      frameWidth: 64,
      frameHeight: 64,
    });
  }
}

// ── Mythology Bosses (480×480 spritesheets per direction) ──
const BOSSES = ['Anubis', 'Medusa', 'Horus'];

async function uploadBosses() {
  console.log('\n═══ UPLOADING MYTHOLOGY BOSSES ═══');
  const mythBase = path.join(FOOZLE_ROOT,
    'craftpix-net-270646-mythology-2d-character-assets-anubis-medusa-horus');

  for (const boss of BOSSES) {
    const sheetsDir = path.join(mythBase, boss, 'PNG', 'Spritesheets');
    if (!fs.existsSync(sheetsDir)) {
      console.log(`  ⚠ Missing: ${sheetsDir}`);
      continue;
    }

    const pngs = fs.readdirSync(sheetsDir).filter(f => f.endsWith('.png'));
    for (const file of pngs) {
      // "Front - Attacking.png" → "front-attacking"
      const key = file.replace('.png', '')
        .replace(/ /g, '')
        .replace(/-/g, '')
        .toLowerCase();
      // Normalize to dir-anim format
      const parts = file.replace('.png', '').split(' - ');
      const dir = parts[0].toLowerCase().trim();
      const anim = parts[1]?.toLowerCase().trim().replace(/ /g, '') || 'unknown';
      const r2Key = `sprites/foozle/bosses/${boss.toLowerCase()}/${dir}-${anim}.png`;

      await uploadFile(path.join(sheetsDir, file), r2Key);
      manifest.push({
        grudgeUuid: `GRD-FOOZLE-BOSS-${boss.toUpperCase()}-${dir.toUpperCase()}-${anim.toUpperCase()}`,
        r2Key,
        url: `${PUBLIC_URL}/${r2Key}`,
        category: 'foozle-boss',
        character: boss.toLowerCase(),
        animation: anim,
        direction: dir,
        frameWidth: 480,
        frameHeight: 480,
      });
    }
    console.log(`  ${boss}: done`);
  }
}

// ── UI Pack ──
async function uploadUI() {
  console.log('\n═══ UPLOADING UI ═══');
  const uiBase = path.join(FOOZLE_ROOT,
    'Foozle_UI_0002_Lucifer_RPG_UI_Pixel_Art',
    'Foozle_UI_0002_Lucifer_RPG_UI_Pixel_Art');

  const pngs = findPngs(uiBase);
  for (const localPath of pngs) {
    const rel = path.relative(uiBase, localPath).replace(/\\/g, '/').replace(/ /g, '_');
    const r2Key = `sprites/foozle/ui/${rel}`;
    await uploadFile(localPath, r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-UI-${String(manifest.length).padStart(4, '0')}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-ui',
      frameWidth: 0, frameHeight: 0,
    });
  }
}

// ── Effects ──
async function uploadEffects() {
  console.log('\n═══ UPLOADING EFFECTS ═══');
  const fxBase = path.join(FOOZLE_ROOT,
    'Foozle_2DE0002_Lucifer_Effects_Pixel_Art',
    'Foozle_2DE0002_Lucifer_Effects_Pixel_Art');

  const pngs = findPngs(fxBase);
  for (const localPath of pngs) {
    const rel = path.relative(fxBase, localPath).replace(/\\/g, '/').replace(/ /g, '_');
    const r2Key = `sprites/foozle/effects/${rel}`;
    await uploadFile(localPath, r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-FX-${String(manifest.length).padStart(4, '0')}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-effect',
      frameWidth: 48, frameHeight: 48,
    });
  }
}

// ── Equipment ──
async function uploadEquipment() {
  console.log('\n═══ UPLOADING EQUIPMENT ═══');
  const eqBase = path.join(FOOZLE_ROOT,
    'Foozle_2DS0005_Lucifer_Equipment_Pixel_Art',
    'Foozle_2DS0005_Lucifer_Equipment_Pixel_Art',
    'Equipment');

  const pngs = findPngs(eqBase);
  for (const localPath of pngs) {
    const rel = path.relative(eqBase, localPath).replace(/\\/g, '/').replace(/ /g, '_');
    const r2Key = `sprites/foozle/equipment/${rel}`;
    await uploadFile(localPath, r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-EQ-${String(manifest.length).padStart(4, '0')}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-equipment',
      frameWidth: 0, frameHeight: 0,
    });
  }
}

// ── Pickups ──
async function uploadPickups() {
  console.log('\n═══ UPLOADING PICKUPS ═══');
  const pkBase = path.join(FOOZLE_ROOT,
    'Foozle_2DS0006_Lucifer_Pickups_Pixel_Art',
    'Foozle_2DS0006_Lucifer_Pickups_Pixel_Art');

  const pngs = findPngs(pkBase);
  for (const localPath of pngs) {
    const rel = path.relative(pkBase, localPath).replace(/\\/g, '/').replace(/ /g, '_');
    const r2Key = `sprites/foozle/pickups/${rel}`;
    await uploadFile(localPath, r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-PK-${String(manifest.length).padStart(4, '0')}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-pickup',
      frameWidth: 0, frameHeight: 0,
    });
  }
}

// ── Traps ──
async function uploadTraps() {
  console.log('\n═══ UPLOADING TRAPS ═══');
  const trapBase = path.join(FOOZLE_ROOT,
    'Foozle_2DS0007_Pixel_Trap_Pack',
    'Foozle_2DTR0001_Pixel_Trap_Pack');

  const pngs = findPngs(trapBase);
  for (const localPath of pngs) {
    const rel = path.relative(trapBase, localPath).replace(/\\/g, '/').replace(/ /g, '_');
    const r2Key = `sprites/foozle/traps/${rel}`;
    await uploadFile(localPath, r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-TRAP-${String(manifest.length).padStart(4, '0')}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-trap',
      frameWidth: 0, frameHeight: 0,
    });
  }
}

// ── Tileset ──
async function uploadTileset() {
  console.log('\n═══ UPLOADING TILESET ═══');
  const tileBase = path.join(FOOZLE_ROOT,
    'Foozle_2DT0011_Lucifer_Lava_Tileset_Pixel_Art');

  const pngs = findPngs(tileBase);
  for (const localPath of pngs) {
    const rel = path.relative(tileBase, localPath).replace(/\\/g, '/').replace(/ /g, '_');
    const r2Key = `sprites/foozle/tileset/${rel}`;
    await uploadFile(localPath, r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-TILE-${String(manifest.length).padStart(4, '0')}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-tileset',
      frameWidth: 0, frameHeight: 0,
    });
  }
}

// ── Skill Icons (from UI pack) ──
async function uploadSkillIcons() {
  console.log('\n═══ UPLOADING SKILL ICONS ═══');
  const skillBase = path.join(FOOZLE_ROOT,
    'Foozle_UI_0002_Lucifer_RPG_UI_Pixel_Art',
    'Foozle_UI_0002_Lucifer_RPG_UI_Pixel_Art',
    'Skill Icons');

  const pngs = findPngs(skillBase);
  for (const localPath of pngs) {
    const rel = path.relative(skillBase, localPath).replace(/\\/g, '/').replace(/ /g, '_');
    const r2Key = `sprites/foozle/skill-icons/${rel}`;
    await uploadFile(localPath, r2Key);
    manifest.push({
      grudgeUuid: `GRD-FOOZLE-SKILL-${String(manifest.length).padStart(4, '0')}`,
      r2Key,
      url: `${PUBLIC_URL}/${r2Key}`,
      category: 'foozle-skill-icon',
      frameWidth: 0, frameHeight: 0,
    });
  }
}

// ── Magic effect packs ──
async function uploadMagicFX() {
  console.log('\n═══ UPLOADING MAGIC FX ═══');
  const magicPacks = [
    'craftpix-net-153715-fire-and-earth-magic-sprites-for-top-down-games',
    'craftpix-net-381552-free-water-and-fire-magic-sprite-vector-pack',
    'craftpix-net-821246-top-down-wind-and-lightning-magic-effects-pack',
    'craftpix-net-865099-magic-shield-animation-asset-pack',
  ];

  for (const pack of magicPacks) {
    const packDir = path.join(FOOZLE_ROOT, pack);
    if (!fs.existsSync(packDir)) continue;

    const pngs = findPngs(packDir);
    const shortName = pack.split('-').slice(4).join('-').substring(0, 30);
    for (const localPath of pngs) {
      const rel = path.relative(packDir, localPath).replace(/\\/g, '/').replace(/ /g, '_');
      const r2Key = `sprites/foozle/magic-fx/${shortName}/${rel}`;
      await uploadFile(localPath, r2Key);
      manifest.push({
        grudgeUuid: `GRD-FOOZLE-MAGIC-${String(manifest.length).padStart(4, '0')}`,
        r2Key,
        url: `${PUBLIC_URL}/${r2Key}`,
        category: 'foozle-magic-fx',
        frameWidth: 0, frameHeight: 0,
      });
    }
  }
}

async function uploadManifest() {
  console.log('\n═══ UPLOADING MANIFEST ═══');

  // Load existing manifest and merge
  const existingPath = path.join('F:\\GrudgeStudio\\grudge-studio\\scripts', 'sprite-manifest.json');
  let existing: SpriteEntry[] = [];
  if (fs.existsSync(existingPath)) {
    existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
  }

  // Remove any previous foozle entries, then append new ones
  const filtered = existing.filter(e => !e.grudgeUuid.startsWith('GRD-FOOZLE'));
  const merged = [...filtered, ...manifest];

  const json = JSON.stringify(merged, null, 2);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: 'manifests/sprite-manifest.json',
    Body: json,
    ContentType: 'application/json',
    CacheControl: 'public, max-age=300',
  }));
  fs.writeFileSync(existingPath, json);
  console.log(`  ✓ manifests/sprite-manifest.json (${merged.length} total entries, ${manifest.length} new foozle)`);
}

async function main() {
  console.log('Grudge Studio — Foozle Lucifer R2 Upload');
  console.log(`Source: ${FOOZLE_ROOT}`);
  console.log(`Bucket: ${BUCKET}`);

  await uploadFoozleHeroes();
  await uploadGolem();
  await uploadBosses();
  await uploadUI();
  await uploadEffects();
  await uploadEquipment();
  await uploadPickups();
  await uploadTraps();
  await uploadTileset();
  await uploadSkillIcons();
  await uploadMagicFX();
  await uploadManifest();

  console.log(`\n✅ Done! ${uploadCount} files uploaded, ${manifest.length} new manifest entries.`);
}

main().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
