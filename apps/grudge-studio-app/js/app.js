/* ============================================
   GRUDGE STUDIO — Core App
   Auth · Navigation · Dashboard · Health · KV · Launcher
   ============================================ */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  const ADMIN_USERS = ['admin', 'grudgewarlord', 'outapps', 'molochdagod', 'grudachain', 'racalvindapirateking'];

  const SERVICES = [
    { name: 'Auth Gateway',     url: 'https://auth-gateway-flax.vercel.app', desc: 'Discord & GitHub OAuth' },
    { name: 'ObjectStore',      url: 'https://molochdagod.github.io/ObjectStore/', desc: 'Game asset repository' },
    { name: 'GrudaChain Hub',   url: 'https://grudachain-ve8e8.puter.site', desc: 'Node explorer' },
    { name: 'Admin Dashboard',  url: 'https://grudge-admin.puter.site', desc: 'Admin tools' },
    { name: 'Command Center',   url: 'https://grudge-command-center.puter.site', desc: 'Worker ops' },
  ];

  const LAUNCHER_APPS = [
    { icon: '⚔️',  title: 'Grudge Game Editor', desc: 'Main studio application',     url: 'https://puter.com/app/Grudge-Game-Editor' },
    { icon: '🛠️',  title: 'Warlord Crafting',  desc: 'Crafting Suite (live)',         url: 'https://grudge-crafting.puter.site' },
    { icon: '🎮',  title: 'GrudaChain Hub',     desc: 'Blockchain node explorer',     url: 'https://grudachain-ve8e8.puter.site' },
    { icon: '📊',  title: 'Admin Dashboard',    desc: 'Admin management panel',       url: 'https://grudge-admin.puter.site' },
    { icon: '🖥️',  title: 'Command Center',     desc: 'Worker & site management',     url: 'https://grudge-command-center.puter.site' },
    { icon: '🗄️',  title: 'ObjectStore',        desc: 'Sprite & data asset browser',  url: 'https://molochdagod.github.io/ObjectStore/' },
    { icon: '🔐',  title: 'Auth Gateway',       desc: 'Discord / GitHub OAuth',       url: 'https://auth-gateway-flax.vercel.app' },
    { icon: '🌐',  title: 'Grudge Warlords',    desc: 'Game portal & MMO hub',        url: 'https://grudgewarlords.com' },
  ];

  const API_BASE = 'https://grudgewarlords.com';

  /* ---------- state ---------- */
  let user = null;
  let role = 'viewer';
  let account = null; // unified KV account

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
     AUTH (Puter + GrudgeAuth dual login)
     =========================== */
  async function initAuth() {
    // Check GrudgeAuth SDK session first
    if (window.GrudgeAuth && GrudgeAuth.isLoggedIn()) {
      const ud = GrudgeAuth.getUserData();
      if (ud) {
        user = { username: ud.username || 'Player', uuid: ud.userId || ud.grudgeId };
        enterStudio();
        return;
      }
    }
    // Then try Puter
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

  // Grudge ID login — redirect to auth-gateway
  const grudgeLoginBtn = $('#grudgeLoginBtn');
  if (grudgeLoginBtn) {
    grudgeLoginBtn.addEventListener('click', () => {
      if (window.GrudgeAuth) {
        GrudgeAuth.redirectToLogin(window.location.href);
      } else {
        window.location.href = 'https://auth-gateway-flax.vercel.app?return=' + encodeURIComponent(window.location.href);
      }
    });
  }

  // Guest login
  const guestBtn = $('#guestBtn');
  if (guestBtn) {
    guestBtn.addEventListener('click', async () => {
      guestBtn.disabled = true;
      guestBtn.textContent = 'Entering…';
      try {
        if (window.GrudgeAuth) {
          await GrudgeAuth.guestLogin();
          const ud = GrudgeAuth.getUserData();
          user = { username: ud?.username || 'Guest', uuid: ud?.userId || 'guest' };
        } else {
          user = { username: 'Guest_' + Math.random().toString(36).slice(2,6), uuid: 'guest_' + Date.now() };
        }
        enterStudio();
      } catch (e) {
        guestBtn.disabled = false;
        guestBtn.textContent = 'Play as Guest';
        console.error('Guest login error', e);
      }
    });
  }

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
    initAccount();
    renderDashboard();
    renderLauncher();
  }

  /* ===========================
     UNIFIED ACCOUNT INIT
     =========================== */
  async function initAccount() {
    try {
      const puterId = user.uuid || user.username;
      // Init account in Puter KV
      await puter.kv.set(`grudge:account:${puterId}`, JSON.stringify({
        puterId,
        puterUsername: user.username,
        discordId: null,
        discordUsername: null,
        grudgeId: null,
        walletAddress: null,
        linkedCharacterIds: [],
        createdAt: Date.now(),
        lastSeenAt: Date.now(),
      }));

      // Also try to fetch existing to preserve linked data
      try {
        const existing = await puter.kv.get(`grudge:account:${puterId}`);
        if (existing) {
          const data = typeof existing === 'string' ? JSON.parse(existing) : existing;
          if (data.puterId) {
            account = { ...data, lastSeenAt: Date.now(), puterUsername: user.username };
            await puter.kv.set(`grudge:account:${puterId}`, JSON.stringify(account));
          } else {
            account = { puterId, puterUsername: user.username, lastSeenAt: Date.now() };
          }
        }
      } catch { /* use fresh account */ }

      if (!account) account = { puterId, puterUsername: user.username };

      // Also init via server for cross-service linking
      try {
        await fetch(`${API_BASE}/api/studio/account/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puterId, puterUsername: user.username }),
        });
      } catch { /* server may be offline */ }

      logActivity('Account initialized');
    } catch (err) {
      console.warn('Account init failed:', err);
    }
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
    renderAccountCard();
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

    /* Discord link status */
    const discordUser = localStorage.getItem('grudge_studio_user');
    if (discordUser) {
      try {
        const du = JSON.parse(discordUser);
        stats.push({ label: 'Discord', num: du.username || 'Linked', color: 'hsl(235 86% 65%)' });
      } catch { /* ignore */ }
    }

    /* Server health */
    try {
      const resp = await fetch(`${API_BASE}/api/studio/health`);
      const health = await resp.json();
      stats.push({ label: 'Server', num: health.server?.status === 'ok' ? 'Online' : 'Offline', color: health.server?.status === 'ok' ? 'var(--green)' : 'var(--danger)' });
    } catch {
      stats.push({ label: 'Server', num: 'Offline', color: 'var(--danger)' });
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
     ACCOUNT CARD
     =========================== */
  function renderAccountCard() {
    let card = document.getElementById('accountCard');
    if (!card) {
      card = document.createElement('div');
      card.id = 'accountCard';
      card.className = 'account-card';
      const statsRow = $('#statsRow');
      if (statsRow) statsRow.parentNode.insertBefore(card, statsRow);
    }

    const uname = user?.username || 'Unknown';
    const puterId = user?.uuid || user?.username || '—';
    const discordUser = localStorage.getItem('grudge_studio_user');
    let discordName = null;
    try { if (discordUser) discordName = JSON.parse(discordUser)?.username; } catch {}

    const acct = account || {};
    const walletAddr = acct.walletAddress;

    card.innerHTML = `
      <div class="account-card-inner">
        <div class="account-avatar">👤</div>
        <div class="account-info">
          <div class="account-name">${uname}</div>
          <div class="account-id">ID: ${puterId}</div>
          <div class="account-role" style="color:${role === 'admin' ? 'var(--yellow)' : 'var(--green)'}">${role.toUpperCase()}</div>
        </div>
        <div class="account-links">
          <div class="account-link-item">
            <span class="account-link-icon">🔷</span>
            <span>Puter</span>
            <span class="account-link-status linked">✓ Linked</span>
          </div>
          <div class="account-link-item">
            <span class="account-link-icon">💬</span>
            <span>Discord</span>
            ${discordName
              ? `<span class="account-link-status linked">✓ ${discordName}</span>`
              : `<button class="btn btn-secondary btn-xs" onclick="window.location.href='https://auth-gateway-flax.vercel.app/api/discord?return='+encodeURIComponent(location.href)">Link</button>`
            }
          </div>
          <div class="account-link-item">
            <span class="account-link-icon">🔑</span>
            <span>GrudgeAuth</span>
            ${acct.grudgeId
              ? `<span class="account-link-status linked">✓</span>`
              : `<button class="btn btn-secondary btn-xs" onclick="window.location.href='https://auth-gateway-flax.vercel.app?return='+encodeURIComponent(location.href)">Link</button>`
            }
          </div>
          <div class="account-link-item">
            <span class="account-link-icon">💎</span>
            <span>Wallet</span>
            ${walletAddr
              ? `<span class="account-link-status linked">✓ ${walletAddr.slice(0,6)}…${walletAddr.slice(-4)}</span>`
              : `<span class="account-link-status">Not linked</span>`
            }
          </div>
        </div>
      </div>
    `;
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
     APP LAUNCHER (via Registry)
     =========================== */
  function renderLauncher() {
    // Delegate to the full registry if loaded
    if (window.GrudgeRegistry) {
      window.GrudgeRegistry.render();
    } else {
      const grid = $('#launcherGrid');
      grid.innerHTML = '<div class="muted">Loading app registry…</div>';
    }
  }

  /* ===========================
     EXPOSE & BOOT
     =========================== */
  window.GrudgeStudio = { logActivity, user: () => user, role: () => role, account: () => account };
  initAuth();
})();
