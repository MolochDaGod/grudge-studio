// Recipe acquisition sources
export type RecipeSource = 'starter' | 'skillTree' | 'harvesting' | 'drop' | 'purchase' | 'dismantle' | 'quest';

export interface RecipeAcquisition {
  source: RecipeSource;
  skillNode?: string;          // For skillTree - which node unlocks it
  harvestLevel?: number;       // For harvesting - required profession level
  dropSource?: string;         // For drops - where it drops from
  purchaseCost?: number;       // For purchase - gold cost
  dismantleItem?: string;      // For dismantle - which item gives this recipe
  questId?: string;            // For quest - which quest unlocks it
}

export interface StarterRecipe {
  id: string;
  name: string;
  profession: string;
  type: 'Refining' | 'Weapons' | 'Armor' | 'Consumable' | 'Utility' | 'Building' | 'Mount';
  tier: number;
  description: string;
  craftingTime: number;
  requiredStation?: string;
  inputs: { itemId: string; quantity: number }[];
  outputs: { itemId: string; quantity: number }[];
  // Recipe acquisition and progression
  acquisition?: RecipeAcquisition;
  baseRecipeXp?: number;       // XP gained per craft toward recipe mastery
  dismantleReturn?: number;    // % of materials returned (0-100)
}

export const CRAFTING_STATIONS = {
  campfire: { id: 'campfire', name: 'Campfire', profession: 'Chef', tier: 0, description: 'Basic cooking station' },
  forge: { id: 'forge', name: 'Forge', profession: 'Miner', tier: 1, description: 'Smelt ores and craft metal items' },
  furnace: { id: 'furnace', name: 'Furnace', profession: 'Miner', tier: 0, description: 'Simple ore smelting' },
  sawmill: { id: 'sawmill', name: 'Sawmill', profession: 'Forester', tier: 1, description: 'Process logs into planks' },
  workbench: { id: 'workbench', name: 'Workbench', profession: 'Forester', tier: 0, description: 'Basic woodworking' },
  loom: { id: 'loom', name: 'Loom', profession: 'Mystic', tier: 1, description: 'Weave cloth from thread' },
  spinningWheel: { id: 'spinning-wheel', name: 'Spinning Wheel', profession: 'Mystic', tier: 0, description: 'Spin fibers into thread' },
  kitchen: { id: 'kitchen', name: 'Kitchen', profession: 'Chef', tier: 1, description: 'Advanced cooking station' },
  workshop: { id: 'workshop', name: 'Workshop', profession: 'Engineer', tier: 1, description: 'Assemble mechanical components' },
  tinkerBench: { id: 'tinker-bench', name: 'Tinker Bench', profession: 'Engineer', tier: 0, description: 'Basic engineering' },
  scriptorium: { id: 'scriptorium', name: 'Scriptorium', profession: 'All', tier: 1, description: 'Create scrolls and recipes' },
} as const;

export type CraftingStationId = keyof typeof CRAFTING_STATIONS;

export const T0_UNIVERSAL_RECIPES: StarterRecipe[] = [
  // === REFINING ===
  {
    id: 'parchment',
    name: 'Parchment',
    profession: 'All',
    type: 'Refining',
    tier: 0,
    description: 'Thin writing surface made from plant fibers',
    craftingTime: 5,
    inputs: [{ itemId: 'plant-fiber', quantity: 3 }],
    outputs: [{ itemId: 'parchment', quantity: 1 }],
  },
  {
    id: 'ink',
    name: 'Ink',
    profession: 'All',
    type: 'Refining',
    tier: 0,
    description: 'Dark writing fluid for inscriptions',
    craftingTime: 5,
    inputs: [{ itemId: 'charcoal', quantity: 1 }, { itemId: 'water', quantity: 1 }],
    outputs: [{ itemId: 'ink', quantity: 1 }],
  },
  {
    id: 'simple-thread',
    name: 'Simple Thread',
    profession: 'All',
    type: 'Refining',
    tier: 0,
    description: 'Basic thread spun from plant fibers',
    craftingTime: 10,
    inputs: [{ itemId: 'plant-fiber', quantity: 5 }],
    outputs: [{ itemId: 'simple-thread', quantity: 2 }],
  },
  {
    id: 'blank-scroll',
    name: 'Blank Scroll',
    profession: 'All',
    type: 'Utility',
    tier: 0,
    description: 'An empty scroll ready for inscription',
    craftingTime: 15,
    inputs: [{ itemId: 'parchment', quantity: 2 }, { itemId: 'simple-thread', quantity: 1 }],
    outputs: [{ itemId: 'blank-scroll', quantity: 1 }],
  },
  // === CONSUMABLES - Potions & Bandages ===
  {
    id: 'minor-health-potion',
    name: 'Minor Health Potion',
    profession: 'All',
    type: 'Consumable',
    tier: 0,
    description: 'Restores 25 HP instantly',
    craftingTime: 20,
    inputs: [{ itemId: 'herb', quantity: 2 }, { itemId: 'water', quantity: 1 }],
    outputs: [{ itemId: 'minor-health-potion', quantity: 1 }],
  },
  {
    id: 'minor-mana-potion',
    name: 'Minor Mana Potion',
    profession: 'All',
    type: 'Consumable',
    tier: 0,
    description: 'Restores 25 Mana instantly',
    craftingTime: 20,
    inputs: [{ itemId: 'arcane-dust', quantity: 1 }, { itemId: 'water', quantity: 2 }],
    outputs: [{ itemId: 'minor-mana-potion', quantity: 1 }],
  },
  {
    id: 'crude-bandage',
    name: 'Crude Bandage',
    profession: 'All',
    type: 'Consumable',
    tier: 0,
    description: 'Stops bleeding and restores 10 HP over 10s',
    craftingTime: 10,
    inputs: [{ itemId: 'torn-rag', quantity: 2 }],
    outputs: [{ itemId: 'crude-bandage', quantity: 1 }],
  },
  {
    id: 'simple-bandage',
    name: 'Simple Bandage',
    profession: 'All',
    type: 'Consumable',
    tier: 0,
    description: 'Stops bleeding and restores 20 HP over 10s',
    craftingTime: 15,
    inputs: [{ itemId: 'simple-thread', quantity: 2 }, { itemId: 'herb', quantity: 1 }],
    outputs: [{ itemId: 'simple-bandage', quantity: 2 }],
  },
  // === WEAPONS ===
  {
    id: 'wooden-club',
    name: 'Wooden Club',
    profession: 'All',
    type: 'Weapons',
    tier: 0,
    description: 'A crude bludgeon carved from wood',
    craftingTime: 30,
    inputs: [{ itemId: 'rotted-wood', quantity: 3 }],
    outputs: [{ itemId: 'wooden-club', quantity: 1 }],
  },
  {
    id: 'stone-knife',
    name: 'Stone Knife',
    profession: 'All',
    type: 'Weapons',
    tier: 0,
    description: 'A sharp stone lashed to a handle',
    craftingTime: 25,
    inputs: [{ itemId: 'stone', quantity: 2 }, { itemId: 'simple-thread', quantity: 1 }],
    outputs: [{ itemId: 'stone-knife', quantity: 1 }],
  },
  {
    id: 'makeshift-spear',
    name: 'Makeshift Spear',
    profession: 'All',
    type: 'Weapons',
    tier: 0,
    description: 'A sharpened stick for poking enemies',
    craftingTime: 20,
    inputs: [{ itemId: 'rotted-wood', quantity: 2 }, { itemId: 'stone', quantity: 1 }],
    outputs: [{ itemId: 'makeshift-spear', quantity: 1 }],
  },
  // === ARMOR ===
  {
    id: 'tattered-shirt',
    name: 'Tattered Shirt',
    profession: 'All',
    type: 'Armor',
    tier: 0,
    description: 'Barely holds together, +1 Defense',
    craftingTime: 30,
    inputs: [{ itemId: 'torn-rag', quantity: 4 }, { itemId: 'simple-thread', quantity: 2 }],
    outputs: [{ itemId: 'tattered-shirt', quantity: 1 }],
  },
  {
    id: 'scrap-helm',
    name: 'Scrap Helm',
    profession: 'All',
    type: 'Armor',
    tier: 0,
    description: 'Dented metal scrap shaped into a helm, +1 Defense',
    craftingTime: 35,
    inputs: [{ itemId: 'scrap-metal', quantity: 2 }],
    outputs: [{ itemId: 'scrap-helm', quantity: 1 }],
  },
  {
    id: 'ragged-pants',
    name: 'Ragged Pants',
    profession: 'All',
    type: 'Armor',
    tier: 0,
    description: 'Worn cloth pants, +1 Defense',
    craftingTime: 25,
    inputs: [{ itemId: 'torn-rag', quantity: 3 }, { itemId: 'simple-thread', quantity: 1 }],
    outputs: [{ itemId: 'ragged-pants', quantity: 1 }],
  },
  {
    id: 'scrappy-boots',
    name: 'Scrappy Boots',
    profession: 'All',
    type: 'Armor',
    tier: 0,
    description: 'Cobbled together footwear, +1 Defense',
    craftingTime: 20,
    inputs: [{ itemId: 'leather-scraps', quantity: 2 }, { itemId: 'simple-thread', quantity: 1 }],
    outputs: [{ itemId: 'scrappy-boots', quantity: 1 }],
  },
  {
    id: 'hand-wraps',
    name: 'Hand Wraps',
    profession: 'All',
    type: 'Armor',
    tier: 0,
    description: 'Simple cloth wrappings for hands',
    craftingTime: 15,
    inputs: [{ itemId: 'torn-rag', quantity: 2 }],
    outputs: [{ itemId: 'hand-wraps', quantity: 1 }],
  },
  // === BUILDINGS ===
  {
    id: 'tent',
    name: 'Tent',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'Basic shelter for resting',
    craftingTime: 60,
    inputs: [{ itemId: 'rotted-wood', quantity: 4 }, { itemId: 'torn-rag', quantity: 6 }, { itemId: 'simple-thread', quantity: 3 }],
    outputs: [{ itemId: 'tent', quantity: 1 }],
  },
  {
    id: 'campfire-building',
    name: 'Campfire',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'A warm fire for cooking and light',
    craftingTime: 30,
    inputs: [{ itemId: 'stone', quantity: 5 }, { itemId: 'rotted-wood', quantity: 3 }],
    outputs: [{ itemId: 'campfire-building', quantity: 1 }],
  },
  {
    id: 'crude-workbench',
    name: 'Crude Workbench',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'A flat surface for basic crafting',
    craftingTime: 45,
    inputs: [{ itemId: 'rotted-wood', quantity: 6 }, { itemId: 'stone', quantity: 2 }],
    outputs: [{ itemId: 'crude-workbench', quantity: 1 }],
  },
  {
    id: 'watch-tower',
    name: 'Watch Tower',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'Tall structure for scouting the area',
    craftingTime: 120,
    inputs: [{ itemId: 'rotted-wood', quantity: 10 }, { itemId: 'simple-thread', quantity: 4 }],
    outputs: [{ itemId: 'watch-tower', quantity: 1 }],
  },
  {
    id: 'wooden-fence',
    name: 'Wooden Fence',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'Simple fence section for perimeter',
    craftingTime: 20,
    inputs: [{ itemId: 'rotted-wood', quantity: 3 }],
    outputs: [{ itemId: 'wooden-fence', quantity: 2 }],
  },
  {
    id: 'storage-chest',
    name: 'Storage Chest',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'Wooden box for storing items',
    craftingTime: 40,
    inputs: [{ itemId: 'rotted-wood', quantity: 5 }, { itemId: 'scrap-metal', quantity: 1 }],
    outputs: [{ itemId: 'storage-chest', quantity: 1 }],
  },
  {
    id: 'crude-raft',
    name: 'Crude Raft',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'A simple floating platform for water travel',
    craftingTime: 90,
    inputs: [{ itemId: 'rotted-wood', quantity: 8 }, { itemId: 'simple-thread', quantity: 5 }],
    outputs: [{ itemId: 'crude-raft', quantity: 1 }],
  },
  {
    id: 'lean-to',
    name: 'Lean-To',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'Quick shelter against a tree or rock',
    craftingTime: 25,
    inputs: [{ itemId: 'rotted-wood', quantity: 3 }, { itemId: 'plant-fiber', quantity: 4 }],
    outputs: [{ itemId: 'lean-to', quantity: 1 }],
  },
  {
    id: 'drying-rack',
    name: 'Drying Rack',
    profession: 'All',
    type: 'Building',
    tier: 0,
    description: 'Hang meat and fish to preserve them',
    craftingTime: 35,
    inputs: [{ itemId: 'rotted-wood', quantity: 4 }, { itemId: 'simple-thread', quantity: 2 }],
    outputs: [{ itemId: 'drying-rack', quantity: 1 }],
  },
];

export const MINER_STARTER_RECIPES: StarterRecipe[] = [
  // === T0 REFINING ===
  {
    id: 'scrap-metal',
    name: 'Scrap Metal',
    profession: 'Miner',
    type: 'Refining',
    tier: 0,
    description: 'Salvage metal from junk',
    craftingTime: 10,
    requiredStation: 'furnace',
    inputs: [{ itemId: 'junk-ore', quantity: 3 }],
    outputs: [{ itemId: 'scrap-metal', quantity: 1 }],
  },
  // === T0 WEAPONS ===
  {
    id: 'broken-blade',
    name: 'Broken Blade',
    profession: 'Miner',
    type: 'Weapons',
    tier: 0,
    description: 'A crude blade forged from scrap',
    craftingTime: 60,
    requiredStation: 'furnace',
    inputs: [{ itemId: 'scrap-metal', quantity: 3 }, { itemId: 'simple-thread', quantity: 1 }],
    outputs: [{ itemId: 'broken-blade', quantity: 1 }],
  },
  {
    id: 'rusty-mace',
    name: 'Rusty Mace',
    profession: 'Miner',
    type: 'Weapons',
    tier: 0,
    description: 'A heavy scrap metal bludgeon',
    craftingTime: 55,
    requiredStation: 'furnace',
    inputs: [{ itemId: 'scrap-metal', quantity: 4 }, { itemId: 'rotted-wood', quantity: 1 }],
    outputs: [{ itemId: 'rusty-mace', quantity: 1 }],
  },
  // === T0 ARMOR ===
  {
    id: 'scrap-chestplate',
    name: 'Scrap Chestplate',
    profession: 'Miner',
    type: 'Armor',
    tier: 0,
    description: 'Hammered scrap metal chest armor, +3 Defense',
    craftingTime: 90,
    requiredStation: 'furnace',
    inputs: [{ itemId: 'scrap-metal', quantity: 5 }, { itemId: 'simple-thread', quantity: 2 }],
    outputs: [{ itemId: 'scrap-chestplate', quantity: 1 }],
  },
  {
    id: 'scrap-greaves',
    name: 'Scrap Greaves',
    profession: 'Miner',
    type: 'Armor',
    tier: 0,
    description: 'Crude metal leg guards, +2 Defense',
    craftingTime: 70,
    requiredStation: 'furnace',
    inputs: [{ itemId: 'scrap-metal', quantity: 4 }],
    outputs: [{ itemId: 'scrap-greaves', quantity: 1 }],
  },
  // === T1 REFINING ===
  {
    id: 'copper-ingot',
    name: 'Copper Ingot',
    profession: 'Miner',
    type: 'Refining',
    tier: 1,
    description: 'Smelt copper ore into usable ingots',
    craftingTime: 30,
    requiredStation: 'furnace',
    inputs: [{ itemId: 'copper-ore', quantity: 5 }],
    outputs: [{ itemId: 'copper-ingot', quantity: 1 }],
  },
  // === T1 WEAPONS ===
  {
    id: 'bloodfeud-blade',
    name: 'Bloodfeud Blade',
    profession: 'Miner',
    type: 'Weapons',
    tier: 1,
    description: 'A basic copper sword',
    craftingTime: 120,
    requiredStation: 'forge',
    inputs: [{ itemId: 'copper-ingot', quantity: 3 }, { itemId: 'leather-strips', quantity: 2 }],
    outputs: [{ itemId: 'bloodfeud-blade', quantity: 1 }],
  },
];

export const FORESTER_STARTER_RECIPES: StarterRecipe[] = [
  // === T0 REFINING ===
  {
    id: 'rotted-wood',
    name: 'Rotted Wood',
    profession: 'Forester',
    type: 'Refining',
    tier: 0,
    description: 'Salvage usable wood from debris',
    craftingTime: 10,
    inputs: [{ itemId: 'wood-scraps', quantity: 3 }],
    outputs: [{ itemId: 'rotted-wood', quantity: 1 }],
  },
  // === T0 WEAPONS ===
  {
    id: 'warped-bow',
    name: 'Warped Bow',
    profession: 'Forester',
    type: 'Weapons',
    tier: 0,
    description: 'A crude bow bent from salvage',
    craftingTime: 60,
    requiredStation: 'workbench',
    inputs: [{ itemId: 'rotted-wood', quantity: 2 }, { itemId: 'simple-thread', quantity: 3 }],
    outputs: [{ itemId: 'warped-bow', quantity: 1 }],
  },
  {
    id: 'whittled-arrows',
    name: 'Whittled Arrows',
    profession: 'Forester',
    type: 'Weapons',
    tier: 0,
    description: 'Crude arrows sharpened from wood',
    craftingTime: 20,
    inputs: [{ itemId: 'rotted-wood', quantity: 1 }, { itemId: 'feathers', quantity: 2 }],
    outputs: [{ itemId: 'whittled-arrows', quantity: 5 }],
  },
  // === T0 ARMOR ===
  {
    id: 'bark-vest',
    name: 'Bark Vest',
    profession: 'Forester',
    type: 'Armor',
    tier: 0,
    description: 'Rough bark stitched into armor, +2 Defense',
    craftingTime: 50,
    inputs: [{ itemId: 'rotted-wood', quantity: 3 }, { itemId: 'simple-thread', quantity: 3 }],
    outputs: [{ itemId: 'bark-vest', quantity: 1 }],
  },
  {
    id: 'hide-bracers',
    name: 'Hide Bracers',
    profession: 'Forester',
    type: 'Armor',
    tier: 0,
    description: 'Crude leather arm guards, +1 Defense',
    craftingTime: 35,
    inputs: [{ itemId: 'leather-scraps', quantity: 3 }, { itemId: 'simple-thread', quantity: 1 }],
    outputs: [{ itemId: 'hide-bracers', quantity: 1 }],
  },
  // === T0 BUILDINGS ===
  {
    id: 'wooden-spike',
    name: 'Wooden Spike',
    profession: 'Forester',
    type: 'Building',
    tier: 0,
    description: 'Sharpened wood for defense',
    craftingTime: 15,
    inputs: [{ itemId: 'rotted-wood', quantity: 2 }],
    outputs: [{ itemId: 'wooden-spike', quantity: 3 }],
  },
  // === T1 REFINING ===
  {
    id: 'pine-plank',
    name: 'Pine Plank',
    profession: 'Forester',
    type: 'Refining',
    tier: 1,
    description: 'Process pine logs into smooth planks',
    craftingTime: 30,
    requiredStation: 'sawmill',
    inputs: [{ itemId: 'pine-log', quantity: 3 }],
    outputs: [{ itemId: 'pine-plank', quantity: 2 }],
  },
  // === T1 WEAPONS ===
  {
    id: 'wraithbone-bow',
    name: 'Wraithbone Bow',
    profession: 'Forester',
    type: 'Weapons',
    tier: 1,
    description: 'A sturdy pine hunting bow',
    craftingTime: 120,
    requiredStation: 'workbench',
    inputs: [{ itemId: 'pine-plank', quantity: 2 }, { itemId: 'linen-thread', quantity: 2 }],
    outputs: [{ itemId: 'wraithbone-bow', quantity: 1 }],
  },
];

export const MYSTIC_STARTER_RECIPES: StarterRecipe[] = [
  // === T0 REFINING ===
  {
    id: 'torn-rag',
    name: 'Torn Rag',
    profession: 'Mystic',
    type: 'Refining',
    tier: 0,
    description: 'Salvage usable cloth from scraps',
    craftingTime: 10,
    inputs: [{ itemId: 'cloth-scraps', quantity: 3 }],
    outputs: [{ itemId: 'torn-rag', quantity: 1 }],
  },
  // === T0 WEAPONS ===
  {
    id: 'cracked-rod',
    name: 'Cracked Rod',
    profession: 'Mystic',
    type: 'Weapons',
    tier: 0,
    description: 'A crude staff held together with rags',
    craftingTime: 60,
    inputs: [{ itemId: 'rotted-wood', quantity: 1 }, { itemId: 'torn-rag', quantity: 2 }],
    outputs: [{ itemId: 'cracked-rod', quantity: 1 }],
  },
  {
    id: 'focus-stone',
    name: 'Focus Stone',
    profession: 'Mystic',
    type: 'Weapons',
    tier: 0,
    description: 'A rough crystal that channels weak magic',
    craftingTime: 45,
    inputs: [{ itemId: 'arcane-dust', quantity: 2 }, { itemId: 'stone', quantity: 1 }],
    outputs: [{ itemId: 'focus-stone', quantity: 1 }],
  },
  // === T0 ARMOR ===
  {
    id: 'patchwork-robe',
    name: 'Patchwork Robe',
    profession: 'Mystic',
    type: 'Armor',
    tier: 0,
    description: 'Rough cloth sewn into a robe, +1 Defense +2 Mana',
    craftingTime: 70,
    inputs: [{ itemId: 'torn-rag', quantity: 5 }, { itemId: 'simple-thread', quantity: 3 }],
    outputs: [{ itemId: 'patchwork-robe', quantity: 1 }],
  },
  {
    id: 'cloth-hood',
    name: 'Cloth Hood',
    profession: 'Mystic',
    type: 'Armor',
    tier: 0,
    description: 'Simple head covering, +1 Mana',
    craftingTime: 30,
    inputs: [{ itemId: 'torn-rag', quantity: 2 }, { itemId: 'simple-thread', quantity: 1 }],
    outputs: [{ itemId: 'cloth-hood', quantity: 1 }],
  },
  // === T1 REFINING ===
  {
    id: 'linen-cloth',
    name: 'Linen Cloth',
    profession: 'Mystic',
    type: 'Refining',
    tier: 1,
    description: 'Weave linen thread into cloth',
    craftingTime: 30,
    requiredStation: 'loom',
    inputs: [{ itemId: 'linen-thread', quantity: 4 }],
    outputs: [{ itemId: 'linen-cloth', quantity: 1 }],
  },
  // === T1 WEAPONS ===
  {
    id: 'emberwrath-staff',
    name: 'Emberwrath Staff',
    profession: 'Mystic',
    type: 'Weapons',
    tier: 1,
    description: 'Channel flames through this focus staff',
    craftingTime: 120,
    requiredStation: 'loom',
    inputs: [{ itemId: 'pine-plank', quantity: 1 }, { itemId: 'linen-cloth', quantity: 2 }, { itemId: 'ember-essence', quantity: 1 }],
    outputs: [{ itemId: 'emberwrath-staff', quantity: 1 }],
  },
];

export const CHEF_STARTER_RECIPES: StarterRecipe[] = [
  // === T0 REFINING ===
  {
    id: 'charcoal',
    name: 'Charcoal',
    profession: 'Chef',
    type: 'Refining',
    tier: 0,
    description: 'Burn wood scraps into fuel',
    craftingTime: 15,
    requiredStation: 'campfire',
    inputs: [{ itemId: 'wood-scraps', quantity: 5 }],
    outputs: [{ itemId: 'charcoal', quantity: 2 }],
  },
  {
    id: 'salt',
    name: 'Salt',
    profession: 'Chef',
    type: 'Refining',
    tier: 0,
    description: 'Evaporate seawater to extract salt',
    craftingTime: 20,
    requiredStation: 'campfire',
    inputs: [{ itemId: 'seawater', quantity: 3 }],
    outputs: [{ itemId: 'salt', quantity: 1 }],
  },
  // === T0 CONSUMABLES ===
  {
    id: 'grilled-fish',
    name: 'Grilled Fish',
    profession: 'Chef',
    type: 'Consumable',
    tier: 0,
    description: 'Simple restorative meal (+10 HP)',
    craftingTime: 30,
    requiredStation: 'campfire',
    inputs: [{ itemId: 'raw-fish', quantity: 1 }, { itemId: 'charcoal', quantity: 1 }],
    outputs: [{ itemId: 'grilled-fish', quantity: 1 }],
  },
  {
    id: 'simple-bread',
    name: 'Simple Bread',
    profession: 'Chef',
    type: 'Consumable',
    tier: 0,
    description: 'Basic stamina food (+10 Stamina)',
    craftingTime: 45,
    requiredStation: 'campfire',
    inputs: [{ itemId: 'flour', quantity: 2 }, { itemId: 'water', quantity: 1 }],
    outputs: [{ itemId: 'simple-bread', quantity: 2 }],
  },
  {
    id: 'roasted-meat',
    name: 'Roasted Meat',
    profession: 'Chef',
    type: 'Consumable',
    tier: 0,
    description: 'Cooked meat for energy (+15 HP)',
    craftingTime: 35,
    requiredStation: 'campfire',
    inputs: [{ itemId: 'raw-meat', quantity: 1 }, { itemId: 'charcoal', quantity: 1 }],
    outputs: [{ itemId: 'roasted-meat', quantity: 1 }],
  },
  {
    id: 'herbal-tea',
    name: 'Herbal Tea',
    profession: 'Chef',
    type: 'Consumable',
    tier: 0,
    description: 'Soothing drink (+5 Mana regen for 30s)',
    craftingTime: 25,
    requiredStation: 'campfire',
    inputs: [{ itemId: 'herb', quantity: 2 }, { itemId: 'water', quantity: 1 }],
    outputs: [{ itemId: 'herbal-tea', quantity: 1 }],
  },
  // === T1 CONSUMABLES ===
  {
    id: 'salted-jerky',
    name: 'Salted Jerky',
    profession: 'Chef',
    type: 'Consumable',
    tier: 1,
    description: 'Preserved meat for long journeys (+15 HP, +5 Stamina)',
    craftingTime: 120,
    requiredStation: 'kitchen',
    inputs: [{ itemId: 'raw-meat', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
    outputs: [{ itemId: 'salted-jerky', quantity: 3 }],
  },
];

export const ENGINEER_STARTER_RECIPES: StarterRecipe[] = [
  // === T0 REFINING ===
  {
    id: 'scrap-parts',
    name: 'Scrap Parts',
    profession: 'Engineer',
    type: 'Refining',
    tier: 0,
    description: 'Salvage mechanical bits from junk',
    craftingTime: 15,
    requiredStation: 'tinker-bench',
    inputs: [{ itemId: 'junk-ore', quantity: 2 }, { itemId: 'scrap-metal', quantity: 1 }],
    outputs: [{ itemId: 'scrap-parts', quantity: 2 }],
  },
  // === T0 WEAPONS ===
  {
    id: 'jammed-crossbow',
    name: 'Jammed Crossbow',
    profession: 'Engineer',
    type: 'Weapons',
    tier: 0,
    description: 'A salvaged crossbow that might work',
    craftingTime: 60,
    requiredStation: 'tinker-bench',
    inputs: [{ itemId: 'rotted-wood', quantity: 2 }, { itemId: 'scrap-metal', quantity: 2 }, { itemId: 'simple-thread', quantity: 2 }],
    outputs: [{ itemId: 'jammed-crossbow', quantity: 1 }],
  },
  {
    id: 'crude-bolts',
    name: 'Crude Bolts',
    profession: 'Engineer',
    type: 'Weapons',
    tier: 0,
    description: 'Metal bolts for crossbows',
    craftingTime: 20,
    requiredStation: 'tinker-bench',
    inputs: [{ itemId: 'scrap-metal', quantity: 1 }],
    outputs: [{ itemId: 'crude-bolts', quantity: 5 }],
  },
  // === T0 UTILITY ===
  {
    id: 'basic-trap',
    name: 'Basic Trap',
    profession: 'Engineer',
    type: 'Utility',
    tier: 0,
    description: 'A simple snare for catching small game',
    craftingTime: 30,
    requiredStation: 'tinker-bench',
    inputs: [{ itemId: 'simple-thread', quantity: 3 }, { itemId: 'scrap-metal', quantity: 1 }],
    outputs: [{ itemId: 'basic-trap', quantity: 1 }],
  },
  {
    id: 'rope-ladder',
    name: 'Rope Ladder',
    profession: 'Engineer',
    type: 'Utility',
    tier: 0,
    description: 'Portable climbing aid',
    craftingTime: 40,
    requiredStation: 'tinker-bench',
    inputs: [{ itemId: 'simple-thread', quantity: 5 }, { itemId: 'rotted-wood', quantity: 2 }],
    outputs: [{ itemId: 'rope-ladder', quantity: 1 }],
  },
  // === T0 BUILDINGS ===
  {
    id: 'alarm-tripwire',
    name: 'Alarm Tripwire',
    profession: 'Engineer',
    type: 'Building',
    tier: 0,
    description: 'Alerts you when something crosses it',
    craftingTime: 25,
    requiredStation: 'tinker-bench',
    inputs: [{ itemId: 'simple-thread', quantity: 4 }, { itemId: 'scrap-parts', quantity: 1 }],
    outputs: [{ itemId: 'alarm-tripwire', quantity: 2 }],
  },
  // === T1 REFINING ===
  {
    id: 'copper-gear',
    name: 'Copper Gear',
    profession: 'Engineer',
    type: 'Refining',
    tier: 1,
    description: 'Precision mechanical component',
    craftingTime: 45,
    requiredStation: 'tinker-bench',
    inputs: [{ itemId: 'copper-ingot', quantity: 1 }],
    outputs: [{ itemId: 'copper-gear', quantity: 2 }],
  },
  // === T1 WEAPONS ===
  {
    id: 'ironveil',
    name: 'Ironveil Crossbow',
    profession: 'Engineer',
    type: 'Weapons',
    tier: 1,
    description: 'Reliable ranged weapon with good accuracy',
    craftingTime: 180,
    requiredStation: 'workshop',
    inputs: [{ itemId: 'pine-plank', quantity: 2 }, { itemId: 'copper-ingot', quantity: 2 }, { itemId: 'copper-gear', quantity: 2 }],
    outputs: [{ itemId: 'ironveil', quantity: 1 }],
  },
];

export const CLASS_BONUS_RECIPES: Record<string, StarterRecipe[]> = {
  Warrior: [
    {
      id: 'warrior-repair-kit',
      name: 'Warrior Repair Kit',
      profession: 'Miner',
      type: 'Utility',
      tier: 0,
      description: 'Repair damaged metal armor',
      craftingTime: 30,
      inputs: [{ itemId: 'scrap-metal', quantity: 2 }],
      outputs: [{ itemId: 'repair-kit-metal', quantity: 1 }],
    },
  ],
  Worg: [
    {
      id: 'worg-leather-patch',
      name: 'Leather Patch',
      profession: 'Forester',
      type: 'Utility',
      tier: 0,
      description: 'Repair leather armor',
      craftingTime: 30,
      inputs: [{ itemId: 'leather-scraps', quantity: 2 }],
      outputs: [{ itemId: 'leather-patch', quantity: 1 }],
    },
  ],
  Mage: [
    {
      id: 'mage-mana-vial',
      name: 'Mana Vial',
      profession: 'Mystic',
      type: 'Consumable',
      tier: 0,
      description: 'Restores a small amount of mana',
      craftingTime: 45,
      inputs: [{ itemId: 'water', quantity: 2 }, { itemId: 'arcane-dust', quantity: 1 }],
      outputs: [{ itemId: 'minor-mana-potion', quantity: 1 }],
    },
  ],
  Ranger: [
    {
      id: 'ranger-arrow-bundle',
      name: 'Arrow Bundle',
      profession: 'Forester',
      type: 'Utility',
      tier: 0,
      description: 'Craft basic arrows',
      craftingTime: 20,
      inputs: [{ itemId: 'rotted-wood', quantity: 1 }, { itemId: 'feathers', quantity: 2 }],
      outputs: [{ itemId: 'basic-arrows', quantity: 10 }],
    },
  ],
};

export const RACE_BONUS_RECIPES: Record<string, StarterRecipe[]> = {
  Orc: [
    {
      id: 'orc-metal-salvage',
      name: 'Efficient Salvage',
      profession: 'Miner',
      type: 'Refining',
      tier: 0,
      description: 'Orcs extract more metal from scraps',
      craftingTime: 10,
      inputs: [{ itemId: 'junk-ore', quantity: 2 }],
      outputs: [{ itemId: 'scrap-metal', quantity: 1 }],
    },
  ],
  Elf: [
    {
      id: 'elf-lumber-efficiency',
      name: 'Elven Woodcraft',
      profession: 'Forester',
      type: 'Refining',
      tier: 0,
      description: 'Elves waste less wood when processing',
      craftingTime: 10,
      inputs: [{ itemId: 'wood-scraps', quantity: 2 }],
      outputs: [{ itemId: 'rotted-wood', quantity: 1 }],
    },
  ],
  Human: [
    {
      id: 'human-ink-economy',
      name: 'Scribes Ink',
      profession: 'All',
      type: 'Utility',
      tier: 0,
      description: 'Humans craft ink more efficiently',
      craftingTime: 5,
      inputs: [{ itemId: 'charcoal', quantity: 1 }],
      outputs: [{ itemId: 'ink', quantity: 2 }],
    },
  ],
  Undead: [
    {
      id: 'undead-essence-transmute',
      name: 'Death Transmutation',
      profession: 'Mystic',
      type: 'Refining',
      tier: 0,
      description: 'Undead can transmute bone into essence',
      craftingTime: 30,
      inputs: [{ itemId: 'bone-fragments', quantity: 3 }],
      outputs: [{ itemId: 'death-essence', quantity: 1 }],
    },
  ],
};

export const ALL_STARTER_RECIPES: StarterRecipe[] = [
  ...T0_UNIVERSAL_RECIPES,
  ...MINER_STARTER_RECIPES,
  ...FORESTER_STARTER_RECIPES,
  ...MYSTIC_STARTER_RECIPES,
  ...CHEF_STARTER_RECIPES,
  ...ENGINEER_STARTER_RECIPES,
];

export const STARTER_RECIPES_BY_PROFESSION: Record<string, StarterRecipe[]> = {
  All: T0_UNIVERSAL_RECIPES,
  Miner: MINER_STARTER_RECIPES,
  Forester: FORESTER_STARTER_RECIPES,
  Mystic: MYSTIC_STARTER_RECIPES,
  Chef: CHEF_STARTER_RECIPES,
  Engineer: ENGINEER_STARTER_RECIPES,
};

export function getStarterRecipeIds(classId?: string, raceId?: string): string[] {
  const baseRecipes = ALL_STARTER_RECIPES.map(r => r.id);
  const classRecipes = classId && CLASS_BONUS_RECIPES[classId] 
    ? CLASS_BONUS_RECIPES[classId].map(r => r.id) 
    : [];
  const raceRecipes = raceId && RACE_BONUS_RECIPES[raceId] 
    ? RACE_BONUS_RECIPES[raceId].map(r => r.id) 
    : [];
  
  return [...baseRecipes, ...classRecipes, ...raceRecipes];
}

export function getStarterRecipesForCharacter(classId?: string, raceId?: string): StarterRecipe[] {
  const recipes = [...ALL_STARTER_RECIPES];
  
  if (classId && CLASS_BONUS_RECIPES[classId]) {
    recipes.push(...CLASS_BONUS_RECIPES[classId]);
  }
  
  if (raceId && RACE_BONUS_RECIPES[raceId]) {
    recipes.push(...RACE_BONUS_RECIPES[raceId]);
  }
  
  return recipes;
}
