/* ============================================
   GRUDGE STUDIO — Code Playground
   CodeMirror 6 editor + script execution in 3D context
   ============================================ */
(function () {
  'use strict';

  let editorView = null;
  let cmLoaded = false;

  const CM_CDN = 'https://cdn.jsdelivr.net/npm/';
  const CM_MODULES = [
    '@codemirror/state@6/dist/index.js',
    '@codemirror/view@6/dist/index.js',
    '@codemirror/language@6/dist/index.js',
    '@codemirror/commands@6/dist/index.js',
    '@codemirror/lang-javascript@6/dist/index.js',
  ];

  /* ---------- Load CodeMirror from CDN ---------- */
  async function loadCodeMirror() {
    if (cmLoaded) return;
    try {
      const [stateModule, viewModule, langModule, cmdModule, jsModule] = await Promise.all(
        CM_MODULES.map(m => import(CM_CDN + m))
      );

      const { EditorState } = stateModule;
      const { EditorView, keymap, lineNumbers, highlightActiveLine } = viewModule;
      const { defaultHighlightStyle, syntaxHighlighting } = langModule;
      const { defaultKeymap, history, historyKeymap } = cmdModule;
      const { javascript } = jsModule;

      const mount = document.getElementById('codeEditorMount');
      if (!mount) return;

      const darkTheme = EditorView.theme({
        '&': { backgroundColor: 'hsl(225, 30%, 6%)', color: 'hsl(45, 30%, 90%)', height: '100%' },
        '.cm-gutters': { backgroundColor: 'hsl(225, 28%, 10%)', color: 'hsl(45, 15%, 60%)', borderRight: '1px solid hsl(43, 60%, 30%)' },
        '.cm-activeLineGutter': { backgroundColor: 'hsl(225, 25%, 14%)' },
        '.cm-activeLine': { backgroundColor: 'hsl(225, 25%, 12%)' },
        '.cm-cursor': { borderLeftColor: 'hsl(195, 100%, 50%)' },
        '.cm-selectionBackground': { backgroundColor: 'rgba(0, 191, 255, 0.15) !important' },
        '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(0, 191, 255, 0.2) !important' },
      });

      const defaultCode = `// Grudge Studio Code Playground
// Access the 3D scene via GrudgeEditor3D API:
//   GrudgeEditor3D.getScene()
//   GrudgeEditor3D.getCamera()
//   GrudgeEditor3D.getSelected()
//   GrudgeEditor3D.getObjects()

const scene = GrudgeEditor3D.getScene();
console.log('Scene children:', scene?.children?.length || 0);
`;

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          history(),
          syntaxHighlighting(defaultHighlightStyle),
          javascript(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          darkTheme,
          EditorView.lineWrapping,
        ],
      });

      editorView = new EditorView({ state, parent: mount });
      cmLoaded = true;
    } catch (err) {
      // Fallback: plain textarea
      const mount = document.getElementById('codeEditorMount');
      if (mount) {
        mount.innerHTML = `<textarea id="codeFallback" style="width:100%;height:100%;background:hsl(225,30%,6%);color:hsl(45,30%,90%);border:none;padding:0.8rem;font-family:'JetBrains Mono',monospace;font-size:0.85rem;resize:none">// Code Playground (CodeMirror failed to load)\n// ${err.message}\n</textarea>`;
      }
      cmLoaded = true; // mark as loaded so we don't retry
    }
  }

  /* ---------- Get code from editor ---------- */
  function getCode() {
    if (editorView) return editorView.state.doc.toString();
    const fallback = document.getElementById('codeFallback');
    return fallback ? fallback.value : '';
  }

  function setCode(code) {
    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: code },
      });
    } else {
      const fallback = document.getElementById('codeFallback');
      if (fallback) fallback.value = code;
    }
  }

  /* ---------- Run code ---------- */
  function runCode() {
    const output = document.getElementById('codeOutput');
    const code = getCode();
    if (!code.trim()) return;

    // Capture console.log
    const logs = [];
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    console.log = (...args) => { logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')); origLog(...args); };
    console.warn = (...args) => { logs.push('⚠ ' + args.join(' ')); origWarn(...args); };
    console.error = (...args) => { logs.push('❌ ' + args.join(' ')); origError(...args); };

    try {
      const THREE = window.THREE; // available from importmap
      const result = new Function('THREE', 'GrudgeEditor3D', 'puter', code)(
        THREE, window.GrudgeEditor3D, typeof puter !== 'undefined' ? puter : null
      );
      if (result !== undefined) logs.push('→ ' + String(result));
    } catch (err) {
      logs.push('❌ ' + err.message);
    }

    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;

    if (output) output.textContent = logs.join('\n') || '(no output)';
  }

  /* ---------- Save / Load scripts ---------- */
  async function saveScript() {
    const nameInput = document.getElementById('codeScriptName');
    const name = nameInput?.value?.trim();
    if (!name) return alert('Enter a script name');
    try {
      await puter.kv.set(`grudge:script:${name}`, getCode());
      refreshScriptList();
      if (window.GrudgeStudio?.logActivity) window.GrudgeStudio.logActivity(`Script "${name}" saved`);
    } catch (e) { alert('Save error: ' + e.message); }
  }

  async function loadScript() {
    const select = document.getElementById('codeScriptSelect');
    const name = select?.value;
    if (!name) return;
    try {
      const code = await puter.kv.get(`grudge:script:${name}`);
      if (code) {
        setCode(typeof code === 'string' ? code : JSON.stringify(code));
        const nameInput = document.getElementById('codeScriptName');
        if (nameInput) nameInput.value = name;
      }
    } catch (e) { alert('Load error: ' + e.message); }
  }

  async function refreshScriptList() {
    const select = document.getElementById('codeScriptSelect');
    if (!select) return;
    try {
      const keys = await puter.kv.list();
      const scriptKeys = (Array.isArray(keys) ? keys : [])
        .map(k => typeof k === 'string' ? k : k.key)
        .filter(k => k?.startsWith('grudge:script:'));

      select.innerHTML = '<option value="">New Script</option>' +
        scriptKeys.map(k => {
          const name = k.replace('grudge:script:', '');
          return `<option value="${name}">${name}</option>`;
        }).join('');
    } catch { /* non-critical */ }
  }

  /* ---------- Wire buttons ---------- */
  function wireControls() {
    document.getElementById('codeRunBtn')?.addEventListener('click', runCode);
    document.getElementById('codeSaveBtn')?.addEventListener('click', saveScript);
    document.getElementById('codeLoadBtn')?.addEventListener('click', loadScript);
    document.getElementById('codeScriptSelect')?.addEventListener('change', loadScript);
  }

  /* ---------- Hook into navigation ---------- */
  const observer = new MutationObserver(() => {
    const codeView = document.getElementById('view-code');
    if (codeView && codeView.classList.contains('active')) {
      if (!cmLoaded) {
        loadCodeMirror().then(() => {
          wireControls();
          refreshScriptList();
        });
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const main = document.querySelector('.main-content');
      if (main) observer.observe(main, { attributes: true, subtree: true, attributeFilter: ['class'] });
    });
  } else {
    const main = document.querySelector('.main-content');
    if (main) observer.observe(main, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  window.GrudgeCode = { run: runCode, getCode, setCode };
})();
