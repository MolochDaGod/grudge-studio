import { T0_WEAPONS, T1_SWORDS, ALL_WEAPONS, WeaponComplete } from '../client/src/data/weaponsComplete';
import { ALL_T0_ITEMS, ALL_T0_RECIPES, T0Item, T0Recipe } from '../client/src/data/t0Items';
import * as fs from 'fs';

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportWeaponsToCSV(weapons: WeaponComplete[]): string {
  const headers = [
    'id', 'name', 'type', 'category', 'tier', 'lore',
    'damage_base', 'damage_per_tier', 'speed_base', 'speed_per_tier',
    'combo_base', 'combo_per_tier', 'crit_base', 'crit_per_tier',
    'block_base', 'block_per_tier', 'defense_base', 'defense_per_tier',
    'ability1_name', 'ability1_tooltip', 'ability1_cooldown', 'ability1_mana', 'ability1_damage', 'ability1_effect',
    'ability2_name', 'ability2_tooltip', 'ability2_cooldown', 'ability2_mana', 'ability2_damage', 'ability2_effect',
    'ability3_name', 'ability3_tooltip', 'ability3_cooldown', 'ability3_mana', 'ability3_damage', 'ability3_effect',
    'ability4_name', 'ability4_tooltip', 'ability4_cooldown', 'ability4_mana', 'ability4_damage', 'ability4_effect',
    'passive1_name', 'passive1_desc', 'passive1_value',
    'passive2_name', 'passive2_desc', 'passive2_value',
    'passive3_name', 'passive3_desc', 'passive3_value',
    'crafted_by', 'sprite', 'craft_time', 'materials'
  ];

  const rows = weapons.map(w => {
    const p1 = w.passives[0] || { name: '', description: '', value: 0 };
    const p2 = w.passives[1] || { name: '', description: '', value: 0 };
    const p3 = w.passives[2] || { name: '', description: '', value: 0 };
    
    const materials = w.requiredMaterials.map(m => `${m.materialId}:${m.quantity}`).join(';');

    return [
      w.id, w.name, w.type, w.category, w.tier, w.lore,
      w.stats.damage.base, w.stats.damage.perTier,
      w.stats.speed.base, w.stats.speed.perTier,
      w.stats.combo.base, w.stats.combo.perTier,
      w.stats.crit.base, w.stats.crit.perTier,
      w.stats.block.base, w.stats.block.perTier,
      w.stats.defense.base, w.stats.defense.perTier,
      w.abilities.slot1?.name || '', w.abilities.slot1?.tooltip || '',
      w.abilities.slot1?.cooldown || 0, w.abilities.slot1?.manaCost || 0,
      w.abilities.slot1?.damage || '', w.abilities.slot1?.effect || '',
      w.abilities.slot2?.name || '', w.abilities.slot2?.tooltip || '',
      w.abilities.slot2?.cooldown || 0, w.abilities.slot2?.manaCost || 0,
      w.abilities.slot2?.damage || '', w.abilities.slot2?.effect || '',
      w.abilities.slot3?.name || '', w.abilities.slot3?.tooltip || '',
      w.abilities.slot3?.cooldown || 0, w.abilities.slot3?.manaCost || 0,
      w.abilities.slot3?.damage || '', w.abilities.slot3?.effect || '',
      w.abilities.slot4?.name || '', w.abilities.slot4?.tooltip || '',
      w.abilities.slot4?.cooldown || 0, w.abilities.slot4?.manaCost || 0,
      w.abilities.slot4?.damage || '', w.abilities.slot4?.effect || '',
      p1.name, p1.description, p1.value,
      p2.name, p2.description, p2.value,
      p3.name, p3.description, p3.value,
      w.craftedBy, w.sprite, w.craftTime, materials
    ].map(escapeCSV);
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function exportItemsToCSV(items: T0Item[]): string {
  const headers = [
    'id', 'name', 'type', 'sub_type', 'tier', 'description',
    'effect', 'duration', 'crafted_by', 'sprite',
    'stackable', 'max_stack', 'stats'
  ];

  const rows = items.map(item => {
    const statsStr = item.stats ? Object.entries(item.stats).map(([k, v]) => `${k}:${v}`).join(';') : '';
    
    const values: (string | number | null | undefined)[] = [
      item.id, item.name, item.type, item.subType, item.tier, item.description,
      item.effect || '', item.duration || '',
      item.craftedBy, item.sprite,
      item.stackable ? 'true' : 'false', item.maxStack, statsStr
    ];
    return values.map(escapeCSV);
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function exportRecipesToCSV(recipes: T0Recipe[]): string {
  const headers = [
    'id', 'name', 'output_item_id', 'output_quantity', 'tier',
    'profession', 'station', 'craft_time', 'materials', 'unlocks_recipes'
  ];

  const rows = recipes.map(r => {
    const materials = r.materials.map(m => `${m.itemId}:${m.quantity}`).join(';');
    const unlocks = r.unlocksRecipes.join(';');
    
    return [
      r.id, r.name, r.outputItemId, r.outputQuantity, r.tier,
      r.profession, r.station, r.craftTime, materials, unlocks
    ].map(escapeCSV);
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function main() {
  console.log('Exporting weapons data to CSV...');
  
  const weaponsCSV = exportWeaponsToCSV(ALL_WEAPONS);
  fs.writeFileSync('data-exports/weapons-complete.csv', weaponsCSV);
  console.log(`Exported ${ALL_WEAPONS.length} weapons to data-exports/weapons-complete.csv`);
  
  const itemsCSV = exportItemsToCSV(ALL_T0_ITEMS);
  fs.writeFileSync('data-exports/t0-items.csv', itemsCSV);
  console.log(`Exported ${ALL_T0_ITEMS.length} T0 items to data-exports/t0-items.csv`);
  
  const recipesCSV = exportRecipesToCSV(ALL_T0_RECIPES);
  fs.writeFileSync('data-exports/t0-recipes.csv', recipesCSV);
  console.log(`Exported ${ALL_T0_RECIPES.length} T0 recipes to data-exports/t0-recipes.csv`);
  
  console.log('\nExport complete!');
  console.log(`Summary:`);
  console.log(`- Weapons: ${ALL_WEAPONS.length} total (T0: ${T0_WEAPONS.length}, T1 Swords: ${T1_SWORDS.length})`);
  console.log(`- T0 Items: ${ALL_T0_ITEMS.length}`);
  console.log(`- T0 Recipes: ${ALL_T0_RECIPES.length}`);
}

main().catch(console.error);
