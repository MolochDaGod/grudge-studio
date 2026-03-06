import type { GridCell, IslandBuilding, HarvestNode } from '@shared/schema';

export type BiomeType = 'temperate' | 'tropical' | 'arctic' | 'desert' | 'volcanic';

export interface GeneratedIsland {
  seed: number;
  name: string;
  gridRows: number;
  gridCols: number;
  gridCells: GridCell[];
  harvestNodes: HarvestNode[];
  campPosition: { x: number; y: number };
  resources: { gold: number; wood: number; ore: number; herbs: number };
  terrainBiome: 'temperate' | 'tropical' | 'arctic' | 'desert' | 'volcanic';
  imagePrompt: string;
}

const ISLAND_NAMES = [
  'Verdant Isle', 'Mystic Cove', 'Golden Peak', 'Sapphire Bay', 'Ancient Haven',
  'Emerald Shore', 'Shadow Reef', 'Crystal Harbor', 'Storm Watch', 'Moonlit Atoll',
  'Dragon\'s Rest', 'Sunset Point', 'Whispering Sands', 'Thunder Rock', 'Paradise Cay'
];

const BIOME_CONFIGS = {
  temperate: {
    terrainWeights: { grass: 0.5, forest: 0.3, rock: 0.1, sand: 0.1, water: 0 },
    resources: { wood: 2, ore: 1, herbs: 1.5, fish: 0.5, crystal: 0.2 },
    style: 'lush green meadows with oak forests and rolling hills'
  },
  tropical: {
    terrainWeights: { grass: 0.3, forest: 0.3, rock: 0.05, sand: 0.3, water: 0.05 },
    resources: { wood: 1.5, ore: 0.5, herbs: 2, fish: 1.5, crystal: 0.3 },
    style: 'palm trees, white sandy beaches, and turquoise lagoons'
  },
  arctic: {
    terrainWeights: { grass: 0.1, forest: 0.2, rock: 0.4, sand: 0.1, water: 0.2 },
    resources: { wood: 0.5, ore: 2, herbs: 0.5, fish: 1, crystal: 1 },
    style: 'snowy peaks, frozen tundra, and icy glaciers'
  },
  desert: {
    terrainWeights: { grass: 0.1, forest: 0.05, rock: 0.3, sand: 0.5, water: 0.05 },
    resources: { wood: 0.3, ore: 1.5, herbs: 0.5, fish: 0.2, crystal: 1.5 },
    style: 'golden sand dunes, ancient ruins, and oasis pools'
  },
  volcanic: {
    terrainWeights: { grass: 0.15, forest: 0.15, rock: 0.5, sand: 0.1, water: 0.1 },
    resources: { wood: 0.5, ore: 3, herbs: 0.3, fish: 0.5, crystal: 2 },
    style: 'volcanic mountains, lava flows, and obsidian formations'
  }
};

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function weightedRandomChoice<T extends string>(
  weights: Record<T, number>,
  random: () => number
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = random() * total;
  
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  
  return entries[0][0];
}

export function generateIsland(options?: {
  seed?: number;
  rows?: number;
  cols?: number;
  biome?: 'temperate' | 'tropical' | 'arctic' | 'desert' | 'volcanic';
  name?: string;
}): GeneratedIsland {
  const seed = options?.seed ?? Math.floor(Math.random() * 1000000);
  const random = seededRandom(seed);
  const rows = options?.rows ?? 10;
  const cols = options?.cols ?? 10;
  const biome = options?.biome ?? (['temperate', 'tropical', 'arctic', 'desert', 'volcanic'] as const)[Math.floor(random() * 5)];
  const name = options?.name ?? ISLAND_NAMES[Math.floor(random() * ISLAND_NAMES.length)];
  
  const config = BIOME_CONFIGS[biome];
  
  const gridCells: GridCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const terrainType = weightedRandomChoice(config.terrainWeights, random);
      const isValid = terrainType !== 'water';
      
      gridCells.push({
        id: generateUUID(),
        row,
        col,
        isValid,
        terrainType,
        buildingId: null,
        buildingType: null,
        occupiedBy: null,
      });
    }
  }
  
  const harvestNodes: HarvestNode[] = [];
  const nodeTypes: Array<'wood' | 'ore' | 'herbs' | 'fish' | 'crystal'> = ['wood', 'ore', 'herbs', 'fish', 'crystal'];
  
  for (const nodeType of nodeTypes) {
    const count = Math.floor(random() * 3 * (config.resources[nodeType] || 1)) + 1;
    for (let i = 0; i < count; i++) {
      const row = Math.floor(random() * rows);
      const col = Math.floor(random() * cols);
      const cell = gridCells.find(c => c.row === row && c.col === col);
      
      if (cell && cell.isValid && !cell.occupiedBy) {
        harvestNodes.push({
          id: generateUUID(),
          type: nodeType,
          gridRow: row,
          gridCol: col,
          remaining: Math.floor(random() * 50) + 50,
          maxCapacity: 100,
        });
        cell.occupiedBy = 'harvest_node';
      }
    }
  }
  
  let campRow = Math.floor(rows / 2);
  let campCol = Math.floor(cols / 2);
  const centerCell = gridCells.find(c => c.row === campRow && c.col === campCol);
  if (centerCell) {
    centerCell.isValid = true;
    centerCell.terrainType = 'grass';
  }
  
  const baseResources = {
    gold: Math.floor(random() * 50) + 100,
    wood: Math.floor(random() * 30 * config.resources.wood) + 25,
    ore: Math.floor(random() * 20 * config.resources.ore) + 10,
    herbs: Math.floor(random() * 15 * config.resources.herbs) + 5,
  };
  
  const imagePrompt = `Fantasy island game map, top-down isometric view, ${config.style}, magical fantasy RPG art style, detailed terrain, vibrant colors, game asset, high quality illustration, no text, no UI elements, stylized`;
  
  return {
    seed,
    name,
    gridRows: rows,
    gridCols: cols,
    gridCells,
    harvestNodes,
    campPosition: { x: campCol, y: campRow },
    resources: baseResources,
    terrainBiome: biome,
    imagePrompt,
  };
}

export function getValidBuildingCells(
  gridCells: GridCell[],
  sizeRows: number = 1,
  sizeCols: number = 1,
  gridRows: number = 10,
  gridCols: number = 10
): GridCell[] {
  const validCells: GridCell[] = [];
  
  for (const cell of gridCells) {
    if (!cell.isValid || cell.buildingId || cell.occupiedBy) continue;
    
    if (cell.row + sizeRows > gridRows || cell.col + sizeCols > gridCols) continue;
    
    let canPlace = true;
    for (let dr = 0; dr < sizeRows && canPlace; dr++) {
      for (let dc = 0; dc < sizeCols && canPlace; dc++) {
        const targetCell = gridCells.find(c => c.row === cell.row + dr && c.col === cell.col + dc);
        if (!targetCell || !targetCell.isValid || targetCell.buildingId || targetCell.occupiedBy) {
          canPlace = false;
        }
      }
    }
    
    if (canPlace) {
      validCells.push(cell);
    }
  }
  
  return validCells;
}

export function placeBuilding(
  gridCells: GridCell[],
  row: number,
  col: number,
  buildingType: string,
  sizeRows: number = 1,
  sizeCols: number = 1
): { building: IslandBuilding; updatedCells: GridCell[] } | null {
  const startCell = gridCells.find(c => c.row === row && c.col === col);
  if (!startCell || !startCell.isValid || startCell.buildingId) return null;
  
  const buildingId = generateUUID();
  const cellsToUpdate: GridCell[] = [];
  
  for (let dr = 0; dr < sizeRows; dr++) {
    for (let dc = 0; dc < sizeCols; dc++) {
      const cell = gridCells.find(c => c.row === row + dr && c.col === col + dc);
      if (!cell || !cell.isValid || cell.buildingId) return null;
      cellsToUpdate.push(cell);
    }
  }
  
  const updatedCells = gridCells.map(cell => {
    if (cellsToUpdate.includes(cell)) {
      return {
        ...cell,
        buildingId,
        buildingType,
      };
    }
    return cell;
  });
  
  const building: IslandBuilding = {
    id: buildingId,
    type: buildingType,
    name: buildingType.charAt(0).toUpperCase() + buildingType.slice(1),
    gridRow: row,
    gridCol: col,
    sizeRows,
    sizeCols,
    level: 1,
    placedAt: new Date().toISOString(),
  };
  
  return { building, updatedCells };
}

export const BUILDING_TYPES = {
  house: { name: 'House', sizeRows: 1, sizeCols: 1, cost: { wood: 20, gold: 50 } },
  outpost: { name: 'Outpost', sizeRows: 1, sizeCols: 1, cost: { wood: 15, ore: 10 } },
  farm: { name: 'Farm', sizeRows: 1, sizeCols: 1, cost: { wood: 25, herbs: 5 } },
  tower: { name: 'Tower', sizeRows: 2, sizeCols: 2, cost: { ore: 40, gold: 100 } },
  market: { name: 'Market', sizeRows: 2, sizeCols: 2, cost: { wood: 50, gold: 150 } },
  warehouse: { name: 'Warehouse', sizeRows: 2, sizeCols: 2, cost: { wood: 60, ore: 30 } },
  fortress: { name: 'Fortress', sizeRows: 3, sizeCols: 3, cost: { ore: 100, gold: 500 } },
  workshop: { name: 'Workshop', sizeRows: 2, sizeCols: 1, cost: { wood: 30, ore: 20 } },
  shrine: { name: 'Shrine', sizeRows: 1, sizeCols: 1, cost: { gold: 200, herbs: 20 } },
};

export type BuildingType = keyof typeof BUILDING_TYPES;
