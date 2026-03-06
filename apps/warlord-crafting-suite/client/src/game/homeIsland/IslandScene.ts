/**
 * Home Island RTS Scene
 * 
 * Phaser scene for the Home Island game mode with:
 * - Procedural terrain generation
 * - RTS camera controls (zoom, pan)
 * - Grid-based building placement
 * - Camp placement for cutscene completion
 */

import Phaser from 'phaser';

export interface IslandConfig {
  seed: number;
  width: number;
  height: number;
  terrain?: number[][];
  buildings?: Building[];
  campPosition?: { x: number; y: number };
  harvestNodes?: HarvestNode[];
}

export interface Building {
  id: string;
  type: string;
  gridX: number;
  gridY: number;
  worldX: number;
  worldY: number;
}

export interface HarvestNode {
  id: string;
  type: 'ore' | 'wood' | 'fish' | 'herbs';
  gridX: number;
  gridY: number;
  respawnTime: number;
}

export interface IslandSceneCallbacks {
  onCampPlaced?: (position: { x: number; y: number }) => void;
  onBuildingPlaced?: (building: Building) => void;
  onSaveRequested?: () => void;
}

export const TERRAIN_TYPES = {
  WATER: 0,
  SAND: 1,
  GRASS: 2,
  FOREST: 3,
  ROCK: 4,
  BUILDABLE: 5,
};

export const TERRAIN_COLORS: Record<number, number> = {
  [TERRAIN_TYPES.WATER]: 0x1a4d7a,
  [TERRAIN_TYPES.SAND]: 0xc2b280,
  [TERRAIN_TYPES.GRASS]: 0x5fa354,
  [TERRAIN_TYPES.FOREST]: 0x2d5016,
  [TERRAIN_TYPES.ROCK]: 0x666666,
  [TERRAIN_TYPES.BUILDABLE]: 0x90EE90,
};

export class IslandScene extends Phaser.Scene {
  public GRID_SIZE = 32;
  public ISLAND_WIDTH = 130;
  public ISLAND_HEIGHT = 105;
  public WORLD_WIDTH: number;
  public WORLD_HEIGHT: number;
  
  private config: IslandConfig;
  private callbacks: IslandSceneCallbacks;
  private terrain: number[][] = [];
  private buildings: Building[] = [];
  private harvestNodes: HarvestNode[] = [];
  
  private selectedBuilding: string | null = null;
  private buildingPreview: Phaser.GameObjects.Rectangle | null = null;
  private campPlaced = false;
  private isCutsceneMode = false;
  
  private hudText!: Phaser.GameObjects.Text;

  constructor() {
    super('IslandScene');
    this.WORLD_WIDTH = this.ISLAND_WIDTH * this.GRID_SIZE;
    this.WORLD_HEIGHT = this.ISLAND_HEIGHT * this.GRID_SIZE;
    this.config = { seed: Date.now(), width: 130, height: 105 };
    this.callbacks = {};
  }

  init(data: { config?: IslandConfig; callbacks?: IslandSceneCallbacks; cutsceneMode?: boolean }) {
    if (data.config) {
      this.config = data.config;
      this.ISLAND_WIDTH = data.config.width || 130;
      this.ISLAND_HEIGHT = data.config.height || 105;
      this.WORLD_WIDTH = this.ISLAND_WIDTH * this.GRID_SIZE;
      this.WORLD_HEIGHT = this.ISLAND_HEIGHT * this.GRID_SIZE;
    }
    if (data.callbacks) {
      this.callbacks = data.callbacks;
    }
    this.isCutsceneMode = data.cutsceneMode || false;
  }

  create() {
    this.physics.world.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
    
    if (this.config.terrain && this.config.terrain.length > 0) {
      this.terrain = this.config.terrain;
    } else {
      this.terrain = this.generateTerrain(this.config.seed);
    }
    
    if (this.config.buildings) {
      this.buildings = [...this.config.buildings];
    }
    
    if (this.config.harvestNodes) {
      this.harvestNodes = [...this.config.harvestNodes];
    } else {
      this.harvestNodes = this.generateHarvestNodes();
    }
    
    this.createTerrainDisplay();
    this.renderBuildings();
    this.renderHarvestNodes();
    this.setupCamera();
    this.setupInput();
    this.createHUD();
    
    if (this.isCutsceneMode) {
      this.selectedBuilding = 'camp';
      this.showCutsceneOverlay();
    }
    
    console.log(`✓ Island scene ready: ${this.ISLAND_WIDTH}x${this.ISLAND_HEIGHT} tiles`);
  }

  private generateTerrain(seed: number): number[][] {
    const terrain: number[][] = [];
    const centerX = this.ISLAND_WIDTH / 2;
    const centerY = this.ISLAND_HEIGHT / 2;
    const islandRadius = Math.min(centerX, centerY) * 0.7;
    
    for (let y = 0; y < this.ISLAND_HEIGHT; y++) {
      terrain[y] = [];
      for (let x = 0; x < this.ISLAND_WIDTH; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const noise = this.seededNoise(x, y, seed);
        const falloff = 1 - (distance / islandRadius);
        const value = falloff + (noise - 0.5) * 0.4;
        
        if (value < 0) {
          terrain[y][x] = TERRAIN_TYPES.WATER;
        } else if (value < 0.15) {
          terrain[y][x] = TERRAIN_TYPES.SAND;
        } else if (value < 0.4) {
          terrain[y][x] = TERRAIN_TYPES.GRASS;
        } else if (value < 0.7) {
          terrain[y][x] = TERRAIN_TYPES.FOREST;
        } else {
          terrain[y][x] = TERRAIN_TYPES.ROCK;
        }
        
        if (value >= 0.2 && value < 0.5 && distance < islandRadius * 0.5) {
          terrain[y][x] = TERRAIN_TYPES.BUILDABLE;
        }
      }
    }
    
    return terrain;
  }

  private seededNoise(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  private generateHarvestNodes(): HarvestNode[] {
    const nodes: HarvestNode[] = [];
    const nodeTypes: HarvestNode['type'][] = ['ore', 'wood', 'fish', 'herbs'];
    
    for (let i = 0; i < 20; i++) {
      const gridX = Math.floor(Math.random() * this.ISLAND_WIDTH);
      const gridY = Math.floor(Math.random() * this.ISLAND_HEIGHT);
      const terrainType = this.terrain[gridY]?.[gridX];
      
      if (terrainType && terrainType !== TERRAIN_TYPES.WATER) {
        let nodeType: HarvestNode['type'] = 'herbs';
        if (terrainType === TERRAIN_TYPES.ROCK) nodeType = 'ore';
        else if (terrainType === TERRAIN_TYPES.FOREST) nodeType = 'wood';
        else if (terrainType === TERRAIN_TYPES.SAND) nodeType = 'fish';
        
        nodes.push({
          id: `node-${i}`,
          type: nodeType,
          gridX,
          gridY,
          respawnTime: 300,
        });
      }
    }
    
    return nodes;
  }

  private createTerrainDisplay() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    for (let y = 0; y < this.ISLAND_HEIGHT; y++) {
      for (let x = 0; x < this.ISLAND_WIDTH; x++) {
        const terrainType = this.terrain[y]?.[x] ?? TERRAIN_TYPES.WATER;
        const color = TERRAIN_COLORS[terrainType] ?? TERRAIN_COLORS[TERRAIN_TYPES.WATER];
        
        const worldX = x * this.GRID_SIZE;
        const worldY = y * this.GRID_SIZE;
        
        graphics.fillStyle(color, 1);
        graphics.fillRect(worldX, worldY, this.GRID_SIZE, this.GRID_SIZE);
        
        if (terrainType === TERRAIN_TYPES.BUILDABLE) {
          graphics.lineStyle(1, 0x00aa00, 0.3);
          graphics.strokeRect(worldX, worldY, this.GRID_SIZE, this.GRID_SIZE);
        }
      }
    }
    
    graphics.generateTexture('islandTerrain', this.WORLD_WIDTH, this.WORLD_HEIGHT);
    graphics.destroy();
    
    this.add.image(0, 0, 'islandTerrain').setOrigin(0).setDepth(0);
  }

  private renderBuildings() {
    const buildingColors: Record<string, number> = {
      camp: 0xff8800,
      house: 0x0088ff,
      tower: 0xff3333,
      farm: 0xffdd00,
      market: 0xff8800,
      forge: 0xcc6600,
    };
    
    this.buildings.forEach(building => {
      const color = buildingColors[building.type] || 0xffffff;
      const rect = this.add.rectangle(
        building.worldX,
        building.worldY,
        this.GRID_SIZE - 4,
        this.GRID_SIZE - 4,
        color,
        0.9
      ).setDepth(15);
      
      (rect as any).buildingData = building;
    });
  }

  private renderHarvestNodes() {
    const nodeColors: Record<string, number> = {
      ore: 0x888888,
      wood: 0x8B4513,
      fish: 0x00CED1,
      herbs: 0x32CD32,
    };
    
    this.harvestNodes.forEach(node => {
      const worldX = node.gridX * this.GRID_SIZE + this.GRID_SIZE / 2;
      const worldY = node.gridY * this.GRID_SIZE + this.GRID_SIZE / 2;
      const color = nodeColors[node.type] || 0xffffff;
      
      this.add.circle(worldX, worldY, 8, color, 0.7).setDepth(5);
    });
  }

  private setupCamera() {
    const camera = this.cameras.main;
    const centerX = (this.ISLAND_WIDTH / 2) * this.GRID_SIZE;
    const centerY = (this.ISLAND_HEIGHT / 2) * this.GRID_SIZE;
    
    camera.centerOn(centerX, centerY);
    camera.setZoom(1);
    camera.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
  }

  private setupInput() {
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaY: number) => {
      const camera = this.cameras.main;
      const direction = deltaY > 0 ? -1 : 1;
      const newZoom = Phaser.Math.Clamp(camera.zoom + (direction * 0.1), 0.5, 3);
      camera.setZoom(newZoom);
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        const camera = this.cameras.main;
        const dx = pointer.prevPosition.x - pointer.position.x;
        const dy = pointer.prevPosition.y - pointer.position.y;
        camera.scrollX += dx / camera.zoom;
        camera.scrollY += dy / camera.zoom;
      }
      
      this.updateBuildingPreview(pointer);
    });
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.placeBuildingAtPointer(pointer);
      }
    });
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.clearBuildingPreview();
      }
    });
    
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on('keydown-ONE', () => this.selectedBuilding = 'house');
      keyboard.on('keydown-TWO', () => this.selectedBuilding = 'tower');
      keyboard.on('keydown-THREE', () => this.selectedBuilding = 'farm');
      keyboard.on('keydown-FOUR', () => this.selectedBuilding = 'market');
      keyboard.on('keydown-R', () => this.resetCamera());
      keyboard.on('keydown-S', () => this.callbacks.onSaveRequested?.());
      keyboard.on('keydown-ESC', () => this.clearBuildingPreview());
    }
  }

  private updateBuildingPreview(pointer: Phaser.Input.Pointer) {
    if (!this.selectedBuilding) return;
    
    const camera = this.cameras.main;
    const worldX = (pointer.x / camera.zoom) + camera.scrollX;
    const worldY = (pointer.y / camera.zoom) + camera.scrollY;
    
    const snappedX = Math.floor(worldX / this.GRID_SIZE) * this.GRID_SIZE + this.GRID_SIZE / 2;
    const snappedY = Math.floor(worldY / this.GRID_SIZE) * this.GRID_SIZE + this.GRID_SIZE / 2;
    
    if (!this.buildingPreview) {
      this.buildingPreview = this.add.rectangle(
        snappedX, snappedY,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2,
        0xffff00, 0.4
      ).setDepth(50);
    }
    
    this.buildingPreview.setPosition(snappedX, snappedY);
    
    const gridX = Math.floor(snappedX / this.GRID_SIZE);
    const gridY = Math.floor(snappedY / this.GRID_SIZE);
    const isValid = this.isValidPlacement(gridX, gridY);
    
    this.buildingPreview.setFillStyle(isValid ? 0x00ff00 : 0xff0000, 0.4);
  }

  private placeBuildingAtPointer(pointer: Phaser.Input.Pointer) {
    if (!this.selectedBuilding) return;
    
    const camera = this.cameras.main;
    const worldX = (pointer.x / camera.zoom) + camera.scrollX;
    const worldY = (pointer.y / camera.zoom) + camera.scrollY;
    
    const snappedX = Math.floor(worldX / this.GRID_SIZE) * this.GRID_SIZE + this.GRID_SIZE / 2;
    const snappedY = Math.floor(worldY / this.GRID_SIZE) * this.GRID_SIZE + this.GRID_SIZE / 2;
    
    const gridX = Math.floor(snappedX / this.GRID_SIZE);
    const gridY = Math.floor(snappedY / this.GRID_SIZE);
    
    if (!this.isValidPlacement(gridX, gridY)) return;
    
    const building: Building = {
      id: `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.selectedBuilding,
      gridX,
      gridY,
      worldX: snappedX,
      worldY: snappedY,
    };
    
    this.buildings.push(building);
    
    const color = this.selectedBuilding === 'camp' ? 0xff8800 : 0x0088ff;
    this.add.rectangle(snappedX, snappedY, this.GRID_SIZE - 4, this.GRID_SIZE - 4, color, 0.9).setDepth(15);
    
    if (this.selectedBuilding === 'camp' && this.isCutsceneMode) {
      this.campPlaced = true;
      this.callbacks.onCampPlaced?.({ x: gridX, y: gridY });
      this.hideCutsceneOverlay();
    } else {
      this.callbacks.onBuildingPlaced?.(building);
    }
    
    console.log(`✓ Placed ${building.type} at (${gridX}, ${gridY})`);
  }

  private isValidPlacement(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= this.ISLAND_WIDTH || gridY < 0 || gridY >= this.ISLAND_HEIGHT) {
      return false;
    }
    
    const terrainType = this.terrain[gridY]?.[gridX];
    if (terrainType === TERRAIN_TYPES.WATER || terrainType === TERRAIN_TYPES.ROCK) {
      return false;
    }
    
    for (const building of this.buildings) {
      if (building.gridX === gridX && building.gridY === gridY) {
        return false;
      }
    }
    
    return true;
  }

  private clearBuildingPreview() {
    if (this.buildingPreview) {
      this.buildingPreview.destroy();
      this.buildingPreview = null;
    }
    if (!this.isCutsceneMode) {
      this.selectedBuilding = null;
    }
  }

  private resetCamera() {
    const centerX = (this.ISLAND_WIDTH / 2) * this.GRID_SIZE;
    const centerY = (this.ISLAND_HEIGHT / 2) * this.GRID_SIZE;
    this.cameras.main.centerOn(centerX, centerY);
    this.cameras.main.setZoom(1);
  }

  private createHUD() {
    this.hudText = this.add.text(12, 12, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000dd',
      padding: { x: 10, y: 8 },
    }).setScrollFactor(0).setDepth(100);
    
    this.events.on('update', () => {
      const camera = this.cameras.main;
      const pointer = this.input.activePointer;
      const worldX = (pointer.x / camera.zoom) + camera.scrollX;
      const worldY = (pointer.y / camera.zoom) + camera.scrollY;
      const gridX = Math.floor(worldX / this.GRID_SIZE);
      const gridY = Math.floor(worldY / this.GRID_SIZE);
      
      this.hudText.setText([
        `Zoom: ${camera.zoom.toFixed(1)}x | Position: ${Math.floor(camera.scrollX)}, ${Math.floor(camera.scrollY)}`,
        `Grid: (${gridX}, ${gridY}) | Buildings: ${this.buildings.length}`,
        this.isCutsceneMode ? '🏕️ Click to place your camp!' : `Selected: ${this.selectedBuilding || 'None'}`,
      ]);
    });
  }

  private showCutsceneOverlay() {
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2,
      50,
      400, 60,
      0x000000, 0.8
    ).setScrollFactor(0).setDepth(99);
    
    this.add.text(
      this.cameras.main.width / 2,
      50,
      '🏕️ Choose where to place your Camp!',
      { fontSize: '18px', color: '#ffdd00', fontStyle: 'bold' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  private hideCutsceneOverlay() {
    // Overlay will remain for confirmation
  }

  public getTerrain(): number[][] {
    return this.terrain;
  }

  public getBuildings(): Building[] {
    return this.buildings;
  }

  public getHarvestNodes(): HarvestNode[] {
    return this.harvestNodes;
  }

  public setSelectedBuilding(type: string | null) {
    this.selectedBuilding = type;
  }
}

export function createIslandGameConfig(
  parentElement: HTMLElement,
  config: IslandConfig,
  callbacks: IslandSceneCallbacks,
  cutsceneMode: boolean = false
): Phaser.Game {
  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: parentElement.clientWidth || 1280,
    height: parentElement.clientHeight || 720,
    parent: parentElement,
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: IslandScene,
    render: {
      pixelArt: false,
      antialias: true,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  const game = new Phaser.Game(gameConfig);
  
  game.events.once('ready', () => {
    const scene = game.scene.getScene('IslandScene') as IslandScene;
    scene.scene.restart({ config, callbacks, cutsceneMode });
  });

  return game;
}
