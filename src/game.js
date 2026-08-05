/* ALIEN FRUIT — a XenoHarvest Corp. field assignment.
   Single-file Three.js game. Textures generated with gpt-image-2. */
"use strict";

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- Renderer / scene ----------
const canvas = $("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0518);
scene.fog = new THREE.Fog(0x0a0518, 26, 54);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ---------- Textures ----------
const texLoader = new THREE.TextureLoader();
function tex(name, repeat) {
  const t = texLoader.load(TEXTURES[name]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}
if (TEXTURES.title) $("title-art").style.backgroundImage = `url(${TEXTURES.title})`;

// Soft radial glow sprite (for fruit / lights), drawn on a canvas.
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const glowTex = makeGlowTexture();

// ---------- Lighting ----------
scene.add(new THREE.AmbientLight(0x554488, 1.05));
const moon = new THREE.DirectionalLight(0xbfd8ff, 1.0);
moon.position.set(18, 30, -12);
scene.add(moon);
const playerLight = new THREE.PointLight(0xffc890, 1.4, 11, 1.6);
scene.add(playerLight);

// ---------- World constants ----------
const CLEAR_R = 11;       // clearing radius around the ship
const CELL = 6;           // tree grid cell size
const SPAWN_R = 44;       // trees exist within this radius of the player
const SEED = 1337;

function hash2(x, z, salt) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(salt | 0, 951274213) + SEED;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Tiers by distance from ship: name, canopy tint, fruit color, fruit value
const TIERS = [
  { name: "Mosslight Belt", tint: 0xffffff, fruit: 0xffa040, value: 4 },
  { name: "Violet Deep",    tint: 0x9fd8ff, fruit: 0x50f0ff, value: 9 },
  { name: "Gilded Wilds",   tint: 0xffd89f, fruit: 0xffe050, value: 20 },
  { name: "Ember Reach",    tint: 0xff9f7f, fruit: 0xff5040, value: 45 },
  { name: "The Hush",       tint: 0xbfefff, fruit: 0xd0a0ff, value: 100 },
];
function tierAt(r) { return r < 32 ? 0 : r < 62 ? 1 : r < 100 ? 2 : r < 145 ? 3 : 4; }

// ---------- Ground + clearing ----------
{
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 420),
    new THREE.MeshLambertMaterial({ map: tex("ground", 56) })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const clearing = new THREE.Mesh(
    new THREE.CircleGeometry(CLEAR_R, 48),
    new THREE.MeshLambertMaterial({ map: tex("dirt", 3) })
  );
  clearing.rotation.x = -Math.PI / 2;
  clearing.position.y = 0.02;
  scene.add(clearing);
}

// ---------- Ship ----------
const ship = new THREE.Group();
{
  const hull = new THREE.MeshLambertMaterial({ map: tex("hull", 1) });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.7, 4.4, 14), hull);
  body.position.y = 2.4;
  ship.add(body);
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.86, 1.7, 14),
    new THREE.MeshLambertMaterial({ color: 0xd85c28 })
  );
  nose.position.y = 5.45;
  ship.add(nose);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(1.28, 1.44, 0.55, 14),
    new THREE.MeshLambertMaterial({ color: 0xd85c28 })
  );
  band.position.y = 1.6;
  ship.add(band);
  const window_ = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 10, 10),
    new THREE.MeshLambertMaterial({ color: 0x0c2a3a, emissive: 0x2ad8ff, emissiveIntensity: 0.9 })
  );
  window_.position.set(0, 3.1, 1.05);
  ship.add(window_);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 2.2, 6),
      new THREE.MeshLambertMaterial({ color: 0x8a8f9a })
    );
    leg.position.set(Math.cos(a) * 1.9, 0.9, Math.sin(a) * 1.9);
    leg.rotation.z = Math.cos(a) * 0.5;
    leg.rotation.x = -Math.sin(a) * 0.5;
    ship.add(leg);
    const foot = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x6a6f7a })
    );
    foot.scale.y = 0.4;
    foot.position.set(Math.cos(a) * 2.45, 0.1, Math.sin(a) * 2.45);
    ship.add(foot);
  }
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 2.4),
    new THREE.MeshLambertMaterial({ color: 0x565b66 })
  );
  ramp.position.set(0, 0.38, 2.1);
  ramp.rotation.x = 0.34;
  ship.add(ramp);
  // Landing beacon glow
  const beacon = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, color: 0x2ad8ff, transparent: true, opacity: 0.55, depthWrite: false })
  );
  beacon.scale.set(6, 6, 1);
  beacon.position.y = 0.4;
  ship.add(beacon);
  scene.add(ship);
}

// ---------- Trees ----------
const barkTex = tex("bark", 1);
const foliageTex = tex("foliage", 1);
const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 1, 7);
// One organic canopy blob per tier tint (shared geometry, displaced vertices).
const canopyGeo = (() => {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const s = 1 + (hash2(i * 7, i * 13, 5) - 0.5) * 0.55;
    p.setXYZ(i, p.getX(i) * s, p.getY(i) * s * 0.82, p.getZ(i) * s);
  }
  g.computeVertexNormals();
  return g;
})();
const fruitGeo = new THREE.SphereGeometry(0.26, 8, 6);
const trunkMat = new THREE.MeshLambertMaterial({ map: barkTex });
const canopyMats = TIERS.map((t) => new THREE.MeshLambertMaterial({ map: foliageTex, color: t.tint }));
const fruitMats = TIERS.map(
  (t) => new THREE.MeshLambertMaterial({ color: t.fruit, emissive: t.fruit, emissiveIntensity: 0.75 })
);

const trees = new Map(); // "cx,cz" -> { group, x, z, r, tier, fruits, cut, dmg, ... }
const felled = new Map(); // "cx,cz" -> game time when felled (stump until regrow)
const REGROW_S = 120;
const stumpGeo = new THREE.CylinderGeometry(0.26, 0.4, 0.5, 7);

function spawnStump(x, z, key) {
  const stump = new THREE.Mesh(stumpGeo, trunkMat);
  stump.position.set(x, 0.25, z);
  scene.add(stump);
  trees.set(key, { group: stump, x, z, r: Math.hypot(x, z), tier: 0, fruits: [], cut: true, dmg: 0, sway: 0 });
}

function treeAtCell(cx, cz) {
  if (hash2(cx, cz, 1) > 0.74) return null;
  const x = cx * CELL + CELL / 2 + (hash2(cx, cz, 2) - 0.5) * 4.4;
  const z = cz * CELL + CELL / 2 + (hash2(cx, cz, 3) - 0.5) * 4.4;
  const r = Math.hypot(x, z);
  if (r < CLEAR_R + 1.5) return null;
  return { x, z, r };
}

function spawnTree(cx, cz, key) {
  const spot = treeAtCell(cx, cz);
  if (!spot) return;
  const { x, z, r } = spot;
  if (felled.has(key)) {
    spawnStump(x, z, key);
    return;
  }
  const tier = tierAt(r);
  const h1 = hash2(cx, cz, 4), h2 = hash2(cx, cz, 6);
  const height = 2.6 + h1 * 1.8 + tier * 0.35;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = h2 * Math.PI * 2;

  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.scale.set(1 + tier * 0.12, height, 1 + tier * 0.12);
  trunk.position.y = height / 2;
  group.add(trunk);

  const canopy = new THREE.Mesh(canopyGeo, canopyMats[tier]);
  const cs = 1.5 + h1 * 0.7 + tier * 0.16;
  canopy.scale.set(cs, cs * 0.9, cs);
  canopy.position.y = height + cs * 0.35;
  group.add(canopy);

  // Fruit: ~60% of trees carry 1-4 glowing fruits tucked in the canopy.
  const fruits = [];
  const fh = hash2(cx, cz, 7);
  const nFruit = fh < 0.25 ? 0 : 1 + Math.floor(hash2(cx, cz, 8) * 4);
  for (let i = 0; i < nFruit; i++) {
    const a = hash2(cx + i, cz, 9) * Math.PI * 2;
    const rr = cs * (0.55 + hash2(cx, cz + i, 10) * 0.45);
    const fruit = new THREE.Mesh(fruitGeo, fruitMats[tier]);
    fruit.position.set(Math.cos(a) * rr, height + cs * 0.3 + (hash2(cx + i, cz + i, 11) - 0.3) * cs * 0.5, Math.sin(a) * rr);
    const fs = 0.8 + hash2(cx, cz, 12 + i) * 0.5 + tier * 0.1;
    fruit.scale.setScalar(fs);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: TIERS[tier].fruit, transparent: true, opacity: 0.5, depthWrite: false })
    );
    glow.scale.set(1.4, 1.4, 1);
    fruit.add(glow);
    group.add(fruit);
    fruits.push(fruit);
  }

  scene.add(group);
  // hpS: seconds of sawing (at saw power 1) to fell this tree.
  trees.set(key, {
    group, x, z, r, tier, fruits, cut: false, sway: h2 * 10,
    key, height, dmg: 0, hpS: 1.4 + tier * 1.5 + h1 * 0.6, falling: null,
  });
}

function updateTreeField(px, pz) {
  const minC = Math.floor((-SPAWN_R) / CELL), maxC = Math.ceil(SPAWN_R / CELL);
  const pcx = Math.floor(px / CELL), pcz = Math.floor(pz / CELL);
  for (let dx = minC; dx <= maxC; dx++) {
    for (let dz = minC; dz <= maxC; dz++) {
      const cx = pcx + dx, cz = pcz + dz;
      const key = cx + "," + cz;
      const f = felled.get(key);
      if (f !== undefined && gameTime - f > REGROW_S) {
        felled.delete(key);
        const stump = trees.get(key);
        if (stump && stump.cut) { scene.remove(stump.group); trees.delete(key); }
      }
      if (trees.has(key)) continue;
      const wx = cx * CELL + CELL / 2, wz = cz * CELL + CELL / 2;
      if (Math.hypot(wx - px, wz - pz) < SPAWN_R) spawnTree(cx, cz, key);
    }
  }
  for (const [key, t] of trees) {
    if (Math.hypot(t.x - px, t.z - pz) > SPAWN_R + 8) {
      scene.remove(t.group);
      trees.delete(key);
    }
  }
}

// ---------- Player ----------
const player = new THREE.Group();
{
  const suit = new THREE.MeshLambertMaterial({ color: 0xe8e2d8 });
  const trim = new THREE.MeshLambertMaterial({ color: 0xd85c28 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 4, 10), suit);
  body.position.y = 0.62;
  player.add(body);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), suit);
  helmet.position.y = 1.28;
  player.add(helmet);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x0c1a2a, emissive: 0x2a90c8, emissiveIntensity: 0.7 })
  );
  visor.position.set(0, 1.28, 0.14);
  visor.scale.z = 0.72;
  player.add(visor);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.26), trim);
  pack.position.set(0, 0.78, -0.34);
  player.add(pack);
  // The basket: an open cylinder riding on the pack.
  const basket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.2, 0.3, 10, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xffa040, side: THREE.DoubleSide })
  );
  basket.position.set(0, 1.16, -0.34);
  player.add(basket);
  // Saw arm: a stubby limb with a glowing blade disc.
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.5), suit);
  arm.position.set(0.42, 0.72, 0.22);
  player.add(arm);
  const blade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.05, 14),
    new THREE.MeshLambertMaterial({ color: 0x555a66, emissive: 0xffa040, emissiveIntensity: 0.35 })
  );
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0.42, 0.72, 0.55);
  blade.name = "blade";
  player.add(blade);
  player.position.set(0, 0, 6.5);
  scene.add(player);
}
const blade = player.getObjectByName("blade");

// ---------- Ambient spores around the player ----------
const sporeCount = 180;
const sporeGeo = new THREE.BufferGeometry();
const sporeBox = 34;
{
  const pos = new Float32Array(sporeCount * 3);
  for (let i = 0; i < sporeCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * sporeBox;
    pos[i * 3 + 1] = Math.random() * 7 + 0.4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * sporeBox;
  }
  sporeGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
}
const spores = new THREE.Points(
  sporeGeo,
  new THREE.PointsMaterial({ color: 0x7fe8d0, size: 0.14, transparent: true, opacity: 0.6 })
);
scene.add(spores);

// ---------- Input: virtual joystick + WASD ----------
const input = { x: 0, z: 0, action: false };
{
  const joy = $("joystick"), knob = $("joystick-knob");
  let active = null, cx = 0, cy = 0;
  const R = 44;
  joy.addEventListener("pointerdown", (e) => {
    active = e.pointerId;
    const rect = joy.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
    joy.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = (e) => {
    if (e.pointerId !== active) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.x = dx / R;
    input.z = dy / R;
  };
  const end = (e) => {
    if (e.pointerId !== active) return;
    active = null;
    knob.style.transform = "translate(-50%, -50%)";
    input.x = input.z = 0;
  };
  joy.addEventListener("pointermove", move);
  joy.addEventListener("pointerup", end);
  joy.addEventListener("pointercancel", end);

  const keys = {};
  window.addEventListener("keydown", (e) => { keys[e.code] = true; syncKeys(); });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; syncKeys(); });
  function syncKeys() {
    const kx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    const kz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    if (kx || kz || active === null) {
      const len = Math.hypot(kx, kz) || 1;
      input.x = kx / len;
      input.z = kz / len;
    }
    input.keyAction = !!keys.Space;
  }

  const btn = $("btn-action");
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (sawTarget) input.btnAction = true;
    else openShop();
  });
  const btnUp = () => { input.btnAction = false; };
  btn.addEventListener("pointerup", btnUp);
  btn.addEventListener("pointercancel", btnUp);
  btn.addEventListener("pointerleave", btnUp);
}

// ---------- Game state ----------
const state = {
  mode: "title",
  speed: 4.6,
  facing: 0,
  battery: 100,
  batteryMax: 100,
  basket: [],       // array of { value, tier }
  basketCap: 10,
  money: 0,
  sawPower: 1,
  hintedSaw: false,
};
let gameTime = 0;

// ---------- Upgrades ----------
const UPGRADES = {
  bat:  { icon: "🔋", name: "Battery Cells", vals: [100, 140, 190, 260, 350, 500], costs: [40, 90, 200, 450, 1000],
          desc: (v) => `${v} charge` },
  bask: { icon: "🧺", name: "Basket Rig", vals: [10, 14, 19, 26, 35, 50], costs: [30, 70, 160, 360, 800],
          desc: (v) => `holds ${v} fruit` },
  saw:  { icon: "🪚", name: "Plasma Saw", vals: [1, 1.5, 2.2, 3.2, 4.5, 6.5], costs: [50, 120, 280, 650, 1500],
          desc: (v) => `${v}× cut speed` },
  arm:  { icon: "🛡", name: "Suit Armor", vals: [0, 0.2, 0.35, 0.5, 0.65, 0.8], costs: [40, 100, 240, 560, 1300],
          desc: (v) => v ? `blocks ${Math.round(v * 100)}% damage` : "no protection" },
  pul:  { icon: "📡", name: "Sonic Pulser", vals: [0, 1, 2, 3, 4, 5], costs: [60, 140, 320, 750, 1750],
          desc: (v) => v ? `repels dangers, power ${v}` : "not installed" },
  env:  { icon: "🌡", name: "Environmental Unit", vals: [0, 1, 2], costs: [250, 1200],
          desc: (v) => v === 0 ? "temperate zones only" : v === 1 ? "survive the Ember Reach" : "survive The Hush" },
};
state.lv = { bat: 0, bask: 0, saw: 0, arm: 0, pul: 0, env: 0 };

function applyLevels() {
  const keep = state.battery / state.batteryMax;
  state.batteryMax = UPGRADES.bat.vals[state.lv.bat];
  state.battery = Math.min(state.batteryMax, Math.max(state.battery, keep * state.batteryMax));
  state.basketCap = UPGRADES.bask.vals[state.lv.bask];
  state.sawPower = UPGRADES.saw.vals[state.lv.saw];
  state.armor = UPGRADES.arm.vals[state.lv.arm];
  state.pulser = UPGRADES.pul.vals[state.lv.pul];
  state.envUnit = UPGRADES.env.vals[state.lv.env];
}

const SAVE_KEY = "alienfruit-save-v1";
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ money: state.money, lv: state.lv }));
  } catch (e) { /* private browsing */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (typeof d.money === "number") state.money = d.money;
    for (const k in state.lv) if (typeof d.lv?.[k] === "number") state.lv[k] = d.lv[k];
  } catch (e) { /* corrupt save — start fresh */ }
}
loadGame();
applyLevels();
state.battery = state.batteryMax;

// ---------- Shop ----------
let shopOpen = false;
function renderShop() {
  const rows = Object.entries(UPGRADES).map(([k, u]) => {
    const lvl = state.lv[k];
    const maxed = lvl >= u.costs.length;
    const cost = maxed ? null : u.costs[lvl];
    const pips = u.costs.map((_, i) => `<i class="${i < lvl ? "on" : ""}"></i>`).join("");
    const btn = maxed
      ? `<button class="up-buy maxed" disabled>MAX</button>`
      : `<button class="up-buy" data-k="${k}" ${state.money < cost ? "disabled" : ""}>₡ ${cost}</button>`;
    return `<div class="up-row">
      <div class="up-icon">${u.icon}</div>
      <div class="up-info">
        <div class="up-name">${u.name} <span class="up-pips">${pips}</span></div>
        <div class="up-desc">now: ${u.desc(u.vals[lvl])}${maxed ? "" : " → next: " + u.desc(u.vals[lvl + 1])}</div>
      </div>${btn}</div>`;
  }).join("");
  $("shop").innerHTML = `<div id="shop-panel">
    <div id="shop-head">
      <div id="shop-title">SHIP TERMINAL</div>
      <div id="shop-money">₡ ${state.money}</div>
      <button id="shop-close">×</button>
    </div>
    <div id="shop-sub">XenoHarvest Corp. deducts upgrades from your pay. Naturally.</div>
    <div id="shop-rows">${rows}</div>
  </div>`;
  $("shop-close").addEventListener("click", closeShop);
  for (const b of document.querySelectorAll(".up-buy[data-k]")) {
    b.addEventListener("click", () => {
      const k = b.dataset.k;
      const cost = UPGRADES[k].costs[state.lv[k]];
      if (state.money < cost) return;
      state.money -= cost;
      state.lv[k]++;
      applyLevels();
      saveGame();
      updateHUD();
      renderShop();
      showMsg(`${UPGRADES[k].name} upgraded — ${UPGRADES[k].desc(UPGRADES[k].vals[state.lv[k]])}.`);
    });
  }
}
function openShop() {
  if (shopOpen) return;
  shopOpen = true;
  renderShop();
  $("shop").classList.remove("hidden");
}
function closeShop() {
  shopOpen = false;
  $("shop").classList.add("hidden");
}
$("shop").addEventListener("click", (e) => { if (e.target.id === "shop") closeShop(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && state.mode === "play") {
    if (shopOpen) closeShop();
    else if (Math.hypot(player.position.x, player.position.z) < 7) openShop();
  }
  if (e.code === "Escape") closeShop();
});

window.GAME = state; // debug/test handle
window.GAME_POS = () => ({ x: player.position.x, z: player.position.z });
window.DIAG = () => {
  let best = null, bestD = 1e9;
  for (const t of trees.values()) {
    if (t.cut) continue;
    const d = Math.hypot(t.x - player.position.x, t.z - player.position.z);
    if (d < bestD) { bestD = d; best = t; }
  }
  return {
    px: +player.position.x.toFixed(1), pz: +player.position.z.toFixed(1),
    nearD: +bestD.toFixed(2), dmg: best ? +best.dmg.toFixed(2) : null,
    hpS: best ? +best.hpS.toFixed(2) : null, fruits: best ? best.fruits.length : null,
    keyAction: input.keyAction, btnAction: input.btnAction,
    basket: state.basket.length, battery: Math.round(state.battery),
    flying: flying.length, fallingN: falling.length,
  };
};

$("btn-start").addEventListener("click", () => {
  $("title-screen").classList.add("fading");
  setTimeout(() => $("title-screen").classList.add("hidden"), 950);
  $("hud").classList.remove("hidden");
  state.mode = "play";
  showMsg("Quota briefing: cut trees, catch fruit, don't die of curiosity.", 4200);
});

let msgTimer = 0;
function showMsg(text, ms = 3200) {
  const el = $("hud-msg");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => el.classList.remove("show"), ms);
}

// ---------- Collision ----------
function collide(nx, nz) {
  // Ship body
  const shipD = Math.hypot(nx, nz);
  if (shipD < 2.6) {
    nx = (nx / shipD) * 2.6;
    nz = (nz / shipD) * 2.6;
  }
  // Trees
  for (const t of trees.values()) {
    if (t.cut) continue;
    const dx = nx - t.x, dz = nz - t.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.85 && d > 0.0001) {
      nx = t.x + (dx / d) * 0.85;
      nz = t.z + (dz / d) * 0.85;
    }
  }
  return [nx, nz];
}

// ---------- Camera ----------
const camOffset = new THREE.Vector3(0, 27, 14.5);
function updateCamera(dt, snap) {
  const target = new THREE.Vector3().copy(player.position).add(camOffset);
  if (snap) camera.position.copy(target);
  else camera.position.lerp(target, 1 - Math.pow(0.0005, dt));
  camera.lookAt(player.position.x, 0.8, player.position.z);
}
updateCamera(0, true);
updateTreeField(player.position.x, player.position.z);

// ---------- Saw progress ring ----------
const ringGroup = new THREE.Group();
const ringBg = new THREE.Mesh(
  new THREE.RingGeometry(0.55, 0.78, 28),
  new THREE.MeshBasicMaterial({ color: 0x1a1030, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthTest: false })
);
ringGroup.add(ringBg);
let ringFg = null, ringShownProgress = -1;
ringGroup.visible = false;
scene.add(ringGroup);

function showRing(tree, progress) {
  ringGroup.visible = true;
  ringGroup.position.set(tree.x, tree.height + 2.2, tree.z);
  ringGroup.quaternion.copy(camera.quaternion);
  if (Math.abs(progress - ringShownProgress) > 0.02) {
    if (ringFg) {
      ringGroup.remove(ringFg);
      ringFg.geometry.dispose();
    }
    ringFg = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.78, 28, 1, Math.PI / 2, -progress * Math.PI * 2),
      new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false })
    );
    ringGroup.add(ringFg);
    ringShownProgress = progress;
  }
}

// ---------- Saw sparks ----------
const sparks = [];
function spawnSpark(x, y, z, color) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.9, depthWrite: false })
  );
  s.scale.set(0.5, 0.5, 1);
  s.position.set(x, y, z);
  s.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.5 + 1, (Math.random() - 0.5) * 3);
  s.userData.life = 0.5;
  scene.add(s);
  sparks.push(s);
}
function updateSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.userData.life -= dt;
    if (s.userData.life <= 0) {
      scene.remove(s);
      sparks.splice(i, 1);
      continue;
    }
    s.userData.vel.y -= 6 * dt;
    s.position.addScaledVector(s.userData.vel, dt);
    s.material.opacity = s.userData.life * 1.8;
  }
}

// ---------- Flying fruit (tree -> basket) ----------
const flying = [];
function launchFruit(fruit, tree) {
  const world = new THREE.Vector3();
  fruit.getWorldPosition(world);
  tree.group.remove(fruit);
  fruit.position.copy(world);
  scene.add(fruit);
  flying.push({ mesh: fruit, t: 0, dur: 0.65 + Math.random() * 0.35, from: world.clone(), tier: tree.tier });
}
function updateFlying(dt) {
  for (let i = flying.length - 1; i >= 0; i--) {
    const f = flying[i];
    f.t += dt;
    const k = Math.min(f.t / f.dur, 1);
    const target = new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z - 0.3);
    f.mesh.position.lerpVectors(f.from, target, k * k);
    f.mesh.position.y += Math.sin(k * Math.PI) * 2.2;
    f.mesh.scale.setScalar(Math.max(0.25, 1 - k * 0.6));
    if (k >= 1) {
      scene.remove(f.mesh);
      flying.splice(i, 1);
      if (state.basket.length < state.basketCap) {
        state.basket.push({ value: TIERS[f.tier].value, tier: f.tier });
        if (state.basket.length === state.basketCap) showMsg("Basket full — haul it back to the ship!");
      } else {
        showMsg("Basket overflowing — that one got away.");
      }
      updateHUD();
    }
  }
}

// ---------- Falling trees ----------
const falling = [];
function fellTree(tree) {
  tree.cut = true;
  felled.set(tree.key, gameTime);
  ringGroup.visible = false;
  for (const fruit of [...tree.fruits]) launchFruit(fruit, tree);
  tree.fruits = [];
  const away = new THREE.Vector3(tree.x - player.position.x, 0, tree.z - player.position.z).normalize();
  falling.push({ tree, t: 0, axis: new THREE.Vector3(-away.z, 0, away.x), done: false });
}
function updateFalling(dt) {
  for (let i = falling.length - 1; i >= 0; i--) {
    const f = falling[i];
    f.t += dt;
    if (f.t < 1.0) {
      const k = f.t / 1.0;
      f.tree.group.setRotationFromAxisAngle(f.axis, -k * k * (Math.PI / 2 - 0.1));
    } else if (f.t < 1.45) {
      const k = (f.t - 1.0) / 0.45;
      f.tree.group.scale.setScalar(Math.max(0.001, 1 - k));
    } else {
      scene.remove(f.tree.group);
      const key = f.tree.key;
      trees.delete(key);
      spawnStump(f.tree.x, f.tree.z, key);
      falling.splice(i, 1);
    }
  }
}

// ---------- HUD ----------
function updateHUD() {
  const b = state.battery / state.batteryMax;
  const bf = document.querySelector("#meter-battery .meter-fill");
  bf.style.transform = `scaleX(${b})`;
  bf.style.background = b < 0.25 ? "linear-gradient(90deg,#ff4040,#ff8040)" : "linear-gradient(90deg,#38e8b0,#b7ff5c)";
  document.querySelector("#meter-battery .meter-label").textContent = `⚡ ${Math.ceil(state.battery)}%`;
  document.querySelector("#meter-basket .meter-fill").style.transform = `scaleX(${state.basket.length / state.basketCap})`;
  document.querySelector("#meter-basket .meter-label").textContent = `🧺 ${state.basket.length}/${state.basketCap}`;
  $("hud-money").textContent = `₡ ${state.money}`;
}

// ---------- Ship zone: sell + recharge ----------
let wasAtShip = false;
function updateShipZone(dt) {
  const atShip = Math.hypot(player.position.x, player.position.z) < 7;
  if (atShip) {
    if (state.battery < state.batteryMax) {
      state.battery = Math.min(state.batteryMax, state.battery + 20 * dt);
      updateHUD();
    }
    if (!wasAtShip && state.basket.length > 0) {
      const total = state.basket.reduce((s, f) => s + f.value, 0);
      state.money += total;
      showMsg(`Sold ${state.basket.length} fruit for ₡${total}. The Corp thanks you. Sort of.`);
      state.basket = [];
      saveGame();
      updateHUD();
    }
  }
  wasAtShip = atShip;
}

// ---------- Battery + emergency recall ----------
let recalling = false;
function drainBattery(amount) {
  state.battery = Math.max(0, state.battery - amount);
  if (state.battery <= 0 && !recalling) emergencyRecall();
}
function emergencyRecall() {
  recalling = true;
  const lost = Math.ceil(state.basket.length * 0.35);
  $("fade").classList.add("show");
  showMsg("SUIT DEAD. Tow drone dispatched… (recovery fee: " + lost + " fruit)", 4200);
  setTimeout(() => {
    player.position.set(0, 0, 6.5);
    state.basket.splice(0, lost);
    state.battery = state.batteryMax * 0.3;
    updateCamera(0, true);
    updateTreeField(0, 6.5);
    updateHUD();
    $("fade").classList.remove("show");
    recalling = false;
  }, 1400);
}

// ---------- Sawing ----------
function nearestTree() {
  let best = null, bestD = 2.7;
  for (const t of trees.values()) {
    if (t.cut) continue;
    const d = Math.hypot(t.x - player.position.x, t.z - player.position.z);
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}

let sawTarget = null;
function updateSaw(dt) {
  const target = recalling ? null : nearestTree();
  const btn = $("btn-action");
  const atShip = Math.hypot(player.position.x, player.position.z) < 7;
  btn.classList.toggle("hidden", !target && !atShip);
  btn.textContent = target ? "SAW" : "SHOP";
  if (target && !state.hintedSaw) {
    state.hintedSaw = true;
    showMsg("Hold SAW (or Space) to cut the tree — the fruit is yours.");
  }
  const sawing = target && (input.btnAction || input.keyAction) && state.battery > 0;
  if (sawing) {
    // Face the tree while cutting.
    state.facing = Math.atan2(target.x - player.position.x, target.z - player.position.z);
    target.dmg += dt * state.sawPower;
    drainBattery(dt * 2.8);
    blade.rotation.x += dt * 30;
    const mid = new THREE.Vector3(
      player.position.x + (target.x - player.position.x) * 0.55,
      0.9,
      player.position.z + (target.z - player.position.z) * 0.55
    );
    if (Math.random() < 0.55) spawnSpark(mid.x, mid.y, mid.z, 0xffc060);
    target.group.position.x = target.x + (Math.random() - 0.5) * 0.06;
    target.group.position.z = target.z + (Math.random() - 0.5) * 0.06;
    showRing(target, Math.min(target.dmg / target.hpS, 1));
    if (target.dmg >= target.hpS) fellTree(target);
    updateHUD();
  } else {
    if (sawTarget && sawTarget !== target) {
      sawTarget.group.position.x = sawTarget.x;
      sawTarget.group.position.z = sawTarget.z;
    }
    if (target && target.dmg > 0) showRing(target, Math.min(target.dmg / target.hpS, 1));
    else ringGroup.visible = false;
  }
  sawTarget = target;
}

// ---------- Main loop ----------
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();
  gameTime = t;

  if (state.mode === "play" && !recalling && !shopOpen) {
    const mx = input.x, mz = input.z;
    const mlen = Math.hypot(mx, mz);
    if (mlen > 0.08) {
      const s = state.speed * Math.min(mlen, 1);
      let nx = player.position.x + (mx / (mlen || 1)) * s * dt;
      let nz = player.position.z + (mz / (mlen || 1)) * s * dt;
      [nx, nz] = collide(nx, nz);
      player.position.x = nx;
      player.position.z = nz;
      state.facing = Math.atan2(mx, mz);
      player.position.y = Math.abs(Math.sin(t * 9)) * 0.06;
      updateTreeField(nx, nz);
      drainBattery(dt * 0.45);
    } else {
      player.position.y *= 0.8;
      drainBattery(dt * 0.1);
    }
    updateSaw(dt);
    const targetRot = state.facing;
    let dr = targetRot - player.rotation.y;
    while (dr > Math.PI) dr -= Math.PI * 2;
    while (dr < -Math.PI) dr += Math.PI * 2;
    player.rotation.y += dr * Math.min(1, dt * 12);
    updateCamera(dt, false);
  }
  if (state.mode === "play" && !recalling) {
    updateShipZone(dt);
    updateHUD();
  }
  updateFlying(dt);
  updateFalling(dt);
  updateSparks(dt);

  // Idle saw blade spin + tree sway
  blade.rotation.x = t * 3;
  for (const tr of trees.values()) {
    if (!tr.cut) tr.group.rotation.z = Math.sin(t * 0.7 + tr.sway) * 0.012;
  }

  // Spores drift and wrap around the player
  const pos = sporeGeo.attributes.position;
  for (let i = 0; i < sporeCount; i++) {
    let sx = pos.array[i * 3] + Math.sin(t * 0.3 + i) * 0.004;
    let sy = pos.array[i * 3 + 1] + Math.sin(t * 0.5 + i * 2.1) * 0.003;
    let sz = pos.array[i * 3 + 2] + 0.006;
    const rx = sx - player.position.x, rz = sz - player.position.z;
    if (rx > sporeBox / 2) sx -= sporeBox;
    if (rx < -sporeBox / 2) sx += sporeBox;
    if (rz > sporeBox / 2) sz -= sporeBox;
    if (rz < -sporeBox / 2) sz += sporeBox;
    pos.array[i * 3] = sx;
    pos.array[i * 3 + 1] = sy;
    pos.array[i * 3 + 2] = sz;
  }
  pos.needsUpdate = true;

  playerLight.position.set(player.position.x, 2.4, player.position.z + 0.5);
  ship.getObjectByProperty("type", "Sprite").material.opacity = 0.4 + Math.sin(t * 2.2) * 0.15;

  renderer.render(scene, camera);
}
tick();
