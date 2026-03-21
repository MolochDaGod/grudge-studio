/**
 * GRUDGE Warlords - Puter Worker Server
 * 
 * Deployed on Puter as the backend API for GRUDGE Warlords
 * Works with both Puter-hosted frontend and Replit deployment
 * 
 * Puter Worker Runtime Globals:
 * - `router` - Express-like router for defining endpoints
 * - `me` - Developer context with `me.puter` for KV, FS, AI
 * - `user` - User context when authenticated (optional)
 * - `Response` - Fetch API Response constructor
 * 
 * @runtime Puter Worker
 * @version 3.0.0
 */

/* global router, me, user, Response, crypto, console */

const APP_CONFIG = {
  VERSION: '3.0.0',
  
  ADMIN_PUTER_ACCOUNT: 'GRUDACHAIN',
  
  ADMIN_USERNAMES: ['admin', 'grudgewarlord', 'outapps', 'grudachain'],
  DEVELOPER_USERNAMES: ['dev', 'developer'],
  
  AUTH_APP_ID: 'app-78a6cac4-afb0-45a2-8074-90d687b41770',
  SERVER_APP_ID: 'app-f9ad7ff9-1a2e-4bb0-a20a-8db9db03a620',
  CLOUD_APP_ID: 'app-72f20857-03d2-4551-b6fd-7bf1f90a2cf0',
  
  REPLIT_DEPLOYMENT: 'https://api.grudge-studio.com',
  
  SESSION_PREFIX: 'grudge_session_',
  JOB_PREFIX: 'grudge_job_',
  NPC_PREFIX: 'grudge_npc_',
  DATA_PREFIX: 'grudge_data_',
  USER_PREFIX: 'grudge_user_',
  
  ASSET_DIR: '/grudge-warlords/assets',
  SPRITES_DIR: '/grudge-warlords/assets/sprites',
  
  ROLES: {
    ADMIN: ['admin', 'developer'],
    PREMIUM: ['admin', 'developer', 'premium'],
    USER: ['admin', 'developer', 'premium', 'user'],
    ALL: ['admin', 'developer', 'premium', 'user', 'guest']
  },
  
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000
};

function determineRole(username, isPuterUser = false) {
  const lower = username.toLowerCase();
  
  if (APP_CONFIG.ADMIN_USERNAMES.includes(lower)) return 'admin';
  if (APP_CONFIG.DEVELOPER_USERNAMES.includes(lower)) return 'developer';
  if (isPuterUser) return 'premium';
  return 'user';
}

function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createSession(userId, username, role, puterUuid = null) {
  const code = generateSessionCode();
  const session = {
    code,
    userId,
    username,
    role,
    puterUuid,
    isPuterUser: !!puterUuid,
    createdAt: Date.now(),
    expiresAt: Date.now() + APP_CONFIG.SESSION_DURATION,
    lastActive: Date.now()
  };
  
  await me.puter.kv.set(APP_CONFIG.SESSION_PREFIX + code, JSON.stringify(session));
  
  console.log(`[Auth] Session created for ${username} (${role})`);
  return session;
}

async function verifySession(code) {
  if (!code) return null;
  
  try {
    const data = await me.puter.kv.get(APP_CONFIG.SESSION_PREFIX + code);
    if (!data) return null;
    
    const session = JSON.parse(data);
    
    if (session.expiresAt < Date.now()) {
      await me.puter.kv.del(APP_CONFIG.SESSION_PREFIX + code);
      console.log(`[Auth] Session expired for ${session.username}`);
      return null;
    }
    
    session.lastActive = Date.now();
    await me.puter.kv.set(APP_CONFIG.SESSION_PREFIX + code, JSON.stringify(session));
    
    return session;
  } catch (e) {
    console.error('[Auth] Session verification error:', e);
    return null;
  }
}

function getAuthCode(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const url = new URL(request.url);
  return url.searchParams.get('auth_code') || url.searchParams.get('token');
}

async function requireAuth(request) {
  const code = getAuthCode(request);
  
  if (!code) {
    return { error: 'Authorization required', status: 401 };
  }
  
  const session = await verifySession(code);
  if (!session) {
    return { error: 'Invalid or expired session', status: 401 };
  }
  
  return { session, code };
}

async function requireRole(request, allowedRoles) {
  const auth = await requireAuth(request);
  if (auth.error) return auth;
  
  if (!allowedRoles.includes(auth.session.role)) {
    return { error: 'Insufficient permissions', status: 403 };
  }
  
  return auth;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message, success: false }, status);
}

router.options("/*", async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

router.get("/api/health", async () => {
  let kvStatus = 'unknown';
  let aiStatus = 'unknown';
  
  try {
    await me.puter.kv.set('_health_check', Date.now().toString());
    await me.puter.kv.del('_health_check');
    kvStatus = 'operational';
  } catch (e) {
    kvStatus = 'error: ' + e.message;
  }
  
  try {
    aiStatus = 'available';
  } catch (e) {
    aiStatus = 'error: ' + e.message;
  }
  
  return jsonResponse({
    status: 'healthy',
    app: 'grudge-server',
    version: APP_CONFIG.VERSION,
    adminAccount: APP_CONFIG.ADMIN_PUTER_ACCOUNT,
    replitDeployment: APP_CONFIG.REPLIT_DEPLOYMENT,
    timestamp: new Date().toISOString(),
    services: { kv: kvStatus, ai: aiStatus }
  });
});

router.post("/api/auth/puter", async ({ request }) => {
  try {
    const body = await request.json();
    const { puterUuid, username, email } = body;
    
    if (!puterUuid || !username) {
      return errorResponse('puterUuid and username required', 400);
    }
    
    const role = determineRole(username, true);
    
    const isAdminAccount = username.toUpperCase() === APP_CONFIG.ADMIN_PUTER_ACCOUNT;
    const finalRole = isAdminAccount ? 'admin' : role;
    
    const session = await createSession(puterUuid, username, finalRole, puterUuid);
    
    const userKey = APP_CONFIG.USER_PREFIX + puterUuid;
    const existingUser = await me.puter.kv.get(userKey);
    const userData = existingUser ? JSON.parse(existingUser) : {
      id: puterUuid,
      username,
      email,
      role: finalRole,
      isPuterUser: true,
      createdAt: Date.now()
    };
    userData.lastLogin = Date.now();
    userData.role = finalRole;
    await me.puter.kv.set(userKey, JSON.stringify(userData));
    
    return jsonResponse({
      success: true,
      authCode: session.code,
      user: {
        id: puterUuid,
        username,
        role: finalRole,
        isPuterUser: true,
        isAdmin: finalRole === 'admin'
      },
      expiresAt: session.expiresAt
    });
  } catch (e) {
    console.error('[Auth] Puter auth error:', e);
    return errorResponse('Puter authentication failed: ' + e.message, 500);
  }
});

router.post("/api/auth/login", async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return errorResponse('Username and password required', 400);
    }
    
    const usersData = await me.puter.kv.get('grudge_users_db');
    const users = usersData ? JSON.parse(usersData) : [];
    
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      return errorResponse('Account not found', 401);
    }
    
    const inputHash = simpleHash(password);
    if (user.passwordHash !== inputHash) {
      return errorResponse('Incorrect password', 401);
    }
    
    const role = determineRole(username, false);
    const session = await createSession(user.id, username, role);
    
    return jsonResponse({
      success: true,
      authCode: session.code,
      user: {
        id: user.id,
        username: user.username,
        role,
        isPuterUser: false,
        isAdmin: role === 'admin'
      },
      expiresAt: session.expiresAt
    });
  } catch (e) {
    console.error('[Auth] Login error:', e);
    return errorResponse('Login failed: ' + e.message, 500);
  }
});

router.post("/api/auth/register", async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return errorResponse('Username and password required', 400);
    }
    
    if (username.length < 3 || username.length > 20) {
      return errorResponse('Username must be 3-20 characters', 400);
    }
    
    if (password.length < 4) {
      return errorResponse('Password must be at least 4 characters', 400);
    }
    
    const usersData = await me.puter.kv.get('grudge_users_db');
    const users = usersData ? JSON.parse(usersData) : [];
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return errorResponse('Username already exists', 400);
    }
    
    const userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const newUser = {
      id: userId,
      username,
      passwordHash: simpleHash(password),
      role: determineRole(username, false),
      createdAt: Date.now(),
      lastLogin: Date.now()
    };
    
    users.push(newUser);
    await me.puter.kv.set('grudge_users_db', JSON.stringify(users));
    
    const session = await createSession(userId, username, newUser.role);
    
    return jsonResponse({
      success: true,
      authCode: session.code,
      user: {
        id: userId,
        username,
        role: newUser.role,
        isPuterUser: false,
        isAdmin: newUser.role === 'admin'
      },
      expiresAt: session.expiresAt
    });
  } catch (e) {
    console.error('[Auth] Register error:', e);
    return errorResponse('Registration failed: ' + e.message, 500);
  }
});

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

router.get("/api/auth/verify", async ({ request }) => {
  const auth = await requireAuth(request);
  
  if (auth.error) {
    return jsonResponse({ valid: false, error: auth.error }, auth.status);
  }
  
  return jsonResponse({
    valid: true,
    user: {
      id: auth.session.userId,
      username: auth.session.username,
      role: auth.session.role,
      isPuterUser: auth.session.isPuterUser,
      isAdmin: auth.session.role === 'admin'
    }
  });
});

router.post("/api/auth/logout", async ({ request }) => {
  const code = getAuthCode(request);
  
  if (code) {
    try {
      await me.puter.kv.del(APP_CONFIG.SESSION_PREFIX + code);
    } catch (e) {
      console.error('[Auth] Logout error:', e);
    }
  }
  
  return jsonResponse({ success: true, message: 'Logged out' });
});

router.post("/api/ai/chat", async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  
  try {
    const body = await request.json();
    const { message, context = 'general', conversationId, npcId } = body;
    
    if (!message) {
      return errorResponse('Message required', 400);
    }
    
    const systemPrompts = {
      general: `You are a helpful assistant for GRUDGE Warlords, a fantasy crafting and progression game.
        You help players understand crafting, professions (Miner, Forester, Mystic, Chef, Engineer), 
        classes (Warrior, Worg, Mage, Ranger), and game mechanics. Be concise and helpful.`,
      
      command: `You are GRUDGE Command AI, the intelligent control system for GRUDGE Warlords.
        You can help with:
        - Generating sprites using AI (describe what you want)
        - Managing game data and assets
        - Analyzing images and assets
        - Controlling game systems
        Respond with clear, actionable guidance.`,
      
      npc: `You are an NPC in GRUDGE Warlords. Stay in character as a medieval fantasy character.
        Be immersive and provide helpful hints about the game world, crafting, and progression.`,
      
      admin: `You are the GRUDGE Admin AI assistant. You help administrators manage:
        - Game balance and economy
        - User accounts and permissions
        - Asset management and sprite generation
        - Data synchronization between systems
        Be professional and thorough.`
    };
    
    let systemPrompt = systemPrompts[context] || systemPrompts.general;
    
    if (npcId) {
      const npcPersonalities = {
        blacksmith: `You are Grimjaw the Blacksmith. Gruff but kind, you love metalwork and give hints about weapon crafting.`,
        herbalist: `You are Willowmere the Herbalist. Gentle and wise, you know about potions and the Mystic/Chef professions.`,
        merchant: `You are Goldfinger the Merchant. Shrewd but fair, you give hints about trading and the Shop system.`,
        miner: `You are Stonefist the Miner. Hardy and practical, you know about ore, gems, and the Miner profession.`,
        forester: `You are Oakshade the Forester. Patient and observant, you know about wood, plants, and the Forester profession.`
      };
      systemPrompt = npcPersonalities[npcId] || systemPrompts.npc;
    }
    
    const response = await me.puter.ai.chat(message, {
      system: systemPrompt
    });
    
    if (conversationId) {
      const historyKey = `grudge_chat_${conversationId}`;
      const existingData = await me.puter.kv.get(historyKey);
      const history = existingData ? JSON.parse(existingData) : [];
      history.push(
        { role: 'user', content: message, timestamp: Date.now() },
        { role: 'assistant', content: response, timestamp: Date.now() }
      );
      await me.puter.kv.set(historyKey, JSON.stringify(history.slice(-30)));
    }
    
    return jsonResponse({ 
      success: true,
      response, 
      context,
      npcId,
      user: auth.session.username 
    });
  } catch (e) {
    console.error('[AI] Chat error:', e);
    return errorResponse('AI chat failed: ' + e.message, 500);
  }
});

router.post("/api/ai/vision", async ({ request }) => {
  const auth = await requireRole(request, APP_CONFIG.ROLES.PREMIUM);
  if (auth.error) return errorResponse(auth.error, auth.status);
  
  try {
    const body = await request.json();
    const { imageUrl, question = 'Describe this image in detail for a game asset.' } = body;
    
    if (!imageUrl) {
      return errorResponse('Image URL required', 400);
    }
    
    const response = await me.puter.ai.chat(question, {
      vision: { url: imageUrl }
    });
    
    return jsonResponse({ 
      success: true,
      analysis: response,
      imageUrl,
      analyzedBy: auth.session.username
    });
  } catch (e) {
    console.error('[AI] Vision error:', e);
    return errorResponse('Vision analysis failed: ' + e.message, 500);
  }
});

router.post("/api/sprites/generate", async ({ request }) => {
  const auth = await requireRole(request, APP_CONFIG.ROLES.ADMIN);
  if (auth.error) return errorResponse(auth.error, auth.status);
  
  try {
    const body = await request.json();
    const { prompt, style = 'pixel-art', size = '64x64', category = 'general' } = body;
    
    if (!prompt) {
      return errorResponse('Prompt required', 400);
    }
    
    const jobId = 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    
    const job = {
      id: jobId,
      type: 'sprite_generation',
      status: 'queued',
      prompt, style, size, category,
      createdBy: auth.session.username,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await me.puter.kv.set(APP_CONFIG.JOB_PREFIX + jobId, JSON.stringify(job));
    
    processSpritejob(jobId, prompt, style, size, category);
    
    return jsonResponse({ 
      success: true,
      jobId, 
      status: 'queued',
      message: 'Sprite generation job created'
    });
  } catch (e) {
    console.error('[Sprites] Generate error:', e);
    return errorResponse('Failed to create sprite job: ' + e.message, 500);
  }
});

async function processSpritejob(jobId, prompt, style, size, category) {
  const jobKey = APP_CONFIG.JOB_PREFIX + jobId;
  
  try {
    await me.puter.kv.set(jobKey, JSON.stringify({
      status: 'processing',
      startedAt: Date.now(),
      updatedAt: Date.now()
    }));
    
    const fullPrompt = `Create a ${size} ${style} game sprite: ${prompt}.
Requirements:
- Transparent background (PNG with alpha channel)
- Hard outlines, no soft shadows
- Crisp, clean edges for pixel art scaling
- Fantasy RPG game style
- Professional game asset quality`;
    
    const result = await me.puter.ai.txt2img(fullPrompt, {
      size: size === '64x64' ? 512 : 1024
    });
    
    const safeName = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const filename = `${category}/${safeName}_${jobId.slice(4, 12)}.png`;
    const fullPath = `${APP_CONFIG.SPRITES_DIR}/${filename}`;
    
    await me.puter.fs.mkdir(`${APP_CONFIG.SPRITES_DIR}/${category}`, { createMissingParents: true });
    await me.puter.fs.write(fullPath, result);
    
    await me.puter.kv.set(jobKey, JSON.stringify({
      status: 'completed',
      result: fullPath,
      filename,
      completedAt: Date.now(),
      updatedAt: Date.now()
    }));
    
    console.log(`[Sprites] Job ${jobId} completed: ${filename}`);
  } catch (error) {
    console.error(`[Sprites] Job ${jobId} failed:`, error);
    await me.puter.kv.set(jobKey, JSON.stringify({
      status: 'failed',
      error: error.message,
      failedAt: Date.now(),
      updatedAt: Date.now()
    }));
  }
}

router.get("/api/jobs/:jobId", async ({ request, params }) => {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  
  try {
    const jobData = await me.puter.kv.get(APP_CONFIG.JOB_PREFIX + params.jobId);
    
    if (!jobData) {
      return errorResponse('Job not found', 404);
    }
    
    return jsonResponse(JSON.parse(jobData));
  } catch (e) {
    return errorResponse('Failed to get job: ' + e.message, 500);
  }
});

router.get("/api/jobs", async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  
  try {
    const keys = await me.puter.kv.list();
    const jobKeys = keys.filter(k => k.startsWith(APP_CONFIG.JOB_PREFIX));
    
    const jobs = [];
    for (const key of jobKeys.slice(-20)) {
      try {
        const data = await me.puter.kv.get(key);
        if (data) jobs.push(JSON.parse(data));
      } catch {}
    }
    
    return jsonResponse({ 
      success: true,
      jobs: jobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    });
  } catch (e) {
    return errorResponse('Failed to list jobs: ' + e.message, 500);
  }
});

router.get("/api/data/game", async () => {
  return jsonResponse({
    professions: ['Miner', 'Forester', 'Mystic', 'Chef', 'Engineer'],
    classes: ['Warrior', 'Worg', 'Mage', 'Ranger'],
    factions: ['Order', 'Chaos', 'Neutral'],
    races: {
      Order: ['Human', 'Elf', 'Dwarf'],
      Chaos: ['Orc', 'Demon', 'Undead'],
      Neutral: ['Beastkin', 'Golem']
    },
    tiers: ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
    recipeCount: 518,
    weaponCount: 96,
    version: APP_CONFIG.VERSION,
    adminAccount: APP_CONFIG.ADMIN_PUTER_ACCOUNT,
    replitDeployment: APP_CONFIG.REPLIT_DEPLOYMENT
  });
});

router.post("/api/data/sync", async ({ request }) => {
  const auth = await requireRole(request, APP_CONFIG.ROLES.ADMIN);
  if (auth.error) return errorResponse(auth.error, auth.status);
  
  try {
    const body = await request.json();
    const { dataType, data } = body;
    
    if (!dataType || data === undefined) {
      return errorResponse('dataType and data required', 400);
    }
    
    const key = APP_CONFIG.DATA_PREFIX + dataType;
    await me.puter.kv.set(key, JSON.stringify({
      data,
      updatedBy: auth.session.username,
      updatedAt: Date.now()
    }));
    
    console.log(`[Data] Synced ${dataType} by ${auth.session.username}`);
    
    return jsonResponse({ 
      success: true, 
      dataType, 
      timestamp: Date.now() 
    });
  } catch (e) {
    return errorResponse('Data sync failed: ' + e.message, 500);
  }
});

router.get("/api/data/:dataType", async ({ params }) => {
  try {
    const key = APP_CONFIG.DATA_PREFIX + params.dataType;
    const data = await me.puter.kv.get(key);
    
    if (!data) {
      return errorResponse('Data not found', 404);
    }
    
    return jsonResponse(JSON.parse(data));
  } catch (e) {
    return errorResponse('Failed to get data: ' + e.message, 500);
  }
});

router.get("/api/admin/users", async ({ request }) => {
  const auth = await requireRole(request, APP_CONFIG.ROLES.ADMIN);
  if (auth.error) return errorResponse(auth.error, auth.status);
  
  try {
    const usersData = await me.puter.kv.get('grudge_users_db');
    const users = usersData ? JSON.parse(usersData) : [];
    
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));
    
    return jsonResponse({ success: true, users: safeUsers });
  } catch (e) {
    return errorResponse('Failed to list users: ' + e.message, 500);
  }
});

router.post("/api/admin/user-role", async ({ request }) => {
  const auth = await requireRole(request, APP_CONFIG.ROLES.ADMIN);
  if (auth.error) return errorResponse(auth.error, auth.status);

  try {
    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return errorResponse("userId and newRole required", 400);
    }

    const validRoles = ["admin", "developer", "premium", "user", "guest"];
    if (!validRoles.includes(newRole)) {
      return errorResponse("Invalid role", 400);
    }

    const usersData = await me.puter.kv.get("grudge_users_db");
    const users = usersData ? JSON.parse(usersData) : [];

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return errorResponse("User not found", 404);
    }

    users[userIndex].role = newRole;
    await me.puter.kv.set("grudge_users_db", JSON.stringify(users));

    console.log(
      `[Admin] Role changed for ${users[userIndex].username}: ${newRole}`
    );

    return jsonResponse({
      success: true,
      userId,
      newRole,
      message: `Role updated to ${newRole}`,
    });
  } catch (e) {
    return errorResponse("Failed to update role: " + e.message, 500);
  }
});

router.get("/api/admin/online", async ({ request }) => {
  const auth = await requireRole(request, APP_CONFIG.ROLES.ADMIN);
  if (auth.error) return errorResponse(auth.error, auth.status);

  try {
    const sessions = [];
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    // Scan all session keys
    const allKeys = await me.puter.kv.list();
    for (const key of allKeys) {
      if (key.startsWith(APP_CONFIG.SESSION_PREFIX)) {
        const sessionData = await me.puter.kv.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.lastActive && session.lastActive > fiveMinutesAgo) {
            sessions.push({
              username: session.username,
              role: session.role,
              lastActive: session.lastActive,
              isPuterUser: session.isPuterUser || false,
            });
          }
        }
      }
    }

    return jsonResponse({
      success: true,
      count: sessions.length,
      players: sessions,
    });
  } catch (e) {
    return errorResponse("Failed to get online players: " + e.message, 500);
  }
});

router.get("/api/admin/kv-stats", async ({ request }) => {
  const auth = await requireRole(request, APP_CONFIG.ROLES.ADMIN);
  if (auth.error) return errorResponse(auth.error, auth.status);

  try {
    const allKeys = await me.puter.kv.list();

    let sessions = 0;
    let users = 0;
    let characters = 0;
    let jobs = 0;

    for (const key of allKeys) {
      if (key.startsWith(APP_CONFIG.SESSION_PREFIX)) sessions++;
      else if (key.startsWith(APP_CONFIG.USER_PREFIX)) users++;
      else if (key.startsWith("grudge_character_")) characters++;
      else if (key.startsWith(APP_CONFIG.JOB_PREFIX)) jobs++;
    }

    return jsonResponse({
      success: true,
      totalKeys: allKeys.length,
      sessions,
      users,
      characters,
      jobs,
      timestamp: Date.now(),
    });
  } catch (e) {
    return errorResponse("Failed to get KV stats: " + e.message, 500);
  }
});

router.get("/", async () => {
  return jsonResponse({
    app: 'GRUDGE Warlords Server',
    version: APP_CONFIG.VERSION,
    status: 'operational',
    adminAccount: APP_CONFIG.ADMIN_PUTER_ACCOUNT,
    replitDeployment: APP_CONFIG.REPLIT_DEPLOYMENT,
    endpoints: [
      'GET  /api/health',
      'POST /api/auth/puter',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET  /api/auth/verify',
      'POST /api/auth/logout',
      'POST /api/ai/chat',
      'POST /api/ai/vision',
      'POST /api/sprites/generate',
      'GET  /api/jobs/:jobId',
      'GET  /api/jobs',
      'GET  /api/data/game',
      'POST /api/data/sync',
      'GET  /api/data/:dataType',
      'GET  /api/admin/users',
      'POST /api/admin/user-role'
    ]
  });
});

router.get("/*page", async ({ params }) => {
  return jsonResponse({
    error: 'Endpoint not found',
    path: '/' + (params.page || ''),
    hint: 'Visit / for available endpoints'
  }, 404);
});

console.log(`GRUDGE Server v${APP_CONFIG.VERSION} initialized`);
console.log(`Admin account: ${APP_CONFIG.ADMIN_PUTER_ACCOUNT}`);
console.log(`Replit deployment: ${APP_CONFIG.REPLIT_DEPLOYMENT}`);
