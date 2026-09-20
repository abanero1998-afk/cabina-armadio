import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08, ...extra });
}
function logoN() {
  const g = new THREE.Group();
  const m = mat(0xf2f2f2, { roughness: 0.35, metalness: 0.2 });
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.02), m); a.position.x = -0.055;
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.02), m); b.position.x = 0.055;
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.02), m); c.rotation.z = -0.55;
  g.add(a, b, c); return g;
}
export function buildNB1000(scale = 1) {
  const shoe = new THREE.Group();
  const black = mat(0x161616, { roughness: 0.48 });
  const mesh = mat(0x1c1c1c, { roughness: 0.72 });
  const grey = mat(0x8a8f96, { roughness: 0.4 });
  const greyD = mat(0x5c6168, { roughness: 0.45 });
  const white = mat(0xe8e8e8, { roughness: 0.3 });
  const outsole = mat(0x111111, { roughness: 0.8 });
  const sole1 = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.07, 0.38), outsole); sole1.position.set(0.02, 0.035, 0); sole1.castShadow = true;
  const sole2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.36), greyD); sole2.position.set(0.02, 0.1, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.018, 0.37), white); stripe.position.set(0.02, 0.145, 0);
  const sole3 = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.09, 0.34), grey); sole3.position.set(0.03, 0.195, 0);
  shoe.add(sole1, sole2, stripe, sole3);
  const heelStack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.34), grey); heelStack.position.set(-0.28, 0.2, 0); shoe.add(heelStack);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.42, 8, 16), mesh); upper.rotation.z = Math.PI / 2; upper.position.set(0.06, 0.34, 0); upper.scale.set(1, 0.95, 0.82); shoe.add(upper);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), black); toe.scale.set(1.15, 0.7, 0.95); toe.position.set(0.36, 0.28, 0); shoe.add(toe);
  const mud = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.33), greyD); mud.position.set(0.08, 0.26, 0); shoe.add(mud);
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.08), black); tongue.position.set(-0.02, 0.48, 0); tongue.rotation.z = -0.35; shoe.add(tongue);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 8, 16), black); collar.rotation.x = Math.PI / 2; collar.position.set(-0.22, 0.4, 0); shoe.add(collar);
  const n = logoN(); n.position.set(0.05, 0.36, 0.16); shoe.add(n);
  const n2 = logoN(); n2.position.set(0.05, 0.36, -0.16); n2.rotation.y = Math.PI; shoe.add(n2);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.16), black); tab.position.set(-0.42, 0.38, 0); shoe.add(tab);
  shoe.scale.setScalar(scale); shoe.userData.model = "nb1000"; return shoe;
}
export function initShoe360(canvas) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x14100c);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20); camera.position.set(1.15, 0.55, 1.35);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true;
  const pair = new THREE.Group();
  const left = buildNB1000(1); left.position.set(0, 0, 0.18); left.rotation.y = 0.18;
  const right = buildNB1000(1); right.position.set(0.05, 0, -0.22); right.rotation.y = -0.35;
  pair.add(left, right); pair.position.y = -0.15; scene.add(pair);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), new THREE.MeshStandardMaterial({ color: 0x2a211a, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x1a120c, 0.85));
  const key = new THREE.SpotLight(0xffe6c2, 16, 10, Math.PI / 5, 0.4); key.position.set(1.2, 2.2, 1.4); key.castShadow = true; scene.add(key);
  const rim = new THREE.PointLight(0xc9a36a, 5, 6); rim.position.set(-1.2, 1.2, -0.8); scene.add(rim);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.target.set(0, 0.28, 0);
  controls.autoRotate = true; controls.autoRotateSpeed = 2.4;
  controls.minDistance = 0.9; controls.maxDistance = 3.2;
  function resize() {
    const w = canvas.clientWidth || 400; const h = canvas.clientHeight || 400;
    camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
  }
  resize(); window.addEventListener("resize", resize);
  let live = true;
  (function loop() { if (!live) return; requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
  return { setMotion(on) { controls.autoRotate = on; }, isMoving() { return controls.autoRotate; }, dispose() { live = false; renderer.dispose(); } };
}
