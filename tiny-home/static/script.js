// Import from CDN as modules
import * as THREE from 'https://cdn.skypack.dev/three@0.148.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.148.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;

async function fetchLayout(data) {
    const res = await fetch("/generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    try {
        return await res.json();
    } catch (error) {
        console.error("Failed to parse response as JSON:", error);
        return { error: "Invalid JSON response from server." };
    }
}

function clearScene() {
    if (!scene) return;
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const obj = scene.children[i];
        if (obj.type === 'Mesh' || obj.type === 'GridHelper') {
            scene.remove(obj);
        }
    }
}

function createRoom(room) {
    const geometry = new THREE.BoxGeometry(room.width, room.height, room.length);
    const material = new THREE.MeshStandardMaterial({ color: 0x99ccff });
    const mesh = new THREE.Mesh(geometry, material);
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

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("viewer").appendChild(renderer.domElement);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    scene.add(new THREE.AmbientLight(0x404040));
    scene.add(new THREE.GridHelper(50, 50));

    controls = new OrbitControls(camera, renderer.domElement);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
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
    console.log("Layout returned from API:", layout);

    clearScene();

    if (layout.rooms && Array.isArray(layout.rooms)) {
        layout.rooms.forEach(createRoom);
    } else {
        console.error("Invalid layout response:", layout);
        alert("Error: Could not generate rooms. See console for details.");
    }
}

// Setup after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
    setupScene();
    document.getElementById("generateBtn").addEventListener("click", generateLayout);
});
