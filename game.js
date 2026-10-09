import * as THREE from "three";

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

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x55aa55 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Player (placeholder teacher)
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.y = 1;
scene.add(player);

// ---------- UI: health bar, crosshair, death message ----------
const healthBox = document.createElement("div");
healthBox.style.cssText =
  "position:fixed;bottom:20px;left:20px;width:250px;height:24px;background:#333;border:2px solid #fff;";
const healthFill = document.createElement("div");
healthFill.style.cssText = "height:100%;width:100%;background:#2ecc40;";
healthBox.appendChild(healthFill);
document.body.appendChild(healthBox);

const crosshair = document.createElement("div");
crosshair.style.cssText =
  "position:fixed;top:50%;left:50%;width:8px;height:8px;margin:-4px 0 0 -4px;background:#fff;border:1px solid #000;border-radius:50%;";
document.body.appendChild(crosshair);

const deathMsg = document.createElement("div");
deathMsg.textContent = "YOU DIED - respawning...";
deathMsg.style.cssText =
  "position:fixed;top:40%;width:100%;text-align:center;font:bold 40px sans-serif;color:#fff;text-shadow:2px 2px 4px #000;display:none;";
document.body.appendChild(deathMsg);

// ---------- Player health ----------
let playerHealth = 100;
let maxHealth = 100;
let lastShot = 0;
let dead = false;

function updateHealthBar() {
    healthFill.style.width = (playerHealth / maxHealth) * 100 + "%";
}

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

// Keyboard
const keys = {};
addEventListener("keydown", (e) => (keys[e.code] = true));
addEventListener("keyup", (e) => (keys[e.code] = false));

// Fix the screen if the window is resized
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Mouse aiming: click the page to lock the mouse, then move it to turn
let yaw = 0;
renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});
addEventListener("mousemove", (e) => {
  if (document.pointerLockElement) yaw -= e.movementX * 0.003;
});

// Your bullets
const bullets = [];
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
addEventListener("mousedown", () => {
    if (!document.pointerLockElement || dead) return;
  if (performance.now() - lastShot < current.fireDelay) return;
  lastShot = performance.now();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.15), bulletMat);
  b.position.copy(player.position);
  b.position.y = 1.5;
  b.userData.dir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  b.userData.life = 100;
  scene.add(b);
  bullets.push(b);
});

// Enemy bullets
const enemyBullets = [];
const enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
let enemyTimer = 0;

// Target dummy (now shoots back)
const dummy = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x3366ff })
);
dummy.position.set(0, 1, -10);
dummy.userData.health = 100;
scene.add(dummy);

let speed = 0.15;

// Teacher characters (change these numbers to balance them)
const characters = {
  1: { name: "Mr. Math", color: 0xff0000, health: 100, speed: 0.15, damage: 20, fireDelay: 300 },
  2: { name: "Coach", color: 0xff8800, health: 200, speed: 0.11, damage: 35, fireDelay: 600 },
  3: { name: "Science", color: 0x9b59b6, health: 70, speed: 0.2, damage: 10, fireDelay: 120 },
};
let current = characters[1];

function selectCharacter(num) {
  current = characters[num];
  player.material.color.setHex(current.color);
  maxHealth = current.health;
  playerHealth = maxHealth;
  speed = current.speed;
  updateHealthBar();
}
addEventListener("keydown", (e) => {
  if (e.code === "Digit1") selectCharacter(1);
  if (e.code === "Digit2") selectCharacter(2);
  if (e.code === "Digit3") selectCharacter(3);
});
selectCharacter(1);

function animate() {
  requestAnimationFrame(animate);

  // Move relative to where you're facing
  if (!dead) {
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    if (keys.KeyW) player.position.addScaledVector(forward, speed);
    if (keys.KeyS) player.position.addScaledVector(forward, -speed);
    if (keys.KeyD) player.position.addScaledVector(right, speed);
    if (keys.KeyA) player.position.addScaledVector(right, -speed);
  }
  player.rotation.y = yaw;

  // Move your bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.dir, 0.8);

    // Hit check
    if (dummy.visible && b.position.distanceTo(dummy.position) < 1.2) {
      dummy.userData.health -= current.damage;
      dummy.material.color.setHex(0xffffff);
      setTimeout(() => dummy.material.color.setHex(0x3366ff), 80);
      scene.remove(b);
      bullets.splice(i, 1);
      if (dummy.userData.health <= 0) {
        dummy.visible = false;
        setTimeout(() => {
          dummy.userData.health = 100;
          dummy.visible = true;
        }, 3000);
      }
      continue;
    }

    b.userData.life--;
    if (b.userData.life <= 0) {
      scene.remove(b);
      bullets.splice(i, 1);
    }
  }

  // Dummy shoots at you about every 1.5 seconds
  enemyTimer++;
  if (enemyTimer >= 90 && dummy.visible && !dead) {
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

  // Move enemy bullets and check if they hit you
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
