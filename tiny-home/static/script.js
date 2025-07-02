let engine, scene, currentCamera, canvas;
let layoutData = null;
let isInterior = false;

// Load layout JSON
async function fetchLayout(data) {
  const res = await fetch("/generate-layout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Clear all meshes except ground
function clearScene() {
  scene.meshes.slice().forEach(m => {
    if (m.name !== "ground") m.dispose();
  });
}

// Build the exterior view with colored boxes, doors, paths, and plants
function createExterior() {
  clearScene();
  isInterior = false;
  document.getElementById("outside-btn").style.display = "none";

  layoutData.rooms.forEach(room => {
    // Room box
    const box = BABYLON.MeshBuilder.CreateBox(room.name, {
      width: room.width,
      height: room.height,
      depth: room.length
    }, scene);
    box.position.set(
      room.x + room.width/2,
      room.height/2,
      room.y + room.length/2
    );
    box.material = new BABYLON.StandardMaterial("mat_"+room.name, scene);
    box.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());

    // Door
    if (room.features.includes("door")) {
      const door = BABYLON.MeshBuilder.CreateBox("door_"+room.name, {
        width:1, height:2, depth:0.1
      }, scene);
      door.position.set(
        room.x + room.width/2,
        1,
        room.y
      );
      door.material = new BABYLON.StandardMaterial("doorMat", scene);
      door.material.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0);

      // Path
      const pathLen = 8;
      const path = BABYLON.MeshBuilder.CreateBox("path_"+room.name, {
        width:1.5, height:0.05, depth:pathLen
      }, scene);
      path.position.set(
        door.position.x,
        0.025,
        door.position.z - pathLen/2 - 0.05
      );
      path.material = new BABYLON.StandardMaterial("pathMat", scene);
      path.material.diffuseColor = new BABYLON.Color3(0.6,0.6,0.6);

      // Potted plants (2 each side)
      [-1,1].forEach(side=>{
        [2,6].forEach(off=>{
          const pot = BABYLON.MeshBuilder.CreateCylinder(
            `pot_${room.name}_${side}_${off}`, { diameter:0.5, height:0.5 }, scene
          );
          pot.position.set(
            path.position.x + side*0.9,
            0.25,
            path.position.z + 0.05 - off
          );
          pot.material = new BABYLON.StandardMaterial("potMat", scene);
          pot.material.diffuseColor = new BABYLON.Color3(0.5,0.3,0.1);

          const leaves = BABYLON.MeshBuilder.CreateSphere(
            `leaf_${room.name}_${side}_${off}`, { diameter:0.6 }, scene
          );
          leaves.position = pot.position.add(new BABYLON.Vector3(0,0.55,0));
          leaves.material = new BABYLON.StandardMaterial("leafMat", scene);
          leaves.material.diffuseColor = new BABYLON.Color3(0.1,0.5,0.1);
        });
      });
    }
  });
}

// Build the interior view: floor, walls, ceiling, furniture, and first-person camera
function createInterior(doorMesh) {
  clearScene();
  isInterior = true;
  document.getElementById("outside-btn").style.display = "inline-block";

  const roomName = doorMesh.name.replace("door_","");
  const room = layoutData.rooms.find(r=>r.name===roomName);
  if (!room) return;

  // Floor
  const floor = BABYLON.MeshBuilder.CreateGround("floor", {
    width: room.width,
    height: room.length
  }, scene);
  floor.position.set(
    room.x + room.width/2,
    0,
    room.y + room.length/2
  );
  floor.material = new BABYLON.StandardMaterial("floorMat", scene);
  floor.material.diffuseColor = new BABYLON.Color3(0.95,0.95,0.95);

  // Walls (back, left, right)
  const h = room.height, t = 0.1;
  [
    { dx: 0, dz: room.length/2,   w: room.width, d: t },
    { dx: room.width/2, dz: 0,    w: t,         d: room.length },
    { dx: -room.width/2, dz: 0,   w: t,         d: room.length }
  ].forEach((w,i)=>{
    const wall = BABYLON.MeshBuilder.CreateBox(`wall${i}`, {
      width: w.w, height: h, depth: w.d
    }, scene);
    wall.position = floor.position.add(new BABYLON.Vector3(w.dx, h/2, w.dz));
    wall.material = new BABYLON.StandardMaterial("wallMat", scene);
    wall.material.diffuseColor = new BABYLON.Color3(1,1,1);
  });

  // Ceiling
  const ceil = BABYLON.MeshBuilder.CreateGround("ceiling", {
    width: room.width,
    height: room.length
  }, scene);
  ceil.position = floor.position.add(new BABYLON.Vector3(0,room.height,0));
  ceil.rotation.x = Math.PI;
  ceil.material = new BABYLON.StandardMaterial("ceilMat", scene);
  ceil.material.diffuseColor = new BABYLON.Color3(0.9,0.9,0.9);

  // Furniture (sofa, table, lamp)
  const sofa = BABYLON.MeshBuilder.CreateBox("sofa", {
    width: room.width/2, height:0.5, depth:room.length/4
  }, scene);
  sofa.position = floor.position.add(new BABYLON.Vector3(-room.width/4,0.25,room.length/4));
  sofa.material = new BABYLON.StandardMaterial("sofaMat", scene);
  sofa.material.diffuseColor = new BABYLON.Color3(0.8,0.2,0.2);

  const table = BABYLON.MeshBuilder.CreateCylinder("table", {
    diameter: room.width/6, height:0.2, tessellation:32
  }, scene);
  table.position = floor.position.add(new BABYLON.Vector3(room.width/4,0.1,-room.length/4));
  table.material = new BABYLON.StandardMaterial("tableMat", scene);
  table.material.diffuseColor = new BABYLON.Color3(0.6,0.4,0.2);

  const lamp = BABYLON.MeshBuilder.CreateCylinder("lamp", { diameter:0.1, height:1 }, scene);
  lamp.position = floor.position.add(new BABYLON.Vector3(room.width/4,0.5,room.length/4));
  lamp.material = new BABYLON.StandardMaterial("lampMat", scene);
  lamp.material.diffuseColor = new BABYLON.Color3(0.2,0.2,0.2);
  const lampHead = BABYLON.MeshBuilder.CreateSphere("lampHead", { diameter:0.3 }, scene);
  lampHead.position = lamp.position.add(new BABYLON.Vector3(0,0.6,0));
  lampHead.material = new BABYLON.StandardMaterial("lampHeadMat", scene);
  lampHead.material.emissiveColor = new BABYLON.Color3(1,1,0.8);

  // Switch to FreeCamera for click-to-move
  currentCamera.detachControl(canvas);
  currentCamera.dispose();
  currentCamera = new BABYLON.FreeCamera("freeCam",
    new BABYLON.Vector3(room.x + room.width/2, 1.6, room.y + room.length + 0.3),
    scene);
  currentCamera.attachControl(canvas, true);

  // Set up click handling for interior
  scene.onPointerObservable.clear();
  scene.onPointerObservable.add(evt => {
    if (evt.type !== BABYLON.PointerEventTypes.POINTERUP) return;
    // Only left button
    if (evt.event && evt.event.button !== 0) return;
    const pi = evt.pickInfo;
    if (pi && pi.hit) {
      const m = pi.pickedMesh;
      if (m && m.name.startsWith("door_")) {
        document.getElementById("outside-btn").click();
        return;
      }
      if (m === floor && pi.pickedPoint) {
        currentCamera.position.set(pi.pickedPoint.x, 1.6, pi.pickedPoint.z);
      }
    }
  });
}

// Initialize Babylon scene
function setupScene() {
  canvas = document.getElementById("renderCanvas");
  engine = new BABYLON.Engine(canvas, true);
  scene = new BABYLON.Scene(engine);

  currentCamera = new BABYLON.ArcRotateCamera("arcCam",
    Math.PI/4, Math.PI/3, 50, new BABYLON.Vector3(10,0,10), scene);
  currentCamera.attachControl(canvas, true);

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0,1,0), scene);
  BABYLON.MeshBuilder.CreateGround("ground", { width:100, height:100 }, scene);

  // Set up initial exterior click handling (no rooms yet)
  scene.onPointerObservable.clear();

  engine.runRenderLoop(()=>scene.render());
  window.addEventListener("resize", ()=>engine.resize());
}

// Button handlers
window.addEventListener("DOMContentLoaded", ()=>{
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
    // After rooms exist, enable exterior clicks
    enableExteriorClicks();
  };

  document.getElementById("outside-btn").onclick = () => {
    // Switch back to ArcRotateCamera
    currentCamera.detachControl(canvas);
    currentCamera.dispose();
    isInterior = false;

    currentCamera = new BABYLON.ArcRotateCamera("arcCam",
      Math.PI/4, Math.PI/3, 50, new BABYLON.Vector3(10,0,10), scene);
    currentCamera.attachControl(canvas, true);

    createExterior();
    enableExteriorClicks();
  };
});
