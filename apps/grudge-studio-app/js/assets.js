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

  /* ---------- boot ---------- */
  loadIndex();
})();
