/**
 * AI Agent Routes
 * Powered by Puter AI cloud + autonomous multi-agent system.
 * Agents: code, art, lore, balance, QA, mission, director.
 */

import { Router } from 'express';
import { aiRateLimit } from '../middleware/rate-limit.js';
import { runAgent, runPipeline, listAgents, getAgentInfo } from '../lib/ai-autonomous.js';
import { healthCheck } from '../lib/puter-client.js';

const router = Router();

/**
 * GET /api/v1/ai/status
 * Puter AI connection health check
 */
router.get('/status', async (req, res) => {
  const health = await healthCheck();
  res.json({ service: 'puter-ai', ...health });
});

/**
 * GET /api/v1/ai/agents
 * List available AI agents
 */
router.get('/agents', (req, res) => {
  const agents = listAgents();
  res.json({ agents, count: agents.length });
});

/**
 * GET /api/v1/ai/agents/:type
 * Get info about a specific agent
 */
router.get('/agents/:type', (req, res) => {
  const info = getAgentInfo(req.params.type);
  if (!info) {
    return res.status(404).json({
      error: 'unknown_agent',
      available: listAgents().map(a => a.type),
    });
  }
  res.json(info);
});

/**
 * POST /api/v1/ai/query
 * Query a specific AI agent (powered by Puter AI)
 */
router.post('/query', aiRateLimit, async (req, res) => {
  const { agentType, prompt, options } = req.body;

  if (!agentType || !prompt) {
    return res.status(400).json({
      error: 'missing_fields',
      message: 'Both agentType and prompt are required',
      available: listAgents().map(a => a.type),
    });
  }

  try {
    const result = await runAgent(agentType, prompt, {
      model: options?.model,
      temperature: options?.temperature,
    });

    res.json({
      success: result.status === 'completed',
      ...result,
      metadata: { source: 'puter-ai-autonomous' },
    });
  } catch (err) {
    console.error(`[AI] Query error for ${agentType}:`, err);
    res.status(500).json({
      error: 'ai_query_failed',
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/ai/pipeline
 * Run an autonomous multi-agent pipeline.
 * The Director agent plans tasks and executes them across specialized agents.
 */
router.post('/pipeline', aiRateLimit, async (req, res) => {
  const { goal, maxSteps } = req.body;

  if (!goal) {
    return res.status(400).json({
      error: 'missing_goal',
      message: 'A goal string is required for autonomous pipeline execution',
    });
  }

  try {
    const result = await runPipeline(goal, { maxSteps: maxSteps || 6 });
    res.json(result);
  } catch (err) {
    console.error('[AI] Pipeline error:', err);
    res.status(500).json({
      error: 'pipeline_failed',
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/ai/research
 * AI-powered research using the lore or balance agent
 */
router.post('/research', aiRateLimit, async (req, res) => {
  const { topic, category } = req.body;

  if (!topic) {
    return res.status(400).json({
      error: 'missing_topic',
      message: 'Research topic is required',
    });
  }

  const agentType = category === 'balance' ? 'balance' : 'lore';

  try {
    const result = await runAgent(agentType, `Research the following topic and provide detailed findings:\n\n${topic}`);
    res.json({
      query: topic,
      agentUsed: agentType,
      findings: result.result,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      error: 'research_failed',
      message: err.message,
    });
  }
});

export default router;
