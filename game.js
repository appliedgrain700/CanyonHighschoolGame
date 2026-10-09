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

const speed = 0.15;

function animate() {
  requestAnimationFrame(animate);

  if (keys.KeyW) player.position.z -= speed;
  if (keys.KeyS) player.position.z += speed;
  if (keys.KeyA) player.position.x -= speed;
  if (keys.KeyD) player.position.x += speed;

  // Camera follows behind and above the player
  camera.position.set(player.position.x, player.position.y + 5, player.position.z + 8);
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}
animate();
