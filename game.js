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
    fireDelay: 700, // ms between bursts
    spread: 0.08, // bigger = phones spread out more
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
  if (!playing || dead) {
    if (e.code === "KeyC" && !playing) return;
    return;
  }
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
  if (document.pointerLockElement) yaw -= e.movementX * 0.003;
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
    setTimeout(() => {
      dummy.userData.health = DUMMY_MAX;
      dummyBar.scale.x = 1;
      dummy.visible = true;
    }, 3000);
  }
}

// ================= MR. MAHONEY: PHONE BURST =================
const bullets = [];
const phoneGeo = new THREE.BoxGeometry(0.25, 0.06, 0.45);
const phoneMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

function shoot() {
  for (let i = 0; i < current.burst; i++) {
    const angle = yaw + (Math.random() - 0.5) * 2 * current.spread;
    const b = new THREE.Mesh(phoneGeo, phoneMat);
    b.position.set(player.position.x, 1.5, player.position.z);
    b.rotation.y = angle;
    b.userData.dir = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
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
  player.position.addScaledVector(dir, current.dashDistance);
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
  g.userData.vel = new THREE.Vector3(-Math.sin(yaw) * 0.35, 0.25, -Math.cos(yaw) * 0.35);
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
  player.rotation.y = yaw;

  // Your phones
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.dir, 0.8);

    if (dummy.visible && b.position.distanceTo(dummy.position) < 1.2) {
      damageDummy(b.userData.damage);
      scene.remove(b);
      bullets.splice(i, 1);
      continue;
    }

    b.userData.life--;
    if (b.userData.life <= 0) {
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
    if (g.position.y <= 0.2) {
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
    if (eb.userData.life <= 0) {
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
  camera.position.set(
    player.position.x + Math.sin(yaw) * 8,
    player.position.y + 4,
    player.position.z + Math.cos(yaw) * 8
  );
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z);

  renderer.render(scene, camera);
}
animate();
