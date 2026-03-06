export { 
  SWORDS, AXES, BOWS, CROSSBOWS, GUNS, DAGGERS,
  GREATSWORDS, GREATAXES, HAMMERS_1H, HAMMERS_2H,
  STAVES, TOMES,
  ALL_WEAPONS, WEAPON_TYPES
} from '@/data/weapons';

export { 
  CLOTH_EQUIPMENT, LEATHER_EQUIPMENT, METAL_EQUIPMENT, GEM_EQUIPMENT,
  ALL_EQUIPMENT, EQUIPMENT_SETS, EQUIPMENT_SLOTS, ARMOR_MATERIALS
} from '@/data/equipment';

export { 
  WEAPON_SETS, 
  ARMOR_SETS as TIERED_ARMOR_SETS, 
  CONSUMABLE_SETS,
  TIERS, TIER_LABELS, TIER_MATERIALS, TIER_COSTS,
  ARMOR_SLOTS as TIERED_ARMOR_SLOTS,
  ARMOR_MATERIALS as TIERED_ARMOR_MATERIALS
} from '@/data/tieredCrafting';

export type { Weapon, WeaponStats, WeaponAbility } from '@/data/weapons';
export type { EquipmentItem, EquipmentStats } from '@/data/equipment';
export type { Tier } from '@/data/tieredCrafting';
