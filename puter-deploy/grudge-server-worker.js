/**
 * GRUDGE Studio — Unified Puter Worker
 * 
 * Bridges Puter-native KV/AI/FS with grudgewarlords.com/api/studio/*
 * All Grudge apps (.puter.site, .puter.work, grudgewarlords.com) share this backend.
 *
 * Deploy: puter.workers.create('grudge-studio-api', '/grudge-studio/workers/grudge-server-worker.js')
 * URL:    https://grudge-studio-api.puter.work
 *
 * @runtime Puter Worker
 * @version 3.0.0
 */

/* global router, me, user, Response, crypto, console */

const WARLORDS_API = 'https://grudgewarlords.com/api';
const STUDIO_API = WARLORDS_API + '/studio';
const VERSION = '3.0.0';

const KV = {
  session:  (id) => `grudge_session_${id}`,
  account:  (id) => `grudge:account:${id}`,
  save:     (id) => `grudge:save:${id}`,
  prefs:    (id) => `grudge:prefs:${id}`,
  data:     (t)  => `grudge_data_${t}`,
  npcMem:   (id) => `grudge_npc_${id}_memory`,
  chat:     (id) => `grudge_chat_${id}`,
  objectStore: (ds) => `grudge:objectstore:${ds}`,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-Puter-Token',
    },
  });
}

function error(msg, status = 400) { return json({ error: msg }, status); }

async function kvGet(key) {
  const raw = await me.puter.kv.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function kvSet(key, value) {
  await me.puter.kv.set(key, typeof value === 'string' ? value : JSON.stringify(value));
}

// ── Session / Auth ───────────────────────────────────────────────────────────
async function verifySession(code) {
  if (!code) return null;
  const session = await kvGet(KV.session(code));
  if (!session) return null;
  if (session.expiresAt && session.expiresAt < Date.now()) {
    await me.puter.kv.del(KV.session(code));
    return null;
  }
  return session;
}

function getAuthCode(request) {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const url = new URL(request.url);
  return url.searchParams.get('auth_code');
}

async function requireAuth(request) {
  const code = getAuthCode(request);
  if (!code) return { error: 'Authorization required', status: 401 };
  const session = await verifySession(code);
  if (!session) return { error: 'Invalid or expired session', status: 401 };
  return { session, code };
}

// ── Root ─────────────────────────────────────────────────────────────────────
router.get('/', async () => {
  return json({
    app: 'GRUDGE Studio API',
    version: VERSION,
    platform: 'puter-worker',
    backend: WARLORDS_API,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET  /api/health',
      'GET  /api/studio/status          — full platform status',
      'GET  /api/studio/game-data/:ds   — ObjectStore datasets (weapons, armor, etc.)',
      'GET  /api/studio/game-data/search?q=',
      'GET  /api/studio/game-data/catalog',
      'GET  /api/studio/ai/agents',
      'POST /api/studio/ai/query        — { agentType, prompt }',
      'POST /api/studio/uuid/generate   — { type, count }',
      'GET  /api/studio/uuid/types',
      'POST /api/auth/consume',
      'GET  /api/auth/verify',
      'POST /api/ai/chat               — Puter AI direct (auth required)',
      'POST /api/npc/chat              — NPC with memory (auth required)',
      'GET  /api/data/game',
      'POST /api/kv/get                — { key }',
      'POST /api/kv/set                — { key, value }',
    ],
  });
});

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/api/health', async () => {
  let kvOk = false, aiOk = false, backendOk = false;
  try { await me.puter.kv.set('_hc', Date.now().toString()); await me.puter.kv.del('_hc'); kvOk = true; } catch {}
  try { aiOk = !!me.puter.ai; } catch {}
  try { const r = await fetch(`${WARLORDS_API}/health`); backendOk = r.ok; } catch {}

  return json({
    status: 'healthy',
    app: 'grudge-studio-api',
    version: VERSION,
    timestamp: new Date().toISOString(),
    services: { kv: kvOk ? 'ok' : 'error', ai: aiOk ? 'ok' : 'error', backend: backendOk ? 'ok' : 'unreachable' },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STUDIO PROXY — forward to grudgewarlords.com/api/studio/*
// ══════════════════════════════════════════════════════════════════════════════

router.get('/api/studio/status', async () => {
  try {
    const r = await fetch(`${STUDIO_API}/status`);
    const data = await r.json();
    data.worker = { url: 'grudge-studio-api.puter.work', version: VERSION };
    return json(data);
  } catch (e) {
    return json({ error: 'Backend unreachable', message: e.message, workerVersion: VERSION }, 502);
  }
});

router.get('/api/studio/game-data/catalog', async () => {
  try {
    const r = await fetch(`${STUDIO_API}/game-data/catalog`);
    return json(await r.json());
  } catch (e) { return error('Catalog fetch failed: ' + e.message, 502); }
});

router.get('/api/studio/game-data/search', async ({ request }) => {
  const url = new URL(request.url);
  const qs = url.search;
  try {
    const r = await fetch(`${STUDIO_API}/game-data/search${qs}`);
    return json(await r.json());
  } catch (e) { return error('Search failed: ' + e.message, 502); }
});

router.get('/api/studio/game-data/:resource', async ({ params }) => {
  try {
    const r = await fetch(`${STUDIO_API}/game-data/${params.resource}`);
    const data = await r.json();
    // Cache in Puter KV for offline access
    if (data.data) {
      try { await kvSet(KV.objectStore(params.resource), { data: data.data, cachedAt: Date.now() }); } catch {}
    }
    return json(data);
  } catch (e) {
    // Fallback: try Puter KV cache
    const cached = await kvGet(KV.objectStore(params.resource));
    if (cached) return json({ dataset: params.resource, data: cached.data, source: 'puter-kv-cache', cachedAt: cached.cachedAt });
    return error('Dataset fetch failed: ' + e.message, 502);
  }
});

router.get('/api/studio/ai/agents', async () => {
  try {
    const r = await fetch(`${STUDIO_API}/ai/agents`);
    return json(await r.json());
  } catch (e) { return error('AI agents fetch failed: ' + e.message, 502); }
});

router.get('/api/studio/ai/agents/:type', async ({ params }) => {
  try {
    const r = await fetch(`${STUDIO_API}/ai/agents/${params.type}`);
    return json(await r.json());
  } catch (e) { return error(e.message, 502); }
});

router.post('/api/studio/ai/query', async ({ request }) => {
  const body = await request.json();
  // Try Puter AI directly (free, no API key needed)
  if (body.agentType && body.prompt) {
    try {
      // Get agent info from backend for system prompt
      let systemPrompt = 'You are a helpful assistant for Grudge Studio games.';
      try {
        const infoRes = await fetch(`${STUDIO_API}/ai/agents/${body.agentType}`);
        if (infoRes.ok) {
          const info = await infoRes.json();
          systemPrompt = info.systemPrompt || systemPrompt;
        }
      } catch {}
      const result = await me.puter.ai.chat(body.prompt, { system: systemPrompt });
      return json({ status: 'completed', agent: body.agentType, result, source: 'puter-ai-worker' });
    } catch (e) {
      console.error('Puter AI failed, falling back to backend:', e.message);
    }
  }
  // Fallback to backend
  try {
    const r = await fetch(`${STUDIO_API}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return json(await r.json());
  } catch (e) { return error('AI query failed: ' + e.message, 502); }
});

router.get('/api/studio/uuid/types', async () => {
  try { const r = await fetch(`${STUDIO_API}/uuid/types`); return json(await r.json()); }
  catch (e) { return error(e.message, 502); }
});

router.post('/api/studio/uuid/generate', async ({ request }) => {
  try {
    const body = await request.json();
    const r = await fetch(`${STUDIO_API}/uuid/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return json(await r.json());
  } catch (e) { return error(e.message, 502); }
});

// ══════════════════════════════════════════════════════════════════════════════
// PUTER-NATIVE — KV, AI Chat, NPC (uses me.puter directly)
// ══════════════════════════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/api/auth/consume', async ({ request }) => {
  try {
    const { code } = await request.json();
    if (!code) return error('Auth code required');
    const session = await verifySession(code);
    if (!session) return error('Invalid or expired auth code', 401);
    return json({
      success: true,
      user: { id: session.userId, username: session.username, role: session.role },
      expiresAt: session.expiresAt,
    });
  } catch (e) { return error(e.message, 500); }
});

router.get('/api/auth/verify', async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth.error) return json({ valid: false, error: auth.error });
  return json({ valid: true, user: { id: auth.session.userId, username: auth.session.username, role: auth.session.role } });
});

// ── KV Store (direct Puter KV access) ────────────────────────────────────────
router.post('/api/kv/set', async ({ request }) => {
  try {
    const { key, value } = await request.json();
    if (!key) return error('key required');
    await kvSet(key, value);
    return json({ ok: true });
  } catch (e) { return error(e.message, 500); }
});

router.post('/api/kv/get', async ({ request }) => {
  try {
    const { key } = await request.json();
    if (!key) return error('key required');
    const value = await kvGet(key);
    return json({ ok: true, value });
  } catch (e) { return error(e.message, 500); }
});

router.post('/api/kv/del', async ({ request }) => {
  try {
    const { key } = await request.json();
    if (!key) return error('key required');
    await me.puter.kv.del(key);
    return json({ ok: true });
  } catch (e) { return error(e.message, 500); }
});

// ── AI Chat (direct Puter AI — free unlimited) ──────────────────────────────
router.post('/api/ai/chat', async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth.error) return error(auth.error, auth.status);

  try {
    const { message, context = 'general', conversationId } = await request.json();
    if (!message) return error('Message required');

    const systemPrompts = {
      general: 'You are a helpful assistant for GRUDGE Warlords, a fantasy crafting and progression game.',
      command: 'You are GRUDGE Command AI. You can generate sprites, manage game data, and control Puter workers. Respond with clear, actionable commands.',
      npc: 'You are an NPC in GRUDGE Warlords. Stay in character as a medieval fantasy character.',
    };

    const response = await me.puter.ai.chat(message, {
      system: systemPrompts[context] || systemPrompts.general,
    });

    if (conversationId) {
      const key = KV.chat(conversationId);
      const history = (await kvGet(key)) || [];
      history.push({ role: 'user', content: message, ts: Date.now() });
      history.push({ role: 'assistant', content: response, ts: Date.now() });
      await kvSet(key, history.slice(-20));
    }

    return json({ response, context, user: auth.session.username });
  } catch (e) { return error('AI chat failed: ' + e.message, 500); }
});

// ── NPC Chat with Memory ─────────────────────────────────────────────────────
router.post('/api/npc/chat', async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth.error) return error(auth.error, auth.status);

  try {
    const { npcId, message } = await request.json();
    if (!npcId || !message) return error('npcId and message required');

    const memory = (await kvGet(KV.npcMem(npcId))) || { conversations: [], facts: [] };

    const personalities = {
      blacksmith: 'You are Grimjaw the Blacksmith. Gruff but kind, loves metalwork. Hints about weapon crafting and Engineer profession.',
      herbalist: 'You are Willowmere the Herbalist. Gentle and wise. Hints about Mystic and Chef professions.',
      merchant: 'You are Goldfinger the Merchant. Shrewd but fair. Hints about trading.',
    };

    const systemPrompt = personalities[npcId] || 'You are an NPC in GRUDGE Warlords. Be helpful and in character.';
    const context = memory.conversations.slice(-5).map(c => `Player: ${c.player}\nYou: ${c.npc}`).join('\n');
    const fullPrompt = context ? `Previous:\n${context}\n\nPlayer: ${message}` : message;

    const response = await me.puter.ai.chat(fullPrompt, { system: systemPrompt });

    memory.conversations.push({ player: message, npc: response, ts: Date.now() });
    await kvSet(KV.npcMem(npcId), { ...memory, conversations: memory.conversations.slice(-20) });

    return json({ npcId, response, hasMemory: memory.conversations.length > 1 });
  } catch (e) { return error('NPC chat failed: ' + e.message, 500); }
});

// ── Game Data ────────────────────────────────────────────────────────────────
router.get('/api/data/game', async () => {
  return json({
    professions: ['Miner', 'Forester', 'Mystic', 'Chef', 'Engineer'],
    classes: ['Warrior', 'Worge', 'Mage', 'Ranger'],
    tiers: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
    recipeCount: 518,
    version: VERSION,
    backend: WARLORDS_API,
  });
});

router.get('/api/data/:dataType', async ({ params }) => {
  const data = await kvGet(KV.data(params.dataType));
  if (!data) {
    // Try fetching from ObjectStore via backend
    try {
      const r = await fetch(`${STUDIO_API}/game-data/${params.dataType}`);
      if (r.ok) return json(await r.json());
    } catch {}
    return error('Data not found', 404);
  }
  return json(data);
});

router.post('/api/data/sync', async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth.error) return error(auth.error, auth.status);
  try {
    const { dataType, data } = await request.json();
    if (!dataType || data === undefined) return error('dataType and data required');
    await kvSet(KV.data(dataType), { data, updatedBy: auth.session.username, updatedAt: Date.now() });
    return json({ success: true, dataType, timestamp: Date.now() });
  } catch (e) { return error(e.message, 500); }
});

// ── Catch-all 404 ────────────────────────────────────────────────────────────
router.get('/*path', async ({ params }) => {
  return json({
    error: 'Endpoint not found',
    path: '/' + (params.path || ''),
    docs: 'GET / for full endpoint list',
  }, 404);
});

console.log(`GRUDGE Studio Worker v${VERSION} initialized — backend: ${WARLORDS_API}`);
