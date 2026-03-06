export interface T0Item {
  id: string;
  name: string;
  type: 'consumable' | 'armor' | 'accessory' | 'material';
  subType: string;
  tier: 0;
  description: string;
  stats?: Record<string, number>;
  effect?: string;
  duration?: number;
  craftedBy: string;
  sprite: string;
  stackable: boolean;
  maxStack: number;
}

export interface T0Recipe {
  id: string;
  name: string;
  outputItemId: string;
  outputQuantity: number;
  tier: 0;
  profession: string;
  station: string;
  craftTime: number;
  materials: { itemId: string; quantity: number }[];
  unlocksRecipes: string[];
}

const SPRITE_BASE = '/2dassets/sprites';

export const T0_CONSUMABLES: T0Item[] = [
  {
    id: 't0-health-potion',
    name: 'Minor Health Potion',
    type: 'consumable',
    subType: 'potion',
    tier: 0,
    description: 'A weak healing concoction. Restores a small amount of health.',
    effect: 'Restores 50 HP over 5 seconds',
    duration: 5,
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/consumable/minor-health-potion.png`,
    stackable: true,
    maxStack: 20
  },
  {
    id: 't0-mana-potion',
    name: 'Minor Mana Potion',
    type: 'consumable',
    subType: 'potion',
    tier: 0,
    description: 'A diluted mana restorative. Provides a small mana boost.',
    effect: 'Restores 30 Mana instantly',
    craftedBy: 'Mystic',
    sprite: `${SPRITE_BASE}/consumable/minor-mana-potion.png`,
    stackable: true,
    maxStack: 20
  },
  {
    id: 't0-cooked-meat',
    name: 'Charred Meat',
    type: 'consumable',
    subType: 'food',
    tier: 0,
    description: 'Barely edible but provides sustenance.',
    effect: '+5 HP regen/min for 10 minutes',
    duration: 600,
    stats: { hpRegen: 5 },
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/consumable/charred-meat.png`,
    stackable: true,
    maxStack: 10
  },
  {
    id: 't0-cooked-fish',
    name: 'Grilled Fish',
    type: 'consumable',
    subType: 'food',
    tier: 0,
    description: 'A simple grilled fish. Slightly bitter but nutritious.',
    effect: '+3 Mana regen/min for 10 minutes',
    duration: 600,
    stats: { manaRegen: 3 },
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/consumable/grilled-fish.png`,
    stackable: true,
    maxStack: 10
  },
  {
    id: 't0-herb-salad',
    name: 'Wild Herb Salad',
    type: 'consumable',
    subType: 'food',
    tier: 0,
    description: 'Foraged herbs tossed together. Provides minor buffs.',
    effect: '+2% all stats for 5 minutes',
    duration: 300,
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/consumable/herb-salad.png`,
    stackable: true,
    maxStack: 10
  }
];

export const T0_CLOTH_ARMOR: T0Item[] = [
  {
    id: 't0-cloth-hood',
    name: 'Tattered Hood',
    type: 'armor',
    subType: 'head',
    tier: 0,
    description: 'A worn cloth hood offering minimal protection.',
    stats: { defense: 2, mana: 5 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/tattered-hood.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-cloth-robe',
    name: 'Tattered Robe',
    type: 'armor',
    subType: 'chest',
    tier: 0,
    description: 'A patched robe with many holes.',
    stats: { defense: 4, mana: 10 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/tattered-robe.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-cloth-gloves',
    name: 'Worn Cloth Gloves',
    type: 'armor',
    subType: 'hands',
    tier: 0,
    description: 'Threadbare gloves that barely keep hands warm.',
    stats: { defense: 1, mana: 3 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/worn-cloth-gloves.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-cloth-pants',
    name: 'Patched Cloth Pants',
    type: 'armor',
    subType: 'legs',
    tier: 0,
    description: 'Pants held together by patches and hope.',
    stats: { defense: 3, mana: 6 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/patched-cloth-pants.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-cloth-shoes',
    name: 'Worn Cloth Shoes',
    type: 'armor',
    subType: 'feet',
    tier: 0,
    description: 'Thin-soled shoes with holes forming.',
    stats: { defense: 1, mana: 3, speed: 2 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/worn-cloth-shoes.png`,
    stackable: false,
    maxStack: 1
  }
];

export const T0_LEATHER_ARMOR: T0Item[] = [
  {
    id: 't0-leather-cap',
    name: 'Cracked Leather Cap',
    type: 'armor',
    subType: 'head',
    tier: 0,
    description: 'A leather cap with visible cracks.',
    stats: { defense: 4, stamina: 5 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/cracked-leather-cap.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-leather-vest',
    name: 'Worn Leather Vest',
    type: 'armor',
    subType: 'chest',
    tier: 0,
    description: 'A stiff leather vest past its prime.',
    stats: { defense: 8, stamina: 10 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/worn-leather-vest.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-leather-bracers',
    name: 'Frayed Leather Bracers',
    type: 'armor',
    subType: 'hands',
    tier: 0,
    description: 'Bracers with fraying edges.',
    stats: { defense: 3, stamina: 3 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/frayed-leather-bracers.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-leather-pants',
    name: 'Scuffed Leather Pants',
    type: 'armor',
    subType: 'legs',
    tier: 0,
    description: 'Well-worn leather pants with many scuffs.',
    stats: { defense: 6, stamina: 6 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/scuffed-leather-pants.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-leather-boots',
    name: 'Worn Leather Boots',
    type: 'armor',
    subType: 'feet',
    tier: 0,
    description: 'Boots that have seen many miles.',
    stats: { defense: 3, stamina: 4, speed: 3 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/armor/worn-leather-boots.png`,
    stackable: false,
    maxStack: 1
  }
];

export const T0_METAL_ARMOR: T0Item[] = [
  {
    id: 't0-metal-helm',
    name: 'Dented Iron Helm',
    type: 'armor',
    subType: 'head',
    tier: 0,
    description: 'A heavily dented iron helmet.',
    stats: { defense: 8, health: 10 },
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/armor/dented-iron-helm.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-metal-breastplate',
    name: 'Rusted Breastplate',
    type: 'armor',
    subType: 'chest',
    tier: 0,
    description: 'A breastplate covered in rust patches.',
    stats: { defense: 15, health: 20 },
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/armor/rusted-breastplate.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-metal-gauntlets',
    name: 'Battered Gauntlets',
    type: 'armor',
    subType: 'hands',
    tier: 0,
    description: 'Gauntlets with many battle scars.',
    stats: { defense: 5, health: 5 },
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/armor/battered-gauntlets.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-metal-greaves',
    name: 'Worn Iron Greaves',
    type: 'armor',
    subType: 'legs',
    tier: 0,
    description: 'Iron leg armor with visible wear.',
    stats: { defense: 10, health: 12 },
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/armor/worn-iron-greaves.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-metal-boots',
    name: 'Heavy Iron Boots',
    type: 'armor',
    subType: 'feet',
    tier: 0,
    description: 'Clunky iron boots that slow movement slightly.',
    stats: { defense: 6, health: 8, speed: -2 },
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/armor/heavy-iron-boots.png`,
    stackable: false,
    maxStack: 1
  }
];

export const T0_ACCESSORIES: T0Item[] = [
  {
    id: 't0-shield-wooden',
    name: 'Splintered Wooden Shield',
    type: 'accessory',
    subType: 'shield',
    tier: 0,
    description: 'A wooden shield with many splinters.',
    stats: { block: 10, defense: 5 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/accessory/splintered-wooden-shield.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-ring-copper',
    name: 'Tarnished Copper Ring',
    type: 'accessory',
    subType: 'ring',
    tier: 0,
    description: 'A simple copper ring losing its luster.',
    stats: { allStats: 1 },
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/accessory/tarnished-copper-ring.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-necklace-bone',
    name: 'Bone Tooth Necklace',
    type: 'accessory',
    subType: 'necklace',
    tier: 0,
    description: 'A crude necklace made from animal teeth.',
    stats: { health: 5, crit: 1 },
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/accessory/bone-tooth-necklace.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-cape-ragged',
    name: 'Ragged Cape',
    type: 'accessory',
    subType: 'back',
    tier: 0,
    description: 'A tattered cape barely hanging together.',
    stats: { defense: 2, speed: 1 },
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/accessory/ragged-cape.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-torch',
    name: 'Makeshift Torch',
    type: 'accessory',
    subType: 'torch',
    tier: 0,
    description: 'A branch wrapped in oil-soaked rags.',
    stats: { lightRadius: 5 },
    effect: 'Illuminates a 5m radius around the player',
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/accessory/makeshift-torch.png`,
    stackable: false,
    maxStack: 1
  },
  {
    id: 't0-spellbook',
    name: 'Novice Spellbook',
    type: 'accessory',
    subType: 'spellbook',
    tier: 0,
    description: 'A basic spellbook with a few simple incantations.',
    stats: { mana: 10, spellPower: 3 },
    craftedBy: 'Mystic',
    sprite: `${SPRITE_BASE}/accessory/novice-spellbook.png`,
    stackable: false,
    maxStack: 1
  }
];

export const T0_MATERIALS: T0Item[] = [
  {
    id: 'scrap-metal',
    name: 'Scrap Metal',
    type: 'material',
    subType: 'metal',
    tier: 0,
    description: 'Bits of rusted metal salvaged from old equipment.',
    craftedBy: 'Miner',
    sprite: `${SPRITE_BASE}/material/scrap-metal.png`,
    stackable: true,
    maxStack: 100
  },
  {
    id: 'wood-stick',
    name: 'Wood Stick',
    type: 'material',
    subType: 'wood',
    tier: 0,
    description: 'A sturdy wooden stick useful for handles.',
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/material/wood-stick.png`,
    stackable: true,
    maxStack: 100
  },
  {
    id: 'string',
    name: 'Crude String',
    type: 'material',
    subType: 'cloth',
    tier: 0,
    description: 'Fibrous string made from plant materials.',
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/material/crude-string.png`,
    stackable: true,
    maxStack: 100
  },
  {
    id: 'raw-meat-t0',
    name: 'Tough Meat',
    type: 'material',
    subType: 'ingredient',
    tier: 0,
    description: 'Tough meat from common beasts.',
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/ingredient/tough-meat.png`,
    stackable: true,
    maxStack: 50
  },
  {
    id: 'raw-fish-t0',
    name: 'Small Fish',
    type: 'material',
    subType: 'ingredient',
    tier: 0,
    description: 'Tiny fish caught from shallow waters.',
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/ingredient/small-fish.png`,
    stackable: true,
    maxStack: 50
  },
  {
    id: 'wild-herbs',
    name: 'Wild Herbs',
    type: 'material',
    subType: 'ingredient',
    tier: 0,
    description: 'Common herbs found in the wild.',
    craftedBy: 'Chef',
    sprite: `${SPRITE_BASE}/ingredient/wild-herbs.png`,
    stackable: true,
    maxStack: 50
  },
  {
    id: 'tattered-cloth',
    name: 'Tattered Cloth',
    type: 'material',
    subType: 'cloth',
    tier: 0,
    description: 'Scraps of old cloth salvaged from ruined garments.',
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/material/tattered-cloth.png`,
    stackable: true,
    maxStack: 100
  },
  {
    id: 'scrap-leather',
    name: 'Scrap Leather',
    type: 'material',
    subType: 'leather',
    tier: 0,
    description: 'Pieces of old leather cut from worn items.',
    craftedBy: 'Forester',
    sprite: `${SPRITE_BASE}/material/scrap-leather.png`,
    stackable: true,
    maxStack: 100
  }
];

export const T0_RECIPES: T0Recipe[] = [
  {
    id: 'recipe-t0-health-potion',
    name: 'Minor Health Potion Recipe',
    outputItemId: 't0-health-potion',
    outputQuantity: 1,
    tier: 0,
    profession: 'Chef',
    station: 'campfire',
    craftTime: 3,
    materials: [
      { itemId: 'wild-herbs', quantity: 2 },
      { itemId: 'raw-meat-t0', quantity: 1 }
    ],
    unlocksRecipes: ['recipe-t1-health-potion']
  },
  {
    id: 'recipe-t0-mana-potion',
    name: 'Minor Mana Potion Recipe',
    outputItemId: 't0-mana-potion',
    outputQuantity: 1,
    tier: 0,
    profession: 'Mystic',
    station: 'arcane-circle',
    craftTime: 3,
    materials: [
      { itemId: 'wild-herbs', quantity: 3 }
    ],
    unlocksRecipes: ['recipe-t1-mana-potion']
  },
  {
    id: 'recipe-t0-cooked-meat',
    name: 'Charred Meat Recipe',
    outputItemId: 't0-cooked-meat',
    outputQuantity: 1,
    tier: 0,
    profession: 'Chef',
    station: 'campfire',
    craftTime: 2,
    materials: [
      { itemId: 'raw-meat-t0', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-roasted-meat']
  },
  {
    id: 'recipe-t0-cooked-fish',
    name: 'Grilled Fish Recipe',
    outputItemId: 't0-cooked-fish',
    outputQuantity: 1,
    tier: 0,
    profession: 'Chef',
    station: 'campfire',
    craftTime: 2,
    materials: [
      { itemId: 'raw-fish-t0', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-baked-fish']
  },
  {
    id: 'recipe-t0-herb-salad',
    name: 'Wild Herb Salad Recipe',
    outputItemId: 't0-herb-salad',
    outputQuantity: 1,
    tier: 0,
    profession: 'Chef',
    station: 'campfire',
    craftTime: 1,
    materials: [
      { itemId: 'wild-herbs', quantity: 5 }
    ],
    unlocksRecipes: ['recipe-t1-herbal-stew']
  },
  {
    id: 'recipe-t0-cloth-hood',
    name: 'Tattered Hood Recipe',
    outputItemId: 't0-cloth-hood',
    outputQuantity: 1,
    tier: 0,
    profession: 'Forester',
    station: 'workbench',
    craftTime: 5,
    materials: [
      { itemId: 'tattered-cloth', quantity: 3 },
      { itemId: 'string', quantity: 1 }
    ],
    unlocksRecipes: ['recipe-t1-cloth-hood']
  },
  {
    id: 'recipe-t0-cloth-robe',
    name: 'Tattered Robe Recipe',
    outputItemId: 't0-cloth-robe',
    outputQuantity: 1,
    tier: 0,
    profession: 'Forester',
    station: 'workbench',
    craftTime: 8,
    materials: [
      { itemId: 'tattered-cloth', quantity: 6 },
      { itemId: 'string', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-cloth-robe']
  },
  {
    id: 'recipe-t0-leather-vest',
    name: 'Worn Leather Vest Recipe',
    outputItemId: 't0-leather-vest',
    outputQuantity: 1,
    tier: 0,
    profession: 'Forester',
    station: 'workbench',
    craftTime: 8,
    materials: [
      { itemId: 'scrap-leather', quantity: 6 },
      { itemId: 'string', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-leather-chest']
  },
  {
    id: 'recipe-t0-metal-breastplate',
    name: 'Rusted Breastplate Recipe',
    outputItemId: 't0-metal-breastplate',
    outputQuantity: 1,
    tier: 0,
    profession: 'Miner',
    station: 'forge',
    craftTime: 10,
    materials: [
      { itemId: 'scrap-metal', quantity: 8 },
      { itemId: 'scrap-leather', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-metal-chest']
  },
  {
    id: 'recipe-t0-shield',
    name: 'Splintered Wooden Shield Recipe',
    outputItemId: 't0-shield-wooden',
    outputQuantity: 1,
    tier: 0,
    profession: 'Forester',
    station: 'workbench',
    craftTime: 6,
    materials: [
      { itemId: 'wood-stick', quantity: 5 },
      { itemId: 'scrap-metal', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-wooden-shield']
  },
  {
    id: 'recipe-t0-ring',
    name: 'Tarnished Copper Ring Recipe',
    outputItemId: 't0-ring-copper',
    outputQuantity: 1,
    tier: 0,
    profession: 'Miner',
    station: 'forge',
    craftTime: 4,
    materials: [
      { itemId: 'scrap-metal', quantity: 3 }
    ],
    unlocksRecipes: ['recipe-t1-copper-ring']
  },
  {
    id: 'recipe-t0-necklace',
    name: 'Bone Tooth Necklace Recipe',
    outputItemId: 't0-necklace-bone',
    outputQuantity: 1,
    tier: 0,
    profession: 'Chef',
    station: 'campfire',
    craftTime: 4,
    materials: [
      { itemId: 'raw-meat-t0', quantity: 3 },
      { itemId: 'string', quantity: 1 }
    ],
    unlocksRecipes: ['recipe-t1-bone-necklace']
  },
  {
    id: 'recipe-t0-cape',
    name: 'Ragged Cape Recipe',
    outputItemId: 't0-cape-ragged',
    outputQuantity: 1,
    tier: 0,
    profession: 'Forester',
    station: 'workbench',
    craftTime: 5,
    materials: [
      { itemId: 'tattered-cloth', quantity: 4 },
      { itemId: 'string', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-cloth-cape']
  },
  {
    id: 'recipe-t0-torch',
    name: 'Makeshift Torch Recipe',
    outputItemId: 't0-torch',
    outputQuantity: 1,
    tier: 0,
    profession: 'Forester',
    station: 'campfire',
    craftTime: 2,
    materials: [
      { itemId: 'wood-stick', quantity: 2 },
      { itemId: 'tattered-cloth', quantity: 1 }
    ],
    unlocksRecipes: []
  },
  {
    id: 'recipe-t0-spellbook',
    name: 'Novice Spellbook Recipe',
    outputItemId: 't0-spellbook',
    outputQuantity: 1,
    tier: 0,
    profession: 'Mystic',
    station: 'arcane-circle',
    craftTime: 8,
    materials: [
      { itemId: 'tattered-cloth', quantity: 4 },
      { itemId: 'string', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-spellbook']
  },
  {
    id: 'recipe-t0-sword',
    name: 'Rusty Sword Recipe',
    outputItemId: 't0-sword-rusty',
    outputQuantity: 1,
    tier: 0,
    profession: 'Miner',
    station: 'forge',
    craftTime: 5,
    materials: [
      { itemId: 'scrap-metal', quantity: 2 },
      { itemId: 'wood-stick', quantity: 1 }
    ],
    unlocksRecipes: ['recipe-t1-sword-bloodfeud']
  },
  {
    id: 'recipe-t0-axe',
    name: 'Chipped Axe Recipe',
    outputItemId: 't0-axe-chipped',
    outputQuantity: 1,
    tier: 0,
    profession: 'Miner',
    station: 'forge',
    craftTime: 5,
    materials: [
      { itemId: 'scrap-metal', quantity: 3 },
      { itemId: 'wood-stick', quantity: 1 }
    ],
    unlocksRecipes: ['recipe-t1-axe-gorehowl']
  },
  {
    id: 'recipe-t0-bow',
    name: 'Simple Bow Recipe',
    outputItemId: 't0-bow-simple',
    outputQuantity: 1,
    tier: 0,
    profession: 'Forester',
    station: 'workbench',
    craftTime: 5,
    materials: [
      { itemId: 'wood-stick', quantity: 3 },
      { itemId: 'string', quantity: 2 }
    ],
    unlocksRecipes: ['recipe-t1-bow-wraithbone']
  },
  {
    id: 'recipe-t0-staff',
    name: 'Apprentice Staff Recipe',
    outputItemId: 't0-staff-apprentice',
    outputQuantity: 1,
    tier: 0,
    profession: 'Mystic',
    station: 'arcane-circle',
    craftTime: 8,
    materials: [
      { itemId: 'wood-stick', quantity: 3 }
    ],
    unlocksRecipes: ['recipe-t1-staff-fire', 'recipe-t1-staff-frost', 'recipe-t1-staff-nature', 'recipe-t1-staff-holy', 'recipe-t1-staff-arcane', 'recipe-t1-staff-lightning']
  }
];

export const ALL_T0_ITEMS: T0Item[] = [
  ...T0_CONSUMABLES,
  ...T0_CLOTH_ARMOR,
  ...T0_LEATHER_ARMOR,
  ...T0_METAL_ARMOR,
  ...T0_ACCESSORIES,
  ...T0_MATERIALS
];

export const ALL_T0_RECIPES = T0_RECIPES;

export function getT0ItemById(id: string): T0Item | undefined {
  return ALL_T0_ITEMS.find(item => item.id === id);
}

export function getT0RecipesByProfession(profession: string): T0Recipe[] {
  return T0_RECIPES.filter(r => r.profession === profession);
}
