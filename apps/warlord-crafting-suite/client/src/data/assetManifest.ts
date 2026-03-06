export type AssetCategory = 'building' | 'resource' | 'character' | 'decoration' | 'terrain' | 'effect';
export type GridSize = '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '3x2' | '3x3' | '4x4';
export type AssetAge = 'FirstAge' | 'SecondAge' | 'ThirdAge';

export interface GameAsset {
  id: string;
  name: string;
  category: AssetCategory;
  subcategory: string;
  gridSize: GridSize;
  filePath: string;
  fileType: 'gltf' | 'fbx' | 'png' | 'jpg';
  age?: AssetAge;
  level?: number;
  harvestable?: boolean;
  harvestYield?: string;
  profession?: string;
  xpReward?: number;
  cooldown?: number;
  previewImage?: string;
}

export const GRID_SIZE_DIMENSIONS: Record<GridSize, { width: number; height: number }> = {
  '1x1': { width: 1, height: 1 },
  '1x2': { width: 1, height: 2 },
  '2x1': { width: 2, height: 1 },
  '2x2': { width: 2, height: 2 },
  '2x3': { width: 2, height: 3 },
  '3x2': { width: 3, height: 2 },
  '3x3': { width: 3, height: 3 },
  '4x4': { width: 4, height: 4 },
};

export const BUILDINGS: GameAsset[] = [
  { id: 'market_1a_1', name: 'Market (First Age L1)', category: 'building', subcategory: 'commerce', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Market_FirstAge_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'market_1a_2', name: 'Market (First Age L2)', category: 'building', subcategory: 'commerce', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Market_FirstAge_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'market_1a_3', name: 'Market (First Age L3)', category: 'building', subcategory: 'commerce', gridSize: '3x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Market_FirstAge_Level3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  { id: 'market_2a_1', name: 'Market (Second Age L1)', category: 'building', subcategory: 'commerce', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Market_SecondAge_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'market_2a_2', name: 'Market (Second Age L2)', category: 'building', subcategory: 'commerce', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Market_SecondAge_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  { id: 'market_2a_3', name: 'Market (Second Age L3)', category: 'building', subcategory: 'commerce', gridSize: '3x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Market_SecondAge_Level3.fbx', fileType: 'fbx', age: 'SecondAge', level: 3 },
  
  { id: 'barracks_1a_1', name: 'Barracks (First Age L1)', category: 'building', subcategory: 'military', gridSize: '2x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Barracks_FirstAge_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'barracks_1a_2', name: 'Barracks (First Age L2)', category: 'building', subcategory: 'military', gridSize: '2x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Barracks_FirstAge_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'barracks_1a_3', name: 'Barracks (First Age L3)', category: 'building', subcategory: 'military', gridSize: '3x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Barracks_FirstAge_Level3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  { id: 'barracks_2a_1', name: 'Barracks (Second Age L1)', category: 'building', subcategory: 'military', gridSize: '2x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Barracks_SecondAge_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'barracks_2a_2', name: 'Barracks (Second Age L2)', category: 'building', subcategory: 'military', gridSize: '2x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Barracks_SecondAge_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  { id: 'barracks_2a_3', name: 'Barracks (Second Age L3)', category: 'building', subcategory: 'military', gridSize: '3x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Barracks_SecondAge_Level3.fbx', fileType: 'fbx', age: 'SecondAge', level: 3 },
  
  { id: 'archery_1a_1', name: 'Archery Range (First Age L1)', category: 'building', subcategory: 'military', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Archery_FirstAge_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'archery_1a_2', name: 'Archery Range (First Age L2)', category: 'building', subcategory: 'military', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Archery_FirstAge_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'archery_1a_3', name: 'Archery Range (First Age L3)', category: 'building', subcategory: 'military', gridSize: '2x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Archery_FirstAge_Level3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  { id: 'archery_2a_1', name: 'Archery Range (Second Age L1)', category: 'building', subcategory: 'military', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Archery_SecondAge_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'archery_2a_2', name: 'Archery Range (Second Age L2)', category: 'building', subcategory: 'military', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Archery_SecondAge_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  { id: 'archery_2a_3', name: 'Archery Range (Second Age L3)', category: 'building', subcategory: 'military', gridSize: '2x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Archery_SecondAge_Level3.fbx', fileType: 'fbx', age: 'SecondAge', level: 3 },
  
  { id: 'storage_1a_1', name: 'Storage (First Age L1)', category: 'building', subcategory: 'utility', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Storage_FirstAge_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'storage_1a_2', name: 'Storage (First Age L2)', category: 'building', subcategory: 'utility', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Storage_FirstAge_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'storage_1a_3', name: 'Storage (First Age L3)', category: 'building', subcategory: 'utility', gridSize: '2x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Storage_FirstAge_Leve3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  { id: 'storage_2a_1', name: 'Storage (Second Age L1)', category: 'building', subcategory: 'utility', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Storage_SecondAge_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'storage_2a_2', name: 'Storage (Second Age L2)', category: 'building', subcategory: 'utility', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Storage_SecondAge_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  
  { id: 'port_1a_1', name: 'Port (First Age L1)', category: 'building', subcategory: 'commerce', gridSize: '3x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Port_FirstAge_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'port_1a_2', name: 'Port (First Age L2)', category: 'building', subcategory: 'commerce', gridSize: '3x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Port_FirstAge_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'port_1a_3', name: 'Port (First Age L3)', category: 'building', subcategory: 'commerce', gridSize: '3x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Port_FirstAge_Level3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  { id: 'port_2a_1', name: 'Port (Second Age L1)', category: 'building', subcategory: 'commerce', gridSize: '3x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Port_SecondAge_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'port_2a_2', name: 'Port (Second Age L2)', category: 'building', subcategory: 'commerce', gridSize: '3x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Port_SecondAge_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  { id: 'port_2a_3', name: 'Port (Second Age L3)', category: 'building', subcategory: 'commerce', gridSize: '3x3', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Port_SecondAge_Level3.fbx', fileType: 'fbx', age: 'SecondAge', level: 3 },
  
  { id: 'house_1a_1_1', name: 'House Type 1 (First Age L1)', category: 'building', subcategory: 'residential', gridSize: '1x1', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_1_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'house_1a_1_2', name: 'House Type 1 (First Age L2)', category: 'building', subcategory: 'residential', gridSize: '1x1', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_1_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'house_1a_1_3', name: 'House Type 1 (First Age L3)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_1_Level3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  { id: 'house_1a_2_1', name: 'House Type 2 (First Age L1)', category: 'building', subcategory: 'residential', gridSize: '1x1', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_2_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'house_1a_2_2', name: 'House Type 2 (First Age L2)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_2_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'house_1a_2_3', name: 'House Type 2 (First Age L3)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_2_Level3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  { id: 'house_1a_3_1', name: 'House Type 3 (First Age L1)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_3_Level1.fbx', fileType: 'fbx', age: 'FirstAge', level: 1 },
  { id: 'house_1a_3_2', name: 'House Type 3 (First Age L2)', category: 'building', subcategory: 'residential', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_3_Level2.fbx', fileType: 'fbx', age: 'FirstAge', level: 2 },
  { id: 'house_1a_3_3', name: 'House Type 3 (First Age L3)', category: 'building', subcategory: 'residential', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_FirstAge_3_Level3.fbx', fileType: 'fbx', age: 'FirstAge', level: 3 },
  
  { id: 'house_2a_1_1', name: 'House Type 1 (Second Age L1)', category: 'building', subcategory: 'residential', gridSize: '1x1', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_1_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'house_2a_1_2', name: 'House Type 1 (Second Age L2)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_1_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  { id: 'house_2a_1_3', name: 'House Type 1 (Second Age L3)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_1_Level3.fbx', fileType: 'fbx', age: 'SecondAge', level: 3 },
  { id: 'house_2a_2_1', name: 'House Type 2 (Second Age L1)', category: 'building', subcategory: 'residential', gridSize: '1x1', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_2_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'house_2a_2_2', name: 'House Type 2 (Second Age L2)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_2_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  { id: 'house_2a_2_3', name: 'House Type 2 (Second Age L3)', category: 'building', subcategory: 'residential', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_2_Level3.fbx', fileType: 'fbx', age: 'SecondAge', level: 3 },
  { id: 'house_2a_3_1', name: 'House Type 3 (Second Age L1)', category: 'building', subcategory: 'residential', gridSize: '1x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_3_Level1.fbx', fileType: 'fbx', age: 'SecondAge', level: 1 },
  { id: 'house_2a_3_2', name: 'House Type 3 (Second Age L2)', category: 'building', subcategory: 'residential', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_3_Level2.fbx', fileType: 'fbx', age: 'SecondAge', level: 2 },
  { id: 'house_2a_3_3', name: 'House Type 3 (Second Age L3)', category: 'building', subcategory: 'residential', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Houses_SecondAge_3_Level3.fbx', fileType: 'fbx', age: 'SecondAge', level: 3 },
];

export const HARVESTABLE_RESOURCES: GameAsset[] = [
  { id: 'tree_group', name: 'Tree Group', category: 'resource', subcategory: 'forestry', gridSize: '2x2', filePath: 'fantasy_rts/Ultimate Fantasy RTS - Aug 2022/FBX/Resource_Tree_Group_Cut.fbx', fileType: 'fbx', harvestable: true, harvestYield: 'wood', profession: 'Forester', xpReward: 15, cooldown: 60 },
  { id: 'ore_node_copper', name: 'Copper Ore Node', category: 'resource', subcategory: 'mining', gridSize: '1x1', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'copper_ore', profession: 'Miner', xpReward: 10, cooldown: 45 },
  { id: 'ore_node_iron', name: 'Iron Ore Node', category: 'resource', subcategory: 'mining', gridSize: '1x1', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'iron_ore', profession: 'Miner', xpReward: 20, cooldown: 60 },
  { id: 'ore_node_gold', name: 'Gold Ore Node', category: 'resource', subcategory: 'mining', gridSize: '1x2', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'gold_ore', profession: 'Miner', xpReward: 35, cooldown: 90 },
  { id: 'herb_patch', name: 'Herb Patch', category: 'resource', subcategory: 'alchemy', gridSize: '1x1', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'herbs', profession: 'Mystic', xpReward: 12, cooldown: 30 },
  { id: 'crystal_cluster', name: 'Crystal Cluster', category: 'resource', subcategory: 'alchemy', gridSize: '1x1', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'crystals', profession: 'Mystic', xpReward: 25, cooldown: 120 },
  { id: 'fishing_spot', name: 'Fishing Spot', category: 'resource', subcategory: 'cooking', gridSize: '1x1', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'fish', profession: 'Chef', xpReward: 15, cooldown: 45 },
  { id: 'berry_bush', name: 'Berry Bush', category: 'resource', subcategory: 'cooking', gridSize: '1x1', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'berries', profession: 'Chef', xpReward: 8, cooldown: 20 },
  { id: 'scrap_pile', name: 'Scrap Pile', category: 'resource', subcategory: 'engineering', gridSize: '1x1', filePath: '', fileType: 'png', harvestable: true, harvestYield: 'scrap_metal', profession: 'Engineer', xpReward: 18, cooldown: 50 },
];

export const CHARACTERS: GameAsset[] = [
  { id: 'knight_male', name: 'Knight (Male)', category: 'character', subcategory: 'warrior', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Knight_Male.gltf', fileType: 'gltf' },
  { id: 'knight_golden_male', name: 'Golden Knight (Male)', category: 'character', subcategory: 'warrior', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Knight_Golden_Male.gltf', fileType: 'gltf' },
  { id: 'knight_golden_female', name: 'Golden Knight (Female)', category: 'character', subcategory: 'warrior', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Knight_Golden_Female.gltf', fileType: 'gltf' },
  { id: 'soldier_male', name: 'Soldier (Male)', category: 'character', subcategory: 'warrior', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Soldier_Male.gltf', fileType: 'gltf' },
  { id: 'soldier_female', name: 'Soldier (Female)', category: 'character', subcategory: 'warrior', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Soldier_Female.gltf', fileType: 'gltf' },
  { id: 'viking_male', name: 'Viking (Male)', category: 'character', subcategory: 'warrior', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Viking_Male.gltf', fileType: 'gltf' },
  { id: 'viking_female', name: 'Viking (Female)', category: 'character', subcategory: 'warrior', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Viking_Female.gltf', fileType: 'gltf' },
  { id: 'wizard', name: 'Wizard', category: 'character', subcategory: 'mage', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Wizard.gltf', fileType: 'gltf' },
  { id: 'witch', name: 'Witch', category: 'character', subcategory: 'mage', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Witch.gltf', fileType: 'gltf' },
  { id: 'elf', name: 'Elf', category: 'character', subcategory: 'ranger', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Elf.gltf', fileType: 'gltf' },
  { id: 'ninja_male', name: 'Ninja (Male)', category: 'character', subcategory: 'ranger', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Ninja_Male.gltf', fileType: 'gltf' },
  { id: 'ninja_female', name: 'Ninja (Female)', category: 'character', subcategory: 'ranger', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Ninja_Female.gltf', fileType: 'gltf' },
  { id: 'pirate_male', name: 'Pirate (Male)', category: 'character', subcategory: 'rogue', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Pirate_Male.gltf', fileType: 'gltf' },
  { id: 'pirate_female', name: 'Pirate (Female)', category: 'character', subcategory: 'rogue', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Pirate_Female.gltf', fileType: 'gltf' },
  { id: 'goblin_male', name: 'Goblin (Male)', category: 'character', subcategory: 'monster', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Goblin_Male.gltf', fileType: 'gltf' },
  { id: 'goblin_female', name: 'Goblin (Female)', category: 'character', subcategory: 'monster', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Goblin_Female.gltf', fileType: 'gltf' },
  { id: 'zombie_male', name: 'Zombie (Male)', category: 'character', subcategory: 'monster', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Zombie_Male.gltf', fileType: 'gltf' },
  { id: 'zombie_female', name: 'Zombie (Female)', category: 'character', subcategory: 'monster', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Zombie_Female.gltf', fileType: 'gltf' },
  { id: 'worker_male', name: 'Worker (Male)', category: 'character', subcategory: 'npc', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Worker_Male.gltf', fileType: 'gltf' },
  { id: 'worker_female', name: 'Worker (Female)', category: 'character', subcategory: 'npc', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Worker_Female.gltf', fileType: 'gltf' },
  { id: 'chef_male', name: 'Chef (Male)', category: 'character', subcategory: 'npc', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Chef_Male.gltf', fileType: 'gltf' },
  { id: 'chef_female', name: 'Chef (Female)', category: 'character', subcategory: 'npc', gridSize: '1x1', filePath: 'character_pack/Ultimate Animated Character Pack - Nov 2019/glTF/Chef_Female.gltf', fileType: 'gltf' },
];

export const CRAFTING_STATIONS: GameAsset[] = [
  { id: 'smelter', name: 'Smelter', category: 'building', subcategory: 'crafting', gridSize: '2x2', filePath: '', fileType: 'png', profession: 'Miner' },
  { id: 'sawmill', name: 'Sawmill', category: 'building', subcategory: 'crafting', gridSize: '2x3', filePath: '', fileType: 'png', profession: 'Forester' },
  { id: 'alchemy_table', name: 'Alchemy Table', category: 'building', subcategory: 'crafting', gridSize: '2x2', filePath: '', fileType: 'png', profession: 'Mystic' },
  { id: 'cooking_fire', name: 'Cooking Fire', category: 'building', subcategory: 'crafting', gridSize: '1x1', filePath: '', fileType: 'png', profession: 'Chef' },
  { id: 'kitchen', name: 'Kitchen', category: 'building', subcategory: 'crafting', gridSize: '2x2', filePath: '', fileType: 'png', profession: 'Chef' },
  { id: 'workshop', name: 'Workshop', category: 'building', subcategory: 'crafting', gridSize: '2x3', filePath: '', fileType: 'png', profession: 'Engineer' },
  { id: 'anvil', name: 'Anvil', category: 'building', subcategory: 'crafting', gridSize: '1x1', filePath: '', fileType: 'png', profession: 'Miner' },
  { id: 'loom', name: 'Loom', category: 'building', subcategory: 'crafting', gridSize: '1x2', filePath: '', fileType: 'png', profession: 'Forester' },
];

export const ALL_ASSETS: GameAsset[] = [
  ...BUILDINGS,
  ...HARVESTABLE_RESOURCES,
  ...CHARACTERS,
  ...CRAFTING_STATIONS,
];

export function getAssetsByCategory(category: AssetCategory): GameAsset[] {
  return ALL_ASSETS.filter(a => a.category === category);
}

export function getAssetsByProfession(profession: string): GameAsset[] {
  return ALL_ASSETS.filter(a => a.profession === profession);
}

export function getAssetsByGridSize(size: GridSize): GameAsset[] {
  return ALL_ASSETS.filter(a => a.gridSize === size);
}

export function getHarvestableAssets(): GameAsset[] {
  return ALL_ASSETS.filter(a => a.harvestable);
}
