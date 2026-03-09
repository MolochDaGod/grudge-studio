/* ============================================
   GRUDGE STUDIO — Deploy Manager
   In-app deploy + Cloud FS browser + Deploy log
   ============================================ */
(function () {
  'use strict';

  let fsCurrentPath = '/GRUDACHAIN';

  /* ---------- Init (called when Deploy view shows) ---------- */
  function initDeploy() {
    renderDeployableApps();
    renderDeployLog();
    bindFSBrowser();
  }

  /* ---------- Deployable Apps ---------- */
  function renderDeployableApps() {
    const list = document.getElementById('deployAppList');
    if (!list) return;

    // Get deployable apps from registry
    const catalog = window.GrudgeRegistry?.catalog || [];
    const deployable = catalog.filter(a => a.cloudPath && a.subdomain);

    if (!deployable.length) {
      list.innerHTML = '<div class="muted">No deployable apps found</div>';
      return;
    }

    list.innerHTML = deployable.map(app => `
      <div class="deploy-app-item">
        <div>
          <div class="deploy-app-name">${app.icon} ${app.title}</div>
          <div class="deploy-app-sub">${app.subdomain}.puter.site → ${app.cloudPath}</div>
        </div>
        <button class="btn btn-primary btn-xs" data-subdomain="${app.subdomain}" data-cloud="${app.cloudPath}" data-name="${app.name}">🚀 Deploy</button>
      </div>
    `).join('');

    list.querySelectorAll('.btn[data-subdomain]').forEach(btn => {
      btn.addEventListener('click', () => deployOne(btn));
    });
  }

  async function deployOne(btn) {
    const subdomain = btn.dataset.subdomain;
    const cloudPath = btn.dataset.cloud;
    const name = btn.dataset.name;
    btn.textContent = '⏳…';
    btn.disabled = true;
    try {
      try { await puter.hosting.update(subdomain, cloudPath); }
      catch { await puter.hosting.create(subdomain, cloudPath); }
      btn.textContent = '✅ Done';
      appendDeployLog({ app: name, subdomain, status: 'success', ts: Date.now() });
      if (window.GrudgeStudio?.logActivity) window.GrudgeStudio.logActivity(`Deployed ${name}`);
    } catch (err) {
      btn.textContent = '❌ Fail';
      appendDeployLog({ app: name, subdomain, status: 'failed', error: err.message, ts: Date.now() });
    }
    setTimeout(() => { btn.textContent = '🚀 Deploy'; btn.disabled = false; }, 3000);
  }

  /* ---------- Deploy Log ---------- */
  async function renderDeployLog() {
    const el = document.getElementById('deployLog');
    if (!el) return;
    try {
      const raw = await puter.kv.get('grudge:deploy:log');
      const logs = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
      if (!logs.length) { el.innerHTML = '<div class="muted">No deploy history</div>'; return; }
      el.innerHTML = logs.slice(0, 20).map(l => {
        const date = new Date(l.ts).toLocaleString();
        const cls = l.status === 'success' ? 'success' : 'fail';
        return `<div class="deploy-log-item"><span class="${cls}">${l.status === 'success' ? '✅' : '❌'}</span> ${l.app || l.subdomain} — ${date}${l.user ? ' by ' + l.user : ''}</div>`;
      }).join('');
    } catch { el.innerHTML = '<div class="muted">Could not load log</div>'; }
  }

  async function appendDeployLog(entry) {
    try {
      const raw = await puter.kv.get('grudge:deploy:log');
      const logs = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
      entry.user = window.GrudgeStudio?.user?.()?.username;
      logs.unshift(entry);
      if (logs.length > 50) logs.length = 50;
      await puter.kv.set('grudge:deploy:log', JSON.stringify(logs));
      renderDeployLog();
    } catch { /* non-critical */ }
  }

  /* ---------- Cloud FS Browser ---------- */
  function bindFSBrowser() {
    const browseBtn = document.getElementById('fsBrowseBtn');
    const pathInput = document.getElementById('fsPath');
    if (browseBtn) browseBtn.addEventListener('click', () => browsePath());
    if (pathInput) {
      pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') browsePath(); });
    }
  }

  async function browsePath(path) {
    const pathInput = document.getElementById('fsPath');
    const browser = document.getElementById('fsBrowser');
    if (!browser) return;

    if (path) {
      fsCurrentPath = path;
      if (pathInput) pathInput.value = path;
    } else {
      fsCurrentPath = pathInput?.value?.trim() || '/GRUDACHAIN';
    }

    browser.innerHTML = '<div class="muted">Loading…</div>';

    try {
      const items = await puter.fs.readdir(fsCurrentPath);
      if (!items || !items.length) {
        browser.innerHTML = '<div class="muted">Empty directory</div>';
        return;
      }

      // Parent dir link
      const parentPath = fsCurrentPath.split('/').slice(0, -1).join('/') || '/';
      let html = '';
      if (fsCurrentPath !== '/') {
        html += `<div class="fs-item" data-path="${parentPath}"><span class="fs-item-name dir">⬆ ..</span><span class="fs-item-size">—</span></div>`;
      }

      // Sort: dirs first, then files
      const sorted = [...items].sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      html += sorted.map(item => {
        const name = item.name || '(unknown)';
        const isDir = item.is_dir;
        const size = isDir ? '—' : ((item.size || 0) / 1024).toFixed(1) + ' KB';
        const fullPath = fsCurrentPath.replace(/\/$/, '') + '/' + name;
        return `<div class="fs-item" ${isDir ? `data-path="${fullPath}"` : ''}>
          <span class="fs-item-name ${isDir ? 'dir' : ''}">${isDir ? '📁' : '📄'} ${name}</span>
          <span class="fs-item-size">${size}</span>
        </div>`;
      }).join('');

      browser.innerHTML = html;

      // Bind directory clicks
      browser.querySelectorAll('.fs-item[data-path]').forEach(el => {
        el.addEventListener('click', () => browsePath(el.dataset.path));
      });
    } catch (err) {
      browser.innerHTML = `<div style="color:var(--danger)">${err.message}</div>`;
    }
  }

  /* ---------- Hook into navigation ---------- */
  // Listen for deploy view activation
  const observer = new MutationObserver(() => {
    const deployView = document.getElementById('view-deploy');
    if (deployView && deployView.classList.contains('active')) {
      initDeploy();
    }
  });

  // Start observing after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const main = document.querySelector('.main-content');
      if (main) observer.observe(main, { attributes: true, subtree: true, attributeFilter: ['class'] });
    });
  } else {
    const main = document.querySelector('.main-content');
    if (main) observer.observe(main, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  window.GrudgeDeploy = { init: initDeploy, browsePath };
})();
