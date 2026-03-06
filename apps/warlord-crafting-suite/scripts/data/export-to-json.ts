/**
 * Data Export Script
 * 
 * Exports all game data to JSON files for easy iteration, editing,
 * and syncing across different deployments.
 * 
 * Usage: npm run build && node scripts/data/export-to-json.js
 * 
 * Note: This script needs to run after build because it requires
 * the compiled client code. For development, use the web-based
 * export in the app instead.
 * 
 * Output: scripts/data/exports/
 */

import * as fs from 'fs';
import * as path from 'path';

const EXPORT_DIR = path.join(__dirname, 'exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

console.log('📦 Game Data Export Script');
console.log('');
console.log('This script exports game data to JSON files.');
console.log('');
console.log('To export data, run the app and use the built-in export feature,');
console.log('or build the app first with `npm run build`.');
console.log('');
console.log('Export directory:', EXPORT_DIR);
console.log('');

// Create a sample structure file showing what data is available
const structure = {
  description: 'GRUDGE Warlords Game Data Structure',
  lastUpdated: new Date().toISOString(),
  dataSources: {
    professions: {
      files: ['miner.ts', 'forester.ts', 'mystic.ts', 'chef.ts', 'engineer.ts'],
      description: 'Profession skill trees with nodes, recipes, and bonuses',
      dataShape: {
        name: 'string',
        icon: 'string',
        description: 'string',
        treeData: 'TreeNode[]',
        recipes: 'Recipe[]',
      },
    },
    weapons: {
      file: 'weapons.ts',
      description: 'All weapons with stats and abilities',
      categories: ['Swords', 'Axes', 'Bows', 'Crossbows', 'Guns', 'Daggers', 'Greatswords', 'Greataxes', 'Hammers', 'Spears', 'Maces', 'Staves', 'Tomes'],
    },
    equipment: {
      file: 'equipment.ts',
      description: 'All armor and equipment',
      materials: ['Cloth', 'Leather', 'Metal', 'Gem'],
      sets: ['Bloodfeud', 'Wraithfang', 'Oathbreaker', 'Kinrend', 'Dusksinger', 'Emberclad'],
    },
    recipes: {
      file: 'recipes.ts',
      description: 'Centralized recipe database with acquisition types',
      acquisitionTypes: ['purchasable', 'skillTree', 'dropOnly'],
    },
    tieredCrafting: {
      file: 'tieredCrafting.ts',
      description: 'T1-T8 tier system with materials and costs',
    },
  },
  domains: {
    professions: 'client/src/domains/professions/index.ts',
    arsenal: 'client/src/domains/arsenal/index.ts',
    crafting: 'client/src/domains/crafting/index.ts',
  },
};

fs.writeFileSync(
  path.join(EXPORT_DIR, '_structure.json'),
  JSON.stringify(structure, null, 2)
);

console.log('✅ Created _structure.json showing data architecture');
