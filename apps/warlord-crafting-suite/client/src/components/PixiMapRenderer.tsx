import { useRef, useEffect, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';

export type TerrainType = 'grass' | 'water' | 'sand' | 'stone' | 'forest' | 'mountain';
export type NodeType = 'ore' | 'herb' | 'crystal' | 'wood' | 'fish' | 'rare_ore' | 'ancient_tree' | 'ley_line';

export interface MapCell {
  x: number;
  y: number;
  terrain: TerrainType;
  height: number;
  isOccupied: boolean;
  occupiedBy?: string;
  nodeId?: string;
  spawnId?: string;
}

export interface IslandNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  isActive: boolean;
}

export interface SpawnPoint {
  id: string;
  x: number;
  y: number;
  type: 'player' | 'enemy' | 'npc';
}

interface PixiMapRendererProps {
  grid: MapCell[][];
  cellSize?: number;
  showGrid?: boolean;
  showHeightMap?: boolean;
  selectedCell?: { x: number; y: number } | null;
  onCellClick?: (x: number, y: number) => void;
  onCellHover?: (x: number, y: number) => void;
  nodes?: IslandNode[];
  spawnPoints?: SpawnPoint[];
}

const NODE_COLORS: Record<NodeType, number> = {
  ore: 0x8B4513,
  herb: 0x228B22,
  crystal: 0x9932CC,
  wood: 0x654321,
  fish: 0x4169E1,
  rare_ore: 0xFFD700,
  ancient_tree: 0x006400,
  ley_line: 0x00CED1,
};

const SPAWN_COLORS: Record<string, number> = {
  player: 0x00FF00,
  enemy: 0xFF0000,
  npc: 0x0000FF,
};

const TERRAIN_COLORS: Record<TerrainType, number> = {
  grass: 0x22c55e,
  water: 0x3b82f6,
  sand: 0xfde047,
  stone: 0x9ca3af,
  forest: 0x15803d,
  mountain: 0x4b5563,
};

export default function PixiMapRenderer({
  grid,
  cellSize = 8,
  showGrid = true,
  showHeightMap = false,
  selectedCell,
  onCellClick,
  onCellHover,
  nodes = [],
  spawnPoints = [],
}: PixiMapRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const cellContainerRef = useRef<PIXI.Container | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();
    
    const initApp = async () => {
      await app.init({
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
        backgroundColor: 0x1e293b,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      
      containerRef.current!.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;
      
      const cellContainer = new PIXI.Container();
      cellContainer.eventMode = 'static';
      cellContainerRef.current = cellContainer;
      app.stage.addChild(cellContainer);
      
      renderGrid();
    };
    
    initApp();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  const renderGrid = useCallback(() => {
    if (!appRef.current || !cellContainerRef.current) return;
    
    const container = cellContainerRef.current;
    container.removeChildren();
    
    const graphics = new PIXI.Graphics();
    
    const height = grid.length;
    const width = grid[0]?.length || 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        let color = TERRAIN_COLORS[cell.terrain];
        
        if (showHeightMap) {
          const brightness = cell.height / 100;
          const r = ((color >> 16) & 0xff) * brightness;
          const g = ((color >> 8) & 0xff) * brightness;
          const b = (color & 0xff) * brightness;
          color = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
        }
        
        graphics.rect(x * cellSize, y * cellSize, cellSize, cellSize);
        graphics.fill(color);
        
        if (showGrid) {
          graphics.rect(x * cellSize, y * cellSize, cellSize, cellSize);
          graphics.stroke({ width: 0.5, color: 0x000000, alpha: 0.2 });
        }
        
        if (selectedCell && selectedCell.x === x && selectedCell.y === y) {
          graphics.rect(x * cellSize, y * cellSize, cellSize, cellSize);
          graphics.stroke({ width: 2, color: 0xfbbf24 });
        }
      }
    }
    
    container.addChild(graphics);
    
    const nodeGraphics = new PIXI.Graphics();
    for (const node of nodes) {
      const color = NODE_COLORS[node.type];
      const cx = node.x * cellSize + cellSize / 2;
      const cy = node.y * cellSize + cellSize / 2;
      const radius = cellSize * 0.4;
      
      nodeGraphics.circle(cx, cy, radius);
      nodeGraphics.fill(color);
      nodeGraphics.circle(cx, cy, radius);
      nodeGraphics.stroke({ width: 1, color: node.isActive ? 0xFFFFFF : 0x555555 });
      
      if (!node.isActive) {
        nodeGraphics.circle(cx, cy, radius * 0.3);
        nodeGraphics.fill(0x333333);
      }
    }
    container.addChild(nodeGraphics);
    
    const spawnGraphics = new PIXI.Graphics();
    for (const spawn of spawnPoints) {
      const color = SPAWN_COLORS[spawn.type];
      const cx = spawn.x * cellSize + cellSize / 2;
      const cy = spawn.y * cellSize + cellSize / 2;
      const size = cellSize * 0.5;
      
      spawnGraphics.star(cx, cy, 4, size / 2, size / 4);
      spawnGraphics.fill(color);
      spawnGraphics.star(cx, cy, 4, size / 2, size / 4);
      spawnGraphics.stroke({ width: 1, color: 0xFFFFFF });
    }
    container.addChild(spawnGraphics);
    
    container.eventMode = 'static';
    container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      const pos = e.getLocalPosition(container);
      const cellX = Math.floor(pos.x / cellSize);
      const cellY = Math.floor(pos.y / cellSize);
      if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height) {
        onCellClick?.(cellX, cellY);
      }
    });
    
    container.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      const pos = e.getLocalPosition(container);
      const cellX = Math.floor(pos.x / cellSize);
      const cellY = Math.floor(pos.y / cellSize);
      if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height) {
        onCellHover?.(cellX, cellY);
      }
    });
  }, [grid, cellSize, showGrid, showHeightMap, selectedCell, onCellClick, onCellHover, nodes, spawnPoints]);

  useEffect(() => {
    renderGrid();
  }, [renderGrid]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!cellContainerRef.current) return;
    e.preventDefault();
    
    const container = cellContainerRef.current;
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, container.scale.x * scaleFactor));
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldX = (mouseX - container.x) / container.scale.x;
      const worldY = (mouseY - container.y) / container.scale.y;
      
      container.scale.set(newScale);
      
      container.x = mouseX - worldX * newScale;
      container.y = mouseY - worldY * newScale;
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && cellContainerRef.current) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      cellContainerRef.current.x += dx;
      cellContainerRef.current.y += dy;
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPos]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    if (cellContainerRef.current) {
      cellContainerRef.current.scale.set(1);
      cellContainerRef.current.x = 0;
      cellContainerRef.current.y = 0;
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button 
          onClick={resetView}
          className="bg-slate-800/80 hover:bg-slate-700 text-white text-xs px-2 py-1 rounded"
          data-testid="btn-reset-view"
        >
          Reset View
        </button>
        <span className="bg-slate-900/80 text-slate-300 text-xs px-2 py-1 rounded">
          Alt+Drag to pan | Scroll to zoom
        </span>
      </div>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: isPanning ? 'grabbing' : 'crosshair' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="pixi-canvas-container"
      />
    </div>
  );
}
