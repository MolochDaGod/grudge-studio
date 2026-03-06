# Data Scripts

Scripts for managing, exporting, and validating game data.

## Available Scripts

### Export Data Structure
Shows the data architecture structure:
```bash
npx tsx scripts/data/export-to-json.ts
```

Output: `scripts/data/exports/_structure.json` - describes the data sources and architecture.

**Note**: Full data export requires running from within the web application context due to TypeScript path aliases. The browser-based app can access all data directly.

### Validate Data
Checks for data integrity issues (requires build context):
```bash
npx tsx scripts/data/validate-data.ts
```

Checks for:
- Duplicate IDs
- Missing parent references in skill trees
- Out-of-bounds positions
- Missing descriptions
- Invalid tier ranges

### Upload Assets
Uploads images to Replit Object Storage:
```bash
npx tsx scripts/upload-assets.ts
```

## Data Architecture

```
client/src/
├── data/                    # Raw data files (source of truth)
│   ├── core/               # Shared constants and types
│   │   ├── constants.ts    # PROFESSIONS, TIERS, NODE_TYPES
│   │   └── index.ts        # Barrel export
│   ├── miner.ts            # Miner profession data (84 nodes)
│   ├── forester.ts         # Forester profession data (82 nodes)
│   ├── mystic.ts           # Mystic profession data (85 nodes)
│   ├── chef.ts             # Chef profession data (90 nodes)
│   ├── engineer.ts         # Engineer profession data (60 nodes)
│   ├── weapons.ts          # All weapon definitions (96 items)
│   ├── equipment.ts        # All armor definitions (240+ items)
│   ├── recipes.ts          # Centralized recipes (140+)
│   ├── materials.ts        # Crafting materials
│   ├── tieredCrafting.ts   # T1-T8 tier system
│   ├── professionActivities.ts  # XP activities
│   └── professionTitles.ts      # Level titles
│
├── domains/                 # Domain-organized barrel exports
│   ├── professions/        # All profession-related exports
│   │   └── index.ts        # Re-exports from data/*.ts
│   ├── arsenal/            # Weapons & armor exports
│   │   └── index.ts        # Re-exports from data/weapons.ts, equipment.ts
│   └── crafting/           # Crafting-related exports
│       └── index.ts        # Re-exports from data/recipes.ts, materials.ts
```

## Import Patterns

### Using Domain Barrel Exports (Recommended)
```typescript
// All profession data
import { minerData, foresterData, professionActivities } from '@/domains/professions';

// Weapons and equipment
import { ALL_WEAPONS, ALL_EQUIPMENT, WEAPON_TYPES } from '@/domains/arsenal';

// Recipes and materials
import { ALL_RECIPES, CRAFTING_MATERIALS, getRecipesByProfession } from '@/domains/crafting';
```

### Direct Data Imports (For specific needs)
```typescript
import { minerData } from '@/data/miner';
import { SWORDS, AXES } from '@/data/weapons';
```

## Editing Data

1. **Edit TypeScript files directly** in `client/src/data/`
2. **Run the app** to see changes (hot reload supported)
3. **Consider validation** if making structural changes

## Adding New Content

### New Weapon
1. Add to appropriate array in `client/src/data/weapons.ts`
2. Follow existing stat format
3. Verify export in `ALL_WEAPONS`

### New Skill Node
1. Add to profession's `.ts` file in `treeData` array
2. Ensure unique `id` and valid `p` (parent) reference
3. Position with `x` and `y` (0-100 percentage)

### New Recipe
1. Add to `client/src/data/recipes.ts` in `ALL_RECIPES`
2. Include all required fields (id, name, profession, category, tierRange, acquisition)
