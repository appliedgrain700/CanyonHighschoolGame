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

// Bullets
const bullets = [];
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
addEventListener("mousedown", () => {
  if (!document.pointerLockElement) return;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.15), bulletMat);
  b.position.copy(player.position);
  b.position.y = 1.5;
  b.userData.dir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  b.userData.life = 100;
  scene.add(b);
  bullets.push(b);
});
const speed = 0.15;

function animate() {
  requestAnimationFrame(animate);

  // Move relative to where you're facing
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  if (keys.KeyW) player.position.addScaledVector(forward, speed);
  if (keys.KeyS) player.position.addScaledVector(forward, -speed);
  if (keys.KeyD) player.position.addScaledVector(right, speed);
  if (keys.KeyA) player.position.addScaledVector(right, -speed);
  player.rotation.y = yaw;

  // Move bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.dir, 0.8);
    b.userData.life--;
    if (b.userData.life <= 0) {
      scene.remove(b);
      bullets.splice(i, 1);
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
