/* ALIEN FRUIT — a XenoHarvest Corp. field assignment.
   Single-file Three.js game. Textures generated with gpt-image-2. */
"use strict";

const $ = (id) => document.getElementById(id);

// ---------- Renderer / scene bootstrap ----------
const canvas = $("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07030f);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ---------- Title backdrop: drifting bioluminescent spores ----------
const sporeCount = 260;
const sporeGeo = new THREE.BufferGeometry();
{
  const pos = new Float32Array(sporeCount * 3);
  for (let i = 0; i < sporeCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 34;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  sporeGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
}
const spores = new THREE.Points(
  sporeGeo,
  new THREE.PointsMaterial({ color: 0x7fe8d0, size: 0.22, transparent: true, opacity: 0.75 })
);
scene.add(spores);
camera.position.set(0, 0, 24);

// Title art from gpt-image-2, if the build embedded it.
if (typeof TEXTURES !== "undefined" && TEXTURES.title) {
  $("title-art").style.backgroundImage = `url(${TEXTURES.title})`;
}

// ---------- State ----------
let mode = "title"; // title | play

$("btn-start").addEventListener("click", () => {
  $("title-screen").classList.add("fading");
  setTimeout(() => {
    $("title-screen").classList.add("hidden");
    $("hud").classList.remove("hidden");
    showMsg("Suit online. World generation arriving in the next supply drop.");
  }, 900);
  mode = "play";
});

let msgTimer = 0;
function showMsg(text, ms = 3200) {
  const el = $("hud-msg");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => el.classList.remove("show"), ms);
}

// ---------- Main loop ----------
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const t = clock.getElapsedTime();
  spores.rotation.y = t * 0.02;
  const pos = sporeGeo.attributes.position;
  for (let i = 0; i < sporeCount; i++) {
    pos.array[i * 3 + 1] += Math.sin(t * 0.6 + i) * 0.0035;
  }
  pos.needsUpdate = true;
  renderer.render(scene, camera);
}
tick();
