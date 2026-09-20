import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const WOOD = 0x6b4a32;
const WOOD_D = 0x3d2a1c;
const WOOD_L = 0x8b6244;
const GOLD = 0xc9a36a;
const MARBLE = 0xeee4d8;
const CREAM = 0x1a140f;

let renderer, scene, camera, controls, clock;
let garmentGroup = new THREE.Group();
let hanging = [];
let getItems = () => [];
let texCache = new Map();

function woodMat(color = WOOD) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.08 });
}
function goldMat() {
  return new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.28, metalness: 0.85 });
}
function addBox(parent, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function buildRoom() {
  const room = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(8.4, 0.08, 6.2),
    new THREE.MeshStandardMaterial({ color: 0xd9cbb8, roughness: 0.45, metalness: 0.05 })
  );
  floor.position.y = 0;
  floor.receiveShadow = true;
  room.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a211b, roughness: 0.9 });
  addBox(room, 8.4, 3.2, 0.08, 0, 1.64, -3.05, wallMat);
  addBox(room, 0.08, 3.2, 6.2, -4.16, 1.64, 0, wallMat);
  addBox(room, 0.08, 3.2, 6.2, 4.16, 1.64, 0, wallMat);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.06, 6.2), new THREE.MeshStandardMaterial({ color: 0x241c16, roughness: 1 }));
  ceil.position.y = 3.22;
  room.add(ceil);
  const led = new THREE.MeshStandardMaterial({ color: 0xffe6b8, emissive: 0xffd089, emissiveIntensity: 1.4, roughness: 0.4 });
  [[-2.2, 3.12, 0], [0, 3.12, 0], [2.2, 3.12, 0]].forEach(([x, y, z]) => {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), led);
    s.rotation.x = -Math.PI / 2;
    s.position.set(x, y, z);
    room.add(s);
  });
  const w = woodMat();
  const wd = woodMat(WOOD_D);
  addBox(room, 0.42, 2.9, 5.4, -3.72, 1.5, 0, w);
  for (let i = 0; i < 4; i++) addBox(room, 0.38, 0.04, 1.15, -3.52, 0.35 + i * 0.55, 1.7, w);
  const rodL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.6, 16), goldMat());
  rodL.rotation.z = Math.PI / 2;
  rodL.position.set(-3.42, 2.15, -0.7);
  room.add(rodL);
  const rodL2 = rodL.clone(); rodL2.position.y = 1.15; room.add(rodL2);
  addBox(room, 5.2, 2.9, 0.42, 0, 1.5, -2.78, w);
  const rodB = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 4.6, 16), goldMat());
  rodB.rotation.z = Math.PI / 2;
  rodB.position.set(0, 2.35, -2.52);
  room.add(rodB);
  for (let i = -2; i <= 2; i++) addBox(room, 0.9, 0.04, 0.36, i * 1.0, 0.55, -2.58, w);
  addBox(room, 0.42, 2.9, 5.4, 3.72, 1.5, 0, w);
  for (let row = 0; row < 6; row++) {
    addBox(room, 0.36, 0.035, 5.0, 3.52, 0.42 + row * 0.42, 0, woodMat(WOOD_L));
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 4.8), led);
    strip.position.set(3.34, 0.45 + row * 0.42, 0);
    room.add(strip);
  }
  addBox(room, 1.7, 0.82, 1.05, 0, 0.45, 0.35, wd);
  addBox(room, 1.82, 0.05, 1.16, 0, 0.88, 0.35, new THREE.MeshStandardMaterial({ color: MARBLE, roughness: 0.22, metalness: 0.12 }));
  [[-0.55, 0.35], [0.55, 0.35]].forEach(([x]) => addBox(room, 0.62, 0.04, 0.9, x, 0.62, 0.35, goldMat()));
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.2), new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: 0.9, roughness: 0.08 }));
  mirror.position.set(2.2, 1.45, -2.82); room.add(mirror);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.28, 0.04), goldMat());
  frame.position.set(2.2, 1.45, -2.84); room.add(frame);
  return room;
}

function zoneFor(cat) {
  if (["Scarpe"].includes(cat)) return "shoes";
  if (["Borse", "Accessori"].includes(cat)) return "bags";
  if (["Abiti", "Cappotti"].includes(cat)) return "long";
  if (["Pantaloni", "Gonne"].includes(cat)) return "pants";
  return "short";
}

function loadTexture(dataUrl) {
  if (texCache.has(dataUrl)) return Promise.resolve(texCache.get(dataUrl));
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(dataUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      texCache.set(dataUrl, tex);
      resolve(tex);
    }, undefined, () => resolve(null));
  });
}

async function makeGarment(item, index, totalInZone) {
  const group = new THREE.Group();
  group.userData.item = item;
  group.userData.phase = Math.random() * Math.PI * 2;
  const zone = zoneFor(item.cat);
  let w = 0.42, h = 0.72;
  if (zone === "long") { w = 0.46; h = 1.15; }
  if (zone === "shoes") { w = 0.34; h = 0.28; }
  if (zone === "bags") { w = 0.32; h = 0.32; }
  if (zone === "pants") { w = 0.38; h = 0.62; }
  let mat;
  if (item.photo) {
    const tex = await loadTexture(item.photo);
    mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide, alphaTest: 0.08 });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: 0xcfc0ae, roughness: 0.7, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  }
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plane.castShadow = true;
  group.add(plane);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 16, Math.PI), goldMat());
  hook.rotation.y = Math.PI / 2;
  hook.position.y = h / 2 + 0.04;
  if (zone === "short" || zone === "long" || zone === "pants") group.add(hook);
  const t = totalInZone <= 1 ? 0.5 : index / Math.max(1, totalInZone - 1);
  if (zone === "short") { group.position.set(-3.28, 1.72, -1.8 + t * 2.2); group.rotation.y = Math.PI / 2; }
  else if (zone === "pants") { group.position.set(-3.28, 0.82, -1.8 + t * 2.2); group.rotation.y = Math.PI / 2; }
  else if (zone === "long") { group.position.set(-2.0 + t * 4.0, 1.72, -2.48); }
  else if (zone === "shoes") {
    const col = index % 6; const row = Math.floor(index / 6) % 6;
    group.position.set(3.32, 0.58 + row * 0.42, -2.1 + col * 0.72);
    group.rotation.y = -Math.PI / 2;
  } else {
    const col = index % 3; const row = Math.floor(index / 3);
    if (row === 0) group.position.set(-0.48 + col * 0.48, 1.12, 0.35);
    else group.position.set(-3.28, 0.55 + (row - 1) * 0.55, 1.35 + (col - 1) * 0.55);
  }
  hanging.push(group);
  garmentGroup.add(group);
}

export async function refreshGarments(items) {
  hanging = [];
  while (garmentGroup.children.length) {
    const ch = garmentGroup.children.pop();
    ch.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
  const zones = { short: [], pants: [], long: [], shoes: [], bags: [] };
  (items || []).forEach(it => zones[zoneFor(it.cat)].push(it));
  for (const z of Object.keys(zones)) {
    for (let i = 0; i < zones[z].length; i++) await makeGarment(zones[z][i], i, zones[z].length);
  }
}

export function initCloset3D(canvas, itemsFn) {
  getItems = itemsFn;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CREAM);
  scene.fog = new THREE.Fog(CREAM, 8, 16);
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 40);
  camera.position.set(3.4, 1.8, 4.2);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene.add(buildRoom());
  scene.add(garmentGroup);
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1c12, 0.7));
  const key = new THREE.SpotLight(0xffe6c2, 18, 14, Math.PI / 4, 0.45, 1.1);
  key.position.set(0.2, 3.0, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.PointLight(0xffd9a0, 6, 10);
  fill.position.set(-2.4, 2.4, 1.2); scene.add(fill);
  const rim = new THREE.PointLight(0xc9a36a, 4, 8);
  rim.position.set(2.6, 2.2, -1.4); scene.add(rim);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 1.15, 0);
  controls.minDistance = 2.2;
  controls.maxDistance = 7.5;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.35;
  clock = new THREE.Clock();
  resize();
  window.addEventListener("resize", resize);
  refreshGarments(getItems());
  loop();
  return {
    setMotion(on) { controls.autoRotate = on; },
    isMoving() { return controls.autoRotate; },
    refresh: () => refreshGarments(getItems())
  };
}

function resize() {
  if (!renderer) return;
  const c = renderer.domElement;
  const w = c.clientWidth || c.parentElement.clientWidth || window.innerWidth;
  const h = c.clientHeight || 420;
  camera.aspect = w / Math.max(180, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  hanging.forEach((g, i) => {
    const z = zoneFor(g.userData.item.cat);
    if (z === "short" || z === "long" || z === "pants") g.rotation.z = Math.sin(t * 1.4 + g.userData.phase) * 0.045;
    else g.position.y += Math.sin(t * 1.2 + i) * 0.00015;
  });
  controls.update();
  renderer.render(scene, camera);
}
