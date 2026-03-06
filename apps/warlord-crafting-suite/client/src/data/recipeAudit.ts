import { WEAPON_SETS, ARMOR_SETS, ARMOR_SLOTS, ARMOR_MATERIALS, CONSUMABLE_SETS } from './tieredCrafting';
import { ALL_STARTER_RECIPES, CLASS_BONUS_RECIPES, RACE_BONUS_RECIPES } from './starterRecipes';
import { CRAFTING_MATERIALS } from './materials';
import { ALL_RECIPES, RECIPE_STATS } from './recipes';

export interface RecipeAuditStats {
  weapons: {
    base: number;
    tiered: number;
    byCategory: Record<string, number>;
  };
  armor: {
    base: number;
    tiered: number;
    sets: number;
    slots: number;
    materials: number;
  };
  consumables: {
    total: number;
    byCategory: Record<string, number>;
  };
  starter: {
    total: number;
    byProfession: Record<string, number>;
    classBonuses: number;
    raceBonuses: number;
  };
  materials: {
    total: number;
    byCategory: Record<string, number>;
    byTier: Record<number, number>;
  };
  totals: {
    baseItems: number;
    allTieredRecipes: number;
    target: number;
    exceeds: boolean;
    percentage: number;
  };
  acquisition: {
    purchasable: number;
    skillTree: number;
    dropOnly: number;
  };
}

export function calculateRecipeAudit(): RecipeAuditStats {
  const weaponsByCategory: Record<string, number> = {};
  let weaponBase = 0;
  
  Object.entries(WEAPON_SETS).forEach(([category, weapons]) => {
    weaponsByCategory[category] = weapons.length;
    weaponBase += weapons.length;
  });
  
  const armorBase = Object.keys(ARMOR_SETS).length * ARMOR_SLOTS.length * ARMOR_MATERIALS.length;
  
  const consumablesByCategory: Record<string, number> = {};
  let consumableTotal = 0;
  
  Object.entries(CONSUMABLE_SETS).forEach(([category, items]) => {
    consumablesByCategory[category] = items.length;
    consumableTotal += items.length;
  });
  
  const classBonuses = Object.values(CLASS_BONUS_RECIPES).flat();
  const raceBonuses = Object.values(RACE_BONUS_RECIPES).flat();
  const starterByProfession: Record<string, number> = {};
  
  ALL_STARTER_RECIPES.forEach(r => {
    starterByProfession[r.profession] = (starterByProfession[r.profession] || 0) + 1;
  });
  
  const materialsByCategory: Record<string, number> = {};
  const materialsByTier: Record<number, number> = {};
  
  CRAFTING_MATERIALS.forEach(m => {
    materialsByCategory[m.category] = (materialsByCategory[m.category] || 0) + 1;
    materialsByTier[m.tier] = (materialsByTier[m.tier] || 0) + 1;
  });
  
  const totalStarter = ALL_STARTER_RECIPES.length + classBonuses.length + raceBonuses.length;
  const baseItems = weaponBase + armorBase + consumableTotal + totalStarter;
  const weaponTiered = weaponBase * 8;
  const armorTiered = armorBase * 8;
  const allTieredRecipes = weaponTiered + armorTiered + consumableTotal + totalStarter;
  const target = 518;
  
  return {
    weapons: {
      base: weaponBase,
      tiered: weaponTiered,
      byCategory: weaponsByCategory
    },
    armor: {
      base: armorBase,
      tiered: armorTiered,
      sets: Object.keys(ARMOR_SETS).length,
      slots: ARMOR_SLOTS.length,
      materials: ARMOR_MATERIALS.length
    },
    consumables: {
      total: consumableTotal,
      byCategory: consumablesByCategory
    },
    starter: {
      total: totalStarter,
      byProfession: starterByProfession,
      classBonuses: classBonuses.length,
      raceBonuses: raceBonuses.length
    },
    materials: {
      total: CRAFTING_MATERIALS.length,
      byCategory: materialsByCategory,
      byTier: materialsByTier
    },
    totals: {
      baseItems,
      allTieredRecipes,
      target,
      exceeds: allTieredRecipes >= target,
      percentage: Math.round((allTieredRecipes / target) * 100)
    },
    acquisition: {
      purchasable: RECIPE_STATS.purchasable,
      skillTree: RECIPE_STATS.skillTree,
      dropOnly: RECIPE_STATS.dropOnly
    }
  };
}

export function validateMaterialReferences(): {
  valid: boolean;
  totalMaterials: number;
  byCategory: Record<string, number>;
  byTier: Record<number, number>;
} {
  const byCategory: Record<string, number> = {};
  const byTier: Record<number, number> = {};
  
  CRAFTING_MATERIALS.forEach(m => {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    byTier[m.tier] = (byTier[m.tier] || 0) + 1;
  });
  
  return {
    valid: CRAFTING_MATERIALS.length >= 100,
    totalMaterials: CRAFTING_MATERIALS.length,
    byCategory,
    byTier
  };
}

export const RECIPE_AUDIT = calculateRecipeAudit();
export const MATERIAL_VALIDATION = validateMaterialReferences();

export const SPRITE_STATS = {
  manifestItems: 172,
  generatedSprites: 95,
  coverage: 55,
  categories: {
    materials: 56,
    weapons: 33,
    other: 6
  },
  status: 'partial' as const
};
