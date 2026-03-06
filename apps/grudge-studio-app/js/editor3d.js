/* ============================================
   GRUDGE STUDIO — 3D Scene Editor
   Three.js + OrbitControls · Save/Load to Puter KV
   ============================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  'use strict';

  const KV_KEY = 'studio_scene';
  let scene, camera, renderer, controls;
  let raycaster, mouse;
  let selected = null;
  let objects = []; // user-added meshes / lights
  let initialized = false;

  /* ---------- init ---------- */
  function init() {
    if (initialized) return;
    const container = document.getElementById('viewport3d');
    if (!container) return;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;

    /* Scene */
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d15);

    /* Camera */
    camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(5, 5, 5);

    /* Renderer */
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    /* Controls */
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    /* Helpers */
    const grid = new THREE.GridHelper(20, 20, 0x333344, 0x222233);
    scene.add(grid);

    /* Lights */
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    /* Raycaster */
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    /* Events */
    renderer.domElement.addEventListener('click', onCanvasClick);
    window.addEventListener('resize', onResize);
    wireToolbar();

    initialized = true;
    animate();
  }

  /* ---------- animate ---------- */
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  /* ---------- resize ---------- */
  function onResize() {
    const container = document.getElementById('viewport3d');
    if (!container || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  /* ---------- selection ---------- */
  function onCanvasClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(objects, false);
    if (hits.length) {
      selectObject(hits[0].object);
    } else {
      deselectAll();
    }
  }

  function selectObject(obj) {
    deselectAll();
    selected = obj;
    if (obj.material && obj.material.emissive) {
      obj._origEmissive = obj.material.emissive.getHex();
      obj.material.emissive.setHex(0xe63946);
    }
    updatePropsPanel();
    updateSceneList();
  }

  function deselectAll() {
    if (selected && selected.material && selected.material.emissive) {
      selected.material.emissive.setHex(selected._origEmissive || 0x000000);
    }
    selected = null;
    updatePropsPanel();
    updateSceneList();
  }

  /* ---------- toolbar ---------- */
  function wireToolbar() {
    document.querySelectorAll('.editor3d-toolbar .tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'cube')     addPrimitive('box');
        if (tool === 'sphere')   addPrimitive('sphere');
        if (tool === 'cylinder') addPrimitive('cylinder');
        if (tool === 'light')    addPointLight();
        if (tool === 'delete')   deleteSelected();
      });
    });

    const saveBtn   = document.getElementById('sceneSaveBtn');
    const loadBtn   = document.getElementById('sceneLoadBtn');
    const exportBtn = document.getElementById('sceneExportBtn');
    if (saveBtn)   saveBtn.addEventListener('click', saveScene);
    if (loadBtn)   loadBtn.addEventListener('click', loadScene);
    if (exportBtn) exportBtn.addEventListener('click', exportScene);
  }

  /* ---------- add primitives ---------- */
  const MAT = () => new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.5,
    metalness: 0.3,
  });

  function addPrimitive(type) {
    let geo;
    if (type === 'box')      geo = new THREE.BoxGeometry(1, 1, 1);
    if (type === 'sphere')   geo = new THREE.SphereGeometry(0.6, 24, 24);
    if (type === 'cylinder') geo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 24);
    const mesh = new THREE.Mesh(geo, MAT());
    mesh.position.set(
      (Math.random() - 0.5) * 6,
      0.5,
      (Math.random() - 0.5) * 6,
    );
    mesh.name = `${type}_${objects.length}`;
    mesh.userData._type = type;
    scene.add(mesh);
    objects.push(mesh);
    selectObject(mesh);
    log(`Added ${type}`);
  }

  function addPointLight() {
    const light = new THREE.PointLight(0xffffff, 1, 15);
    light.position.set(
      (Math.random() - 0.5) * 6,
      3,
      (Math.random() - 0.5) * 6,
    );
    light.name = `light_${objects.length}`;
    light.userData._type = 'pointlight';
    const helper = new THREE.PointLightHelper(light, 0.3);
    scene.add(light);
    scene.add(helper);
    light.userData._helper = helper;
    objects.push(light);
    log('Added point light');
    updateSceneList();
  }

  function deleteSelected() {
    if (!selected) return;
    scene.remove(selected);
    if (selected.userData._helper) scene.remove(selected.userData._helper);
    objects = objects.filter(o => o !== selected);
    log(`Deleted ${selected.name}`);
    selected = null;
    updatePropsPanel();
    updateSceneList();
  }

  /* ---------- props panel ---------- */
  function updatePropsPanel() {
    const panel = document.getElementById('propsPanel');
    if (!panel) return;
    if (!selected) {
      panel.innerHTML = '<p class="muted">Select an object to see properties</p>';
      return;
    }
    const p = selected.position;
    const r = selected.rotation;
    const s = selected.scale;
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
      </div>`;

    panel.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => applyProp(inp.dataset.prop, inp.value));
    });
  }

  function applyProp(prop, val) {
    if (!selected) return;
    const n = parseFloat(val);
    if (prop === 'name') { selected.name = val; updateSceneList(); return; }
    if (prop === 'px') selected.position.x = n;
    if (prop === 'py') selected.position.y = n;
    if (prop === 'pz') selected.position.z = n;
    if (prop === 'rx') selected.rotation.x = n;
    if (prop === 'ry') selected.rotation.y = n;
    if (prop === 'rz') selected.rotation.z = n;
    if (prop === 'sx') selected.scale.x = n;
    if (prop === 'sy') selected.scale.y = n;
    if (prop === 'sz') selected.scale.z = n;
  }

  /* ---------- scene list ---------- */
  function updateSceneList() {
    const list = document.getElementById('sceneList');
    if (!list) return;
    if (objects.length === 0) { list.innerHTML = '<p class="muted">No objects</p>'; return; }
    list.innerHTML = objects.map((o, i) => `
      <div class="scene-item${o === selected ? ' selected' : ''}" data-idx="${i}">
        ${o.userData._type === 'pointlight' ? '💡' : '◻️'} ${o.name}
      </div>`).join('');
    list.querySelectorAll('.scene-item').forEach(el => {
      el.addEventListener('click', () => selectObject(objects[parseInt(el.dataset.idx)]));
    });
  }

  /* ---------- save / load ---------- */
  function serializeScene() {
    return objects.map(o => ({
      type: o.userData._type,
      name: o.name,
      position: [o.position.x, o.position.y, o.position.z],
      rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
      scale: [o.scale.x, o.scale.y, o.scale.z],
      color: o.material ? '#' + o.material.color.getHexString() : '#ffffff',
    }));
  }

  async function saveScene() {
    try {
      await puter.kv.set(KV_KEY, JSON.stringify(serializeScene()));
      log('Scene saved to KV');
    } catch (e) { log('Save error: ' + e.message); }
  }

  async function loadScene() {
    try {
      const raw = await puter.kv.get(KV_KEY);
      if (!raw) return log('No saved scene found');
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      clearScene();
      data.forEach(d => {
        if (d.type === 'pointlight') {
          const l = new THREE.PointLight(new THREE.Color(d.color), 1, 15);
          l.position.set(...d.position);
          l.name = d.name;
          l.userData._type = 'pointlight';
          const h = new THREE.PointLightHelper(l, 0.3);
          scene.add(l);
          scene.add(h);
          l.userData._helper = h;
          objects.push(l);
        } else {
          let geo;
          if (d.type === 'box')      geo = new THREE.BoxGeometry(1, 1, 1);
          if (d.type === 'sphere')   geo = new THREE.SphereGeometry(0.6, 24, 24);
          if (d.type === 'cylinder') geo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 24);
          if (!geo) return;
          const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color), roughness: 0.5, metalness: 0.3 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(...d.position);
          mesh.rotation.set(...d.rotation);
          mesh.scale.set(...d.scale);
          mesh.name = d.name;
          mesh.userData._type = d.type;
          scene.add(mesh);
          objects.push(mesh);
        }
      });
      updateSceneList();
      log(`Loaded ${data.length} objects`);
    } catch (e) { log('Load error: ' + e.message); }
  }

  function clearScene() {
    objects.forEach(o => {
      scene.remove(o);
      if (o.userData._helper) scene.remove(o.userData._helper);
    });
    objects = [];
    selected = null;
    updatePropsPanel();
    updateSceneList();
  }

  function exportScene() {
    const json = JSON.stringify(serializeScene(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'grudge_scene.json';
    a.click();
    log('Scene exported');
  }

  /* ---------- helpers ---------- */
  function log(msg) {
    if (window.GrudgeStudio) window.GrudgeStudio.logActivity('[3D] ' + msg);
  }

  /* ---------- public ---------- */
  window.GrudgeEditor3D = {
    onShow() {
      if (!initialized) init();
      else onResize();
    },
  };
})();
