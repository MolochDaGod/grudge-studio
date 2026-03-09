/* ============================================
   GRUDGE STUDIO — 3D Game Engine
   Three.js + TransformControls + GLTF + Multi-Scene
   ============================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(function () {
  'use strict';

  let scene, camera, renderer, orbit, transform;
  let raycaster, mouse;
  let selected = null;
  let objects = [];
  let initialized = false;
  let sceneName = 'untitled';
  let gridHelper, snapEnabled = false, snapValue = 0.5;
  let undoStack = [], redoStack = [];
  const gltfLoader = new GLTFLoader();

  const PRIM_TYPES = ['box','sphere','cylinder','plane','torus','cone','capsule'];

  /* ========== INIT ========== */
  function init() {
    if (initialized) return;
    const container = document.getElementById('viewport3d');
    if (!container) return;

    const layout = container.closest('.editor3d-layout');
    if (layout) layout.classList.add('theme-engine');

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d15);
    scene.fog = new THREE.FogExp2(0x0d0d15, 0.02);

    camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
    camera.position.set(8, 6, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;

    transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('dragging-changed', e => { orbit.enabled = !e.value; });
    transform.addEventListener('objectChange', () => { updatePropsPanel(); });
    scene.add(transform);

    gridHelper = new THREE.GridHelper(40, 40, 0x334455, 0x1a1a2e);
    scene.add(gridHelper);

    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffeedd, 0.9);
    dir.position.set(8, 15, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    scene.add(dir);
    const hemi = new THREE.HemisphereLight(0x88aacc, 0x332211, 0.4);
    scene.add(hemi);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', onCanvasClick);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);

    buildToolbar();
    initialized = true;
    animate();
  }

  /* ========== TOOLBAR ========== */
  function buildToolbar() {
    const toolbar = document.querySelector('.editor3d-toolbar');
    if (!toolbar) return;

    toolbar.innerHTML = `
      <button class="tool-btn" data-tool="box" title="Box">◻️ Box</button>
      <button class="tool-btn" data-tool="sphere" title="Sphere">🔵 Sphere</button>
      <button class="tool-btn" data-tool="cylinder" title="Cylinder">🔷 Cyl</button>
      <button class="tool-btn" data-tool="plane" title="Plane">▬ Plane</button>
      <button class="tool-btn" data-tool="torus" title="Torus">⭕ Torus</button>
      <button class="tool-btn" data-tool="cone" title="Cone">▲ Cone</button>
      <button class="tool-btn" data-tool="light" title="Point Light">💡 Light</button>
      <span class="toolbar-sep"></span>
      <div class="transform-mode-bar">
        <button class="transform-mode-btn active" data-mode="translate" title="Translate (T)">T</button>
        <button class="transform-mode-btn" data-mode="rotate" title="Rotate (R)">R</button>
        <button class="transform-mode-btn" data-mode="scale" title="Scale (S)">S</button>
      </div>
      <span class="toolbar-sep"></span>
      <button class="tool-btn" data-tool="import" title="Import GLTF/GLB">📥 Import</button>
      <button class="tool-btn" data-tool="delete" title="Delete (Del)">🗑️ Del</button>
      <span class="toolbar-sep"></span>
      <input class="scene-name-input" id="sceneNameInput" value="${sceneName}" placeholder="Scene name">
      <button class="tool-btn" id="sceneSaveBtn" title="Save (Ctrl+S)">💾 Save</button>
      <button class="tool-btn" id="sceneLoadBtn" title="Load">📂 Load</button>
      <button class="tool-btn" id="sceneExportBtn" title="Export JSON">📤 Export</button>
      <span class="toolbar-sep"></span>
      <button class="tool-btn" data-tool="cam-front" title="Front View">🎯 Front</button>
      <button class="tool-btn" data-tool="cam-top" title="Top View">⬆ Top</button>
      <button class="tool-btn" data-tool="cam-side" title="Side View">➡ Side</button>
      <button class="tool-btn" data-tool="snap" title="Toggle Snap" id="snapBtn">🧲 Snap</button>
      <button class="tool-btn" data-tool="undo" title="Undo (Ctrl+Z)">↩ Undo</button>
      <button class="tool-btn" data-tool="redo" title="Redo (Ctrl+Y)">↪ Redo</button>
    `;

    toolbar.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => handleTool(btn.dataset.tool));
    });
    toolbar.querySelectorAll('.transform-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setTransformMode(btn.dataset.mode));
    });
    document.getElementById('sceneSaveBtn')?.addEventListener('click', saveScene);
    document.getElementById('sceneLoadBtn')?.addEventListener('click', showScenePicker);
    document.getElementById('sceneExportBtn')?.addEventListener('click', exportScene);
    document.getElementById('sceneNameInput')?.addEventListener('change', (e) => {
      sceneName = e.target.value.trim() || 'untitled';
    });
  }

  function handleTool(tool) {
    if (PRIM_TYPES.includes(tool)) { pushUndo(); addPrimitive(tool); }
    else if (tool === 'light')  { pushUndo(); addPointLight(); }
    else if (tool === 'delete') { pushUndo(); deleteSelected(); }
    else if (tool === 'import') { importModel(); }
    else if (tool === 'snap')   { toggleSnap(); }
    else if (tool === 'undo')   { undo(); }
    else if (tool === 'redo')   { redo(); }
    else if (tool === 'cam-front') { setCameraPreset('front'); }
    else if (tool === 'cam-top')   { setCameraPreset('top'); }
    else if (tool === 'cam-side')  { setCameraPreset('side'); }
  }

  /* ========== TRANSFORM MODES ========== */
  function setTransformMode(mode) {
    transform.setMode(mode);
    document.querySelectorAll('.transform-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  /* ========== CAMERA PRESETS ========== */
  function setCameraPreset(preset) {
    const target = selected ? selected.position.clone() : new THREE.Vector3(0, 0, 0);
    const dist = 12;
    if (preset === 'front') camera.position.set(target.x, target.y + 2, target.z + dist);
    if (preset === 'top')   camera.position.set(target.x, target.y + dist, target.z + 0.01);
    if (preset === 'side')  camera.position.set(target.x + dist, target.y + 2, target.z);
    orbit.target.copy(target);
    orbit.update();
  }

  function focusSelected() {
    if (!selected) return;
    const box = new THREE.Box3().setFromObject(selected);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const dist = Math.max(size * 2, 3);
    camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.7);
    orbit.target.copy(center);
    orbit.update();
  }

  /* ========== SNAP ========== */
  function toggleSnap() {
    snapEnabled = !snapEnabled;
    const btn = document.getElementById('snapBtn');
    if (btn) btn.classList.toggle('active', snapEnabled);
    transform.setTranslationSnap(snapEnabled ? snapValue : null);
    transform.setRotationSnap(snapEnabled ? THREE.MathUtils.degToRad(15) : null);
    transform.setScaleSnap(snapEnabled ? 0.25 : null);
    log(snapEnabled ? 'Snap ON' : 'Snap OFF');
  }

  /* ========== UNDO / REDO ========== */
  function pushUndo() {
    undoStack.push(serializeScene());
    if (undoStack.length > 40) undoStack.shift();
    redoStack = [];
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(serializeScene());
    restoreScene(undoStack.pop());
    log('Undo');
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(serializeScene());
    restoreScene(redoStack.pop());
    log('Redo');
  }

  /* ========== KEYBOARD ========== */
  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 't' || e.key === 'T') setTransformMode('translate');
    if (e.key === 'r' && !e.ctrlKey) setTransformMode('rotate');
    if (e.key === 's' && !e.ctrlKey) setTransformMode('scale');
    if (e.key === 'f' || e.key === 'F') focusSelected();
    if (e.key === 'Delete' || e.key === 'Backspace') { pushUndo(); deleteSelected(); }
    if (e.key === 'g' || e.key === 'G') toggleSnap();
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveScene(); }
  }

  /* ========== ANIMATE ========== */
  function animate() { requestAnimationFrame(animate); orbit.update(); renderer.render(scene, camera); }

  function onResize() {
    const container = document.getElementById('viewport3d');
    if (!container || !renderer) return;
    const w = container.clientWidth; const h = container.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  }

  /* ========== SELECTION ========== */
  function onCanvasClick(e) {
    if (transform.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(objects, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj.parent && !objects.includes(obj)) obj = obj.parent;
      if (objects.includes(obj)) selectObject(obj);
    } else { deselectAll(); }
  }

  function selectObject(obj) {
    deselectAll();
    selected = obj;
    if (obj.material && obj.material.emissive) {
      obj._origEmissive = obj.material.emissive.getHex();
      obj.material.emissive.setHex(0x1a3a5c);
    }
    transform.attach(obj);
    updatePropsPanel();
    updateSceneList();
  }

  function deselectAll() {
    if (selected) {
      if (selected.material && selected.material.emissive) selected.material.emissive.setHex(selected._origEmissive || 0);
      transform.detach();
    }
    selected = null;
    updatePropsPanel();
    updateSceneList();
  }

  /* ========== PRIMITIVES ========== */
  const MAT = () => new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, roughness: 0.5, metalness: 0.3 });

  function makeGeo(type) {
    switch (type) {
      case 'box':      return new THREE.BoxGeometry(1, 1, 1);
      case 'sphere':   return new THREE.SphereGeometry(0.6, 32, 32);
      case 'cylinder': return new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32);
      case 'plane':    return new THREE.PlaneGeometry(2, 2);
      case 'torus':    return new THREE.TorusGeometry(0.5, 0.2, 16, 48);
      case 'cone':     return new THREE.ConeGeometry(0.5, 1.2, 32);
      case 'capsule':  return new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
      default: return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  function addPrimitive(type) {
    const mesh = new THREE.Mesh(makeGeo(type), MAT());
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.set((Math.random() - 0.5) * 6, type === 'plane' ? 0.01 : 0.5, (Math.random() - 0.5) * 6);
    if (type === 'plane') mesh.rotation.x = -Math.PI / 2;
    mesh.name = `${type}_${objects.length}`;
    mesh.userData._type = type;
    scene.add(mesh); objects.push(mesh);
    selectObject(mesh);
    log(`Added ${type}`);
  }

  function addPointLight() {
    const light = new THREE.PointLight(0xffffff, 1, 20);
    light.castShadow = true;
    light.position.set((Math.random() - 0.5) * 6, 3, (Math.random() - 0.5) * 6);
    light.name = `light_${objects.length}`;
    light.userData._type = 'pointlight';
    const helper = new THREE.PointLightHelper(light, 0.3);
    scene.add(light); scene.add(helper);
    light.userData._helper = helper;
    objects.push(light);
    log('Added point light');
    updateSceneList();
  }

  function deleteSelected() {
    if (!selected) return;
    transform.detach();
    scene.remove(selected);
    if (selected.userData._helper) scene.remove(selected.userData._helper);
    objects = objects.filter(o => o !== selected);
    log(`Deleted ${selected.name}`);
    selected = null;
    updatePropsPanel(); updateSceneList();
  }

  /* ========== IMPORT GLTF ========== */
  async function importModel() {
    try {
      if (typeof puter !== 'undefined' && puter.ui && puter.ui.showOpenFilePicker) {
        const file = await puter.ui.showOpenFilePicker({ accept: '.glb,.gltf' });
        if (file && file.content) { loadGLTF(URL.createObjectURL(new Blob([file.content])), file.name || 'model'); return; }
      }
    } catch { /* fallback */ }
    const url = prompt('Enter GLTF/GLB URL:');
    if (url) loadGLTF(url, 'imported_model');
  }

  function loadGLTF(url, name) {
    gltfLoader.load(url, (gltf) => {
      const model = gltf.scene;
      model.name = name.replace(/\.(glb|gltf)$/i, '') + '_' + objects.length;
      model.userData._type = 'gltf';
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3()).length();
      if (size > 10) model.scale.setScalar(5 / size);
      scene.add(model); objects.push(model);
      selectObject(model); pushUndo();
      log(`Imported ${name}`);
    }, undefined, (err) => { log('Import error: ' + err.message); });
  }

  /* ========== PROPERTIES PANEL ========== */
  function updatePropsPanel() {
    const panel = document.getElementById('propsPanel');
    if (!panel) return;
    if (!selected) { panel.innerHTML = '<p class="muted">Select an object to see properties</p>'; return; }
    const p = selected.position, r = selected.rotation, s = selected.scale;
    const hasMat = selected.material && selected.material.color;
    const color = hasMat ? '#' + selected.material.color.getHexString() : '#ffffff';

    panel.innerHTML = `
      <div class="props-row"><label>Name</label><input value="${selected.name}" data-prop="name"></div>
      <div class="props-row"><label>Pos</label>
        <input type="number" step="0.1" value="${p.x.toFixed(2)}" data-prop="px">
        <input type="number" step="0.1" value="${p.y.toFixed(2)}" data-prop="py">
        <input type="number" step="0.1" value="${p.z.toFixed(2)}" data-prop="pz">
      </div>
      <div class="props-row"><label>Rot</label>
        <input type="number" step="0.1" value="${r.x.toFixed(2)}" data-prop="rx">
        <input type="number" step="0.1" value="${r.y.toFixed(2)}" data-prop="ry">
        <input type="number" step="0.1" value="${r.z.toFixed(2)}" data-prop="rz">
      </div>
      <div class="props-row"><label>Scale</label>
        <input type="number" step="0.1" value="${s.x.toFixed(2)}" data-prop="sx">
        <input type="number" step="0.1" value="${s.y.toFixed(2)}" data-prop="sy">
        <input type="number" step="0.1" value="${s.z.toFixed(2)}" data-prop="sz">
      </div>
      ${hasMat ? `
      <div class="props-row"><label>Color</label><input type="color" value="${color}" data-prop="color"></div>
      <div class="props-row"><label>Rough</label><input type="range" min="0" max="1" step="0.05" value="${selected.material.roughness ?? 0.5}" data-prop="roughness" style="width:100px"></div>
      <div class="props-row"><label>Metal</label><input type="range" min="0" max="1" step="0.05" value="${selected.material.metalness ?? 0.3}" data-prop="metalness" style="width:100px"></div>` : ''}`;

    panel.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => { pushUndo(); applyProp(inp.dataset.prop, inp.value); });
    });
  }

  function applyProp(prop, val) {
    if (!selected) return;
    const n = parseFloat(val);
    if (prop === 'name') { selected.name = val; updateSceneList(); return; }
    if (prop.startsWith('p')) selected.position[prop[1] === 'x' ? 'x' : prop[1] === 'y' ? 'y' : 'z'] = n;
    else if (prop.startsWith('r')) selected.rotation[prop[1] === 'x' ? 'x' : prop[1] === 'y' ? 'y' : 'z'] = n;
    else if (prop.startsWith('s') && prop !== 'color') selected.scale[prop[1] === 'x' ? 'x' : prop[1] === 'y' ? 'y' : 'z'] = n;
    if (prop === 'color' && selected.material) selected.material.color.set(val);
    if (prop === 'roughness' && selected.material) selected.material.roughness = n;
    if (prop === 'metalness' && selected.material) selected.material.metalness = n;
  }

  /* ========== SCENE LIST ========== */
  function updateSceneList() {
    const list = document.getElementById('sceneList');
    if (!list) return;
    if (!objects.length) { list.innerHTML = '<p class="muted">No objects</p>'; return; }
    const icons = { box:'◻️', sphere:'🔵', cylinder:'🔷', plane:'▬', torus:'⭕', cone:'▲', capsule:'💊', pointlight:'💡', gltf:'📦' };
    list.innerHTML = objects.map((o, i) => `
      <div class="scene-item${o === selected ? ' selected' : ''}" data-idx="${i}">
        ${icons[o.userData._type] || '❓'} ${o.name}
      </div>`).join('');
    list.querySelectorAll('.scene-item').forEach(el => {
      el.addEventListener('click', () => selectObject(objects[parseInt(el.dataset.idx)]));
    });
  }

  /* ========== SERIALIZE ========== */
  function serializeScene() {
    return objects.map(o => ({
      type: o.userData._type, name: o.name,
      position: [o.position.x, o.position.y, o.position.z],
      rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
      scale: [o.scale.x, o.scale.y, o.scale.z],
      color: o.material?.color ? '#' + o.material.color.getHexString() : '#ffffff',
      roughness: o.material?.roughness ?? 0.5, metalness: o.material?.metalness ?? 0.3,
    }));
  }

  function restoreScene(data) {
    clearScene();
    data.forEach(d => {
      if (d.type === 'pointlight') {
        const l = new THREE.PointLight(new THREE.Color(d.color), 1, 20);
        l.position.set(...d.position); l.name = d.name; l.userData._type = 'pointlight';
        const h = new THREE.PointLightHelper(l, 0.3);
        scene.add(l); scene.add(h); l.userData._helper = h; objects.push(l);
      } else if (d.type === 'gltf') {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({ color: 0x888888, wireframe: true }));
        mesh.position.set(...d.position); mesh.rotation.set(...d.rotation); mesh.scale.set(...d.scale);
        mesh.name = d.name + ' (placeholder)'; mesh.userData._type = 'gltf';
        scene.add(mesh); objects.push(mesh);
      } else {
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color), roughness: d.roughness ?? 0.5, metalness: d.metalness ?? 0.3 });
        const mesh = new THREE.Mesh(makeGeo(d.type), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.position.set(...d.position); mesh.rotation.set(...d.rotation); mesh.scale.set(...d.scale);
        mesh.name = d.name; mesh.userData._type = d.type;
        scene.add(mesh); objects.push(mesh);
      }
    });
    updateSceneList();
  }

  /* ========== SAVE / LOAD / EXPORT ========== */
  async function saveScene() {
    const nameInput = document.getElementById('sceneNameInput');
    if (nameInput) sceneName = nameInput.value.trim() || 'untitled';
    try {
      await puter.kv.set(`grudge:scene:${sceneName}`, JSON.stringify(serializeScene()));
      log(`Scene "${sceneName}" saved`);
    } catch (e) { log('Save error: ' + e.message); }
  }

  async function showScenePicker() {
    try {
      const keys = await puter.kv.list();
      const sceneKeys = (Array.isArray(keys) ? keys : []).map(k => typeof k === 'string' ? k : k.key).filter(k => k?.startsWith('grudge:scene:'));
      if (!sceneKeys.length) return log('No saved scenes found');
      const name = prompt('Load scene:\\n' + sceneKeys.map(k => k.replace('grudge:scene:', '')).join('\\n'));
      if (name) await loadSceneByName(name);
    } catch (e) { log('Error: ' + e.message); }
  }

  async function loadSceneByName(name) {
    try {
      const raw = await puter.kv.get(`grudge:scene:${name}`);
      if (!raw) return log(`Scene "${name}" not found`);
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      pushUndo(); restoreScene(data);
      sceneName = name;
      const inp = document.getElementById('sceneNameInput');
      if (inp) inp.value = name;
      log(`Loaded "${name}" (${data.length} objects)`);
    } catch (e) { log('Load error: ' + e.message); }
  }

  function clearScene() {
    transform.detach();
    objects.forEach(o => { scene.remove(o); if (o.userData._helper) scene.remove(o.userData._helper); });
    objects = []; selected = null;
    updatePropsPanel(); updateSceneList();
  }

  function exportScene() {
    const json = JSON.stringify({ name: sceneName, objects: serializeScene() }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `grudge_scene_${sceneName}.json`;
    a.click();
    log('Scene exported');
  }

  function log(msg) { if (window.GrudgeStudio) window.GrudgeStudio.logActivity('[3D] ' + msg); }

  /* ========== PUBLIC ========== */
  window.GrudgeEditor3D = {
    onShow() { if (!initialized) init(); else onResize(); },
    getScene: () => scene, getCamera: () => camera,
    getSelected: () => selected, getObjects: () => objects,
  };
})();
