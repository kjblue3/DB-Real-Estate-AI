let scene, camera, renderer, controls;

async function fetchLayout(data) {
    const res = await fetch("/generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

function clearScene() {
    while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }
}

function createRoom(room) {
    const geom = new THREE.BoxGeometry(room.width, room.height, room.length);
    const mat = new THREE.MeshStandardMaterial({ color: 0x99ccff });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(
        room.x + room.width / 2,
        room.height / 2,
        room.y + room.length / 2
    );
    scene.add(mesh);
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("viewer").appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    const grid = new THREE.GridHelper(50, 50);
    scene.add(grid);

    const loader = document.createElement('script');
    loader.src = 'https://threejs.org/examples/js/controls/OrbitControls.js';
    loader.onload = () => {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        animate();
    };
    document.head.appendChild(loader);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}

async function generateLayout() {
    const inputData = {
        num_people: document.getElementById("num_people").value,
        budget: document.getElementById("budget").value,
        climate: document.getElementById("climate").value,
        needs: document.getElementById("needs").value,
        style: document.getElementById("style").value
    };

    const layout = await fetchLayout(inputData);

    clearScene();
    if (layout.rooms) {
        layout.rooms.forEach(createRoom);
    } else {
        console.error("Error generating layout:", layout);
        alert("Error: " + JSON.stringify(layout));
    }
}

window.addEventListener("DOMContentLoaded", () => {
    setupScene();
});
