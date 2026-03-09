/* ============================================
   GRUDGE STUDIO — ObjectStore Asset Browser
   Fetches icon-index.json, sprite grid, search, preview
   ============================================ */
(function () {
  'use strict';

  const BASE = 'https://molochdagod.github.io/ObjectStore/icons/';
  const INDEX_URL = BASE + '../icons/icon-index.json';

  /* ---------- state ---------- */
  let index = null;       // raw icon-index.json
  let flatItems = [];     // { name, category, sub, src }
  let activeCategory = 'weapons';

  /* ---------- DOM ---------- */
  const categorySelect = document.getElementById('assetCategory');
  const searchInput    = document.getElementById('assetSearch');
  const grid           = document.getElementById('assetGrid');
  const previewEl      = document.getElementById('assetPreview');

  /* ---------- load index ---------- */
  async function loadIndex() {
    grid.innerHTML = '<p class="muted">Loading asset index…</p>';
    try {
      const resp = await fetch(INDEX_URL);
      index = await resp.json();
      buildFlatList();
      populateCategories();
      renderGrid();
      log(`Loaded ${flatItems.length} assets`);
    } catch (e) {
      grid.innerHTML = `<p class="muted">❌ Failed to load index: ${e.message}</p>`;
    }
  }

  function buildFlatList() {
    flatItems = [];
    const walk = (obj, cat, sub) => {
      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string') {
          flatItems.push({ name: key, category: cat, sub: sub || '', src: BASE + val });
        } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          // check if it has numeric metadata fields we should skip
          if (val.prefix || val.count || val.min !== undefined) continue;
          walk(val, cat, key);
        }
      }
    };
    for (const [cat, data] of Object.entries(index)) {
      if (cat === 'version' || cat === 'updated' || cat === 'basePath' || cat === 'skills') continue;
      if (typeof data === 'object') walk(data, cat, '');
    }
  }

  function populateCategories() {
    const cats = [...new Set(flatItems.map(i => i.category))];
    categorySelect.innerHTML = cats.map(c =>
      `<option value="${c}"${c === activeCategory ? ' selected' : ''}>${c}</option>`
    ).join('');
  }

  /* ---------- render ---------- */
  function renderGrid() {
    const q = (searchInput.value || '').toLowerCase();
    const filtered = flatItems.filter(i => {
      if (i.category !== activeCategory) return false;
      if (q && !i.name.toLowerCase().includes(q) && !i.sub.toLowerCase().includes(q)) return false;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="muted">No assets match</p>';
      return;
    }

    grid.innerHTML = filtered.map((item, idx) => `
      <div class="asset-card" data-idx="${idx}">
        <img src="${item.src}" alt="${item.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><text x=%2216%22 y=%2240%22 font-size=%2228%22>❓</text></svg>'">
        <div class="asset-name">${item.name}${item.sub ? ' <span class="muted">(' + item.sub + ')</span>' : ''}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.asset-card').forEach(card => {
      card.addEventListener('click', () => {
        const i = filtered[parseInt(card.dataset.idx)];
        showPreview(i);
      });
    });
  }

  /* ---------- preview ---------- */
  function showPreview(item) {
    previewEl.classList.remove('hidden');
    previewEl.innerHTML = `
      <img src="${item.src}" alt="${item.name}">
      <h3 style="margin-top:0.8rem">${item.name}</h3>
      <p class="muted">${item.category} / ${item.sub || '—'}</p>
      <p class="muted" style="font-size:0.75rem;word-break:break-all">${item.src}</p>
      <button class="btn btn-secondary" style="margin-top:0.6rem" onclick="document.getElementById('assetPreview').classList.add('hidden')">Close</button>
    `;
  }

  /* close preview on outside click */
  document.addEventListener('click', e => {
    if (!previewEl.classList.contains('hidden') && !previewEl.contains(e.target) && !e.target.closest('.asset-card')) {
      previewEl.classList.add('hidden');
    }
  });

  /* ---------- events ---------- */
  categorySelect.addEventListener('change', () => {
    activeCategory = categorySelect.value;
    renderGrid();
  });

  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(renderGrid, 200);
  });

  /* ---------- helpers ---------- */
  function log(msg) {
    if (window.GrudgeStudio) window.GrudgeStudio.logActivity('[Assets] ' + msg);
  }

  /* ===========================
     CLOUD STORAGE SYNC
     =========================== */
  async function syncToCloud() {
    const isAdmin = window.GrudgeStudio?.role?.() === 'admin';
    if (!isAdmin) { log('Admin only: cloud sync'); return; }

    const cloudDir = '/GrudgeStudio/objectstore';
    grid.innerHTML = '<p class="muted">Syncing ObjectStore assets to cloud storage…</p>';
    log('Starting ObjectStore → Cloud sync');

    // Ensure target directories exist
    const cats = [...new Set(flatItems.map(i => i.category))];
    for (const cat of cats) {
      try { await puter.fs.mkdir(`${cloudDir}/${cat}`, { createMissingParents: true, dedupeName: false, overwrite: false }); } catch { /* exists */ }
    }

    let synced = 0, failed = 0, skipped = 0;
    const total = flatItems.length;

    for (const item of flatItems) {
      const remotePath = `${cloudDir}/${item.category}/${item.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.png`;
      try {
        // Check if already cached
        try {
          await puter.fs.stat(remotePath);
          skipped++;
          continue; // already in cloud
        } catch { /* not found, need to fetch */ }

        const resp = await fetch(item.src);
        if (!resp.ok) { failed++; continue; }
        const blob = await resp.blob();
        const dir = `${cloudDir}/${item.category}`;
        const fileName = `${item.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.png`;
        await puter.fs.upload(blob, dir, { overwrite: true, dedupeName: false, name: fileName });
        synced++;

        // Update progress every 10 items
        if ((synced + failed) % 10 === 0) {
          grid.innerHTML = `<p class="muted">Syncing… ${synced + skipped}/${total} done (${failed} failed)</p>`;
        }
      } catch {
        failed++;
      }
    }

    // Store sync manifest in KV
    await puter.kv.set('grudge:objectstore:sync', JSON.stringify({
      lastSync: Date.now(),
      total: flatItems.length,
      synced, skipped, failed,
      categories: cats,
    }));

    grid.innerHTML = `<p class="muted">✅ Cloud sync complete: ${synced} new, ${skipped} cached, ${failed} failed</p>`;
    log(`Cloud sync: ${synced} new, ${skipped} cached, ${failed} failed`);

    // Return to grid view after 3s
    setTimeout(() => { renderGrid(); }, 3000);
  }

  /* Check cloud sync status */
  async function checkCloudStatus() {
    try {
      const raw = await puter.kv.get('grudge:objectstore:sync');
      if (raw) {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const ago = Math.round((Date.now() - data.lastSync) / 60000);
        log(`Cloud: ${data.total} assets, last sync ${ago}m ago`);
      }
    } catch { /* not synced yet */ }
  }

  /* ===========================
     PERSONAL VAULT
     =========================== */
  let vaultMode = false;
  let vaultItems = [];

  async function loadVault() {
    vaultMode = true;
    grid.innerHTML = '<p class="muted">Loading personal vault…</p>';
    try {
      const keys = await puter.kv.list();
      const assetKeys = (Array.isArray(keys) ? keys : [])
        .map(k => typeof k === 'string' ? k : k.key)
        .filter(k => k && k.startsWith('grudge:studio:assets:'));

      vaultItems = [];
      for (const key of assetKeys) {
        try {
          const raw = await puter.kv.get(key);
          const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          vaultItems.push({ key, ...data });
        } catch { /* skip corrupt entries */ }
      }

      renderVault();
      log(`Vault: ${vaultItems.length} items`);
    } catch (err) {
      grid.innerHTML = `<p class="muted">❌ ${err.message}</p>`;
    }
  }

  function renderVault() {
    if (vaultItems.length === 0) {
      grid.innerHTML = '<p class="muted">No items in your personal vault. Upload assets or sync from equipped gear.</p>';
      return;
    }

    grid.innerHTML = vaultItems.map((item, idx) => `
      <div class="asset-card vault-item" data-vidx="${idx}">
        ${item.src ? `<img src="${item.src}" alt="${item.name || 'Asset'}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><text x=%2216%22 y=%2240%22 font-size=%2228%22>📦</text></svg>'">` : '<div style="font-size:2rem;margin-bottom:0.3rem">📦</div>'}
        <div class="asset-name">${item.name || item.key.split(':').pop()}</div>
        ${item.type ? `<div class="muted" style="font-size:0.7rem">${item.type}</div>` : ''}
      </div>
    `).join('');

    grid.querySelectorAll('.vault-item').forEach(card => {
      card.addEventListener('click', () => {
        const item = vaultItems[parseInt(card.dataset.vidx)];
        showPreview({ name: item.name || item.key, src: item.src || '', category: 'vault', sub: item.type || '' });
      });
    });
  }

  async function uploadToVault() {
    try {
      // Use Puter's file picker
      const files = await puter.ui.showOpenFilePicker({ multiple: false });
      if (!files || files.length === 0) return;

      const file = files[0];
      // Upload to Puter FS under /GrudgeStudio/assets/
      const destPath = `/GrudgeStudio/assets/${file.name}`;
      await puter.fs.write(destPath, file);

      // Store metadata in KV
      const assetId = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await puter.kv.set(`grudge:studio:assets:${assetId}`, JSON.stringify({
        name: file.name,
        type: file.type || 'unknown',
        src: destPath,
        uploadedAt: Date.now(),
        size: file.size,
      }));

      log(`Uploaded ${file.name} to vault`);
      if (vaultMode) loadVault();
    } catch (err) {
      log(`Upload failed: ${err.message}`);
    }
  }

  /* Equipped gear preview (reads from Character Hub) */
  async function showEquippedGear() {
    const charData = window.GrudgeCharacters?.getSelected?.();
    if (!charData || !charData.inventory) {
      grid.innerHTML = '<p class="muted">Select a character in the Characters panel first.</p>';
      return;
    }

    const equipped = charData.inventory.filter(i => i.equipped);
    if (equipped.length === 0) {
      grid.innerHTML = '<p class="muted">No equipped items on this character.</p>';
      return;
    }

    grid.innerHTML = equipped.map((item, idx) => {
      // Try to find matching ObjectStore icon
      const match = flatItems.find(fi => fi.name.toLowerCase() === (item.itemKey || '').toLowerCase());
      const src = match ? match.src : '';
      return `
        <div class="asset-card" data-eidx="${idx}">
          ${src ? `<img src="${src}" alt="${item.itemKey}" loading="lazy">` : '<div style="font-size:2rem;margin-bottom:0.3rem">🗡️</div>'}
          <div class="asset-name">T${item.tier} ${item.itemKey}</div>
          <div class="muted" style="font-size:0.7rem">${item.itemType || ''}</div>
        </div>`;
    }).join('');
  }

  // Add vault/gear buttons to the asset controls
  const controlsEl = document.querySelector('.assets-controls');
  if (controlsEl) {
    const vaultBtn = document.createElement('button');
    vaultBtn.className = 'vault-upload-btn';
    vaultBtn.textContent = '📦 Vault';
    vaultBtn.addEventListener('click', () => {
      vaultMode = true;
      loadVault();
    });

    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'vault-upload-btn';
    uploadBtn.textContent = '⬆ Upload';
    uploadBtn.addEventListener('click', uploadToVault);

    const gearBtn = document.createElement('button');
    gearBtn.className = 'vault-upload-btn';
    gearBtn.textContent = '⚔ Equipped';
    gearBtn.addEventListener('click', showEquippedGear);

    const browseBtn = document.createElement('button');
    browseBtn.className = 'vault-upload-btn';
    browseBtn.textContent = '🗄 Browse';
    browseBtn.addEventListener('click', () => {
      vaultMode = false;
      renderGrid();
    });

    const cloudSyncBtn = document.createElement('button');
    cloudSyncBtn.className = 'vault-upload-btn';
    cloudSyncBtn.textContent = '☁ Sync to Cloud';
    cloudSyncBtn.title = 'Admin: Sync ObjectStore assets to Puter cloud storage';
    cloudSyncBtn.addEventListener('click', syncToCloud);

    controlsEl.prepend(browseBtn);
    controlsEl.prepend(gearBtn);
    controlsEl.prepend(uploadBtn);
    controlsEl.prepend(vaultBtn);
    controlsEl.prepend(cloudSyncBtn);
  }

  /* ---------- boot ---------- */
  loadIndex().then(() => checkCloudStatus());
})();
