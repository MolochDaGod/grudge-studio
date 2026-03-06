/* ============================================
   GRUDGE STUDIO — Core App
   Auth · Navigation · Dashboard · Health · KV · Launcher
   ============================================ */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  const ADMIN_USERS = ['admin', 'grudgewarlord', 'outapps', 'molochdagod', 'grudachain'];

  const SERVICES = [
    { name: 'Auth Gateway',     url: 'https://auth-gateway-flax.vercel.app', desc: 'Discord & GitHub OAuth' },
    { name: 'ObjectStore',      url: 'https://molochdagod.github.io/ObjectStore/', desc: 'Game asset repository' },
    { name: 'GrudaChain Hub',   url: 'https://grudachain-ve8e8.puter.site', desc: 'Node explorer' },
    { name: 'Admin Dashboard',  url: 'https://grudge-admin.puter.site', desc: 'Admin tools' },
    { name: 'Command Center',   url: 'https://grudge-command-center.puter.site', desc: 'Worker ops' },
  ];

  const LAUNCHER_APPS = [
    { icon: '⚔️',  title: 'Grudge Game Editor', desc: 'Main studio application',     url: 'https://puter.com/app/Grudge-Game-Editor' },
    { icon: '🎮',  title: 'GrudaChain Hub',     desc: 'Blockchain node explorer',     url: 'https://grudachain-ve8e8.puter.site' },
    { icon: '📊',  title: 'Admin Dashboard',    desc: 'Admin management panel',       url: 'https://grudge-admin.puter.site' },
    { icon: '🖥️',  title: 'Command Center',     desc: 'Worker & site management',     url: 'https://grudge-command-center.puter.site' },
    { icon: '🗄️',  title: 'ObjectStore',        desc: 'Sprite & data asset browser',  url: 'https://molochdagod.github.io/ObjectStore/' },
    { icon: '🔐',  title: 'Auth Gateway',       desc: 'Discord / GitHub OAuth',       url: 'https://auth-gateway-flax.vercel.app' },
  ];

  /* ---------- state ---------- */
  let user = null;
  let role = 'viewer';

  /* ---------- DOM refs ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen = $('#loginScreen');
  const loginBtn    = $('#loginBtn');
  const studioShell = $('#studioShell');
  const userBadge   = $('#userBadge');
  const statusDot   = $('#statusDot');
  const statusText  = $('#statusText');

  /* ===========================
     AUTH
     =========================== */
  async function initAuth() {
    try {
      user = await puter.auth.getUser();
      enterStudio();
    } catch {
      loginScreen.classList.remove('hidden');
    }
  }

  loginBtn.addEventListener('click', async () => {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in…';
    try {
      user = await puter.auth.signIn();
      enterStudio();
    } catch (e) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in with Puter';
      console.error('Auth error', e);
    }
  });

  function enterStudio() {
    const uname = (user.username || '').toLowerCase();
    role = ADMIN_USERS.includes(uname) ? 'admin' : 'viewer';

    loginScreen.classList.add('hidden');
    studioShell.classList.remove('hidden');
    userBadge.textContent = user.username || 'User';
    statusDot.style.background = '#10b981';
    statusText.textContent = role === 'admin' ? 'Admin' : 'Viewer';

    logActivity(`${user.username} signed in (${role})`);
    storeSession();
    renderDashboard();
    renderLauncher();
  }

  async function storeSession() {
    try {
      await puter.kv.set('studio_session', JSON.stringify({
        username: user.username,
        role,
        ts: Date.now(),
      }));
    } catch { /* non-critical */ }
  }

  /* ===========================
     NAVIGATION
     =========================== */
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.view;
      $$('.view').forEach(v => v.classList.remove('active'));
      $(`#view-${target}`).classList.add('active');

      if (target === 'editor3d' && window.GrudgeEditor3D) window.GrudgeEditor3D.onShow();
    });
  });

  /* ===========================
     DASHBOARD
     =========================== */
  function renderDashboard() {
    renderStats();
    renderServices();
  }

  async function renderStats() {
    const statsRow = $('#statsRow');
    const stats = [
      { label: 'Services',  num: SERVICES.length, color: 'var(--blue)' },
      { label: 'AI Agents', num: 7,               color: 'var(--green)' },
      { label: 'Role',      num: role,             color: 'var(--yellow)' },
    ];

    /* Try to get KV key count */
    try {
      const keys = await puter.kv.list();
      stats.push({ label: 'KV Keys', num: Array.isArray(keys) ? keys.length : '?', color: 'var(--accent)' });
    } catch {
      stats.push({ label: 'KV Keys', num: '?', color: 'var(--accent)' });
    }

    statsRow.innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-num" style="color:${s.color}">${s.num}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');
  }

  async function renderServices() {
    const grid = $('#servicesGrid');
    grid.innerHTML = SERVICES.map((svc, i) => `
      <div class="svc-card" data-idx="${i}" onclick="window.open('${svc.url}','_blank')">
        <div class="svc-name">${svc.name}</div>
        <div class="svc-desc">${svc.desc}</div>
        <div class="svc-status" id="svc-status-${i}">⏳ checking…</div>
      </div>`).join('');

    SERVICES.forEach(async (svc, i) => {
      const el = $(`#svc-status-${i}`);
      try {
        const resp = await fetch(svc.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        el.innerHTML = '<span style="color:var(--green)">● online</span>';
      } catch {
        el.innerHTML = '<span style="color:var(--danger)">● unreachable</span>';
      }
    });
  }

  /* ===========================
     ACTIVITY LOG
     =========================== */
  const activityItems = [];

  function logActivity(msg) {
    const now = new Date().toLocaleTimeString();
    activityItems.unshift({ msg, time: now });
    if (activityItems.length > 30) activityItems.pop();
    renderActivity();
  }

  function renderActivity() {
    const log = $('#activityLog');
    if (!log) return;
    log.innerHTML = activityItems.map(a => `
      <div class="activity-item">
        <span>${a.msg}</span>
        <span class="muted">${a.time}</span>
      </div>`).join('');
  }

  /* ===========================
     KV STORAGE
     =========================== */
  const kvKey    = $('#kvKey');
  const kvValue  = $('#kvValue');
  const kvResult = $('#kvResult');

  function kvLog(text) { kvResult.textContent = text; }

  $('#kvSetBtn').addEventListener('click', async () => {
    const k = kvKey.value.trim();
    if (!k) return kvLog('⚠ Enter a key');
    let val = kvValue.value;
    try { val = JSON.parse(val); } catch { /* store as string */ }
    try {
      await puter.kv.set(k, val);
      kvLog(`✅ Set "${k}" successfully`);
      logActivity(`KV set: ${k}`);
    } catch (e) { kvLog('❌ ' + e.message); }
  });

  $('#kvGetBtn').addEventListener('click', async () => {
    const k = kvKey.value.trim();
    if (!k) return kvLog('⚠ Enter a key');
    try {
      const v = await puter.kv.get(k);
      kvLog(typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v ?? '(null)'));
    } catch (e) { kvLog('❌ ' + e.message); }
  });

  $('#kvListBtn').addEventListener('click', async () => {
    try {
      const keys = await puter.kv.list();
      if (!Array.isArray(keys) || keys.length === 0) return kvLog('(no keys)');
      const lines = [];
      for (const entry of keys) {
        const k = typeof entry === 'string' ? entry : entry.key;
        lines.push(k);
      }
      kvLog(lines.join('\n'));
    } catch (e) { kvLog('❌ ' + e.message); }
  });

  $('#kvDelBtn').addEventListener('click', async () => {
    const k = kvKey.value.trim();
    if (!k) return kvLog('⚠ Enter a key');
    try {
      await puter.kv.del(k);
      kvLog(`🗑️ Deleted "${k}"`);
      logActivity(`KV del: ${k}`);
    } catch (e) { kvLog('❌ ' + e.message); }
  });

  /* ===========================
     APP LAUNCHER
     =========================== */
  function renderLauncher() {
    const grid = $('#launcherGrid');
    grid.innerHTML = LAUNCHER_APPS.map(app => `
      <a class="launcher-card" href="${app.url}" target="_blank">
        <div class="lc-icon">${app.icon}</div>
        <div class="lc-title">${app.title}</div>
        <div class="lc-desc">${app.desc}</div>
        <div class="lc-url">${app.url}</div>
      </a>`).join('');
  }

  /* ===========================
     EXPOSE & BOOT
     =========================== */
  window.GrudgeStudio = { logActivity, user: () => user, role: () => role };
  initAuth();
})();
