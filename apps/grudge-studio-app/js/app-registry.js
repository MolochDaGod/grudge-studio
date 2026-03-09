/* ============================================
   GRUDGE STUDIO — App Registry & Site Manager
   Full GRUDACHAIN ecosystem catalog
   ============================================ */
(function () {
  'use strict';

  /* ---------- Complete GRUDACHAIN App Catalog ---------- */
  const APP_CATALOG = [
    // ── Core ──
    { name: 'grudge-studio-app',     title: 'Grudge Studio',       icon: '⚔️',  tag: 'puter', category: 'core', url: 'https://grudge-studio-app.puter.site',         subdomain: 'grudge-studio-app',         cloudPath: '/GRUDACHAIN/sites/grudge-studio-app/deployment' },
    { name: 'grudge-command-center', title: 'Command Center',      icon: '🖥️',  tag: 'puter', category: 'core', url: 'https://grudge-command-center.puter.site',      subdomain: 'grudge-command-center',      cloudPath: null },
    { name: 'grudachain',            title: 'GRUDACHAIN Hub',      icon: '⛓️',  tag: 'puter', category: 'core', url: 'https://grudachain-ve8e8.puter.site',           subdomain: 'grudachain-ve8e8',           cloudPath: null },
    { name: 'grudge-auth',           title: 'GrudgeAuth',          icon: '🔐',  tag: 'puter', category: 'core', url: 'https://grudge-auth.puter.site',                subdomain: 'grudge-auth',               cloudPath: '/GRUDACHAIN/puter-deploy/grudge-auth' },
    { name: 'grudge-apps',           title: 'Apps Portal',         icon: '📱',  tag: 'puter', category: 'core', url: 'https://grudge-apps.puter.site',                subdomain: 'grudge-apps',               cloudPath: '/GRUDACHAIN/puter-deploy/grudge-apps' },
    { name: 'grudge-cloud',          title: 'GrudgeCloud',         icon: '☁️',  tag: 'puter', category: 'core', url: 'https://grudge-cloud.puter.site',               subdomain: 'grudge-cloud',              cloudPath: '/GRUDACHAIN/puter-deploy/grudge-cloud' },
    { name: 'GrudgeStudio',          title: 'Nexus Nemesis',       icon: '🌀',  tag: 'puter', category: 'core', url: 'https://grudgeplatform.puter.site',             subdomain: 'grudgeplatform',            cloudPath: null },

    // ── Games ──
    { name: 'grudge-angler',         title: 'Grudge Angler',       icon: '🎣',  tag: 'puter', category: 'game', url: 'https://puter.com/app/grudge-angler',           subdomain: null, cloudPath: null },
    { name: 'betagamegruda',         title: 'Beta GRUDA',          icon: '🎮',  tag: 'puter', category: 'game', url: 'https://puter.com/app/betagamegruda',           subdomain: null, cloudPath: null },
    { name: 'grudgeRPG',             title: 'Grudge RPG',          icon: '⚔️',  tag: 'puter', category: 'game', url: 'https://puter.com/app/grudgeRPG',               subdomain: null, cloudPath: null },
    { name: 'DiGrudge',              title: 'DiGrudge',            icon: '🃏',  tag: 'puter', category: 'game', url: 'https://puter.com/app/DiGrudge',                subdomain: null, cloudPath: null },
    { name: 'nexus-3',               title: 'Nexus-3',             icon: '🌐',  tag: 'puter', category: 'game', url: 'https://puter.com/app/nexus-3',                 subdomain: null, cloudPath: null },
    { name: 'grudgegruda',           title: 'Grudge GRUDA',        icon: '💎',  tag: 'puter', category: 'game', url: 'https://puter.com/app/grudgegruda',             subdomain: null, cloudPath: null },
    { name: 'islands',               title: 'Islands',             icon: '🏝️',  tag: 'puter', category: 'game', url: 'https://islands-cu83xisb0g.puter.site',         subdomain: 'islands-cu83xisb0g', cloudPath: null },
    { name: 'generated-islands',     title: 'Generated Islands',   icon: '🗺️',  tag: 'puter', category: 'game', url: 'https://generated-islands-9tzkr.puter.site',    subdomain: 'generated-islands-9tzkr', cloudPath: null },
    { name: 'crafting',              title: 'Crafting',            icon: '🔨',  tag: 'puter', category: 'game', url: 'https://crafting-vdz7h.puter.site',             subdomain: 'crafting-vdz7h', cloudPath: null },

    // ── Tools / Editors ──
    { name: 'GrudgeGameEngine',      title: 'Gruda3d Engine',      icon: '🎮',  tag: 'puter', category: 'tool', url: 'https://gruda.puter.site',                      subdomain: 'gruda',                     cloudPath: null },
    { name: 'Grudge-Game-Editor',    title: 'Game Editor',         icon: '🛠️',  tag: 'puter', category: 'tool', url: 'https://colorful-puppy-4769-zilvf.puter.site',  subdomain: 'colorful-puppy-4769-zilvf', cloudPath: null },
    { name: 'grudgegameengine-1',    title: 'GRUDGEGAMEENGINE',    icon: '🔧',  tag: 'puter', category: 'tool', url: 'https://grudgegameengine-1-ln4hp.puter.site',   subdomain: 'grudgegameengine-1-ln4hp',  cloudPath: null },
    { name: 'gge',                   title: 'GGE',                 icon: '⚙️',  tag: 'puter', category: 'tool', url: 'https://gge-bl4d7.puter.site',                  subdomain: 'gge-bl4d7',                 cloudPath: null },
    { name: 'gruda-code',            title: 'GRUDA CODE',          icon: '💻',  tag: 'puter', category: 'tool', url: 'https://gruda-code-4zwtk.puter.site',           subdomain: 'gruda-code-4zwtk',          cloudPath: null },
    { name: 'gruda-search',          title: 'GRUDA-SEARCH',        icon: '🔍',  tag: 'puter', category: 'tool', url: 'https://dev-center.puter.site',                 subdomain: 'dev-center',                cloudPath: null },
    { name: 'meta-build',            title: 'Grudge Crafting',     icon: '🏗️',  tag: 'puter', category: 'tool', url: 'https://grudge-crafting.puter.site',            subdomain: 'grudge-crafting',            cloudPath: null },
    { name: 'Grudge-Studio-RPG-Builder', title: 'RPG Game-Starter', icon: '📐', tag: 'puter', category: 'tool', url: 'https://creative-puppy-9315.puter.site',        subdomain: 'creative-puppy-9315',       cloudPath: null },

    // ── Services ──
    { name: 'grudge-launcher',       title: 'Grudge Launcher',     icon: '🚀',  tag: 'puter',  category: 'service', url: 'https://grudge-launcher-xu9q5.puter.site',  subdomain: 'grudge-launcher-xu9q5', cloudPath: '/GRUDACHAIN/puter-deploy/grudge-launcher' },
    { name: 'grudaailegion',         title: 'GrudaAiLegion',       icon: '🤖',  tag: 'puter',  category: 'service', url: 'https://grudaailegion-s9kqf.puter.site',    subdomain: 'grudaailegion-s9kqf',   cloudPath: null },
    { name: 'grudge-client',         title: 'Grudge Client',       icon: '📡',  tag: 'puter',  category: 'service', url: 'https://grudge-finder.puter.site',           subdomain: 'grudge-finder',         cloudPath: null },
    { name: 'grudge-server',         title: 'Grudge Server',       icon: '🖧',  tag: 'puter',  category: 'service', url: 'https://grudge-server-lwvwd.puter.site',     subdomain: 'grudge-server-lwvwd',   cloudPath: null },
    { name: 'grudgecloud',           title: 'GrudgeCloud App',     icon: '☁️',  tag: 'puter',  category: 'service', url: 'https://grudgecloud-85c9p.puter.site',       subdomain: 'grudgecloud-85c9p',     cloudPath: null },
    { name: 'puter-org-agent',       title: 'Puter Org Agent',     icon: '🏢',  tag: 'puter',  category: 'service', url: 'https://brave-room-6097.puter.site',         subdomain: 'brave-room-6097',       cloudPath: null },
    { name: 'thc-dope-budz',         title: 'THC DOPE BUDZ',       icon: '🌿',  tag: 'puter',  category: 'service', url: 'https://thc-dope-budz-o29wc.puter.site',     subdomain: 'thc-dope-budz-o29wc',   cloudPath: null },
    { name: 'dapp-NFT-Grudge',       title: 'DappNFT',             icon: '🖼️',  tag: 'puter',  category: 'service', url: 'https://dapp-NFT-Grudge-sjnq4.puter.site',   subdomain: 'dapp-NFT-Grudge-sjnq4', cloudPath: null },
    { name: 'tge-billing',           title: 'TGE-Billing',         icon: '💳',  tag: 'puter',  category: 'service', url: 'https://tgebilling.puter.site',               subdomain: 'tgebilling',             cloudPath: null },
    { name: 'AWKA-JZ',               title: 'AKWA Power',          icon: '⚡',  tag: 'puter',  category: 'service', url: 'https://akwa-jz.puter.site',                  subdomain: 'akwa-jz',                cloudPath: null },

    // ── Vercel ──
    { name: 'auth-gateway',          title: 'Auth Gateway API',    icon: '🔑',  tag: 'vercel',  category: 'core',    url: 'https://auth-gateway-flax.vercel.app',    subdomain: null, cloudPath: null },
    { name: 'grudachain-legion',     title: 'GRUDA Legion AI',     icon: '🤖',  tag: 'vercel',  category: 'service', url: 'https://grudachain-rho.vercel.app',       subdomain: null, cloudPath: null },
    { name: 'starway-gruda',         title: 'Starway GRUDA',       icon: '🚀',  tag: 'vercel',  category: 'game',    url: 'https://starwaygruda-webclient-as2n.vercel.app', subdomain: null, cloudPath: null },

    // ── GitHub Pages ──
    { name: 'ObjectStore',           title: 'ObjectStore',         icon: '🗄️',  tag: 'github',  category: 'core',    url: 'https://molochdagod.github.io/ObjectStore/',          subdomain: null, cloudPath: null },
    { name: 'GrudgeStudioNPM',       title: 'Studio Playground',   icon: '🎮',  tag: 'github',  category: 'tool',    url: 'https://molochdagod.github.io/GrudgeStudioNPM/',      subdomain: null, cloudPath: null },

    // ── External ──
    { name: 'grudgewarlords',        title: 'Grudge Warlords',     icon: '🌐',  tag: 'domain',  category: 'core',    url: 'https://grudgewarlords.com',  subdomain: null, cloudPath: null },
  ];

  const CATEGORIES = [
    { id: 'all',     label: 'All' },
    { id: 'core',    label: 'Core' },
    { id: 'game',    label: 'Games' },
    { id: 'tool',    label: 'Tools' },
    { id: 'service', label: 'Services' },
  ];

  const TAG_COLORS = {
    puter:  { bg: 'rgba(59,130,246,.15)',  color: '#60a5fa' },
    vercel: { bg: 'rgba(255,255,255,.08)', color: '#999' },
    github: { bg: 'rgba(34,197,94,.12)',   color: '#4ade80' },
    domain: { bg: 'rgba(212,168,67,.12)',  color: '#d4a843' },
  };

  let activeCategory = 'all';
  let searchQuery = '';

  /* ---------- Render ---------- */
  function renderRegistry() {
    const container = document.getElementById('launcherGrid');
    if (!container) return;

    const isAdmin = window.GrudgeStudio?.role?.() === 'admin';

    // Filter
    let apps = APP_CATALOG;
    if (activeCategory !== 'all') {
      apps = apps.filter(a => a.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      apps = apps.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q)
      );
    }

    // Tabs + search
    const header = `
      <div class="registry-header">
        <div class="registry-tabs">
          ${CATEGORIES.map(c => `
            <button class="registry-tab ${c.id === activeCategory ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>
          `).join('')}
        </div>
        <input type="text" class="text-input registry-search" placeholder="Search apps..." value="${searchQuery}" id="registrySearch">
      </div>
      <div class="registry-count">${apps.length} app${apps.length !== 1 ? 's' : ''}</div>
    `;

    // Cards
    const cards = apps.map(app => {
      const tc = TAG_COLORS[app.tag] || TAG_COLORS.puter;
      return `
      <div class="registry-card" data-name="${app.name}">
        <a href="${app.url}" target="_blank" class="registry-card-link">
          <div class="registry-card-icon">${app.icon}</div>
          <div class="registry-card-body">
            <div class="registry-card-title">${app.title}</div>
            <div class="registry-card-name">${app.name}</div>
            ${app.subdomain ? `<div class="registry-card-sub">${app.subdomain}.puter.site</div>` : ''}
          </div>
          <span class="registry-tag" style="background:${tc.bg};color:${tc.color}">${app.tag}</span>
        </a>
        <div class="registry-card-status" data-url="${app.url}">⏳</div>
        ${isAdmin && app.cloudPath ? `<button class="btn btn-secondary registry-deploy-btn" data-app="${app.name}" data-subdomain="${app.subdomain}" data-cloud="${app.cloudPath}">🚀 Deploy</button>` : ''}
      </div>`;
    }).join('');

    // Site Manager (admin only)
    const siteManager = isAdmin ? `
      <div class="registry-section">
        <h3 class="section-title" style="margin-top:24px">🌐 Site Manager</h3>
        <div class="registry-site-controls">
          <button class="btn btn-secondary" id="refreshSitesBtn">Refresh Sites</button>
          <span id="siteCount" class="muted"></span>
        </div>
        <div id="sitesList" class="sites-list"></div>
      </div>
    ` : '';

    container.innerHTML = header + `<div class="registry-grid">${cards}</div>` + siteManager;

    // Bind events
    container.querySelectorAll('.registry-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderRegistry();
      });
    });

    const searchInput = document.getElementById('registrySearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderRegistry();
      });
    }

    // Status checks (fire and forget)
    checkAppStatuses(apps);

    // Admin: deploy buttons
    if (isAdmin) {
      container.querySelectorAll('.registry-deploy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          await deployApp(btn);
        });
      });
      const refreshBtn = document.getElementById('refreshSitesBtn');
      if (refreshBtn) refreshBtn.addEventListener('click', loadSites);
    }
  }

  async function checkAppStatuses(apps) {
    for (const app of apps) {
      const el = document.querySelector(`.registry-card[data-name="${app.name}"] .registry-card-status`);
      if (!el) continue;
      try {
        await fetch(app.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        el.innerHTML = '<span style="color:var(--green)">●</span>';
      } catch {
        el.innerHTML = '<span style="color:var(--danger)">●</span>';
      }
    }
  }

  async function deployApp(btn) {
    const subdomain = btn.dataset.subdomain;
    const cloudPath = btn.dataset.cloud;
    const name = btn.dataset.app;
    btn.textContent = '⏳ Deploying…';
    btn.disabled = true;
    try {
      try {
        await puter.hosting.update(subdomain, cloudPath);
      } catch {
        await puter.hosting.create(subdomain, cloudPath);
      }
      // Log deploy
      const log = { app: name, subdomain, cloudPath, user: window.GrudgeStudio?.user?.()?.username, ts: Date.now(), status: 'success' };
      try {
        const existing = await puter.kv.get('grudge:deploy:log');
        const arr = existing ? (typeof existing === 'string' ? JSON.parse(existing) : existing) : [];
        arr.unshift(log);
        if (arr.length > 50) arr.length = 50;
        await puter.kv.set('grudge:deploy:log', JSON.stringify(arr));
      } catch { await puter.kv.set('grudge:deploy:log', JSON.stringify([log])); }

      btn.textContent = '✅ Deployed';
      if (window.GrudgeStudio?.logActivity) window.GrudgeStudio.logActivity(`Deployed ${name} → ${subdomain}`);
    } catch (err) {
      btn.textContent = '❌ Failed';
      console.error('Deploy error:', err);
    }
    setTimeout(() => { btn.textContent = '🚀 Deploy'; btn.disabled = false; }, 4000);
  }

  /* ---------- Site Manager ---------- */
  async function loadSites() {
    const list = document.getElementById('sitesList');
    const count = document.getElementById('siteCount');
    if (!list) return;
    list.innerHTML = '<div class="muted">Loading sites…</div>';

    try {
      // Try puter.hosting.list() — may not be available in all SDK versions
      let sites = [];
      if (typeof puter !== 'undefined' && puter.hosting && puter.hosting.list) {
        sites = await puter.hosting.list();
      }

      // Fallback: load from KV cache
      if (!sites || sites.length === 0) {
        try {
          const cached = await puter.kv.get('grudge:sites:registry');
          if (cached) sites = typeof cached === 'string' ? JSON.parse(cached) : cached;
        } catch { /* no cache */ }
      }

      if (!sites || sites.length === 0) {
        list.innerHTML = '<div class="muted">No sites found. Use "puter sites" CLI to populate cache.</div>';
        return;
      }

      if (count) count.textContent = `${sites.length} sites`;

      list.innerHTML = sites.map(s => {
        const sub = s.subdomain || s.name || '(unknown)';
        const dir = s.directory || s.dir || s.root_dir?.name || '—';
        return `
          <div class="site-item">
            <div class="site-sub">${sub}<span class="site-suffix">.puter.site</span></div>
            <div class="site-dir">${dir}</div>
          </div>`;
      }).join('');

      // Cache the result
      try { await puter.kv.set('grudge:sites:registry', JSON.stringify(sites)); } catch { /* non-critical */ }
    } catch (err) {
      list.innerHTML = `<div style="color:var(--danger)">${err.message}</div>`;
    }
  }

  /* ---------- Expose ---------- */
  window.GrudgeRegistry = {
    render: renderRegistry,
    catalog: APP_CATALOG,
    loadSites,
  };

  // Auto-render when launcher view becomes active
  const origRenderLauncher = window.GrudgeStudio?.renderLauncher;
  // We'll hook into navigation in app.js instead
})();
