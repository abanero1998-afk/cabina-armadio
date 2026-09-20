import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { buildNB1000 } from "./shoe3d.js";

const LOOKS = {
  casual: { name: "Casual New Balance", top: 0xe8dcc8, bottom: 0xc4b396, skin: 0xc68642, shoes: true },
  classico: { name: "Classico blu", top: 0x3d5a7a, bottom: 0x1a2744, skin: 0xc68642, shoes: false }
};
function m(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.04, ...extra });
}
function limb(h, r, color) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 6, 12), m(color));
  mesh.castShadow = true; return mesh;
}
export function buildAvatar(look = "casual") {
  const L = LOOKS[look] || LOOKS.casual;
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), m(L.skin)); head.position.y = 1.62; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 12, 0, Math.PI * 2, 0, 1.2), m(0x1a120c)); hair.position.y = 1.68; g.add(hair);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.42, 8, 16), m(L.top)); torso.position.y = 1.18; torso.castShadow = true; g.add(torso);
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), m(L.bottom)); hips.position.y = 0.88; g.add(hips);
  const legL = limb(0.42, 0.075, L.bottom); legL.position.set(-0.08, 0.52, 0);
  const legR = limb(0.42, 0.075, L.bottom); legR.position.set(0.08, 0.52, 0);
  const armL = limb(0.32, 0.05, L.top); armL.position.set(-0.26, 1.18, 0); armL.rotation.z = 0.18;
  const armR = limb(0.32, 0.05, L.top); armR.position.set(0.26, 1.18, 0); armR.rotation.z = -0.18;
  g.add(legL, legR, armL, armR);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), m(L.skin)); handL.position.set(-0.32, 0.95, 0);
  const handR = handL.clone(); handR.position.x = 0.32; g.add(handL, handR);
  if (L.shoes) {
    const sl = buildNB1000(0.28); sl.position.set(-0.1, 0.02, 0.04); sl.rotation.y = 0.2;
    const sr = buildNB1000(0.28); sr.position.set(0.1, 0.02, 0.04); sr.rotation.y = -0.2;
    g.add(sl, sr);
  } else {
    const shoe = m(0x111111);
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.22), shoe); sl.position.set(-0.08, 0.04, 0.04);
    const sr = sl.clone(); sr.position.x = 0.08; g.add(sl, sr);
  }
  return g;
}
export function initAvatar3D(canvas, look = "casual") {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x16100c);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20); camera.position.set(1.2, 1.15, 2.4);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), m(0x2a211a, { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  let avatar = buildAvatar(look); scene.add(avatar);
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x1a120c, 0.9));
  const key = new THREE.SpotLight(0xffe6c2, 14, 10, Math.PI / 5, 0.45);
  key.position.set(1.4, 3, 2); key.castShadow = true; scene.add(key);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.target.set(0, 0.95, 0);
  controls.autoRotate = true; controls.autoRotateSpeed = 1.6;
  function resize() {
    const w = canvas.clientWidth || 360, h = canvas.clientHeight || 480;
    camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
  }
  resize(); window.addEventListener("resize", resize);
  let live = true;
  (function loop() { if (!live) return; requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
  return {
    setLook(name) { scene.remove(avatar); avatar = buildAvatar(name); scene.add(avatar); },
    setMotion(on) { controls.autoRotate = on; },
    dispose() { live = false; renderer.dispose(); }
  };
}
