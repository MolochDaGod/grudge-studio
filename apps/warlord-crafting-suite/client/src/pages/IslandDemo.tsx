import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Map, Palmtree, Mountain, Snowflake, Sun, Flame } from 'lucide-react';
import IslandGridRenderer from '@/components/IslandGridRenderer';
import { generateIsland, type BiomeType } from '@/lib/islandGenerator';
import type { GridCell, IslandBuilding, HarvestNode } from '@shared/schema';

const BIOME_OPTIONS: { value: BiomeType; label: string; icon: React.ReactNode }[] = [
  { value: 'temperate', label: 'Temperate', icon: <Palmtree className="w-4 h-4" /> },
  { value: 'tropical', label: 'Tropical', icon: <Sun className="w-4 h-4" /> },
  { value: 'arctic', label: 'Arctic', icon: <Snowflake className="w-4 h-4" /> },
  { value: 'desert', label: 'Desert', icon: <Mountain className="w-4 h-4" /> },
  { value: 'volcanic', label: 'Volcanic', icon: <Flame className="w-4 h-4" /> },
];

export default function IslandDemo() {
  const [biome, setBiome] = useState<BiomeType>('temperate');
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [buildings, setBuildings] = useState<IslandBuilding[]>([]);
  const [harvestNodes, setHarvestNodes] = useState<HarvestNode[]>([]);
  const [resources, setResources] = useState({ gold: 1000, wood: 500, ore: 300, herbs: 200 });
  const [islandGenerated, setIslandGenerated] = useState(false);

  const handleGenerateIsland = useCallback(() => {
    const island = generateIsland({ biome });
    setGridCells(island.gridCells);
    setBuildings([]);
    setHarvestNodes(island.harvestNodes);
    setIslandGenerated(true);
  }, [biome]);

  const handleBuildingPlaced = useCallback((building: IslandBuilding, updatedCells: GridCell[]) => {
    setBuildings(prev => [...prev, building]);
    setGridCells(updatedCells);
  }, []);

  const handleCellClick = useCallback((cell: GridCell) => {
    console.log('Cell clicked:', cell);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2" data-testid="title-island-demo">
              <Map className="w-8 h-8 text-emerald-400" />
              Home Island Demo
            </h1>
            <p className="text-gray-400 mt-1">Test the procedural island generator and building placement system</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            data-testid="btn-back"
          >
            Back
          </Button>
        </div>

        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="bg-black/20">
            <TabsTrigger value="generator" data-testid="tab-generator">Island Generator</TabsTrigger>
            <TabsTrigger value="info" data-testid="tab-info">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-4">
            <Card className="bg-black/30 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Generate New Island</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Biome Type</label>
                    <Select value={biome} onValueChange={(v) => setBiome(v as BiomeType)}>
                      <SelectTrigger className="w-48" data-testid="select-biome">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BIOME_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              {opt.icon}
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleGenerateIsland} data-testid="btn-generate">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Island
                  </Button>
                </div>

                {islandGenerated && (
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-green-900/20">
                      Valid Cells: {gridCells.filter(c => c.isValid).length}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-900/20">
                      Harvest Nodes: {harvestNodes.length}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-900/20">
                      Buildings: {buildings.length}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {islandGenerated && (
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Island Grid (10x10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <IslandGridRenderer
                    gridCells={gridCells}
                    buildings={buildings}
                    harvestNodes={harvestNodes}
                    resources={resources}
                    onBuildingPlaced={handleBuildingPlaced}
                    onCellClick={handleCellClick}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card className="bg-black/30 border-white/10">
              <CardHeader>
                <CardTitle>Character Engagement Framework</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">Game Sessions</h3>
                  <p className="text-sm">
                    Track active play sessions with checkpoints. Sessions connect characters to islands
                    and manage pending resources that can be committed to the main inventory.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">AFK Jobs</h3>
                  <p className="text-sm">
                    Queue background harvesting and automation tasks. Jobs run on a timer and yield
                    resources when completed, even while you're away.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Resource Ledger</h3>
                  <p className="text-sm">
                    Bridges session yields to your main inventory. Resources are tracked as uncommitted
                    until you explicitly commit them, providing a safe progression mechanism.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Building Types</h3>
                  <ul className="text-sm space-y-1">
                    <li><span className="text-amber-400">House</span> - Basic 1x1 housing</li>
                    <li><span className="text-red-400">Outpost</span> - 1x1 defensive structure</li>
                    <li><span className="text-green-400">Farm</span> - 1x1 food production</li>
                    <li><span className="text-purple-400">Tower</span> - 2x2 watchtower</li>
                    <li><span className="text-yellow-400">Market</span> - 2x2 trading hub</li>
                    <li><span className="text-blue-400">Warehouse</span> - 2x2 storage</li>
                    <li><span className="text-red-600">Fortress</span> - 3x3 stronghold</li>
                    <li><span className="text-orange-400">Workshop</span> - 1x1 crafting station</li>
                    <li><span className="text-pink-400">Shrine</span> - 1x1 mystic structure</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
