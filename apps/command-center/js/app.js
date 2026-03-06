/**
 * GrudaChain Command Center
 * Autonomous Worker & Resource Management
 *
 * Uses Puter.js v2 SDK for:
 * - puter.kv — key-value storage
 * - puter.ai.chat() — AI assistant
 * - puter.hosting — site management
 * - puter.auth — authentication
 */

// ============================================
// State
// ============================================
const state = {
  connected: false,
  workers: [],
  sites: [],
  apps: [],
  kvKeys: [],
  activityLog: [],
  chatContext: null,
  chatHistory: [],
};

// ============================================
// Live Network Services (no localhost)
// ============================================
const SERVICES = [
  {
    id: 'auth-gateway',
    name: 'Auth Gateway',
    icon: '\u{1F512}',
    url: 'https://auth-gateway-flax.vercel.app',
    healthPath: '/api/health',
    desc: 'Vercel serverless · Login, JWT, wallet linking',
  },
  {
    id: 'objectstore',
    name: 'ObjectStore',
    icon: '\u{1F5C4}\u{FE0F}',
    url: 'https://molochdagod.github.io/ObjectStore',
    healthPath: '/weapons.json',
    desc: 'GitHub Pages · Weapon/armor sprites & data',
  },
  {
    id: 'grudachain-hub',
    name: 'GrudaChain Hub',
    icon: '\u{26D3}\u{FE0F}',
    url: 'https://grudachain-ve8e8.puter.site',
    healthPath: '/',
    desc: 'Puter · Chain explorer & hub UI',
  },
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    icon: '\u{1F4CA}',
    url: 'https://grudge-admin.puter.site',
    healthPath: '/',
    desc: 'Puter · Studio admin & schema docs',
  },
  {
    id: 'command-center',
    name: 'Command Center',
    icon: '\u{1F3AE}',
    url: 'https://grudge-command-center.puter.site',
    healthPath: '/',
    desc: 'Puter \u00b7 This site \u00b7 AI workers & management',
  },
];

// AI Agent definitions (mirrors api-server/lib/ai-autonomous.js)
const AGENTS = {
  code: {
    name: 'Code Agent',
    icon: '\u{1F4BB}',
    category: 'core',
    desc: 'JavaScript, Express, Three.js code generation and review',
    systemPrompt: 'You are the Code Agent for Grudge Warlords MMO. You specialize in JavaScript, Express.js, Three.js, Puter SDK, and game server architecture. The stack uses Node.js with Express for the API server, Vercel serverless for auth-gateway, Neon PostgreSQL, and Puter for hosting/KV/AI. Help write clean, production-ready code.',
  },
  art: {
    name: 'Art Agent',
    icon: '\u{1F3A8}',
    category: 'graphics',
    desc: 'Asset specs, sprite layouts, visual style direction',
    systemPrompt: 'You are the Art Agent for Grudge Warlords MMO - a dark fantasy souls-like game. You help with sprite sheet specs, asset pipelines, ObjectStore organization, visual effects, UI/UX design for the game client. The game uses 2D sprites stored in ObjectStore on GitHub Pages.',
  },
  lore: {
    name: 'Lore Agent',
    icon: '\u{1F4DC}',
    category: 'game',
    desc: 'World-building, faction lore, quest narrative',
    systemPrompt: 'You are the Lore Agent for Grudge Warlords MMO. The game has 3 factions (Crusade, Legion, Fabled), 6 races (Human, Elf, Worge, Troll, Orc, Piglin), 4 classes (Warrior, Mage Priest, Worge, Ranger). Islands include Crusade Island, Fabled Island, and Piglin Outpost. There is a Piglin invasion storyline. Help write lore, dialogue, and world-building content.',
  },
  balance: {
    name: 'Balance Agent',
    icon: '\u{2696}\u{FE0F}',
    category: 'game',
    desc: 'Stat analysis, progression tuning, economy balancing',
    systemPrompt: 'You are the Balance Agent for Grudge Warlords MMO. The game has 4 classes with unique mechanics: Warriors have stamina/sprint/charge, Rangers have parry/counter, Mages have teleport blocks, Worges have 3 forms (Bear/Raptor/Bird). There are 17 weapon types, 6 shield types, 6 armor sets (cloth/leather/metal), 5 harvesting professions. Help balance stats, progression curves, and economy.',
  },
  qa: {
    name: 'QA Agent',
    icon: '\u{1F9EA}',
    category: 'core',
    desc: 'Test planning, bug detection, edge case analysis',
    systemPrompt: 'You are the QA Agent for Grudge Warlords MMO. Help plan tests, identify bugs, find edge cases, and ensure quality across the auth-gateway, API server, game client, and Puter-hosted services. The auth system uses bcryptjs password hashing and JWT tokens stored in auth_tokens table.',
  },
  mission: {
    name: 'Mission Agent',
    icon: '\u{1F5FA}\u{FE0F}',
    category: 'game',
    desc: 'Quest design, mission flow, reward structures',
    systemPrompt: 'You are the Mission Agent for Grudge Warlords MMO. Players spawn in a floating arena, choose race/class, then warp to a starting island with AI missions. Crews of 3-5 members complete harvesting/fighting/sailing/competing events 11 times per day. Design missions, quest chains, and reward structures.',
  },
  director: {
    name: 'Director',
    icon: '\u{1F3AC}',
    category: 'ai',
    desc: 'Coordinates agents, breaks goals into subtasks',
    systemPrompt: 'You are the Director Agent for Grudge Warlords MMO development. You coordinate other AI agents (Code, Art, Lore, Balance, QA, Mission) to accomplish complex goals. Break large tasks into subtasks and suggest which agent should handle each part. The project uses Node.js, Express, Puter SDK, Neon PostgreSQL, Vercel, and GitHub Pages.',
  },
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupModal();
  setupKV();
  setupChat();
  setupWorkerControls();

  // Wait for Puter SDK
  if (typeof puter !== 'undefined') {
    try {
      const user = await puter.auth.getUser();
      if (user) {
        setStatus('connected', 'Connected as ' + user.username);
        state.connected = true;
      } else {
        setStatus('connecting', 'Not signed in');
        promptSignIn();
      }
    } catch {
      setStatus('connecting', 'Puter SDK loaded — authenticating...');
      try {
        await puter.auth.signIn();
        const user = await puter.auth.getUser();
        setStatus('connected', 'Connected as ' + user.username);
        state.connected = true;
      } catch {
        setStatus('error', 'Authentication failed');
      }
    }
  } else {
    setStatus('error', 'Puter SDK not loaded');
  }

  await loadDashboard();
});

function promptSignIn() {
  const dot = document.getElementById('statusDot');
  if (dot) {
    dot.style.cursor = 'pointer';
    dot.onclick = async () => {
      try {
        await puter.auth.signIn();
        const user = await puter.auth.getUser();
        setStatus('connected', 'Connected as ' + user.username);
        state.connected = true;
        await loadDashboard();
      } catch { /* user cancelled */ }
    };
  }
}

// ============================================
// Navigation
// ============================================
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var view = btn.dataset.view;
      document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
      btn.classList.add('active');
      var el = document.getElementById(view);
      if (el) el.classList.add('active');

      if (view === 'dashboard') loadDashboard();
      if (view === 'workers') loadWorkers();
      if (view === 'sites') loadSites();
      if (view === 'apps') loadApps();
      if (view === 'kv') loadKVList();
    });
  });
}

// ============================================
// Status
// ============================================
function setStatus(status, text) {
  var dot = document.getElementById('statusDot');
  var label = document.getElementById('statusText');
  if (label) label.textContent = text;
  if (dot) {
    dot.style.background = status === 'connected' ? '#10b981'
      : status === 'error' ? '#ef4444' : '#f59e0b';
  }
}

function logActivity(message) {
  var timestamp = new Date().toLocaleTimeString();
  state.activityLog.unshift({ message: message, timestamp: timestamp });
  if (state.activityLog.length > 50) state.activityLog.pop();
  renderActivityLog();
}

function renderActivityLog() {
  var el = document.getElementById('activityLog');
  if (!el) return;
  if (state.activityLog.length === 0) {
    el.innerHTML = '<div class="activity-item" style="color:var(--text-secondary)">No activity yet</div>';
    return;
  }
  el.innerHTML = state.activityLog.slice(0, 20).map(function (a) {
    return '<div class="activity-item">' +
      '<span>' + escapeHtml(a.message) + '</span>' +
      '<span style="color:var(--text-secondary);font-size:0.85rem">' + a.timestamp + '</span>' +
      '</div>';
  }).join('');
}

// ============================================
// Dashboard
// ============================================
async function loadDashboard() {
  renderActivityLog();

  // Worker count from KV
  try {
    var workerKeys = await kvListPrefix('worker:');
    document.getElementById('workerCount').textContent = workerKeys.length;
    if (workerKeys.length > 0) logActivity('Loaded ' + workerKeys.length + ' workers from KV');
  } catch {
    setText('workerCount', '\u2014');
  }

  // Site count
  try {
    var sites = await puter.hosting.list();
    state.sites = sites || [];
    setText('siteCount', state.sites.length);
    logActivity('Found ' + state.sites.length + ' Puter sites');
  } catch {
    setText('siteCount', '\u2014');
  }

  // App count
  try {
    var apps = await puter.apps.list();
    state.apps = apps || [];
    setText('appCount', state.apps.length);
  } catch {
    setText('appCount', '\u2014');
  }

  // KV count
  try {
    var keys = await puter.kv.list(true);
    state.kvKeys = keys || [];
    setText('kvCount', state.kvKeys.length);
  } catch {
    setText('kvCount', '\u2014');
  }

  // Network services health
  await checkServices();
}

// ============================================
// Network Service Health Checks
// ============================================
async function checkServices() {
  var grid = document.getElementById('servicesGrid');
  if (!grid) return;

  // Render initial loading state
  grid.innerHTML = SERVICES.map(function (svc) {
    return '<div class="stat-card" id="svc-' + svc.id + '" style="cursor:pointer" onclick="window.open(\'' + svc.url + '\',\'_blank\')">'
      + '<div class="stat-icon">' + svc.icon + '</div>'
      + '<div class="stat-info">'
      + '<h3 style="font-size:0.95rem">' + escapeHtml(svc.name) + '</h3>'
      + '<p style="font-size:0.8rem">' + escapeHtml(svc.desc) + '</p>'
      + '<span class="svc-status" style="font-size:0.75rem;color:#f59e0b">' + '\u{23F3} Checking...' + '</span>'
      + '</div></div>';
  }).join('');

  // Fire health checks in parallel
  SERVICES.forEach(function (svc) {
    var start = Date.now();
    fetch(svc.url + svc.healthPath, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
      .then(function (res) {
        var ms = Date.now() - start;
        // no-cors gives opaque response (status 0) but means network reached the server
        var ok = res.ok || res.type === 'opaque';
        setSvcStatus(svc.id, ok, ms);
        logActivity(svc.name + ': ' + (ok ? '\u2705 online' : '\u274C down') + ' (' + ms + 'ms)');
      })
      .catch(function () {
        var ms = Date.now() - start;
        setSvcStatus(svc.id, false, ms);
        logActivity(svc.name + ': \u274C unreachable');
      });
  });
}

function setSvcStatus(id, online, ms) {
  var card = document.getElementById('svc-' + id);
  if (!card) return;
  var statusEl = card.querySelector('.svc-status');
  if (statusEl) {
    statusEl.style.color = online ? '#10b981' : '#ef4444';
    statusEl.textContent = online
      ? '\u2705 Online (' + ms + 'ms)'
      : '\u274C Unreachable';
  }
  // Subtle border glow
  card.style.borderLeft = '3px solid ' + (online ? '#10b981' : '#ef4444');
}

// ============================================
// Workers
// ============================================
function setupWorkerControls() {
  var btn = document.getElementById('addWorkerBtn');
  if (btn) btn.addEventListener('click', showAddWorkerModal);

  var search = document.getElementById('workerSearch');
  if (search) search.addEventListener('input', loadWorkers);

  var filter = document.getElementById('workerFilter');
  if (filter) filter.addEventListener('change', loadWorkers);
}

async function loadWorkers() {
  var list = document.getElementById('workersList');
  if (!list) return;
  list.innerHTML = '<div style="color:var(--text-secondary)">Loading workers...</div>';

  // Load custom workers from KV
  var customWorkers = [];
  try {
    var keys = await kvListPrefix('worker:');
    for (var i = 0; i < keys.length; i++) {
      try {
        var data = await puter.kv.get(keys[i]);
        var parsed = typeof data === 'string' ? JSON.parse(data) : data;
        parsed.builtIn = false;
        customWorkers.push(parsed);
      } catch { /* skip corrupt */ }
    }
  } catch { /* no workers yet */ }

  // Built-in AI agents
  var builtIn = Object.keys(AGENTS).map(function (type) {
    var agent = AGENTS[type];
    return {
      id: 'agent-' + type,
      name: agent.name,
      type: type,
      category: agent.category,
      description: agent.desc,
      icon: agent.icon,
      builtIn: true,
      status: 'available',
    };
  });

  // Merge: custom workers first, then built-in agents not overridden
  var allWorkers = customWorkers.concat(
    builtIn.filter(function (b) { return !customWorkers.some(function (w) { return w.type === b.type; }); })
  );
  state.workers = allWorkers;

  // Apply filters
  var searchVal = (document.getElementById('workerSearch')?.value || '').toLowerCase();
  var filterVal = document.getElementById('workerFilter')?.value || 'all';

  var filtered = allWorkers.filter(function (w) {
    if (searchVal && (w.name || '').toLowerCase().indexOf(searchVal) === -1
        && (w.description || '').toLowerCase().indexOf(searchVal) === -1) return false;
    if (filterVal !== 'all' && w.category !== filterVal) return false;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div style="color:var(--text-secondary)">No workers match filters</div>';
    return;
  }

  list.innerHTML = filtered.map(function (w) {
    return '<div class="item-card">' +
      '<div class="item-header">' +
        '<span class="item-title">' + (w.icon || '\u2699\uFE0F') + ' ' + escapeHtml(w.name) + '</span>' +
        '<span class="item-badge badge-' + w.category + '">' + w.category + '</span>' +
      '</div>' +
      '<div class="item-path">' + escapeHtml(w.description || '') + '</div>' +
      '<div style="color:var(--text-secondary);font-size:0.85rem">' +
        'Type: ' + w.type + ' \u00B7 Status: ' + (w.status || 'available') +
        (w.builtIn ? ' \u00B7 Built-in AI Agent' : '') +
      '</div>' +
      '<div class="item-actions">' +
        '<button class="btn btn-primary btn-sm" onclick="runWorkerChat(\'' + w.type + '\')">\u{1F4AC} Chat</button>' +
        (!w.builtIn ? '<button class="btn btn-danger btn-sm" onclick="deleteWorker(\'' + escapeHtml(w.id) + '\')">Delete</button>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

function showAddWorkerModal() {
  showModal('Add Custom Worker', [
    { name: 'name', label: 'Worker Name', type: 'text', required: true },
    { name: 'type', label: 'Type ID', type: 'text', required: true, placeholder: 'e.g. my-worker' },
    { name: 'category', label: 'Category', type: 'select', options: ['core', 'ai', 'game', 'graphics', 'server', 'api'] },
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'systemPrompt', label: 'System Prompt', type: 'textarea', placeholder: 'AI system instructions for this worker...' },
  ], async function (data) {
    var worker = {
      id: 'worker-' + Date.now(),
      name: data.name,
      type: data.type,
      category: data.category,
      description: data.description,
      systemPrompt: data.systemPrompt,
      icon: '\u{1F527}',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await puter.kv.set('worker:' + worker.id, JSON.stringify(worker));
    logActivity('Created worker: ' + worker.name);
    loadWorkers();
  });
}

async function deleteWorker(id) {
  if (!confirm('Delete this worker?')) return;
  try {
    await puter.kv.del('worker:' + id);
    logActivity('Deleted worker: ' + id);
    loadWorkers();
  } catch (e) {
    alert('Delete failed: ' + e.message);
  }
}

function runWorkerChat(agentType) {
  // Switch to chat view
  document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  var chatNav = document.querySelector('[data-view="chat"]');
  if (chatNav) chatNav.classList.add('active');
  var chatView = document.getElementById('chat');
  if (chatView) chatView.classList.add('active');

  // Set context and greet
  state.chatContext = agentType;
  var agent = AGENTS[agentType];
  if (agent) {
    addChatMessage('assistant', agent.icon + ' ' + agent.name + ' active. ' + agent.desc + '\n\nAsk me anything.');
  }
}

// ============================================
// Sites
// ============================================
async function loadSites() {
  var list = document.getElementById('sitesList');
  if (!list) return;
  list.innerHTML = '<div style="color:var(--text-secondary)">Loading sites...</div>';

  try {
    var sites = await puter.hosting.list();
    state.sites = sites || [];

    if (state.sites.length === 0) {
      list.innerHTML = '<div style="color:var(--text-secondary)">No sites deployed</div>';
      return;
    }

    list.innerHTML = state.sites.map(function (s) {
      var domain = s.subdomain || s.name || 'Unnamed';
      var url = s.subdomain ? s.subdomain + '.puter.site' : '';
      return '<div class="item-card">' +
        '<div class="item-header">' +
          '<span class="item-title">\u{1F310} ' + escapeHtml(domain) + '</span>' +
          '<span class="item-badge badge-server">site</span>' +
        '</div>' +
        '<div class="item-path">' + escapeHtml(url) + '</div>' +
        '<div class="item-actions">' +
          (url ? '<a href="https://' + url + '" target="_blank" class="btn btn-primary btn-sm">\u{1F517} Visit</a>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    logActivity('Loaded ' + state.sites.length + ' sites');
  } catch (e) {
    list.innerHTML = '<div style="color:var(--danger-color)">Failed to load sites: ' + escapeHtml(e.message) + '</div>';
  }
}

// ============================================
// Apps
// ============================================
async function loadApps() {
  var list = document.getElementById('appsList');
  if (!list) return;
  list.innerHTML = '<div style="color:var(--text-secondary)">Loading apps...</div>';

  try {
    var apps = await puter.apps.list();
    state.apps = apps || [];

    if (state.apps.length === 0) {
      list.innerHTML = '<div style="color:var(--text-secondary)">No apps registered</div>';
      return;
    }

    list.innerHTML = state.apps.map(function (a) {
      return '<div class="item-card">' +
        '<div class="item-header">' +
          '<span class="item-title">\u{1F4F1} ' + escapeHtml(a.title || a.name || 'Unnamed') + '</span>' +
          '<span class="item-badge badge-core">app</span>' +
        '</div>' +
        '<div class="item-path">' + escapeHtml(a.description || '') + '</div>' +
        (a.uid ? '<div style="color:var(--text-secondary);font-size:0.85rem">UID: ' + escapeHtml(a.uid) + '</div>' : '') +
      '</div>';
    }).join('');

    logActivity('Loaded ' + state.apps.length + ' apps');
  } catch (e) {
    list.innerHTML = '<div style="color:var(--danger-color)">Failed to load apps: ' + escapeHtml(e.message) + '</div>';
  }
}

// ============================================
// KV Storage
// ============================================
function setupKV() {
  var setBtn = document.getElementById('kvSetBtn');
  var getBtn = document.getElementById('kvGetBtn');
  if (setBtn) setBtn.addEventListener('click', kvSetValue);
  if (getBtn) getBtn.addEventListener('click', kvGetValue);
}

async function kvSetValue() {
  var keyEl = document.getElementById('kvKey');
  var valEl = document.getElementById('kvValue');
  var result = document.getElementById('kvResult');
  if (!keyEl || !result) return;

  var key = keyEl.value.trim();
  var value = valEl ? valEl.value.trim() : '';

  if (!key) { result.textContent = 'Error: Key is required'; return; }

  try {
    var parsed;
    try { parsed = JSON.parse(value); } catch { parsed = value; }
    await puter.kv.set(key, typeof parsed === 'object' ? JSON.stringify(parsed) : parsed);
    result.textContent = '\u2705 Set "' + key + '" successfully';
    logActivity('KV set: ' + key);
  } catch (e) {
    result.textContent = '\u274C Error: ' + e.message;
  }
}

async function kvGetValue() {
  var keyEl = document.getElementById('kvKey');
  var result = document.getElementById('kvResult');
  if (!keyEl || !result) return;

  var key = keyEl.value.trim();
  if (!key) { result.textContent = 'Error: Key is required'; return; }

  try {
    var value = await puter.kv.get(key);
    if (value === null || value === undefined) {
      result.textContent = 'Key "' + key + '" not found';
    } else {
      try {
        result.textContent = JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        result.textContent = String(value);
      }
    }
    logActivity('KV get: ' + key);
  } catch (e) {
    result.textContent = '\u274C Error: ' + e.message;
  }
}

async function loadKVList() {
  var result = document.getElementById('kvResult');
  if (!result) return;

  try {
    var keys = await puter.kv.list(true);
    state.kvKeys = keys || [];
    if (keys.length === 0) {
      result.textContent = 'No KV entries found';
    } else {
      var keyNames = keys.map(function (k) { return typeof k === 'object' ? k.key : k; });
      result.textContent = keys.length + ' keys:\n\n' + keyNames.join('\n');
    }
  } catch (e) {
    result.textContent = 'Failed to list keys: ' + e.message;
  }
}

// ============================================
// AI Chat
// ============================================
function setupChat() {
  var sendBtn = document.getElementById('chatSendBtn');
  var input = document.getElementById('chatInput');

  if (sendBtn) sendBtn.addEventListener('click', sendChat);
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });
  }

  // Greeting
  addChatMessage('assistant',
    '\u{1F3AE} GrudaChain AI Assistant\n\n' +
    'Available agents: Code, Art, Lore, Balance, QA, Mission, Director\n' +
    'Switch agents from the Workers tab, or ask me anything.\n\n' +
    'Current context: Director (general coordination)'
  );
}

async function sendChat() {
  var input = document.getElementById('chatInput');
  if (!input) return;
  var message = input.value.trim();
  if (!message) return;

  addChatMessage('user', message);
  input.value = '';

  // Determine agent context
  var agentType = state.chatContext || 'director';
  var agent = AGENTS[agentType];

  // Check for agent switch commands
  var switchMatch = message.match(/^\/agent\s+(\w+)/i);
  if (switchMatch) {
    var target = switchMatch[1].toLowerCase();
    if (AGENTS[target]) {
      state.chatContext = target;
      addChatMessage('assistant', AGENTS[target].icon + ' Switched to ' + AGENTS[target].name + '. ' + AGENTS[target].desc);
      return;
    } else {
      addChatMessage('assistant', 'Unknown agent: ' + target + '. Available: ' + Object.keys(AGENTS).join(', '));
      return;
    }
  }

  // Check for pipeline command
  if (message.startsWith('/pipeline ')) {
    await runPipeline(message.slice(10));
    return;
  }

  // Check for help command
  if (message === '/help') {
    addChatMessage('assistant',
      'Commands:\n' +
      '/agent <name> — Switch agent (code, art, lore, balance, qa, mission, director)\n' +
      '/pipeline <goal> — Director breaks goal into agent subtasks\n' +
      '/agents — List all agents\n' +
      '/help — This message'
    );
    return;
  }

  if (message === '/agents') {
    var agentList = Object.keys(AGENTS).map(function (k) {
      return AGENTS[k].icon + ' ' + k + ' — ' + AGENTS[k].desc;
    }).join('\n');
    addChatMessage('assistant', 'Available agents:\n\n' + agentList);
    return;
  }

  // Build system prompt
  var systemPrompt = agent ? agent.systemPrompt : AGENTS.director.systemPrompt;

  // Add thinking indicator
  var thinkingId = addChatMessage('assistant', '\u{1F4AD} Thinking...');

  try {
    var response = await puter.ai.chat(message, { systemPrompt: systemPrompt });
    var text;
    if (typeof response === 'string') {
      text = response;
    } else if (response && response.message && response.message.content) {
      text = response.message.content;
    } else if (response && response.text) {
      text = response.text;
    } else {
      text = String(response || 'No response');
    }

    // Replace thinking message
    updateChatMessage(thinkingId, 'assistant', (agent ? agent.icon + ' ' : '') + text);
    logActivity('AI chat (' + agentType + '): ' + message.slice(0, 40));
  } catch (e) {
    updateChatMessage(thinkingId, 'assistant', '\u274C AI Error: ' + e.message + '\n\nMake sure you are signed into Puter.');
  }
}

async function runPipeline(goal) {
  addChatMessage('assistant', '\u{1F3AC} Director: Breaking down goal into agent subtasks...\n"' + goal + '"');

  var directorPrompt = AGENTS.director.systemPrompt +
    '\n\nBreak this goal into specific subtasks. For each subtask, specify which agent should handle it (code, art, lore, balance, qa, mission). Format as:\n[agent] task description';

  try {
    var response = await puter.ai.chat(goal, { systemPrompt: directorPrompt });
    var text = typeof response === 'string' ? response
      : (response && response.message && response.message.content) || String(response);
    addChatMessage('assistant', '\u{1F3AC} Pipeline Plan:\n\n' + text);
    logActivity('Pipeline: ' + goal.slice(0, 40));
  } catch (e) {
    addChatMessage('assistant', '\u274C Pipeline error: ' + e.message);
  }
}

function addChatMessage(role, content) {
  var container = document.getElementById('chatMessages');
  if (!container) return null;

  var id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  var div = document.createElement('div');
  div.className = 'chat-message ' + role;
  div.id = id;
  div.style.whiteSpace = 'pre-wrap';
  div.textContent = content;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function updateChatMessage(id, role, content) {
  var el = document.getElementById(id);
  if (el) {
    el.className = 'chat-message ' + role;
    el.textContent = content;
    var container = document.getElementById('chatMessages');
    if (container) container.scrollTop = container.scrollHeight;
  }
}

// ============================================
// Modal
// ============================================
function setupModal() {
  var modal = document.getElementById('modal');
  if (!modal) return;

  var closeBtn = modal.querySelector('.modal-close');
  var cancelBtn = modal.querySelector('.modal-cancel');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
}

function showModal(title, fields, onSubmit) {
  var modal = document.getElementById('modal');
  if (!modal) return;

  var titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.textContent = title;

  var fieldsContainer = document.getElementById('modalFields');
  if (!fieldsContainer) return;

  fieldsContainer.innerHTML = fields.map(function (f) {
    if (f.type === 'textarea') {
      return '<label style="color:var(--text-secondary)">' + escapeHtml(f.label) + '</label>' +
        '<textarea name="' + f.name + '" class="textarea" placeholder="' + escapeHtml(f.placeholder || '') + '"' +
        (f.required ? ' required' : '') + '></textarea>';
    }
    if (f.type === 'select') {
      return '<label style="color:var(--text-secondary)">' + escapeHtml(f.label) + '</label>' +
        '<select name="' + f.name + '" class="filter-select">' +
        f.options.map(function (o) { return '<option value="' + o + '">' + o + '</option>'; }).join('') +
        '</select>';
    }
    return '<label style="color:var(--text-secondary)">' + escapeHtml(f.label) + '</label>' +
      '<input type="' + (f.type || 'text') + '" name="' + f.name + '" class="input"' +
      ' placeholder="' + escapeHtml(f.placeholder || '') + '"' +
      (f.required ? ' required' : '') + '>';
  }).join('');

  var form = document.getElementById('modalForm');
  if (form) {
    form.onsubmit = async function (e) {
      e.preventDefault();
      var data = {};
      fields.forEach(function (f) {
        var el = form.querySelector('[name="' + f.name + '"]');
        data[f.name] = el ? el.value : '';
      });
      await onSubmit(data);
      closeModal();
    };
  }

  modal.classList.add('active');
}

function closeModal() {
  var modal = document.getElementById('modal');
  if (modal) modal.classList.remove('active');
}

// ============================================
// Helpers
// ============================================
async function kvListPrefix(prefix) {
  try {
    var keys = await puter.kv.list(true);
    if (!keys) return [];
    return keys
      .map(function (k) { return typeof k === 'object' ? k.key : k; })
      .filter(function (k) { return k.startsWith(prefix); });
  } catch {
    return [];
  }
}

function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
