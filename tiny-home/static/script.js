let engine, scene, currentCamera, layoutData, canvas;
let isInterior = false;

// Fetch layout JSON from server
async function fetchLayout(data) {
  const res = await fetch("/generate-layout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Remove all meshes except ground
function clearScene() {
  scene.meshes.slice().forEach(m => {
    if (m.name !== "ground") m.dispose();
  });
}

// Create exterior rooms, doors, path, and plants
function createExterior() {
  clearScene();
  isInterior = false;
  document.getElementById("outside-btn").style.display = "none";

  layoutData.rooms.forEach(room => {
    // Room block
    const box = BABYLON.MeshBuilder.CreateBox(room.name, {
      width: room.width, height: room.height, depth: room.length
    }, scene);
    box.position = new BABYLON.Vector3(
      room.x + room.width / 2,
      room.height / 2,
      room.y + room.length / 2
    );
    const mat = new BABYLON.StandardMaterial("mat_" + room.name, scene);
    mat.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
    box.material = mat;

    // Door
    if (room.features.includes("door")) {
      const door = BABYLON.MeshBuilder.CreateBox("door_" + room.name, {
        width: 1, height: 2, depth: 0.1
      }, scene);
      door.position = new BABYLON.Vector3(
        room.x + room.width / 2,
        1,
        room.y
      );
      const dmat = new BABYLON.StandardMaterial("doorMat", scene);
      dmat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0);
      door.material = dmat;

      // Path
      const pathLength = 8;
      const path = BABYLON.MeshBuilder.CreateBox("path_" + room.name, {
        width: 1.5, height: 0.05, depth: pathLength
      }, scene);
      path.position = new BABYLON.Vector3(
        door.position.x,
        0.025,
        door.position.z - pathLength / 2 - 0.05
      );
      const pmat = new BABYLON.StandardMaterial("pathMat", scene);
      pmat.diffuseTexture = new BABYLON.Texture("https://i.imgur.com/3a7Z1.png", scene);
      path.material = pmat;

      // Potted plants: two on each side
      [ -1, 1 ].forEach(side => {
        [2, 6].forEach(offset => {
          const pot = BABYLON.MeshBuilder.CreateCylinder(`pot_${room.name}_${side}_${offset}`, {
            diameter: 0.5, height: 0.5
          }, scene);
          pot.position = new BABYLON.Vector3(
            path.position.x + side * 0.9,
            0.25,
            path.position.z + 0.05 - offset
          );
          const potMat = new BABYLON.StandardMaterial("potMat", scene);
          potMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
          pot.material = potMat;

          const leaves = BABYLON.MeshBuilder.CreateSphere(`leaf_${room.name}_${side}_${offset}`, {
            diameter: 0.6
          }, scene);
          leaves.position = pot.position.add(new BABYLON.Vector3(0, 0.55, 0));
          const leafMat = new BABYLON.StandardMaterial("leafMat", scene);
          leafMat.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1);
          leaves.material = leafMat;
        });
      });
    }
  });
}

// Build interior: walls, ceiling, furniture, and first-person camera
function createInterior(doorMesh) {
  clearScene();
  isInterior = true;
  document.getElementById("outside-btn").style.display = "inline-block";

  const roomName = doorMesh.name.replace("door_", "");
  const room = layoutData.rooms.find(r => r.name === roomName);

  // Floor
  const floor = BABYLON.MeshBuilder.CreateGround("floor", {
    width: room.width, height: room.length
  }, scene);
  floor.position = new BABYLON.Vector3(room.x + room.width / 2, 0, room.y + room.length / 2);
  floor.material = new BABYLON.StandardMaterial("floorMat", scene);
  floor.material.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);

  // Walls (skip door wall)
  const thickness = 0.1, h = room.height;
  const walls = [
    { x: room.x + room.width / 2, y: h / 2, z: room.y + room.length, w: room.width, d: thickness },    // back
    { x: room.x + room.width, y: h / 2, z: room.y + room.length / 2, w: thickness, d: room.length },  // right
    { x: room.x, y: h / 2, z: room.y + room.length / 2, w: thickness, d: room.length },               // left
    // front wall omitted for door
  ];
  walls.forEach((w, i) => {
    const wall = BABYLON.MeshBuilder.CreateBox(`wall${i}`, {
      width: w.w, height: h, depth: w.d
    }, scene);
    wall.position = new BABYLON.Vector3(w.x, w.y, w.z);
    wall.material = new BABYLON.StandardMaterial("wallMat", scene);
    wall.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
  });

  // Ceiling
  const ceil = BABYLON.MeshBuilder.CreateGround("ceiling", {
    width: room.width, height: room.length
  }, scene);
  ceil.position = new BABYLON.Vector3(room.x + room.width / 2, room.height, room.y + room.length / 2);
  ceil.rotation.x = Math.PI;
  ceil.material = new BABYLON.StandardMaterial("ceilMat", scene);
  ceil.material.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);

  // Sofa
  const sofa = BABYLON.MeshBuilder.CreateBox("sofa", {
    width: room.width / 2, height: 0.5, depth: room.length / 4
  }, scene);
  sofa.position = floor.position.add(new BABYLON.Vector3(-room.width / 4, 0.25, room.length / 4));
  sofa.material = new BABYLON.StandardMaterial("sofaMat", scene);
  sofa.material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);

  // Table
  const table = BABYLON.MeshBuilder.CreateCylinder("table", {
    diameter: room.width / 6, height: 0.2, tessellation: 32
  }, scene);
  table.position = floor.position.add(new BABYLON.Vector3(room.width / 4, 0.1, -room.length / 4));
  table.material = new BABYLON.StandardMaterial("tableMat", scene);
  table.material.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);

  // Lamp
  const lampStand = BABYLON.MeshBuilder.CreateCylinder("lamp", {
    diameter: 0.1, height: 1
  }, scene);
  lampStand.position = floor.position.add(new BABYLON.Vector3(room.width / 4, 0.5, room.length / 4));
  lampStand.material = new BABYLON.StandardMaterial("lampMat", scene);
  lampStand.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  const lampHead = BABYLON.MeshBuilder.CreateSphere("lampHead", { diameter: 0.3 }, scene);
  lampHead.position = lampStand.position.add(new BABYLON.Vector3(0, 0.6, 0));
  lampHead.material = new BABYLON.StandardMaterial("lampHeadMat", scene);
  lampHead.material.emissiveColor = new BABYLON.Color3(1, 1, 0.8);

  // First‑person camera
  currentCamera.detachControl(canvas);
  currentCamera.dispose();
  currentCamera = new BABYLON.UniversalCamera("uniCam",
    new BABYLON.Vector3(room.x + room.width / 2, 1.6, room.y + room.length + 0.3),
    scene);
  currentCamera.attachControl(canvas, true);
  currentCamera.speed = 0.5;
}

// Initialize scene
function setupScene() {
  canvas = document.getElementById("renderCanvas");
  engine = new BABYLON.Engine(canvas, true);
  scene = new BABYLON.Scene(engine);

  // Exterior camera
  currentCamera = new BABYLON.ArcRotateCamera("arcCam",
    Math.PI / 4, Math.PI / 3, 50,
    new BABYLON.Vector3(10, 0, 10), scene);
  currentCamera.attachControl(canvas, true);

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);

  // Handle door clicks
  scene.onPointerObservable.add(evt => {
    if (!isInterior && evt.pickInfo.hit) {
      const mesh = evt.pickInfo.pickedMesh;
      if (mesh.name.startsWith("door_")) createInterior(mesh);
    }
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
}

// Button handlers
window.addEventListener("DOMContentLoaded", () => {
  setupScene();
  document.getElementById("generate-btn").onclick = async () => {
    layoutData = await fetchLayout({
      num_people: +document.getElementById("num_people").value,
      budget: document.getElementById("budget").value,
      needs: document.getElementById("needs").value
    });
    isInterior = false;
    document.getElementById("explanation").innerText = layoutData.explanation;
    createExterior();
  };
  document.getElementById("outside-btn").onclick = () => {
    // Restore exterior camera
    currentCamera.detachControl(canvas);
    currentCamera.dispose();
    currentCamera = new BABYLON.ArcRotateCamera("arcCam",
      Math.PI / 4, Math.PI / 3, 50,
      new BABYLON.Vector3(10, 0, 10), scene);
    currentCamera.attachControl(canvas, true);
    createExterior();
  };
});
