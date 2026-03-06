import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Play, Pause, Settings, Terminal, Map, Users, Brain, Zap } from 'lucide-react';
import { aiThink, executeDecision, createDefaultUnits, generateAgentPrompt, type AIDecision, type IslandState } from '@/lib/aiUnitController';
import type { AiAgent, AiUnit, AiAgentMemory } from '@shared/schema';

const AGENT_TYPES = [
  { value: 'admin_tester', label: 'Admin Tester', description: 'Thoroughly tests game systems' },
  { value: 'npc_worker', label: 'NPC Worker', description: 'Focuses on resource gathering' },
  { value: 'npc_explorer', label: 'NPC Explorer', description: 'Discovers new areas' },
  { value: 'npc_defender', label: 'NPC Defender', description: 'Protects the island' },
];

export default function AIAgentTesting() {
  const { toast } = useToast();
  const { user, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  
  const [newAgentType, setNewAgentType] = useState<'admin_tester' | 'npc_worker' | 'npc_explorer' | 'npc_defender'>('admin_tester');
  const [newAgentName, setNewAgentName] = useState('AI Tester');
  const [customPersonality, setCustomPersonality] = useState('');
  const [temperature, setTemperature] = useState(70);
  
  const [mockIsland, setMockIsland] = useState<IslandState>({
    terrain: [],
    buildings: [{ id: 'camp-1', type: 'camp', gridX: 65, gridY: 52 }],
    harvestNodes: [
      { id: 'node-1', type: 'wood', gridX: 60, gridY: 50 },
      { id: 'node-2', type: 'ore', gridX: 70, gridY: 55 },
      { id: 'node-3', type: 'herbs', gridX: 63, gridY: 48 },
    ],
    width: 130,
    height: 105,
  });

  const { data: agents = [], isLoading } = useQuery<AiAgent[]>({
    queryKey: ['/api/ai-agents', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/ai-agents', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const createAgentMutation = useMutation({
    mutationFn: async (data: { name: string; agentType: string; personality: string; systemPrompt: string; temperature: number }) => {
      const units = createDefaultUnits(65, 52);
      const res = await fetch('/api/ai-agents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: data.name,
          agentType: data.agentType,
          personality: data.personality,
          systemPrompt: data.systemPrompt,
          temperature: data.temperature,
          units,
          gameKnowledge: [
            'This is a test island for AI agent development',
            'The camp is at coordinates (65, 52)',
            'Wood nodes are in forest terrain, ore in rock terrain',
          ],
          behaviorFlags: { canHarvest: true, canBuild: true, canExplore: true },
          memory: { 
            shortTerm: [], 
            longTerm: ['I am an AI agent testing the Home Island system'],
            goals: [
              { id: 'goal-1', description: 'Explore the island and report findings', priority: 1, status: 'active' },
              { id: 'goal-2', description: 'Gather resources for building', priority: 2, status: 'active' },
            ]
          },
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to create agent' }));
        throw new Error(error.error || 'Failed to create agent');
      }
      return res.json();
    },
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents'] });
      setSelectedAgentId(agent.id);
      addLog(`Created new AI agent: ${agent.name}`);
      toast({ title: 'AI Agent Created', description: `${agent.name} is ready to play` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<AiAgent> }) => {
      const res = await fetch(`/api/ai-agents/${data.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error('Failed to update agent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents'] });
    },
  });

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [...prev.slice(-100), `[${timestamp}] ${message}`]);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [actionLog]);

  const runTurn = useCallback(async () => {
    if (!selectedAgent) return;

    addLog(`--- Turn ${turnCount + 1} ---`);
    addLog(`AI thinking...`);

    try {
      const result = await aiThink(selectedAgent, mockIsland);
      
      addLog(`Thoughts: ${result.thoughts}`);
      
      let currentUnits = selectedAgent.units as AiUnit[];
      
      for (const decision of result.decisions) {
        const { updatedUnits, result: actionResult } = executeDecision(decision, currentUnits, mockIsland);
        currentUnits = updatedUnits;
        addLog(`  ${actionResult}`);
      }

      await updateAgentMutation.mutateAsync({
        id: selectedAgent.id,
        updates: {
          units: currentUnits,
          memory: result.updatedMemory,
          lastActionAt: new Date(),
          stats: {
            ...(selectedAgent.stats as object || {}),
            actionsPerformed: ((selectedAgent.stats as any)?.actionsPerformed || 0) + result.decisions.length,
            decisionsThinking: ((selectedAgent.stats as any)?.decisionsThinking || 0) + 1,
          },
        },
      });

      setTurnCount(prev => prev + 1);
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedAgent, mockIsland, turnCount, addLog, updateAgentMutation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && selectedAgent) {
      interval = setInterval(runTurn, 5000);
    }
    return () => clearInterval(interval);
  }, [isRunning, selectedAgent, runTurn]);

  const handleCreateAgent = () => {
    const prompt = generateAgentPrompt(newAgentType, customPersonality || undefined);
    createAgentMutation.mutate({
      name: newAgentName,
      agentType: newAgentType,
      personality: prompt.personality,
      systemPrompt: prompt.systemPrompt,
      temperature,
    });
  };

  const units = (selectedAgent?.units as AiUnit[]) || [];
  const memory = (selectedAgent?.memory as AiAgentMemory) || { shortTerm: [], longTerm: [], goals: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">AI Agent Testing Lab</h1>
          </div>
          <Badge variant="outline" className="text-purple-300 border-purple-500">
            Puter AI Powered
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-slate-800/80 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Create AI Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Agent Name</Label>
                <Input
                  data-testid="input-agent-name"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="AI Tester"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Agent Type</Label>
                <Select value={newAgentType} onValueChange={(v: any) => setNewAgentType(v)}>
                  <SelectTrigger data-testid="select-agent-type" className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div>{type.label}</div>
                          <div className="text-xs text-slate-400">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Temperature: {temperature}%</Label>
                <Slider
                  data-testid="slider-temperature"
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-400">
                  Lower = more predictable, Higher = more creative
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Custom Personality (optional)</Label>
                <Textarea
                  data-testid="textarea-personality"
                  value={customPersonality}
                  onChange={(e) => setCustomPersonality(e.target.value)}
                  placeholder="Leave empty to use default personality..."
                  className="bg-slate-700 border-slate-600 text-white h-20"
                />
              </div>

              <Button
                data-testid="button-create-agent"
                onClick={handleCreateAgent}
                disabled={createAgentMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create AI Agent
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-slate-400">Loading agents...</p>
              ) : agents.length === 0 ? (
                <p className="text-slate-400">No agents created yet</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        data-testid={`agent-card-${agent.id}`}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAgentId === agent.id 
                            ? 'bg-purple-600/30 border border-purple-500' 
                            : 'bg-slate-700/50 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{agent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {agent.agentType}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Units: {(agent.units as any[])?.length || 0} | 
                          Temp: {agent.temperature}%
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {selectedAgent && (
                <>
                  <Separator className="my-4 bg-slate-600" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Auto-Run</span>
                      <Switch
                        data-testid="switch-autorun"
                        checked={isRunning}
                        onCheckedChange={setIsRunning}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid="button-run-turn"
                        onClick={runTurn}
                        disabled={isRunning}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Run Turn
                      </Button>
                      <Button
                        data-testid="button-stop"
                        onClick={() => setIsRunning(false)}
                        disabled={!isRunning}
                        variant="destructive"
                        className="flex-1"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                    <div className="text-center text-slate-400 text-sm">
                      Turn: {turnCount}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                <Map className="w-5 h-5" />
                Unit Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {units.length === 0 ? (
                <p className="text-slate-400">Select an agent to view units</p>
              ) : (
                <div className="space-y-3">
                  {units.map(unit => (
                    <div 
                      key={unit.id}
                      data-testid={`unit-status-${unit.id}`}
                      className="p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{unit.name}</span>
                        <Badge 
                          variant={unit.status === 'idle' ? 'secondary' : 'default'}
                          className={unit.status === 'harvesting' ? 'bg-green-600' : unit.status === 'exploring' ? 'bg-blue-600' : ''}
                        >
                          {unit.status}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>Type: {unit.unitType}</div>
                        <div>Pos: ({unit.gridX}, {unit.gridY})</div>
                        <div>Stamina: {unit.stamina}%</div>
                        <div>Inventory: {unit.inventory.length}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-slate-800/80 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Action Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] bg-slate-900 rounded-lg p-3" ref={logRef}>
                {actionLog.length === 0 ? (
                  <p className="text-slate-500 font-mono text-sm">Waiting for actions...</p>
                ) : (
                  <div className="font-mono text-xs space-y-1">
                    {actionLog.map((log, i) => (
                      <div 
                        key={i} 
                        className={`${
                          log.includes('Error') ? 'text-red-400' :
                          log.includes('Turn') ? 'text-yellow-400' :
                          log.includes('Thoughts') ? 'text-purple-400' :
                          'text-green-400'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Agent Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAgent ? (
                <p className="text-slate-400">Select an agent to view memory</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Active Goals</h4>
                    <div className="space-y-1">
                      {memory.goals.filter(g => g.status === 'active').map(goal => (
                        <div key={goal.id} className="text-xs bg-slate-700/50 p-2 rounded">
                          <span className="text-purple-400">P{goal.priority}:</span>{' '}
                          <span className="text-slate-300">{goal.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Short-Term Memory</h4>
                    <ScrollArea className="h-[100px] bg-slate-900/50 rounded p-2">
                      {memory.shortTerm.length === 0 ? (
                        <p className="text-xs text-slate-500">No memories yet</p>
                      ) : (
                        <div className="text-xs space-y-1">
                          {memory.shortTerm.map((m, i) => (
                            <div key={i} className="text-slate-400">{m}</div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Long-Term Memory</h4>
                    <ScrollArea className="h-[80px] bg-slate-900/50 rounded p-2">
                      {memory.longTerm.length === 0 ? (
                        <p className="text-xs text-slate-500">No long-term memories</p>
                      ) : (
                        <div className="text-xs space-y-1">
                          {memory.longTerm.map((m, i) => (
                            <div key={i} className="text-blue-400">{m}</div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
