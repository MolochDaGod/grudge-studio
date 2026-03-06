import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Home, TreePine, Mountain, Waves, Leaf, Building2, AlertCircle } from 'lucide-react';
import type { GridCell, IslandBuilding, HarvestNode } from '@shared/schema';
import { BUILDING_TYPES, type BuildingType, getValidBuildingCells, placeBuilding } from '@/lib/islandGenerator';

interface IslandGridRendererProps {
  gridCells: GridCell[];
  buildings: IslandBuilding[];
  harvestNodes: HarvestNode[];
  overlayImageUrl?: string | null;
  gridRows?: number;
  gridCols?: number;
  resources?: { gold: number; wood: number; ore: number; herbs: number };
  onBuildingPlaced?: (building: IslandBuilding, updatedCells: GridCell[]) => void;
  onCellClick?: (cell: GridCell) => void;
  readOnly?: boolean;
}

const TERRAIN_COLORS: Record<string, string> = {
  grass: 'bg-green-500/30 border-green-600',
  sand: 'bg-yellow-300/30 border-yellow-500',
  rock: 'bg-gray-400/30 border-gray-500',
  water: 'bg-blue-400/30 border-blue-500',
  forest: 'bg-emerald-600/30 border-emerald-700',
};

const TERRAIN_ICONS: Record<string, React.ReactNode> = {
  grass: null,
  sand: null,
  rock: <Mountain className="w-3 h-3 text-gray-400" />,
  water: <Waves className="w-3 h-3 text-blue-400" />,
  forest: <TreePine className="w-3 h-3 text-emerald-500" />,
};

const BUILDING_ICONS: Record<string, React.ReactNode> = {
  house: <Home className="w-4 h-4 text-amber-600" />,
  outpost: <Building2 className="w-4 h-4 text-red-500" />,
  farm: <Leaf className="w-4 h-4 text-green-500" />,
  tower: <Building2 className="w-5 h-5 text-purple-500" />,
  market: <Building2 className="w-5 h-5 text-yellow-500" />,
  warehouse: <Building2 className="w-5 h-5 text-blue-500" />,
  fortress: <Building2 className="w-6 h-6 text-red-700" />,
  workshop: <Building2 className="w-4 h-4 text-orange-500" />,
  shrine: <Building2 className="w-4 h-4 text-pink-400" />,
};

const HARVEST_COLORS: Record<string, string> = {
  wood: 'bg-amber-700',
  ore: 'bg-slate-500',
  herbs: 'bg-lime-500',
  fish: 'bg-cyan-400',
  crystal: 'bg-violet-400',
};

export default function IslandGridRenderer({
  gridCells,
  buildings,
  harvestNodes,
  overlayImageUrl,
  gridRows = 10,
  gridCols = 10,
  resources,
  onBuildingPlaced,
  onCellClick,
  readOnly = false,
}: IslandGridRendererProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  
  const selectedBuildingConfig = selectedBuilding ? BUILDING_TYPES[selectedBuilding] : null;
  const validCells = selectedBuildingConfig 
    ? getValidBuildingCells(
        gridCells, 
        selectedBuildingConfig.sizeRows, 
        selectedBuildingConfig.sizeCols,
        gridRows,
        gridCols
      )
    : [];

  const handleCellClick = useCallback((cell: GridCell) => {
    if (readOnly) {
      onCellClick?.(cell);
      return;
    }
    
    if (selectedBuilding && selectedBuildingConfig) {
      const isValid = validCells.some(c => c.id === cell.id);
      if (!isValid) return;
      
      const result = placeBuilding(
        gridCells,
        cell.row,
        cell.col,
        selectedBuilding,
        selectedBuildingConfig.sizeRows,
        selectedBuildingConfig.sizeCols
      );
      
      if (result) {
        onBuildingPlaced?.(result.building, result.updatedCells);
        setSelectedBuilding(null);
      }
    } else {
      onCellClick?.(cell);
    }
  }, [selectedBuilding, selectedBuildingConfig, validCells, gridCells, onBuildingPlaced, onCellClick, readOnly]);

  const getCellBuilding = (cell: GridCell): IslandBuilding | undefined => {
    return buildings.find(b => b.id === cell.buildingId);
  };

  const getCellHarvestNode = (cell: GridCell): HarvestNode | undefined => {
    return harvestNodes.find(n => n.gridRow === cell.row && n.gridCol === cell.col);
  };

  const isValidPlacement = (cell: GridCell): boolean => {
    return validCells.some(c => c.id === cell.id);
  };

  const isBuildingOrigin = (cell: GridCell): boolean => {
    const building = getCellBuilding(cell);
    return building ? building.gridRow === cell.row && building.gridCol === cell.col : false;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {resources && (
          <div className="flex gap-4 flex-wrap">
            <Badge variant="outline" className="bg-yellow-900/20">Gold: {resources.gold}</Badge>
            <Badge variant="outline" className="bg-amber-900/20">Wood: {resources.wood}</Badge>
            <Badge variant="outline" className="bg-slate-700/20">Ore: {resources.ore}</Badge>
            <Badge variant="outline" className="bg-lime-900/20">Herbs: {resources.herbs}</Badge>
          </div>
        )}

        {!readOnly && (
          <Card className="bg-black/20 border-white/10">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Build</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(Object.keys(BUILDING_TYPES) as BuildingType[]).map(type => {
                  const config = BUILDING_TYPES[type];
                  const isSelected = selectedBuilding === type;
                  return (
                    <Button
                      key={type}
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      className={`text-xs ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
                      onClick={() => setSelectedBuilding(isSelected ? null : type)}
                      data-testid={`building-btn-${type}`}
                    >
                      {BUILDING_ICONS[type]}
                      <span className="ml-1">{config.name}</span>
                      <span className="text-[10px] ml-1 opacity-60">{config.sizeRows}x{config.sizeCols}</span>
                    </Button>
                  );
                })}
              </div>
              {selectedBuilding && selectedBuildingConfig && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">{selectedBuildingConfig.name}</span>
                  <span className="ml-2">
                    Cost: {Object.entries(selectedBuildingConfig.cost).map(([k, v]) => `${v} ${k}`).join(', ')}
                  </span>
                  <span className="ml-2 text-green-400">{validCells.length} valid spots</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div 
          className="relative rounded-lg overflow-hidden border border-white/10"
          style={{
            backgroundImage: overlayImageUrl ? `url(${overlayImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!overlayImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-blue-900/50" />
          )}
          
          <div 
            className="relative grid gap-0.5 p-2"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(32px, 1fr))`,
              gridTemplateRows: `repeat(${gridRows}, minmax(32px, 1fr))`,
            }}
          >
            {Array.from({ length: gridRows }).map((_, row) =>
              Array.from({ length: gridCols }).map((_, col) => {
                const cell = gridCells.find(c => c.row === row && c.col === col);
                if (!cell) return null;
                
                const building = getCellBuilding(cell);
                const harvestNode = getCellHarvestNode(cell);
                const isOrigin = isBuildingOrigin(cell);
                const canPlace = selectedBuilding && isValidPlacement(cell);
                const isHovered = hoveredCell?.id === cell.id;
                
                return (
                  <Tooltip key={cell.id}>
                    <TooltipTrigger asChild>
                      <button
                        data-testid={`grid-cell-${row}-${col}`}
                        className={`
                          relative aspect-square rounded border transition-all
                          ${TERRAIN_COLORS[cell.terrainType] || 'bg-gray-500/30 border-gray-600'}
                          ${!cell.isValid ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
                          ${canPlace ? 'ring-2 ring-green-400 ring-opacity-70' : ''}
                          ${isHovered && selectedBuilding ? 'ring-2 ring-yellow-400' : ''}
                          ${building && !isOrigin ? 'bg-amber-900/40' : ''}
                        `}
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        disabled={!cell.isValid && !readOnly}
                      >
                        {TERRAIN_ICONS[cell.terrainType] && !building && !harvestNode && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-40">
                            {TERRAIN_ICONS[cell.terrainType]}
                          </div>
                        )}
                        
                        {harvestNode && !building && (
                          <div className={`absolute inset-1 rounded ${HARVEST_COLORS[harvestNode.type]} flex items-center justify-center`}>
                            <span className="text-[8px] text-white font-bold uppercase">{harvestNode.type.slice(0, 1)}</span>
                          </div>
                        )}
                        
                        {building && isOrigin && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                            {BUILDING_ICONS[building.type] || <Building2 className="w-4 h-4" />}
                          </div>
                        )}
                        
                        {!cell.isValid && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 text-red-400 opacity-50" />
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div>Cell ({row}, {col})</div>
                      <div className="capitalize">Terrain: {cell.terrainType}</div>
                      {building && <div>Building: {building.name} (Lvl {building.level})</div>}
                      {harvestNode && <div>Resource: {harvestNode.type} ({harvestNode.remaining}/{harvestNode.maxCapacity})</div>}
                      <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[150px]">ID: {cell.id}</div>
                    </TooltipContent>
                  </Tooltip>
                );
              })
            )}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Buildings: {buildings.length} | Harvest Nodes: {harvestNodes.length} | Grid: {gridRows}x{gridCols}
        </div>
      </div>
    </TooltipProvider>
  );
}
