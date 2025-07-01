let engine, scene, camera;

async function fetchLayout(data) {
    const res = await fetch("/generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

function clearScene() {
    const toRemove = scene.meshes.filter(mesh => mesh.name !== "ground");
    toRemove.forEach(mesh => mesh.dispose());
}

function createFeature(room, feature) {
    const baseX = room.x + room.width / 2;
    const baseZ = room.y + room.length / 2;

    if (feature === "window") {
        const windowMesh = BABYLON.MeshBuilder.CreatePlane("window", { width: 1, height: 1 }, scene);
        windowMesh.position = new BABYLON.Vector3(baseX, 1.5, room.y);
        const mat = new BABYLON.StandardMaterial("winMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.9, 1.0);
        mat.alpha = 0.5;
        windowMesh.material = mat;
    }

    if (feature === "roof") {
        const roof = BABYLON.MeshBuilder.CreateCylinder("roof", {
            diameter: Math.max(room.width, room.length) * 1.2,
            height: 1,
            tessellation: 3
        }, scene);
        roof.position = new BABYLON.Vector3(baseX, room.height + 0.5, baseZ);
        roof.rotation.z = Math.PI / 2;
        roof.material = new BABYLON.StandardMaterial("roofMat", scene);
        roof.material.diffuseColor = new BABYLON.Color3(0.5, 0.2, 0.2);
    }

    if (feature === "plant") {
        const plant = BABYLON.MeshBuilder.CreateSphere("plant", { diameter: 0.5 }, scene);
        plant.position = new BABYLON.Vector3(baseX + 1, 0.25, baseZ + 1);
        const mat = new BABYLON.StandardMaterial("plantMat", scene);
        mat.diffuseColor = BABYLON.Color3.Green();
        plant.material = mat;
    }

    if (feature === "bed") {
        const bed = BABYLON.MeshBuilder.CreateBox("bed", { width: 2, height: 0.5, depth: 1 }, scene);
        bed.position = new BABYLON.Vector3(baseX - 1, 0.25, baseZ - 1);
        bed.material = new BABYLON.StandardMaterial("bedMat", scene);
        bed.material.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.7);
    }
}

function createRoom(room) {
    const box = BABYLON.MeshBuilder.CreateBox(room.name, {
        width: room.width,
        height: room.height,
        depth: room.length
    }, scene);

    box.position.x = room.x + room.width / 2;
    box.position.y = room.height / 2;
    box.position.z = room.y + room.length / 2;

    const mat = new BABYLON.StandardMaterial("mat_" + room.name, scene);
    mat.diffuseColor = new BABYLON.Color3(0.6, 0.8, 1.0); // light blue
    box.material = mat;

    if (room.features) {
        room.features.forEach(feature => createFeature(room, feature));
    }
}

function setupScene() {
    const canvas = document.createElement("canvas");
    canvas.id = "renderCanvas";
    document.getElementById("viewer").appendChild(canvas);

    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);

    camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 4, Math.PI / 3, 30, new BABYLON.Vector3(10, 0, 10), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}

async function generateLayout() {
    const inputData = {
        num_people: document.getElementById("num_people").value,
        budget: document.getElementById("budget").value,
        needs: document.getElementById("needs").value
    };

    const layout = await fetchLayout(inputData);
    console.log("Returned layout:", layout);

    clearScene();

    if (layout.rooms) {
        layout.rooms.forEach(createRoom);
        document.getElementById("explanation").innerText = layout.explanation || "No explanation provided.";
    } else {
        alert("Failed to generate layout.");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    setupScene();
    document.getElementById("generate-btn").addEventListener("click", generateLayout);
});
