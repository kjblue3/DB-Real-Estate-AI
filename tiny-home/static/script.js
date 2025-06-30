async function fetchLayout() {
  const res = await fetch("/generate-layout", { method: "POST" });
  const data = await res.json();
  return data.rooms;
}

function createRoom(room, scene) {
  const geometry = new THREE.BoxGeometry(room.width, room.height, room.length);
  const material = new THREE.MeshStandardMaterial({ color: 0x99ccff });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(room.x + room.width / 2, room.height / 2, room.y + room.length / 2);
  scene.add(cube);
}

async function init() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  const rooms = await fetchLayout();
  rooms.forEach(room => createRoom(room, scene));

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}

init();
