/* ============================================
   GRUDGE STUDIO — Character Hub Panel
   Fetches characters from Crafting Suite via bridge API,
   displays cards, sync to/from Puter KV.
   ============================================ */
(function () {
  'use strict';

  const API_BASE = 'https://grudgewarlords.com';

  /* ---------- state ---------- */
  let characters = [];
  let selectedCharId = null;
  let selectedCharFull = null;

  /* ---------- DOM ---------- */
  const grid = document.getElementById('charGrid');
  const detailPanel = document.getElementById('charDetail');
  const refreshBtn = document.getElementById('charRefreshBtn');
  const syncToKvBtn = document.getElementById('charSyncToKvBtn');
  const restoreFromKvBtn = document.getElementById('charRestoreFromKvBtn');
  const linkDiscordBtn = document.getElementById('charLinkDiscordBtn');
  const charStatus = document.getElementById('charStatus');

  /* ---------- class/race display maps ---------- */
  const CLASS_NAMES = { warrior: 'Warrior', mage: 'Mage', ranger: 'Ranger', worge: 'Worge' };
  const RACE_NAMES = { human: 'Human', elf: 'Elf', dwarf: 'Dwarf', orc: 'Orc', undead: 'Undead' };
  const CLASS_ICONS = { warrior: '⚔️', mage: '🔮', ranger: '🏹', worge: '🐺' };

  /* ---------- auth helpers ---------- */
  function getSessionToken() {
    return localStorage.getItem('grudge_studio_session') || null;
  }

  function authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getSessionToken();
    if (token) headers['X-Session-Token'] = token;
    return headers;
  }

  /* ---------- fetch characters ---------- */
  async function loadCharacters() {
    grid.innerHTML = '<p class="muted">Loading characters…</p>';
    charStatus.textContent = 'Fetching…';

    const token = getSessionToken();
    if (!token) {
      grid.innerHTML = '<p class="muted">Link your Discord account to view characters.</p>';
      charStatus.textContent = 'Not linked';
      linkDiscordBtn.classList.remove('hidden');
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/studio/characters`, { headers: authHeaders() });
      const data = await resp.json();

      if (!data.linked) {
        grid.innerHTML = '<p class="muted">No Crafting Suite account found. Create one at the Warlord Crafting Suite first.</p>';
        charStatus.textContent = 'No account';
        return;
      }

      characters = data.characters || [];
      charStatus.textContent = `${characters.length} character${characters.length !== 1 ? 's' : ''} • ${data.grudgeId || 'Unknown'}`;
      linkDiscordBtn.classList.add('hidden');
      renderGrid();
      log(`Loaded ${characters.length} characters`);
    } catch (err) {
      grid.innerHTML = `<p class="muted">❌ Failed to load: ${err.message}</p>`;
      charStatus.textContent = 'Error';
    }
  }

  /* ---------- render ---------- */
  function renderGrid() {
    if (characters.length === 0) {
      grid.innerHTML = '<p class="muted">No characters yet. Create one in the Warlord Crafting Suite.</p>';
      return;
    }

    grid.innerHTML = characters.map((c, i) => {
      const icon = CLASS_ICONS[c.classId] || '🗡️';
      const className = CLASS_NAMES[c.classId] || c.classId;
      const raceName = RACE_NAMES[c.raceId] || c.raceId;
      const professions = c.professionProgression || {};
      const profList = Object.entries(professions)
        .filter(([, v]) => v && v.level > 0)
        .map(([k, v]) => `${k} ${v.level}`)
        .join(', ');

      return `
        <div class="char-card ${c.id === selectedCharId ? 'selected' : ''}" data-id="${c.id}" data-idx="${i}">
          <div class="char-icon">${icon}</div>
          <div class="char-info">
            <div class="char-name">${c.name}</div>
            <div class="char-meta">${raceName} ${className} • Lv ${c.level}</div>
            ${profList ? `<div class="char-profs">${profList}</div>` : ''}
          </div>
          <div class="char-health-bar">
            <div class="char-hp" style="width:${Math.min(100, (c.currentHealth || 100))}%"></div>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => selectCharacter(card.dataset.id));
    });
  }

  /* ---------- select character ---------- */
  async function selectCharacter(charId) {
    selectedCharId = charId;
    renderGrid();
    detailPanel.innerHTML = '<p class="muted">Loading full character data…</p>';
    detailPanel.classList.remove('hidden');
    syncToKvBtn.classList.remove('hidden');
    restoreFromKvBtn.classList.remove('hidden');

    try {
      const resp = await fetch(`${API_BASE}/api/studio/character/${charId}/full`, { headers: authHeaders() });
      const data = await resp.json();
      selectedCharFull = data;
      renderDetail(data);
    } catch (err) {
      detailPanel.innerHTML = `<p class="muted">❌ ${err.message}</p>`;
    }
  }

  function renderDetail(data) {
    const c = data.character;
    const className = CLASS_NAMES[c.classId] || c.classId;
    const raceName = RACE_NAMES[c.raceId] || c.raceId;
    const attrs = c.attributes || {};

    const attrHtml = Object.entries(attrs)
      .map(([k, v]) => `<span class="attr-pill"><span class="attr-name">${k}</span> <span class="attr-val">${v}</span></span>`)
      .join('');

    const equippedItems = data.inventory.filter(i => i.equipped);
    const equipHtml = equippedItems.length
      ? equippedItems.map(i => `<span class="equip-pill">T${i.tier} ${i.itemKey}</span>`).join('')
      : '<span class="muted">None equipped</span>';

    const craftedHtml = data.craftedItems.length
      ? data.craftedItems.slice(0, 8).map(i => `<span class="equip-pill">${i.itemName} (T${i.tier})</span>`).join('')
      : '<span class="muted">None</span>';

    const skillCount = data.skills.length;
    const recipeCount = data.recipes.length;

    detailPanel.innerHTML = `
      <h3>${c.name} <span class="muted">— ${raceName} ${className} Lv ${c.level}</span></h3>
      <div class="detail-row">
        <span class="detail-label">Gold</span> <span class="detail-val gold-text">${c.gold || 0}</span>
        <span class="detail-label" style="margin-left:1rem">XP</span> <span class="detail-val">${c.experience || 0}</span>
      </div>
      <div class="detail-section">
        <div class="detail-label">Attributes</div>
        <div class="attr-row">${attrHtml || '<span class="muted">None</span>'}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Equipped Gear</div>
        <div class="equip-row">${equipHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Crafted Items (${data.craftedItems.length})</div>
        <div class="equip-row">${craftedHtml}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Skills</span> <span class="detail-val">${skillCount}</span>
        <span class="detail-label" style="margin-left:1rem">Recipes</span> <span class="detail-val">${recipeCount}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">HP</span> <span class="detail-val">${c.currentHealth || '?'}</span>
        <span class="detail-label" style="margin-left:1rem">Mana</span> <span class="detail-val">${c.currentMana || '?'}</span>
        <span class="detail-label" style="margin-left:1rem">Stamina</span> <span class="detail-val">${c.currentStamina || '?'}</span>
      </div>
    `;
  }

  /* ---------- sync to KV ---------- */
  async function syncToKv() {
    if (!selectedCharFull) return;
    charStatus.textContent = 'Syncing to KV…';
    try {
      const account = window.GrudgeStudio?.account?.();
      const accountId = account?.puterId || 'unknown';
      const gameState = {
        character: selectedCharFull.character,
        inventory: selectedCharFull.inventory,
        craftedItems: selectedCharFull.craftedItems,
        skills: selectedCharFull.skills,
        recipes: selectedCharFull.recipes,
      };

      // Use Puter KV directly from the client
      await puter.kv.set(`grudge:save:${accountId}`, JSON.stringify({
        ...gameState,
        _syncMeta: { pushedAt: Date.now(), source: 'studio-hub', characterId: selectedCharId },
      }));

      charStatus.textContent = 'Synced to KV ✅';
      log(`Synced ${selectedCharFull.character.name} to KV`);
    } catch (err) {
      charStatus.textContent = `Sync failed: ${err.message}`;
    }
  }

  /* ---------- restore from KV ---------- */
  async function restoreFromKv() {
    charStatus.textContent = 'Pulling from KV…';
    try {
      const account = window.GrudgeStudio?.account?.();
      const accountId = account?.puterId || 'unknown';
      const raw = await puter.kv.get(`grudge:save:${accountId}`);
      if (!raw) {
        charStatus.textContent = 'No save found in KV';
        return;
      }
      const save = typeof raw === 'string' ? JSON.parse(raw) : raw;
      charStatus.textContent = `KV save loaded (${new Date(save._syncMeta?.pushedAt).toLocaleString()})`;
      log(`Restored save from KV (v${save._syncMeta?.version || '?'})`);

      // Show the save data in detail panel
      if (save.character) {
        selectedCharFull = save;
        renderDetail(save);
      }
    } catch (err) {
      charStatus.textContent = `Restore failed: ${err.message}`;
    }
  }

  /* ---------- link discord ---------- */
  async function linkDiscord() {
    try {
      const resp = await fetch(`${API_BASE}/api/discord/login`);
      const data = await resp.json();
      if (data.url) {
        const popup = window.open(data.url, 'Discord Login', 'width=500,height=700');
        window.addEventListener('message', async (e) => {
          if (e.data?.type === 'grudge_login' && e.data.data?.sessionToken) {
            localStorage.setItem('grudge_studio_session', e.data.data.sessionToken);
            localStorage.setItem('grudge_studio_user', JSON.stringify(e.data.data.user));
            log('Discord linked successfully');
            loadCharacters();
          }
        }, { once: true });
      }
    } catch (err) {
      charStatus.textContent = `Link failed: ${err.message}`;
    }
  }

  /* ---------- events ---------- */
  refreshBtn?.addEventListener('click', loadCharacters);
  syncToKvBtn?.addEventListener('click', syncToKv);
  restoreFromKvBtn?.addEventListener('click', restoreFromKv);
  linkDiscordBtn?.addEventListener('click', linkDiscord);

  /* ---------- helpers ---------- */
  function log(msg) {
    if (window.GrudgeStudio) window.GrudgeStudio.logActivity('[Characters] ' + msg);
  }

  /* ---------- expose ---------- */
  window.GrudgeCharacters = { load: loadCharacters, getSelected: () => selectedCharFull };

  /* ---------- boot ---------- */
  // Auto-load when the view becomes active (called from nav)
  const observer = new MutationObserver(() => {
    const view = document.getElementById('view-characters');
    if (view?.classList.contains('active') && characters.length === 0) {
      loadCharacters();
    }
  });
  const charView = document.getElementById('view-characters');
  if (charView) observer.observe(charView, { attributes: true, attributeFilter: ['class'] });
})();
