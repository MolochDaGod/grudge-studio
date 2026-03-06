import { WEAPON_SETS, ARMOR_SETS, ARMOR_SLOTS, ARMOR_MATERIALS, TIERS, CONSUMABLE_SETS, TIER_MATERIALS } from '../client/src/data/tieredCrafting';
import { ALL_RECIPES, RECIPE_STATS } from '../client/src/data/recipes';
import { ALL_STARTER_RECIPES, CLASS_BONUS_RECIPES, RACE_BONUS_RECIPES } from '../client/src/data/starterRecipes';
import { CRAFTING_MATERIALS } from '../client/src/data/materials';

interface AuditResult {
  category: string;
  baseCount: number;
  tieredCount: number;
  items: string[];
}

function auditWeapons(): AuditResult[] {
  const results: AuditResult[] = [];
  
  Object.entries(WEAPON_SETS).forEach(([category, weapons]) => {
    const baseCount = weapons.length;
    const tieredCount = baseCount * 8;
    results.push({
      category: `Weapons - ${category}`,
      baseCount,
      tieredCount,
      items: weapons.map(w => w.id)
    });
  });
  
  return results;
}

function auditArmor(): AuditResult {
  const setCount = Object.keys(ARMOR_SETS).length;
  const slotCount = ARMOR_SLOTS.length;
  const materialCount = ARMOR_MATERIALS.length;
  const baseCount = setCount * slotCount * materialCount;
  
  return {
    category: 'Armor',
    baseCount,
    tieredCount: baseCount * 8,
    items: Object.keys(ARMOR_SETS).flatMap(set =>
      ARMOR_SLOTS.flatMap(slot =>
        ARMOR_MATERIALS.map(mat => `${set}-${mat}-${slot}`)
      )
    )
  };
}

function auditConsumables(): AuditResult[] {
  const results: AuditResult[] = [];
  
  Object.entries(CONSUMABLE_SETS).forEach(([category, items]) => {
    results.push({
      category: `Consumables - ${category}`,
      baseCount: items.length,
      tieredCount: items.length,
      items: items.map(i => i.id)
    });
  });
  
  return results;
}

function auditStarterRecipes(): AuditResult {
  const classBonus = Object.values(CLASS_BONUS_RECIPES).flat();
  const raceBonus = Object.values(RACE_BONUS_RECIPES).flat();
  const allStarter = [...ALL_STARTER_RECIPES, ...classBonus, ...raceBonus];
  
  return {
    category: 'Starter Recipes (T0-T1)',
    baseCount: allStarter.length,
    tieredCount: allStarter.length,
    items: allStarter.map(r => r.id)
  };
}

function auditMaterials(): AuditResult {
  const materialCount = CRAFTING_MATERIALS?.length || 0;
  const tierMaterialCount = Object.values(TIER_MATERIALS).flat().length;
  
  return {
    category: 'Materials',
    baseCount: materialCount,
    tieredCount: materialCount,
    items: CRAFTING_MATERIALS.map(m => m.id)
  };
}

function runAudit() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         GRUDGE WARLORDS - RECIPE DATABASE AUDIT                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const weaponResults = auditWeapons();
  const armorResult = auditArmor();
  const consumableResults = auditConsumables();
  const starterResult = auditStarterRecipes();
  const materialResult = auditMaterials();

  let totalBase = 0;
  let totalTiered = 0;

  console.log('═══ WEAPONS ═══');
  weaponResults.forEach(r => {
    console.log(`  ${r.category}: ${r.baseCount} base × 8 tiers = ${r.tieredCount} recipes`);
    totalBase += r.baseCount;
    totalTiered += r.tieredCount;
  });

  const weaponTotal = weaponResults.reduce((sum, r) => sum + r.tieredCount, 0);
  console.log(`  WEAPONS TOTAL: ${weaponResults.reduce((s, r) => s + r.baseCount, 0)} base → ${weaponTotal} recipes\n`);

  console.log('═══ ARMOR ═══');
  console.log(`  ${armorResult.category}: ${armorResult.baseCount} base × 8 tiers = ${armorResult.tieredCount} recipes`);
  totalBase += armorResult.baseCount;
  totalTiered += armorResult.tieredCount;

  console.log('\n═══ CONSUMABLES ═══');
  consumableResults.forEach(r => {
    console.log(`  ${r.category}: ${r.baseCount} recipes`);
    totalBase += r.baseCount;
    totalTiered += r.tieredCount;
  });
  const consumableTotal = consumableResults.reduce((sum, r) => sum + r.tieredCount, 0);
  console.log(`  CONSUMABLES TOTAL: ${consumableTotal} recipes\n`);

  console.log('═══ STARTER RECIPES ═══');
  console.log(`  ${starterResult.category}: ${starterResult.baseCount} recipes`);
  totalBase += starterResult.baseCount;
  totalTiered += starterResult.tieredCount;

  console.log('\n═══ MATERIALS ═══');
  console.log(`  ${materialResult.category}: ${materialResult.baseCount} items`);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      GRAND TOTALS                              ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Base Items:        ${String(totalBase).padStart(6)}                                 ║`);
  console.log(`║  With All Tiers:    ${String(totalTiered).padStart(6)} recipes                       ║`);
  console.log(`║  Target:               518+ recipes                            ║`);
  console.log(`║  Status:            ${totalTiered >= 518 ? '✅ EXCEEDS TARGET' : '❌ BELOW TARGET'}                          ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  console.log('\n═══ RECIPE ACQUISITION BREAKDOWN ═══');
  console.log(`  Purchasable: ${RECIPE_STATS.purchasable} (${RECIPE_STATS.purchasablePercent}%)`);
  console.log(`  Skill Tree:  ${RECIPE_STATS.skillTree} (${RECIPE_STATS.skillTreePercent}%)`);
  console.log(`  Drop Only:   ${RECIPE_STATS.dropOnly} (${RECIPE_STATS.dropOnlyPercent}%)`);

  return {
    weapons: weaponTotal,
    armor: armorResult.tieredCount,
    consumables: consumableTotal,
    starter: starterResult.tieredCount,
    materials: materialResult.baseCount,
    totalBase,
    totalTiered,
    meetsTarget: totalTiered >= 518
  };
}

runAudit();
