import fs from 'fs';
import path from 'path';

interface ItemRecord {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  tier?: number;
  sourceFile: string;
  spriteFilename: string | null;
  storageUrl: string | null;
  status: 'matched' | 'missing' | 'placeholder';
  notes: string;
}

const inventory: ItemRecord[] = [];

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function findMatchingSprite(itemName: string, availableSprites: string[]): string | null {
  const kebabName = toKebabCase(itemName);
  for (const sprite of availableSprites) {
    const spriteName = path.basename(sprite, path.extname(sprite)).toLowerCase();
    if (spriteName.includes(kebabName) || kebabName.includes(spriteName)) {
      return sprite;
    }
  }
  return null;
}

async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await scanDirectory(fullPath));
      } else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    console.log(`Could not scan ${dir}`);
  }
  return files;
}

async function main() {
  console.log('=== GRUDGE Warlords Asset Inventory ===\n');

  const availableSprites = await scanDirectory('./attached_assets');
  const assetsInPublic = await scanDirectory('./client/public/2dassets');
  const allSprites = [...availableSprites, ...assetsInPublic];
  
  console.log(`Found ${allSprites.length} sprite files\n`);

  const weaponsModule = await import('../client/src/data/weapons');
  const materialsModule = await import('../client/src/data/materials');
  
  const weaponArrays = [
    'SWORDS', 'AXES', 'HAMMERS', 'GREATSWORDS', 'GREATAXES',
    'BOWS', 'CROSSBOWS', 'GUNS', 'DAGGERS', 'STAVES'
  ];
  
  let weaponCount = 0;
  for (const arrayName of weaponArrays) {
    const weapons = (weaponsModule as Record<string, unknown[]>)[arrayName];
    if (Array.isArray(weapons)) {
      for (const weapon of weapons) {
        const w = weapon as { id: string; name: string; type: string };
        const matchedSprite = findMatchingSprite(w.name, allSprites);
        inventory.push({
          id: w.id,
          name: w.name,
          category: 'weapon',
          subcategory: w.type,
          sourceFile: 'client/src/data/weapons.ts',
          spriteFilename: matchedSprite ? path.basename(matchedSprite) : null,
          storageUrl: null,
          status: matchedSprite ? 'matched' : 'missing',
          notes: matchedSprite ? `Found: ${matchedSprite}` : 'Needs sprite'
        });
        weaponCount++;
      }
    }
  }
  console.log(`Weapons: ${weaponCount}`);

  const materials = materialsModule.CRAFTING_MATERIALS;
  for (const mat of materials) {
    const matchedSprite = findMatchingSprite(mat.name, allSprites);
    inventory.push({
      id: mat.id,
      name: mat.name,
      category: 'material',
      subcategory: mat.category,
      tier: mat.tier,
      sourceFile: 'client/src/data/materials.ts',
      spriteFilename: matchedSprite ? path.basename(matchedSprite) : null,
      storageUrl: null,
      status: matchedSprite ? 'matched' : 'missing',
      notes: `Icon: ${mat.icon}`
    });
  }
  console.log(`Materials: ${materials.length}`);

  const matched = inventory.filter(i => i.status === 'matched').length;
  const missing = inventory.filter(i => i.status === 'missing').length;
  
  console.log(`\n=== Summary ===`);
  console.log(`Total items: ${inventory.length}`);
  console.log(`Matched sprites: ${matched}`);
  console.log(`Missing sprites: ${missing}`);
  console.log(`Coverage: ${((matched / inventory.length) * 100).toFixed(1)}%`);

  const csvHeader = 'id,name,category,subcategory,tier,source_file,sprite_filename,storage_url,status,notes';
  const csvRows = inventory.map(item => 
    `"${item.id}","${item.name}","${item.category}","${item.subcategory || ''}","${item.tier || ''}","${item.sourceFile}","${item.spriteFilename || ''}","${item.storageUrl || ''}","${item.status}","${item.notes}"`
  );
  const csvContent = [csvHeader, ...csvRows].join('\n');
  
  fs.mkdirSync('./data-exports', { recursive: true });
  fs.writeFileSync('./data-exports/item-asset-inventory.csv', csvContent);
  console.log(`\nCSV exported to: ./data-exports/item-asset-inventory.csv`);

  const jsonContent = JSON.stringify(inventory, null, 2);
  fs.writeFileSync('./data-exports/item-asset-inventory.json', jsonContent);
  console.log(`JSON exported to: ./data-exports/item-asset-inventory.json`);

  console.log('\n=== Sprite Files Found ===');
  allSprites.forEach(s => console.log(`  ${path.basename(s)}`));
}

main().catch(console.error);
