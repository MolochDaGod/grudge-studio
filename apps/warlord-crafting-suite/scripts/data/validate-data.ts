/**
 * Data Validation Script
 * 
 * Validates game data for consistency, missing references, and data integrity.
 * 
 * Usage: npx tsx scripts/data/validate-data.ts
 */

async function validateData() {
  console.log('🔍 Validating game data...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  // Dynamic imports
  const { minerData } = await import('../../client/src/data/miner');
  const { foresterData } = await import('../../client/src/data/forester');
  const { mysticData } = await import('../../client/src/data/mystic');
  const { chefData } = await import('../../client/src/data/chef');
  const { engineerData } = await import('../../client/src/data/engineer');
  const { ALL_WEAPONS } = await import('../../client/src/data/weapons');
  const { ALL_EQUIPMENT } = await import('../../client/src/data/equipment');
  const { ALL_RECIPES } = await import('../../client/src/data/recipes');

  const professions = { minerData, foresterData, mysticData, chefData, engineerData };

  // Validate skill tree nodes
  console.log('📌 Validating skill tree nodes...');
  for (const [name, data] of Object.entries(professions)) {
    const nodeIds = new Set<number>();
    
    for (const node of data.treeData) {
      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push(`[${name}] Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      // Check parent references
      if (node.p !== null && !data.treeData.find(n => n.id === node.p)) {
        errors.push(`[${name}] Node ${node.id} references non-existent parent: ${node.p}`);
      }

      // Check position bounds
      if (node.x < 0 || node.x > 100 || node.y < 0 || node.y > 100) {
        warnings.push(`[${name}] Node ${node.id} has out-of-bounds position: (${node.x}, ${node.y})`);
      }

      // Check for missing descriptions
      if (!node.desc) {
        warnings.push(`[${name}] Node ${node.id} (${node.n}) is missing description`);
      }
    }
  }

  // Validate weapons
  console.log('⚔️ Validating weapons...');
  const weaponIds = new Set<string>();
  for (const weapon of ALL_WEAPONS) {
    if (weaponIds.has(weapon.id)) {
      errors.push(`Duplicate weapon ID: ${weapon.id}`);
    }
    weaponIds.add(weapon.id);

    // Check stats
    if (weapon.stats.damageBase < 0) {
      errors.push(`Weapon ${weapon.id} has negative damage`);
    }
  }

  // Validate equipment
  console.log('🛡️ Validating equipment...');
  const equipmentIds = new Set<string>();
  for (const equip of ALL_EQUIPMENT) {
    if (equipmentIds.has(equip.id)) {
      errors.push(`Duplicate equipment ID: ${equip.id}`);
    }
    equipmentIds.add(equip.id);
  }

  // Validate recipes
  console.log('📜 Validating recipes...');
  const recipeIds = new Set<string>();
  for (const recipe of ALL_RECIPES) {
    if (recipeIds.has(recipe.id)) {
      errors.push(`Duplicate recipe ID: ${recipe.id}`);
    }
    recipeIds.add(recipe.id);

    // Check tier range
    if (recipe.tierRange[0] > recipe.tierRange[1]) {
      errors.push(`Recipe ${recipe.id} has invalid tier range: [${recipe.tierRange}]`);
    }
  }

  // Check profession recipe counts
  console.log('\n📊 Recipe Counts by Profession:');
  const professionRecipeCounts: Record<string, number> = {};
  for (const recipe of ALL_RECIPES) {
    professionRecipeCounts[recipe.profession] = (professionRecipeCounts[recipe.profession] || 0) + 1;
  }
  for (const [prof, count] of Object.entries(professionRecipeCounts)) {
    console.log(`   ${prof}: ${count} recipes`);
  }

  // Report results
  console.log('\n' + '='.repeat(50));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All validations passed!');
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} Error(s):`);
      errors.forEach(e => console.log(`   - ${e}`));
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} Warning(s):`);
      warnings.forEach(w => console.log(`   - ${w}`));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${errors.length} errors, ${warnings.length} warnings`);

  process.exit(errors.length > 0 ? 1 : 0);
}

validateData().catch(console.error);
