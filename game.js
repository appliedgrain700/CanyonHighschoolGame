import * as THREE from "three";

// ================= SCENE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x55aa55 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x8e44ad })
);
player.position.y = 1;
scene.add(player);

// ================= MAP: FOOTBALL FIELD =================
const texLoader = new THREE.TextureLoader();

// Loads a photo onto a material. If the photo is missing, the plain color stays.
function addPhoto(material, file, repeatX, repeatY) {
  texLoader.load(file, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    material.map = t;
    material.color.setHex(0xffffff);
    material.needsUpdate = true;
  });
}

// ----- Football field (drawn on a canvas, then used as a texture) -----
const END_COLOR = "#1a2a6c"; // end zone + banner color: change to your school color
const fc = document.createElement("canvas");
fc.width = 640;
fc.height = 1440;
const ctx = fc.getContext("2d");

// grass stripes (each stripe = 10 yards)
for (let i = 0; i < 12; i++) {
  ctx.fillStyle = i % 2 === 0 ? "#2e8b3a" : "#3a9d47";
  ctx.fillRect(0, i * 120, 640, 120);
}
// end zones
ctx.fillStyle = END_COLOR;
ctx.fillRect(0, 0, 640, 120);
ctx.fillRect(0, 1320, 640, 120);
// yard lines and sidelines
ctx.fillStyle = "#ffffff";
for (let i = 1; i < 12; i++) ctx.fillRect(0, i * 120 - 3, 640, 6);
ctx.fillRect(0, 0, 8, 1440);
ctx.fillRect(632, 0, 8, 1440);
// end zone text
ctx.font = "bold 80px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("COUGARS", 320, 60);
ctx.fillText("COUGARS", 320, 1380);

const fieldTex = new THREE.CanvasTexture(fc);
fieldTex.colorSpace = THREE.SRGBColorSpace;
fieldTex.anisotropy = 8;
const field = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 90),
  new THREE.MeshStandardMaterial({ map: fieldTex })
);
field.rotation.x = -Math.PI / 2;
field.position.y = 0.02;
scene.add(field);

// Logo at midfield (only appears if logo.png exists)
texLoader.load("logo.png", (t) => {
  t.colorSpace = THREE.SRGBColorSpace;
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14), // size of the logo
    new THREE.MeshBasicMaterial({ map: t, transparent: true })
  );
  logo.rotation.x = -Math.PI / 2;
  logo.position.y = 0.06;
  scene.add(logo);
});

// Goalposts (just decoration, bullets pass through)
const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
function makeGoalpost(z) {
  const parts = [
    [5.6, 0.2, 0.2, 0, 3],    // crossbar
    [0.2, 5, 0.2, -2.8, 5.5], // left upright
    [0.2, 5, 0.2, 2.8, 5.5],  // right upright
    [0.2, 3, 0.2, 0, 1.5],    // base
  ];
  for (const [w, h, d, x, y] of parts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), goldMat);
    m.position.set(x, y, z);
    scene.add(m);
  }
}
makeGoalpost(-44);
makeGoalpost(44);

// ----- Walls and cover -----
// x/z = center, w = width, d = depth, h = height (default 6), color = hex
// Add  photo: "hall.jpg"  to any wall to put a photo on it.
const walls = [
  // fences around the field
  { x: -23, z: 0, w: 2, d: 96, h: 6, color: 0x444444 },
  { x: 23, z: 0, w: 2, d: 96, h: 6, color: 0x444444 },
  { x: 0, z: -47, w: 48, d: 2, h: 6, color: 0x444444 },
  { x: 0, z: 47, w: 48, d: 2, h: 6, color: 0x444444 },
  // cover (equipment and benches)
  { x: -10, z: -22, w: 5, d: 2, h: 3, color: 0x1a2a6c },
  { x: 10, z: -22, w: 5, d: 2, h: 3, color: 0x1a2a6c },
  { x: -10, z: 22, w: 5, d: 2, h: 3, color: 0x1a2a6c },
  { x: 10, z: 22, w: 5, d: 2, h: 3, color: 0x1a2a6c },
  { x: -14, z: 0, w: 2, d: 6, h: 3, color: 0x888888 },
  { x: 14, z: 0, w: 2, d: 6, h: 3, color: 0x888888 },
];

const wallBoxes = [];
for (const wall of walls) {
  const h = wall.h || 6;
  const mat = new THREE.MeshStandardMaterial({ color: wall.color || 0xd8d0c0 });
  if (wall.photo) addPhoto(mat, wall.photo, 1, 1);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.w, h, wall.d), mat);
  mesh.position.set(wall.x, h / 2, wall.z);
  scene.add(mesh);
  wallBoxes.push({
    minX: wall.x - wall.w / 2,
    maxX: wall.x + wall.w / 2,
    minZ: wall.z - wall.d / 2,
    maxZ: wall.z + wall.d / 2,
    h: h,
  });
}

// Stops the player from walking through walls
function pushOutOfWalls(pos) {
  const r = 0.6;
  for (const b of wallBoxes) {
    if (pos.x > b.minX - r && pos.x < b.maxX + r && pos.z > b.minZ - r && pos.z < b.maxZ + r) {
      const left = pos.x - (b.minX - r);
      const right = b.maxX + r - pos.x;
      const up = pos.z - (b.minZ - r);
      const down = b.maxZ + r - pos.z;
      const m = Math.min(left, right, up, down);
      if (m === left) pos.x = b.minX - r;
      else if (m === right) pos.x = b.maxX + r;
      else if (m === up) pos.z = b.minZ - r;
      else pos.z = b.maxZ + r;
    }
  }
}

// True if a point (phone, grenade, enemy ball) is inside a wall
function insideWall(p) {
  for (const b of wallBoxes) {
    if (p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ && p.y < b.h) return true;
  }
  return false;
}

// ================= CHARACTERS =================
// Change these numbers to balance him. More teachers get added here later.
const characters = {
  mahoney: {
    name: "Mr. Mahoney",
    color: 0x8e44ad,
    health: 275,
    speed: 0.15,
    // Weapon: phone burst
    burst: 3,
    damage: 10,
    fireDelay: 800, // ms between bursts (0.8 seconds)
    spread: 0.07, // angle between each phone: bigger = wider fan
    // Q: dash
    dashCooldown: 5000,
    dashDistance: 6,
    // E: phone grenade
    grenadeCooldown: 10000,
    grenadeDamage: 60,
    grenadeRadius: 5,
  },
};
let current = characters.mahoney;

// ================= STATE =================
let playing = false;
let dead = false;
let maxHealth = current.health;
let playerHealth = maxHealth;
let speed = current.speed;
let lastShot = -99999;
let lastDash = -99999;
let lastGrenade = -99999;
let yaw = 0;
let pitch = 0;

// ================= UI =================
const healthBox = document.createElement("div");
healthBox.style.cssText =
  "position:fixed;bottom:20px;left:20px;width:250px;height:24px;background:#333;border:2px solid #fff;";
const healthFill = document.createElement("div");
healthFill.style.cssText = "height:100%;width:100%;background:#2ecc40;";
const healthText = document.createElement("div");
healthText.style.cssText =
  "position:absolute;top:0;left:0;width:100%;text-align:center;font:bold 14px/24px sans-serif;color:#fff;text-shadow:1px 1px 2px #000;";
healthBox.appendChild(healthFill);
healthBox.appendChild(healthText);
document.body.appendChild(healthBox);

const abilityHud = document.createElement("div");
abilityHud.style.cssText =
  "position:fixed;bottom:55px;left:20px;color:#fff;font:bold 16px sans-serif;text-shadow:1px 1px 2px #000;line-height:22px;";
document.body.appendChild(abilityHud);

const crosshair = document.createElement("div");
crosshair.style.cssText =
  "position:fixed;top:50%;left:50%;width:8px;height:8px;margin:-4px 0 0 -4px;background:#fff;border:1px solid #000;border-radius:50%;";
document.body.appendChild(crosshair);

const deathMsg = document.createElement("div");
deathMsg.textContent = "YOU DIED - respawning...";
deathMsg.style.cssText =
  "position:fixed;top:40%;width:100%;text-align:center;font:bold 40px sans-serif;color:#fff;text-shadow:2px 2px 4px #000;display:none;";
document.body.appendChild(deathMsg);

const helpText = document.createElement("div");
helpText.textContent = "WASD move | Click shoot | Q dash | E grenade | C change teacher";
helpText.style.cssText =
  "position:fixed;top:10px;width:100%;text-align:center;font:14px sans-serif;color:#fff;text-shadow:1px 1px 2px #000;";
document.body.appendChild(helpText);

// ----- Kill banner (uses your cougar.png if you upload it) -----
const banner = document.createElement("div");
banner.style.cssText =
  "position:fixed;top:14%;left:50%;transform:translateX(-50%) scale(0.6);display:flex;align-items:center;gap:16px;" +
  "padding:10px 30px 10px 14px;background:linear-gradient(90deg," + END_COLOR + ",#b21f1f);" +
  "border:3px solid #ffd700;border-radius:8px;color:#fff;font-family:sans-serif;opacity:0;" +
  "transition:opacity 0.25s, transform 0.25s;pointer-events:none;z-index:5;";
banner.innerHTML =
  `<img src="cougar.png" style="height:70px;width:auto;" onerror="this.style.display='none'">` +
  `<div><div style="font-size:34px;font-weight:bold;letter-spacing:3px;">ELIMINATION</div>` +
  `<div id="bannerSub" style="font-size:16px;">Cougars win</div></div>`;
document.body.appendChild(banner);
const bannerSub = banner.querySelector("#bannerSub");
let bannerTimer;

function showKillBanner(victim) {
  bannerSub.textContent = victim + " eliminated";
  banner.style.opacity = "1";
  banner.style.transform = "translateX(-50%) scale(1)";
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => {
    banner.style.opacity = "0";
    banner.style.transform = "translateX(-50%) scale(0.6)";
  }, 2500);
}

function updateHealthBar() {
  healthFill.style.width = (playerHealth / maxHealth) * 100 + "%";
  healthText.textContent = Math.ceil(playerHealth) + " / " + maxHealth;
}
updateHealthBar();

function cooldownText(label, key, last, cooldown) {
  const left = Math.ceil((cooldown - (performance.now() - last)) / 1000);
  return label + " (" + key + "): " + (left > 0 ? left + "s" : "READY");
}

// ================= CHARACTER SELECT SCREEN =================
const overlay = document.createElement("div");
overlay.style.cssText =
  "position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;color:#fff;";
overlay.innerHTML =
  '<h1 style="margin:0 0 30px;font-size:42px;">CHOOSE YOUR TEACHER</h1>';
const cardRow = document.createElement("div");
cardRow.style.cssText = "display:flex;gap:20px;";
overlay.appendChild(cardRow);
document.body.appendChild(overlay);

function makeCard(html, locked) {
  const card = document.createElement("div");
  card.style.cssText =
    "width:220px;padding:20px;border:3px solid " +
    (locked ? "#555" : "#fff") +
    ";border-radius:10px;background:#222;text-align:center;" +
    (locked ? "opacity:0.4;" : "cursor:pointer;");
  card.innerHTML = html;
  cardRow.appendChild(card);
  return card;
}

for (const key in characters) {
  const c = characters[key];
  const card = makeCard(
    '<div style="width:80px;height:120px;margin:0 auto 12px;background:#' +
      c.color.toString(16).padStart(6, "0") +
      ';"></div>' +
      '<div style="font-size:24px;font-weight:bold;margin-bottom:10px;">' + c.name + "</div>" +
      '<div style="font-size:14px;line-height:22px;text-align:left;">' +
      "Health: " + c.health + "<br>" +
      "Weapon: Phones (" + c.burst + " x " + c.damage + " dmg)<br>" +
      "Q: Dash<br>" +
      "E: Phone Grenade" +
      "</div>",
    false
  );
  card.addEventListener("mouseenter", () => (card.style.background = "#444"));
  card.addEventListener("mouseleave", () => (card.style.background = "#222"));
  card.addEventListener("click", () => selectCharacter(key));
}
makeCard('<div style="font-size:24px;margin:80px 0;">Coming soon</div>', true);
makeCard('<div style="font-size:24px;margin:80px 0;">Coming soon</div>', true);

function selectCharacter(key) {
  current = characters[key];
  player.material.color.setHex(current.color);
  maxHealth = current.health;
  playerHealth = maxHealth;
  speed = current.speed;
  lastShot = lastDash = lastGrenade = -99999;
  dead = false;
  player.visible = true;
  deathMsg.style.display = "none";
  player.position.set(0, 1, 0);
  updateHealthBar();
  overlay.style.display = "none";
  playing = true;
  renderer.domElement.requestPointerLock();
}

function openSelectScreen() {
  playing = false;
  overlay.style.display = "flex";
  document.exitPointerLock();
}

// ================= PLAYER DAMAGE / RESPAWN =================
function damagePlayer(amount) {
  if (dead) return;
  playerHealth -= amount;
  if (playerHealth <= 0) {
    playerHealth = 0;
    dead = true;
    player.visible = false;
    deathMsg.style.display = "block";
    setTimeout(() => {
      playerHealth = maxHealth;
      dead = false;
      player.position.set(0, 1, 0);
      player.visible = true;
      deathMsg.style.display = "none";
      updateHealthBar();
    }, 3000);
  }
  updateHealthBar();
}

// ================= INPUT =================
const keys = {};
addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (!playing || dead) return;
  if (e.code === "KeyQ") dash();
  if (e.code === "KeyE") throwGrenade();
  if (e.code === "KeyC") openSelectScreen();
});
addEventListener("keyup", (e) => (keys[e.code] = false));

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.domElement.addEventListener("click", () => {
  if (playing) renderer.domElement.requestPointerLock();
});
addEventListener("mousemove", (e) => {
  if (document.pointerLockElement) {
    yaw -= e.movementX * 0.003;
    pitch -= e.movementY * 0.003;
    pitch = Math.max(-1, Math.min(1, pitch));
  }
});

// ================= TARGET DUMMY =================
const DUMMY_MAX = 300;
const dummy = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x3366ff })
);
dummy.position.set(0, 1, -10);
dummy.userData.health = DUMMY_MAX;
scene.add(dummy);

const dummyBar = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.15, 0.05),
  new THREE.MeshBasicMaterial({ color: 0x2ecc40 })
);
dummyBar.position.y = 1.6;
dummy.add(dummyBar);

function damageDummy(amount) {
  if (!dummy.visible) return;
  dummy.userData.health -= amount;
  dummyBar.scale.x = Math.max(0.001, dummy.userData.health / DUMMY_MAX);
  dummy.material.color.setHex(0xffffff);
  setTimeout(() => dummy.material.color.setHex(0x3366ff), 80);
  if (dummy.userData.health <= 0) {
    dummy.visible = false;
    showKillBanner("Blue Dummy"); // elimination banner
    setTimeout(() => {
      dummy.userData.health = DUMMY_MAX;
      dummyBar.scale.x = 1;
      dummy.visible = true;
    }, 3000);
  }
}

// ================= MR. MAHONEY: PHONE BURST =================
const bullets = [];

// Phones are flat pictures that fly like thrown cards
const PHONE_SIZE = 0.9; // length of the phone: bigger = bigger phone
const PHONE_SPIN = 0.4; // spin speed: 0 = no spin, bigger = faster
let phoneAspect = 1; // set automatically from your picture
const phoneTexture = texLoader.load("phone.png", (t) => {
  phoneAspect = t.image.width / t.image.height;
});
phoneTexture.colorSpace = THREE.SRGBColorSpace;
const phoneMat = new THREE.MeshBasicMaterial({
  map: phoneTexture,
  transparent: true,
  alphaTest: 0.05,
  side: THREE.DoubleSide,
});
const phoneGeo = new THREE.PlaneGeometry(1, 1);

function shoot() {
  for (let i = 0; i < current.burst; i++) {
    // Even spread: the phones fan out in a straight line, always the same gap
    const offset = (i - (current.burst - 1) / 2) * current.spread;
    const angle = yaw + offset;

    const b = new THREE.Mesh(phoneGeo, phoneMat);
    b.scale.set(PHONE_SIZE * phoneAspect, PHONE_SIZE, 1);
    b.position.set(player.position.x, 1.5, player.position.z);
    // Lay the phone flat like a thrown card, pointing the way it flies
    b.rotation.set(-Math.PI / 2 + pitch, angle, 0, "YXZ");

    b.userData.dir = new THREE.Vector3(
      -Math.sin(angle) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(angle) * Math.cos(pitch)
    );
    b.userData.damage = current.damage;
    b.userData.life = 100;
    scene.add(b);
    bullets.push(b);
  }
}

addEventListener("mousedown", () => {
  if (!playing || dead || !document.pointerLockElement) return;
  const now = performance.now();
  if (now - lastShot < current.fireDelay) return;
  lastShot = now;
  shoot();
});

// ================= MR. MAHONEY: DASH (Q) =================
function dash() {
  if (performance.now() - lastDash < current.dashCooldown) return;
  lastDash = performance.now();
  const dir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  for (let i = 0; i < 12; i++) {
    player.position.addScaledVector(dir, current.dashDistance / 12);
    pushOutOfWalls(player.position);
  }
  player.position.x = Math.max(-48, Math.min(48, player.position.x));
  player.position.z = Math.max(-48, Math.min(48, player.position.z));
}

// ================= MR. MAHONEY: PHONE GRENADE (E) =================
const grenades = [];
const grenadeMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });

function throwGrenade() {
  if (performance.now() - lastGrenade < current.grenadeCooldown) return;
  lastGrenade = performance.now();
  const g = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.08), grenadeMat);
  g.position.set(player.position.x, 1.8, player.position.z);
  g.userData.vel = new THREE.Vector3(-Math.sin(yaw) * 0.35, 0.25 + pitch * 0.3, -Math.cos(yaw) * 0.35);
  scene.add(g);
  grenades.push(g);
}

function explode(pos) {
  const boom = new THREE.Mesh(
    new THREE.SphereGeometry(current.grenadeRadius, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.5 })
  );
  boom.position.copy(pos);
  scene.add(boom);
  setTimeout(() => scene.remove(boom), 250);

  const dx = dummy.position.x - pos.x;
  const dz = dummy.position.z - pos.z;
  if (Math.sqrt(dx * dx + dz * dz) < current.grenadeRadius + 0.5) {
    damageDummy(current.grenadeDamage);
  }
}

// ================= ENEMY (dummy shoots back) =================
const enemyBullets = [];
const enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
let enemyTimer = 0;

// ================= GAME LOOP =================
function animate() {
  requestAnimationFrame(animate);

  // Movement
  if (playing && !dead) {
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    if (keys.KeyW) player.position.addScaledVector(forward, speed);
    if (keys.KeyS) player.position.addScaledVector(forward, -speed);
    if (keys.KeyD) player.position.addScaledVector(right, speed);
    if (keys.KeyA) player.position.addScaledVector(right, -speed);
    player.position.x = Math.max(-48, Math.min(48, player.position.x));
    player.position.z = Math.max(-48, Math.min(48, player.position.z));
  }
  pushOutOfWalls(player.position);
  player.rotation.y = yaw;

  // Your phones
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.dir, 0.8);
    b.rotation.z += PHONE_SPIN; // card spin

    if (dummy.visible && b.position.distanceTo(dummy.position) < 1.2) {
      damageDummy(b.userData.damage);
      scene.remove(b);
      bullets.splice(i, 1);
      continue;
    }

    b.userData.life--;
    if (b.userData.life <= 0 || b.position.y < 0 || insideWall(b.position)) {
      scene.remove(b);
      bullets.splice(i, 1);
    }
  }

  // Your grenades
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    g.userData.vel.y -= 0.012;
    g.position.add(g.userData.vel);
    g.rotation.x += 0.3;
    if (g.position.y <= 0.2 || insideWall(g.position)) {
      explode(g.position);
      scene.remove(g);
      grenades.splice(i, 1);
    }
  }

  // Dummy shoots at you about every 1.5 seconds
  enemyTimer++;
  if (enemyTimer >= 90 && playing && dummy.visible && !dead) {
    enemyTimer = 0;
    const eb = new THREE.Mesh(new THREE.SphereGeometry(0.2), enemyBulletMat);
    eb.position.copy(dummy.position);
    eb.position.y = 1.5;
    const dir = new THREE.Vector3().subVectors(player.position, dummy.position);
    dir.y = 0;
    dir.normalize();
    eb.userData.dir = dir;
    eb.userData.life = 120;
    scene.add(eb);
    enemyBullets.push(eb);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.position.addScaledVector(eb.userData.dir, 0.4);

    if (!dead && eb.position.distanceTo(player.position) < 1.2) {
      damagePlayer(10);
      scene.remove(eb);
      enemyBullets.splice(i, 1);
      continue;
    }

    eb.userData.life--;
    if (eb.userData.life <= 0 || insideWall(eb.position)) {
      scene.remove(eb);
      enemyBullets.splice(i, 1);
    }
  }

  // Ability text
  abilityHud.innerHTML =
    cooldownText("Dash", "Q", lastDash, current.dashCooldown) +
    "<br>" +
    cooldownText("Grenade", "E", lastGrenade, current.grenadeCooldown);

  // Camera sits behind the player
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const aimY = player.position.y + 0.5;
  camera.position.set(
    player.position.x + Math.sin(yaw) * cp * 8,
    Math.max(0.5, aimY + 1.5 - sp * 8),
    player.position.z + Math.cos(yaw) * cp * 8
  );
  camera.lookAt(
    player.position.x - Math.sin(yaw) * cp * 20,
    aimY + sp * 20,
    player.position.z - Math.cos(yaw) * cp * 20
  );

  renderer.render(scene, camera);
}
animate();
