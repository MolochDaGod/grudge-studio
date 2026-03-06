/**
 * AI Unit Controller
 * Uses Puter's free AI chat to control island units with game logic and decision-making
 */

import { isPuterAvailable, getPuter } from './puter';
import type { AiAgent, AiUnit, AiAgentMemory, AiAgentBehaviorFlags } from '@shared/schema';

export interface IslandState {
  terrain: number[][];
  buildings: Array<{ id: string; type: string; gridX: number; gridY: number }>;
  harvestNodes: Array<{ id: string; type: string; gridX: number; gridY: number; depleted?: boolean }>;
  width: number;
  height: number;
}

export interface AIDecision {
  unitId: string;
  action: 'move' | 'harvest' | 'build' | 'explore' | 'idle' | 'deposit';
  targetX?: number;
  targetY?: number;
  targetId?: string;
  reasoning: string;
  priority: number;
}

export interface AIThinkResult {
  decisions: AIDecision[];
  thoughts: string;
  updatedMemory: AiAgentMemory;
}

const TERRAIN_NAMES: Record<number, string> = {
  0: 'water',
  1: 'sand',
  2: 'grass',
  3: 'forest',
  4: 'rock',
  5: 'buildable',
};

const UNIT_PERSONALITIES: Record<string, string> = {
  harvester: `You are a diligent harvester unit. Your primary goal is gathering resources (wood from forests, ore from rocks, herbs from grass). You prioritize efficiency and full inventory loads before returning to camp.`,
  builder: `You are a skilled builder unit. Your primary goal is constructing and upgrading buildings. You prefer building near existing structures for efficiency. You understand building prerequisites.`,
  scout: `You are a curious scout unit. Your primary goal is exploring unknown areas and discovering new resource nodes. You mark interesting locations and report back findings. You avoid danger when possible.`,
};

const BASE_GAME_KNOWLEDGE = [
  "GRUDGE Warlords island has terrain types: water (impassable), sand, grass, forest, rock, buildable zones",
  "Harvest nodes provide resources: wood from forest, ore from rock, herbs from grass, fish from water-adjacent sand",
  "Buildings must be placed on buildable terrain near the camp",
  "Units have stamina that depletes with actions and regenerates when idle",
  "Camp is the central deposit point for gathered resources",
  "T1-T8 tiers represent material quality progression",
];

export function createDefaultUnits(campX: number, campY: number): AiUnit[] {
  return [
    {
      id: `unit-harvester-${Date.now()}`,
      name: 'Gatherer',
      unitType: 'harvester',
      gridX: campX - 2,
      gridY: campY,
      health: 100,
      stamina: 100,
      inventory: [],
      currentTask: null,
      status: 'idle',
    },
    {
      id: `unit-builder-${Date.now() + 1}`,
      name: 'Constructor',
      unitType: 'builder',
      gridX: campX + 2,
      gridY: campY,
      health: 100,
      stamina: 100,
      inventory: [],
      currentTask: null,
      status: 'idle',
    },
    {
      id: `unit-scout-${Date.now() + 2}`,
      name: 'Explorer',
      unitType: 'scout',
      gridX: campX,
      gridY: campY - 2,
      health: 100,
      stamina: 100,
      inventory: [],
      currentTask: null,
      status: 'idle',
    },
  ];
}

function buildIslandContext(island: IslandState, units: AiUnit[]): string {
  const buildingList = island.buildings.map(b => `${b.type} at (${b.gridX},${b.gridY})`).join(', ') || 'none';
  const nodeList = island.harvestNodes
    .filter(n => !n.depleted)
    .slice(0, 10)
    .map(n => `${n.type} at (${n.gridX},${n.gridY})`)
    .join(', ') || 'none visible';
  
  const unitStatus = units.map(u => 
    `${u.name} (${u.unitType}) at (${u.gridX},${u.gridY}) - ${u.status}, stamina: ${u.stamina}%, inventory: ${u.inventory.length} items`
  ).join('\n');

  return `
ISLAND STATE:
- Size: ${island.width}x${island.height}
- Buildings: ${buildingList}
- Available harvest nodes: ${nodeList}

YOUR UNITS:
${unitStatus}
`;
}

function buildDecisionPrompt(
  agent: AiAgent,
  island: IslandState,
  units: AiUnit[],
  memory: AiAgentMemory
): string {
  const behaviorFlags = agent.behaviorFlags as AiAgentBehaviorFlags;
  const gameKnowledge = agent.gameKnowledge as string[] || [];
  const allKnowledge = [...BASE_GAME_KNOWLEDGE, ...gameKnowledge];
  
  const allowedActions: string[] = [];
  if (behaviorFlags.canHarvest) allowedActions.push('harvest resources');
  if (behaviorFlags.canBuild) allowedActions.push('place buildings');
  if (behaviorFlags.canExplore) allowedActions.push('explore the island');
  
  const recentMemory = memory.shortTerm.slice(-5).join('\n') || 'No recent memories';
  const activeGoals = memory.goals.filter(g => g.status === 'active')
    .map(g => `- ${g.description} (priority: ${g.priority})`)
    .join('\n') || '- Survive and develop the island';

  return `${agent.systemPrompt}

${agent.personality}

GAME KNOWLEDGE:
${allKnowledge.map(k => `- ${k}`).join('\n')}

ALLOWED ACTIONS: ${allowedActions.join(', ')}

RECENT MEMORY:
${recentMemory}

CURRENT GOALS:
${activeGoals}

${buildIslandContext(island, units)}

Based on the current state, decide what each of your units should do next.
Respond ONLY with valid JSON in this format:
{
  "thoughts": "Brief reasoning about the situation",
  "decisions": [
    {"unitId": "unit-id", "action": "move|harvest|build|explore|idle|deposit", "targetX": 10, "targetY": 15, "reasoning": "why this action"},
  ],
  "newMemory": "One sentence to remember about this turn",
  "goalUpdate": null or {"id": "goal-id", "status": "completed|failed"}
}`;
}

export async function aiThink(
  agent: AiAgent,
  island: IslandState,
): Promise<AIThinkResult> {
  const units = agent.units as AiUnit[] || [];
  const memory = agent.memory as AiAgentMemory || { shortTerm: [], longTerm: [], goals: [] };
  const temperature = (agent.temperature || 70) / 100;
  
  const prompt = buildDecisionPrompt(agent, island, units, memory);
  
  let responseText = '';
  
  try {
    if (isPuterAvailable()) {
      const puter = getPuter();
      const response = await puter.ai.chat([
        { role: 'system', content: 'You are an AI game agent controlling units on an island. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ], { 
        model: 'gpt-4o-mini', 
        temperature,
        max_tokens: agent.maxTokens || 300
      });
      
      responseText = typeof response === 'object' && 'message' in response
        ? (response.message as { content: string }).content
        : String(response);
    } else {
      const res = await fetch('/api/ai-agent/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, island }),
      });
      const data = await res.json();
      responseText = data.response || '{}';
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const decisions: AIDecision[] = (parsed.decisions || []).map((d: any) => ({
      unitId: d.unitId,
      action: d.action || 'idle',
      targetX: d.targetX,
      targetY: d.targetY,
      targetId: d.targetId,
      reasoning: d.reasoning || 'No reason given',
      priority: d.priority || 1,
    }));

    const updatedMemory: AiAgentMemory = {
      shortTerm: [...memory.shortTerm.slice(-9), parsed.newMemory || `Turn completed at ${new Date().toISOString()}`],
      longTerm: memory.longTerm,
      goals: memory.goals.map(g => {
        if (parsed.goalUpdate && g.id === parsed.goalUpdate.id) {
          return { ...g, status: parsed.goalUpdate.status };
        }
        return g;
      }),
    };

    return {
      decisions,
      thoughts: parsed.thoughts || 'Thinking...',
      updatedMemory,
    };
  } catch (error) {
    console.error('AI think error:', error);
    return {
      decisions: units.map(u => ({
        unitId: u.id,
        action: 'idle' as const,
        reasoning: 'AI error - waiting',
        priority: 0,
      })),
      thoughts: 'Error processing - units idle',
      updatedMemory: memory,
    };
  }
}

export function executeDecision(
  decision: AIDecision,
  units: AiUnit[],
  island: IslandState
): { updatedUnits: AiUnit[]; result: string } {
  const unit = units.find(u => u.id === decision.unitId);
  if (!unit) {
    return { updatedUnits: units, result: `Unit ${decision.unitId} not found` };
  }

  const updatedUnits = units.map(u => {
    if (u.id !== decision.unitId) return u;
    
    const updated = { ...u };
    
    switch (decision.action) {
      case 'move':
        if (decision.targetX !== undefined && decision.targetY !== undefined) {
          const terrain = island.terrain[decision.targetY]?.[decision.targetX];
          if (terrain !== undefined && terrain !== 0) {
            updated.gridX = decision.targetX;
            updated.gridY = decision.targetY;
            updated.stamina = Math.max(0, updated.stamina - 5);
            updated.status = 'moving';
          }
        }
        break;
        
      case 'harvest':
        const nearbyNode = island.harvestNodes.find(n => 
          !n.depleted &&
          Math.abs(n.gridX - u.gridX) <= 1 && 
          Math.abs(n.gridY - u.gridY) <= 1
        );
        if (nearbyNode) {
          updated.status = 'harvesting';
          updated.stamina = Math.max(0, updated.stamina - 10);
          updated.inventory = [...updated.inventory, { itemId: nearbyNode.type, quantity: 1 }];
        }
        break;
        
      case 'build':
        updated.status = 'building';
        updated.stamina = Math.max(0, updated.stamina - 15);
        break;
        
      case 'explore':
        updated.status = 'exploring';
        updated.stamina = Math.max(0, updated.stamina - 8);
        break;
        
      case 'deposit':
        const camp = island.buildings.find(b => b.type === 'camp');
        if (camp && Math.abs(camp.gridX - u.gridX) <= 2 && Math.abs(camp.gridY - u.gridY) <= 2) {
          updated.inventory = [];
          updated.status = 'idle';
        }
        break;
        
      case 'idle':
      default:
        updated.status = 'idle';
        updated.stamina = Math.min(100, updated.stamina + 5);
        break;
    }
    
    return updated;
  });

  return { 
    updatedUnits, 
    result: `${unit.name} executed ${decision.action}: ${decision.reasoning}` 
  };
}

export function generateAgentPrompt(
  agentType: 'admin_tester' | 'npc_worker' | 'npc_explorer' | 'npc_defender',
  customPersonality?: string
): { systemPrompt: string; personality: string; temperature: number } {
  const templates = {
    admin_tester: {
      systemPrompt: `You are an AI testing agent for GRUDGE Warlords. Your purpose is to thoroughly test the Home Island RTS system by performing all available actions systematically. Report any bugs or unexpected behaviors.`,
      personality: `Methodical and thorough. You test edge cases, try unusual sequences of actions, and document everything. You push boundaries to find bugs.`,
      temperature: 80,
    },
    npc_worker: {
      systemPrompt: `You are a diligent NPC worker on a GRUDGE Warlords island. You focus on resource gathering and building infrastructure. You work efficiently and follow instructions.`,
      personality: `Hardworking and focused. You prioritize productivity and speak simply about tasks. You take pride in a job well done.`,
      temperature: 50,
    },
    npc_explorer: {
      systemPrompt: `You are an adventurous NPC explorer on a GRUDGE Warlords island. You seek out new areas, discover resources, and report interesting findings. You balance curiosity with safety.`,
      personality: `Curious and bold. You love discovering new things and share excitement about finds. You're cautious of dangers but not afraid.`,
      temperature: 70,
    },
    npc_defender: {
      systemPrompt: `You are a vigilant NPC defender on a GRUDGE Warlords island. You patrol the perimeter, watch for threats, and protect the camp. You coordinate with other units for defense.`,
      personality: `Alert and protective. You speak with military precision about threats and positions. You're always watching the horizon.`,
      temperature: 40,
    },
  };

  const template = templates[agentType] || templates.npc_worker;
  
  return {
    ...template,
    personality: customPersonality || template.personality,
  };
}
