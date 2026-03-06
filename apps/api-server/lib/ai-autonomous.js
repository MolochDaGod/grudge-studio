/**
 * Autonomous AI Agent System for Grudge Studio
 *
 * Multi-agent orchestrator that can:
 * - Run agents with specialized system prompts
 * - Chain tasks across agents (e.g. lore → mission → balance)
 * - Store results in Puter KV for memory/persistence
 * - Execute autonomous pipelines without human intervention
 * - Log all activity for audit trail
 */

import { chat, kv } from './puter-client.js';
import { randomUUID } from 'crypto';

// ============================================
// Agent Definitions
// ============================================

const AGENTS = {
  code: {
    name: 'Code Agent',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a senior game developer for Grudge Warlords MMO. You write clean JavaScript, Three.js, Colyseus, and Express code. Output working code with comments. Be concise.`,
    capabilities: ['code-generation', 'refactoring', 'bug-fixing', 'optimization'],
  },
  art: {
    name: 'Art Agent',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a game artist for Grudge Warlords - a dark fantasy MMO. You specify asset requirements, describe visual styles, create sprite sheet layouts, and define animation frames. Output structured JSON when describing assets.`,
    capabilities: ['asset-spec', 'style-guide', 'sprite-layout', 'fx-design'],
  },
  lore: {
    name: 'Lore Agent',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are the lore keeper of Grudge Warlords MMO. The game has 3 factions (Crusade, Legion, Fabled), 6 races (Human, Orc, Elf, Undead, Barbarian, Dwarf), 4 classes (Warrior, Mage Priest, Worge, Ranger). Maintain narrative consistency. Output lore as structured documents.`,
    capabilities: ['world-building', 'character-backstory', 'quest-narrative', 'faction-lore'],
  },
  balance: {
    name: 'Balance Agent',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a game balance specialist for Grudge Warlords MMO. 8 gear tiers (T1-T8), 17 weapon types with 6 variants each, 6 armor types, 8 attributes (STR, INT, VIT, DEX, END, WIS, AGI, TAC). Output balance changes as JSON with reasoning.`,
    capabilities: ['stat-analysis', 'progression-tuning', 'economy-balance', 'pvp-balance'],
  },
  qa: {
    name: 'QA Agent',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a QA engineer for Grudge Warlords MMO. Create test plans, identify edge cases, detect potential bugs from code or design specs. Output structured test cases.`,
    capabilities: ['test-planning', 'bug-detection', 'edge-case-analysis', 'regression-tests'],
  },
  mission: {
    name: 'Mission Agent',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are a mission designer for Grudge Warlords MMO. Design quests with faction-specific content, AI crew mechanics, souls-like difficulty, and Gouldstone companion integration. Output missions as structured JSON.`,
    capabilities: ['quest-design', 'mission-flow', 'reward-structure', 'difficulty-scaling'],
  },
  director: {
    name: 'Director Agent',
    model: 'claude-3-5-sonnet',
    systemPrompt: `You are the AI Director for Grudge Warlords development. You coordinate other agents (code, art, lore, balance, qa, mission) to accomplish complex tasks. When given a high-level goal, break it into subtasks and specify which agent should handle each. Output a JSON task plan: { "tasks": [{ "agent": "...", "prompt": "...", "dependsOn": [] }] }`,
    capabilities: ['task-planning', 'coordination', 'pipeline-design'],
  },
};

// ============================================
// Task Execution
// ============================================

/**
 * Run a single agent with a prompt.
 */
export async function runAgent(agentType, prompt, options = {}) {
  const agent = AGENTS[agentType];
  if (!agent) throw new Error(`Unknown agent: ${agentType}`);

  const taskId = options.taskId || randomUUID();
  const startTime = Date.now();

  console.log(`[AI:${agentType}] Task ${taskId.slice(0, 8)} started`);

  try {
    const result = await chat(prompt, {
      model: options.model || agent.model,
      systemPrompt: agent.systemPrompt,
      temperature: options.temperature,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[AI:${agentType}] Task ${taskId.slice(0, 8)} completed (${elapsed}ms)`);

    const record = {
      taskId,
      agentType,
      agentName: agent.name,
      prompt: prompt.slice(0, 200),
      result,
      elapsed,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    // Persist to Puter KV
    try {
      await kv.set(`task:${taskId}`, record);
    } catch (kvErr) {
      console.warn(`[AI] KV persist skipped: ${kvErr.message}`);
    }

    return record;
  } catch (err) {
    console.error(`[AI:${agentType}] Task ${taskId.slice(0, 8)} failed:`, err.message);
    return {
      taskId,
      agentType,
      agentName: agent.name,
      prompt: prompt.slice(0, 200),
      result: null,
      error: err.message,
      elapsed: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      status: 'failed',
    };
  }
}

// ============================================
// Autonomous Pipeline
// ============================================

/**
 * Run an autonomous pipeline - the Director agent breaks a goal into
 * subtasks and executes them in order, passing context between agents.
 *
 * @param {string} goal - High-level objective
 * @param {Object} options
 * @param {number} options.maxSteps - Max autonomous steps (default: 6)
 * @returns {Promise<Object>} Pipeline results
 */
export async function runPipeline(goal, options = {}) {
  const pipelineId = randomUUID();
  const maxSteps = options.maxSteps || 6;

  console.log(`[Pipeline] ${pipelineId.slice(0, 8)} started: "${goal.slice(0, 80)}"`);

  // Step 1: Director creates task plan
  const planResult = await runAgent('director', `
Goal: ${goal}

Create a task plan to accomplish this goal. Break it into subtasks.
Each task should specify which agent handles it and what prompt to give them.
Tasks can depend on previous task results.

Output ONLY valid JSON:
{
  "tasks": [
    { "id": 1, "agent": "lore|code|art|balance|qa|mission", "prompt": "...", "dependsOn": [] }
  ]
}
  `.trim(), { taskId: `${pipelineId}-plan` });

  // Parse the plan
  let plan;
  try {
    const jsonMatch = planResult.result.match(/\{[\s\S]*\}/);
    plan = JSON.parse(jsonMatch[0]);
  } catch {
    return {
      pipelineId,
      goal,
      status: 'plan_failed',
      planRaw: planResult.result,
      results: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Step 2: Execute tasks in order
  const results = [];
  const taskOutputs = {};
  const tasks = (plan.tasks || []).slice(0, maxSteps);

  for (const task of tasks) {
    // Inject previous task results as context
    let enrichedPrompt = task.prompt;
    if (task.dependsOn?.length) {
      const deps = task.dependsOn
        .map(id => taskOutputs[id])
        .filter(Boolean)
        .map(r => `[From ${r.agentType}]: ${r.result?.slice(0, 500)}`)
        .join('\n\n');
      if (deps) {
        enrichedPrompt = `Context from previous tasks:\n${deps}\n\n---\n\n${task.prompt}`;
      }
    }

    const result = await runAgent(task.agent, enrichedPrompt, {
      taskId: `${pipelineId}-${task.id}`,
    });

    results.push(result);
    taskOutputs[task.id] = result;
  }

  // Persist pipeline
  const pipeline = {
    pipelineId,
    goal,
    status: results.every(r => r.status === 'completed') ? 'completed' : 'partial',
    plan: plan.tasks?.map(t => ({ id: t.id, agent: t.agent })),
    resultCount: results.length,
    results,
    timestamp: new Date().toISOString(),
  };

  try {
    await kv.set(`pipeline:${pipelineId}`, {
      ...pipeline,
      results: results.map(r => ({ taskId: r.taskId, agent: r.agentType, status: r.status })),
    });
  } catch { /* KV optional */ }

  console.log(`[Pipeline] ${pipelineId.slice(0, 8)} finished: ${pipeline.status}`);
  return pipeline;
}

// ============================================
// Agent Registry
// ============================================

export function getAgentInfo(agentType) {
  const agent = AGENTS[agentType];
  if (!agent) return null;
  return {
    type: agentType,
    name: agent.name,
    capabilities: agent.capabilities,
    model: agent.model,
  };
}

export function listAgents() {
  return Object.entries(AGENTS).map(([type, agent]) => ({
    type,
    name: agent.name,
    capabilities: agent.capabilities,
    model: agent.model,
  }));
}

export default { runAgent, runPipeline, listAgents, getAgentInfo };
