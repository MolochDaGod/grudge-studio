/* ============================================
   GRUDGE STUDIO — Game Save Manager
   List, preview, export, import, auto-save via Puter KV.
   ============================================ */
(function () {
  'use strict';

  /* ---------- state ---------- */
  let saves = [];       // { key, data }
  let autoSaveInterval = null;

  /* ---------- DOM ---------- */
  const saveList = document.getElementById('saveList');
  const savePreview = document.getElementById('savePreview');
  const saveStatus = document.getElementById('saveStatus');
  const manualSaveBtn = document.getElementById('saveManualBtn');
  const exportBtn = document.getElementById('saveExportBtn');
  const importBtn = document.getElementById('saveImportBtn');
  const importInput = document.getElementById('saveImportInput');
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  const refreshSavesBtn = document.getElementById('saveRefreshBtn');

  /* ---------- load saves ---------- */
  async function loadSaves() {
    saveList.innerHTML = '<p class="muted">Scanning saves…</p>';
    saveStatus.textContent = 'Loading…';
    try {
      const keys = await puter.kv.list();
      const saveKeys = (Array.isArray(keys) ? keys : [])
        .map(k => typeof k === 'string' ? k : k.key)
        .filter(k => k && k.startsWith('grudge:save:'));

      saves = [];
      for (const key of saveKeys) {
        try {
          const raw = await puter.kv.get(key);
          const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          saves.push({ key, data });
        } catch { saves.push({ key, data: null }); }
      }

      saves.sort((a, b) => {
        const ta = a.data?._syncMeta?.pushedAt || 0;
        const tb = b.data?._syncMeta?.pushedAt || 0;
        return tb - ta;
      });

      saveStatus.textContent = `${saves.length} save${saves.length !== 1 ? 's' : ''} found`;
      renderList();
      log(`Found ${saves.length} saves`);
    } catch (err) {
      saveList.innerHTML = `<p class="muted">❌ ${err.message}</p>`;
      saveStatus.textContent = 'Error';
    }
  }

  /* ---------- render ---------- */
  function renderList() {
    if (saves.length === 0) {
      saveList.innerHTML = '<p class="muted">No saves yet. Use "Sync to KV" from the Characters panel, or save manually.</p>';
      return;
    }

    saveList.innerHTML = saves.map((s, i) => {
      const d = s.data;
      const charName = d?.character?.name || 'Unknown';
      const level = d?.character?.level || '?';
      const time = d?._syncMeta?.pushedAt ? new Date(d._syncMeta.pushedAt).toLocaleString() : 'Unknown';
      const version = d?._syncMeta?.version || '?';
      const source = d?._syncMeta?.source || 'unknown';
      const accountId = s.key.replace('grudge:save:', '');

      return `
        <div class="save-item" data-idx="${i}">
          <div class="save-header">
            <span class="save-name">${charName} (Lv ${level})</span>
            <span class="save-version">v${version}</span>
          </div>
          <div class="save-meta">
            <span>${time}</span> • <span>${source}</span> • <span class="muted">${accountId.slice(0, 12)}…</span>
          </div>
        </div>`;
    }).join('');

    saveList.querySelectorAll('.save-item').forEach(item => {
      item.addEventListener('click', () => showPreview(parseInt(item.dataset.idx)));
    });
  }

  /* ---------- preview ---------- */
  function showPreview(idx) {
    const s = saves[idx];
    if (!s || !s.data) {
      savePreview.textContent = 'No data available for this save.';
      return;
    }

    const d = s.data;
    const lines = [];
    lines.push(`Key: ${s.key}`);
    lines.push(`Saved: ${d._syncMeta?.pushedAt ? new Date(d._syncMeta.pushedAt).toLocaleString() : '?'}`);
    lines.push(`Version: ${d._syncMeta?.version || '?'}`);
    lines.push(`Source: ${d._syncMeta?.source || '?'}`);
    lines.push('');

    if (d.character) {
      const c = d.character;
      lines.push(`Character: ${c.name} — ${c.raceId} ${c.classId} Lv ${c.level}`);
      lines.push(`Gold: ${c.gold || 0}  XP: ${c.experience || 0}`);
      lines.push(`HP: ${c.currentHealth}  Mana: ${c.currentMana}  Stamina: ${c.currentStamina}`);
    }

    if (d.inventory) lines.push(`Inventory: ${d.inventory.length} items`);
    if (d.craftedItems) lines.push(`Crafted: ${d.craftedItems.length} items`);
    if (d.skills) lines.push(`Skills: ${d.skills.length} unlocked`);
    if (d.recipes) lines.push(`Recipes: ${d.recipes.length} unlocked`);

    savePreview.textContent = lines.join('\n');
  }

  /* ---------- manual save ---------- */
  async function manualSave() {
    const charData = window.GrudgeCharacters?.getSelected?.();
    if (!charData) {
      saveStatus.textContent = 'Select a character first (Characters panel)';
      return;
    }

    saveStatus.textContent = 'Saving…';
    try {
      const account = window.GrudgeStudio?.account?.();
      const accountId = account?.puterId || 'unknown';
      const payload = {
        character: charData.character,
        inventory: charData.inventory || [],
        craftedItems: charData.craftedItems || [],
        skills: charData.skills || [],
        recipes: charData.recipes || [],
        _syncMeta: { pushedAt: Date.now(), version: 1, source: 'studio-manual' },
      };

      // Check existing version
      try {
        const existing = await puter.kv.get(`grudge:save:${accountId}`);
        if (existing) {
          const prev = typeof existing === 'string' ? JSON.parse(existing) : existing;
          payload._syncMeta.version = (prev._syncMeta?.version || 0) + 1;
        }
      } catch { /* first save */ }

      await puter.kv.set(`grudge:save:${accountId}`, JSON.stringify(payload));
      saveStatus.textContent = 'Saved ✅';
      log(`Manual save v${payload._syncMeta.version}`);
      loadSaves();
    } catch (err) {
      saveStatus.textContent = `Save failed: ${err.message}`;
    }
  }

  /* ---------- export ---------- */
  async function exportSave() {
    if (saves.length === 0) {
      saveStatus.textContent = 'No saves to export';
      return;
    }
    // Export the most recent save
    const s = saves[0];
    const blob = new Blob([JSON.stringify(s.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grudge-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    saveStatus.textContent = 'Exported ✅';
    log('Exported save to file');
  }

  /* ---------- import ---------- */
  function triggerImport() {
    importInput.click();
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    saveStatus.textContent = 'Importing…';

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.character && !data._syncMeta) {
        saveStatus.textContent = 'Invalid save file format';
        return;
      }

      const account = window.GrudgeStudio?.account?.();
      const accountId = account?.puterId || 'unknown';
      data._syncMeta = {
        ...(data._syncMeta || {}),
        pushedAt: Date.now(),
        source: 'studio-import',
        version: (data._syncMeta?.version || 0) + 1,
      };

      await puter.kv.set(`grudge:save:${accountId}`, JSON.stringify(data));
      saveStatus.textContent = 'Imported ✅';
      log('Imported save from file');
      loadSaves();
    } catch (err) {
      saveStatus.textContent = `Import failed: ${err.message}`;
    }
    importInput.value = '';
  }

  /* ---------- auto-save ---------- */
  function toggleAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
      autoSaveToggle.textContent = '⏸ Auto-Save: OFF';
      autoSaveToggle.classList.remove('active');
      saveStatus.textContent = 'Auto-save disabled';
      log('Auto-save disabled');
    } else {
      autoSaveInterval = setInterval(async () => {
        const charData = window.GrudgeCharacters?.getSelected?.();
        if (charData) {
          try {
            const account = window.GrudgeStudio?.account?.();
            const accountId = account?.puterId || 'unknown';
            const payload = {
              ...charData,
              _syncMeta: { pushedAt: Date.now(), source: 'studio-autosave', version: Date.now() },
            };
            await puter.kv.set(`grudge:save:${accountId}`, JSON.stringify(payload));
            saveStatus.textContent = `Auto-saved at ${new Date().toLocaleTimeString()}`;
          } catch { /* silent */ }
        }
      }, 5 * 60 * 1000); // Every 5 minutes

      autoSaveToggle.textContent = '▶ Auto-Save: ON';
      autoSaveToggle.classList.add('active');
      saveStatus.textContent = 'Auto-save enabled (every 5 min)';
      log('Auto-save enabled');
    }
  }

  /* ---------- events ---------- */
  manualSaveBtn?.addEventListener('click', manualSave);
  exportBtn?.addEventListener('click', exportSave);
  importBtn?.addEventListener('click', triggerImport);
  importInput?.addEventListener('change', handleImport);
  autoSaveToggle?.addEventListener('click', toggleAutoSave);
  refreshSavesBtn?.addEventListener('click', loadSaves);

  /* ---------- helpers ---------- */
  function log(msg) {
    if (window.GrudgeStudio) window.GrudgeStudio.logActivity('[Saves] ' + msg);
  }

  /* ---------- boot ---------- */
  const observer = new MutationObserver(() => {
    const view = document.getElementById('view-saves');
    if (view?.classList.contains('active') && saves.length === 0) {
      loadSaves();
    }
  });
  const savesView = document.getElementById('view-saves');
  if (savesView) observer.observe(savesView, { attributes: true, attributeFilter: ['class'] });
})();
