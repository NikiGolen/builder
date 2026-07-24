import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Preset Sizing & Catalog Data Sets
const sizePresets = {
  small: { width: 560, height: 440, readout: "14ft x 11ft", area: "154 sq ft", floorScale: { x: 7, z: 5.5 } },
  medium: { width: 720, height: 520, readout: "18ft x 13ft", area: "234 sq ft", floorScale: { x: 10, z: 8 } },
  large: { width: 880, height: 600, readout: "22ft x 15ft", area: "330 sq ft", floorScale: { x: 13, z: 9 } }
};

const catalogs = {
  medsurg: {
    title: "Med-Surg Room Builder",
    desc: "Configure a standard clinical training slot",
    headline: "Template Workspace: Medical-Surgical Ward Simulation",
    themeClass: "medsurg-theme",
    items: [
      { label: "Patient Bed", icon: "🛏️", sub: "Multi-position electric model", bg: "#e0f2fe", dims: [1.4, 0.7, 2.2], color: 0x0284c7 },
      { label: "Medical Headwall", icon: "🔌", sub: "Integrated gas & electrical panel", bg: "#e0f2fe", dims: [1.4, 0.4, 0.04], color: 0xf8fafc, isWallItem: true },
      { label: "Anatomical Poster", icon: "🖼️", sub: "Skeletal system educational chart", bg: "#fef08a", dims: [1.0, 1.2, 0.02], color: 0xfffbeb, isWallItem: true },
      { label: "Bedside Cabinet", icon: "🗄️", sub: "Rolling 3-drawer bedside unit", bg: "#fef3c7", dims: [0.6, 0.8, 0.6], color: 0xd97706 },
      { label: "Adult Manikin", icon: "🧍", sub: "High-Fidelity Patient Simulator", bg: "#f1f5f9", dims: [0.6, 0.4, 1.8], color: 0x64748b },
      { label: "IV Pole", icon: "⚗️", sub: "Mobile rolling infusion stand", bg: "#dcfce7", dims: [0.6, 1.8, 0.6], color: 0x64748b },
      { label: "Overbed Table", icon: "🪵", sub: "C-base rolling medical tray", bg: "#fef3c7", dims: [1.0, 0.9, 0.5], color: 0xd97706 },
      { label: "Bio-Waste", icon: "🟥", sub: "Regulated wall sharp box", bg: "#fee2e2", dims: [0.4, 0.5, 0.3], color: 0xdc2626, isWallItem: true }
    ]
  },
  pharmacy: {
    title: "Pharmacy Lab Builder",
    desc: "Configure instructional compounding spaces",
    headline: "Template Workspace: Institutional Pharmacy Simulation",
    themeClass: "pharmacy-theme",
    items: [
      { label: "Laminar Hood", icon: "🌬️", sub: "Sterile compounding workbench", bg: "#ccfbf1", dims: [1.8, 2.0, 0.9], color: 0x0d9488 },
      { label: "Medication Cart", icon: "🛒", sub: "Locking rolling unit dose cart", bg: "#f1f5f9", dims: [1.0, 1.1, 0.7], color: 0x475569 },
      { label: "Supply Shelving", icon: "🗄️", sub: "Heavy-duty bulk storage rack", bg: "#f5f5f4", dims: [2.0, 2.2, 0.6], color: 0x78716c },
      { label: "POS Register", icon: "💻", sub: "Outpatient retail checkout terminal", bg: "#e0f2fe", dims: [0.8, 1.0, 0.8], color: 0x2563eb },
      { label: "Pill Counter", icon: "🔢", sub: "Digital automatic counting tray", bg: "#fef9c3", dims: [0.8, 0.3, 0.8], color: 0xca8a04 }
    ]
  }
};

// 2. DOM Node Core Hooks
const welcomeScreen = document.getElementById('welcome-screen');
const catalogList = document.getElementById('catalog-list');
const sidebarTitle = document.getElementById('sidebar-title');
const sidebarDesc = document.getElementById('sidebar-desc');
const activeRoomTitle = document.getElementById('active-room-title');
const clearBtn = document.getElementById('clear-workspace');
const changeRoomBtn = document.getElementById('change-room');
const sizeSelect = document.getElementById('room-size-select');
const footprintDims = document.getElementById('footprint-dims');
const footprintArea = document.getElementById('footprint-area');

let scene, camera, renderer, floor, gridHelper, controls;
const spawnedObjects = [];
let wallsData = {};
let activeType = 'medsurg';

// Interaction State Properties
const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2();
let planeIntersectionPoint = new THREE.Vector3();
let selectedMesh = null;
const routingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// 3. Application Lifecycle Setup
function initializeWorkspace(type) {
  activeType = type;
  
  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.visibility = 'hidden';
    welcomeScreen.style.pointerEvents = 'none';
  }
  
  init3DSpace();
}

document.addEventListener('DOMContentLoaded', () => {
  const choiceButtons = document.querySelectorAll('.choice-btn');
  if (choiceButtons.length >= 2) {
    choiceButtons[0].addEventListener('click', () => initializeWorkspace('medsurg'));
    choiceButtons[1].addEventListener('click', () => initializeWorkspace('pharmacy'));
  }

  // Add global keyboard listener for rotation (R key)
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'r' || e.key === 'R') && selectedMesh) {
      selectedMesh.rotation.y += Math.PI / 2;
    }
  });
});

// 4. Core Three.js Space Initialization Engine
function init3DSpace() {
  const container = document.getElementById('blueprint-canvas');
  if (!container) return;
  container.innerHTML = ''; 

  scene = new THREE.Scene();

  // Procedural Marble Background Generator
  const canvasTex = document.createElement('canvas');
  canvasTex.width = 512;
  canvasTex.height = 512;
  const ctx = canvasTex.getContext('2d');
  
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);
  
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.bezierCurveTo(200, 150, 300, 50, 512, 200);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.bezierCurveTo(150, 400, 400, 300, 512, 420);
  ctx.stroke();

  scene.background = new THREE.CanvasTexture(canvasTex);

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 12, 14); 

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85);
  directionalLight.position.set(15, 25, 10);
  scene.add(directionalLight);

  const floorGeo = new THREE.BoxGeometry(1, 0.2, 1); 
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.15, 
    metalness: 0.05 
  });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.1, 0);
  scene.add(floor);

  gridHelper = new THREE.GridHelper(1, 1, 0x1e3a8a, 0x93c5fd);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  updateRoomDimensions();
  setupInteractionEvents(container);

  animate();
  load3DMenuCatalog();
}

// 5. Drag-and-Drop Raycasting Module Logic
function setupInteractionEvents(container) {
  container.addEventListener('pointerdown', (e) => {
    const bounds = container.getBoundingClientRect();
    mouseVector.x = ((e.clientX - bounds.left) / container.clientWidth) * 2 - 1;
    mouseVector.y = -((e.clientY - bounds.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouseVector, camera);
    const hits = raycaster.intersectObjects(spawnedObjects, true);

    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj.parent && obj.parent !== scene && !spawnedObjects.includes(obj)) {
        obj = obj.parent;
      }
      selectedMesh = spawnedObjects.includes(obj) ? obj : hits[0].object;
      controls.enabled = false;
    }
  });

  container.addEventListener('pointermove', (e) => {
    if (!selectedMesh) return;

    const bounds = container.getBoundingClientRect();
    mouseVector.x = ((e.clientX - bounds.left) / container.clientWidth) * 2 - 1;
    mouseVector.y = -((e.clientY - bounds.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouseVector, camera);
    
    if (raycaster.ray.intersectPlane(routingPlane, planeIntersectionPoint)) {
      const sizeConfig = sizePresets[sizeSelect.value];
      const maxX = (sizeConfig.floorScale.x / 2) - 0.5;
      const maxZ = (sizeConfig.floorScale.z / 2) - 0.5;

      const clampedX = Math.max(-maxX, Math.min(maxX, planeIntersectionPoint.x));
      const clampedZ = Math.max(-maxZ, Math.min(maxZ, planeIntersectionPoint.z));

      selectedMesh.position.x = Math.round(clampedX / 0.5) * 0.5;
      selectedMesh.position.z = Math.round(clampedZ / 0.5) * 0.5;
    }
  });
 
  window.addEventListener('pointerup', () => {
    selectedMesh = null;
    if (controls) controls.enabled = true;
  });
}

// 6. Dynamic View-Based Full-Height Walls & Camera-Facing Wall Disappearance
function updateRoomWalls() {
  Object.values(wallsData).forEach(data => scene.remove(data.mesh));
  wallsData = {};

  const sizeConfig = sizePresets[sizeSelect.value];
  const halfX = sizeConfig.floorScale.x / 2;
  const halfZ = sizeConfig.floorScale.z / 2;
  const wallThickness = 0.2;
  const fullHeight = 1.8;

  const createWallMaterial = () => new THREE.MeshStandardMaterial({ 
    color: 0xf1f5f9, 
    roughness: 0.9,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide 
  });

  const backGeo = new THREE.BoxGeometry(sizeConfig.floorScale.x, fullHeight, wallThickness);
  const backWall = new THREE.Mesh(backGeo, createWallMaterial());
  backWall.position.set(0, fullHeight / 2, -halfZ - (wallThickness / 2));
  scene.add(backWall);
  wallsData.back = { mesh: backWall, normal: new THREE.Vector3(0, 0, -1) };

  const frontGeo = new THREE.BoxGeometry(sizeConfig.floorScale.x, fullHeight, wallThickness);
  const frontWall = new THREE.Mesh(frontGeo, createWallMaterial());
  frontWall.position.set(0, fullHeight / 2, halfZ + (wallThickness / 2));
  scene.add(frontWall);
  wallsData.front = { mesh: frontWall, normal: new THREE.Vector3(0, 0, 1) };

  const sideGeo = new THREE.BoxGeometry(wallThickness, fullHeight, sizeConfig.floorScale.z);
  const leftWall = new THREE.Mesh(sideGeo, createWallMaterial());
  leftWall.position.set(-halfX - (wallThickness / 2), fullHeight / 2, 0);
  scene.add(leftWall);
  wallsData.left = { mesh: leftWall, normal: new THREE.Vector3(-1, 0, 0) };

  const rightWall = new THREE.Mesh(sideGeo, createWallMaterial());
  rightWall.position.set(halfX + (wallThickness / 2), fullHeight / 2, 0);
  scene.add(rightWall);
  wallsData.right = { mesh: rightWall, normal: new THREE.Vector3(1, 0, 0) };
}

function updateRoomDimensions() {
  if (!floor || !gridHelper) return;
  const sizeConfig = sizePresets[sizeSelect.value];
  
  if (footprintDims) footprintDims.textContent = sizeConfig.readout;
  if (footprintArea) footprintArea.textContent = sizeConfig.area;

  floor.scale.set(sizeConfig.floorScale.x, 1, sizeConfig.floorScale.z);
  
  scene.remove(gridHelper);
  gridHelper = new THREE.GridHelper(
    Math.max(sizeConfig.floorScale.x, sizeConfig.floorScale.z), 
    Math.max(sizeConfig.floorScale.x, sizeConfig.floorScale.z), 
    0x1e3a8a, 0x93c5fd
  );
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  updateRoomWalls();
}

// 7. Continuous Loop Animation & Dynamic Camera-Facing Wall Fade Logic
function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();

  if (camera && Object.keys(wallsData).length > 0) {
    const cameraDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();

    Object.values(wallsData).forEach(data => {
      const dot = cameraDir.dot(data.normal);
      const targetOpacity = dot > 0.1 ? 0.0 : 1.0; 
      
      data.mesh.material.opacity += (targetOpacity - data.mesh.material.opacity) * 0.15;
      data.mesh.material.transparent = true;
    });
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// 8. Sidebar Menu Rendering Engine
function load3DMenuCatalog() {
  const config = catalogs[activeType];
  
  if (sidebarTitle) sidebarTitle.textContent = config.title;
  if (sidebarDesc) sidebarDesc.textContent = config.desc;
  if (activeRoomTitle) activeRoomTitle.textContent = config.headline;

  if (!catalogList) return;
  catalogList.innerHTML = ''; 

  config.items.forEach((item) => {
    const btn = document.createElement('div');
    btn.className = 'draggable-item';
    btn.style.cursor = 'pointer'; 
    
    btn.innerHTML = `
      <div class="item-icon" style="background: ${item.bg}; font-size: 1.25rem; padding: 8px; border-radius: 4px; display: inline-block;">${item.icon}</div>
      <div style="display: inline-block; vertical-align: top; margin-left: 10px;">
        <strong style="display: block; font-size: 0.9rem;">${item.label}</strong>
        <p style="font-size: 0.75rem; color: #64748b; margin: 2px 0 0 0;">${item.sub}</p>
      </div>
    `;
    
    btn.addEventListener('click', () => {
      spawn3DObject(item);
    });
    catalogList.appendChild(btn);
  });
}

function spawn3DObject(itemData) {
  if (!scene) return;
  
  const group = new THREE.Group();

  if (itemData.label === "Patient Bed") {
    const baseGeo = new THREE.BoxGeometry(1.2, 0.15, 2.0);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const baseMesh = new THREE.Mesh(baseGeo, frameMat);
    baseMesh.position.y = 0.15;
    group.add(baseMesh);

    const mattressGeo = new THREE.BoxGeometry(1.3, 0.25, 2.1);
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.7 }); // Light Blue
    const mattressMesh = new THREE.Mesh(mattressGeo, mattressMat);
    mattressMesh.position.y = 0.35;
    group.add(mattressMesh);

    const headGeo = new THREE.BoxGeometry(1.3, 0.25, 0.8);
    const headMesh = new THREE.Mesh(headGeo, mattressMat);
    headMesh.position.set(0, 0.48, -0.7);
    headMesh.rotation.x = Math.PI / 6;
    group.add(headMesh);

    const boardGeo = new THREE.BoxGeometry(1.35, 0.45, 0.1);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    
    const headBoard = new THREE.Mesh(boardGeo, boardMat);
    headBoard.position.set(0, 0.45, -1.05);
    group.add(headBoard);

    const footBoard = new THREE.Mesh(boardGeo, boardMat);
    footBoard.position.set(0, 0.45, 1.05);
    group.add(footBoard);

  } else if (itemData.label === "Medical Headwall") {
    const sizeConfig = sizePresets[sizeSelect.value];
    const halfZ = sizeConfig.floorScale.z / 2;
    
    const panelGeo = new THREE.BoxGeometry(1.4, 0.4, 0.03);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 1.15, -halfZ + 0.02);
    group.add(panel);

    const stripGeo = new THREE.BoxGeometry(1.3, 0.12, 0.01);
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4, roughness: 0.3 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 1.15, -halfZ + 0.04);
    group.add(strip);

    const outletGeo = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const colors = [0x22c55e, 0xef4444, 0x3b82f6];
    
    for (let i = -1; i <= 1; i++) {
      const outletMat = new THREE.MeshStandardMaterial({ color: colors[i + 1] });
      const outlet = new THREE.Mesh(outletGeo, outletMat);
      outlet.position.set(i * 0.35, 1.15, -halfZ + 0.05);
      group.add(outlet);
    }

  } else if (itemData.label === "Anatomical Poster") {
    const sizeConfig = sizePresets[sizeSelect.value];
    const halfZ = sizeConfig.floorScale.z / 2;

    const posterGeo = new THREE.BoxGeometry(0.9, 1.1, 0.02);
    const posterMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.5 });
    const poster = new THREE.Mesh(posterGeo, posterMat);
    poster.position.set(0, 1.35, -halfZ + 0.02);
    group.add(poster);

    const frameGeo = new THREE.BoxGeometry(0.94, 1.14, 0.01);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 1.35, -halfZ + 0.01);
    group.add(frame);

    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.6 });
    
    const spineGeo = new THREE.BoxGeometry(0.06, 0.7, 0.01);
    const spine = new THREE.Mesh(spineGeo, boneMat);
    spine.position.set(0, 1.35, -halfZ + 0.035);
    group.add(spine);

    const skullGeo = new THREE.BoxGeometry(0.12, 0.16, 0.015);
    const skull = new THREE.Mesh(skullGeo, boneMat);
    skull.position.set(0, 1.7, -halfZ + 0.035);
    group.add(skull);

  } else if (itemData.label === "Bedside Cabinet") {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 });

    const bodyGeo = new THREE.BoxGeometry(0.55, 0.75, 0.55);
    const body = new THREE.Mesh(bodyGeo, woodMat);
    body.position.y = 0.375;
    group.add(body);

    const drawerHeights = [0.2, 0.2, 0.22];
    const drawerYPositions = [0.62, 0.38, 0.13];

    drawerYPositions.forEach((yPos, i) => {
      const faceGeo = new THREE.BoxGeometry(0.53, drawerHeights[i], 0.03);
      const face = new THREE.Mesh(faceGeo, trimMat);
      face.position.set(0, yPos, 0.28);
      group.add(face);

      const handleGeo = new THREE.BoxGeometry(0.18, 0.02, 0.03);
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(0, yPos, 0.305);
      group.add(handle);
    });

  } else if (itemData.label === "Overbed Table") {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9, roughness: 0.1 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });

    const floorBaseGeo = new THREE.BoxGeometry(0.7, 0.06, 0.8);
    const floorBase = new THREE.Mesh(floorBaseGeo, baseMat);
    floorBase.position.set(-0.5, 0.03, 0);
    group.add(floorBase);

    const columnGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 12);
    const column = new THREE.Mesh(columnGeo, chromeMat);
    column.position.set(-0.75, 0.45, 0);
    group.add(column);

    const armGeo = new THREE.BoxGeometry(0.8, 0.05, 0.15);
    const arm = new THREE.Mesh(armGeo, chromeMat);
    arm.position.set(-0.35, 0.85, 0);
    group.add(arm);

    const trayGeo = new THREE.BoxGeometry(0.7, 0.04, 0.9);
    const tray = new THREE.Mesh(trayGeo, woodMat);
    tray.position.set(0.1, 0.88, 0);
    group.add(tray);

  } else if (itemData.label === "IV Pole") {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.3 });
    const legGeo1 = new THREE.BoxGeometry(0.5, 0.04, 0.08);
    const leg1 = new THREE.Mesh(legGeo1, baseMat);
    leg1.position.y = 0.02;
    group.add(leg1);

    const legGeo2 = new THREE.BoxGeometry(0.08, 0.04, 0.5);
    const leg2 = new THREE.Mesh(legGeo2, baseMat);
    leg2.position.y = 0.02;
    group.add(leg2);

    const wheelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const wheelCoords = [[0.25, 0.02, 0], [-0.25, 0.02, 0], [0, 0.02, 0.25], [0, 0.02, -0.25]];
    
    wheelCoords.forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(...pos);
      group.add(w);
    });

    const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.6, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.2 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 0.85;
    group.add(pole);

    const topCollarGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9, roughness: 0.1 });
    const topCollar = new THREE.Mesh(topCollarGeo, chromeMat);
    topCollar.position.y = 1.65;
    group.add(topCollar);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const hookArmGeo = new THREE.BoxGeometry(0.15, 0.02, 0.02);
      const hookArm = new THREE.Mesh(hookArmGeo, chromeMat);
      hookArm.position.set(Math.cos(angle) * 0.07, 1.7, Math.sin(angle) * 0.07);
      hookArm.rotation.y = -angle;
      group.add(hookArm);
    }

  } else {
    const geometry = new THREE.BoxGeometry(itemData.dims[0], itemData.dims[1], itemData.dims[2]);
    const material = new THREE.MeshStandardMaterial({ 
      color: itemData.color, 
      roughness: 0.5,
      metalness: 0.1
    });
    const block = new THREE.Mesh(geometry, material);
    block.position.y = itemData.dims[1] / 2;
    group.add(block);
  }

  const sizeConfig = sizePresets[sizeSelect.value];
  if (itemData.isWallItem) {
    group.position.x = 0;
    group.position.y = 0;
    group.position.z = -(sizeConfig.floorScale.z / 2);
  } else {
    let placed = false;
    let attempts = 0;
    const maxX = (sizeConfig.floorScale.x / 2) - 1;
    const maxZ = (sizeConfig.floorScale.z / 2) - 1;

    while (!placed && attempts < 20) {
      const candidateX = Math.round(((Math.random() - 0.5) * maxX * 1.5) / 0.5) * 0.5;
      const candidateZ = Math.round(((Math.random() - 0.5) * maxZ * 1.5) / 0.5) * 0.5;
      
      let collision = false;
      for (const existing of spawnedObjects) {
        if (existing.userData.isWallItem) continue;
        
        const dist = Math.hypot(existing.position.x - candidateX, existing.position.z - candidateZ);
        if (dist < 1.2) {
          collision = true;
          break;
        }
      }

      if (!collision || attempts === 19) {
        group.position.x = candidateX;
        group.position.z = candidateZ;
        placed = true;
      }
      attempts++;
    }
    group.position.y = 0;
  }

  group.userData.isWallItem = !!itemData.isWallItem;
  scene.add(group);
  spawnedObjects.push(group);
}

// 9. Core Command Clear/Reset Triggers
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (scene) {
      spawnedObjects.forEach(obj => scene.remove(obj));
      spawnedObjects.length = 0;
    }
  });
}

if (changeRoomBtn) {
  changeRoomBtn.addEventListener('click', () => {
    if (welcomeScreen) {
      welcomeScreen.style.display = 'flex';
      welcomeScreen.classList.remove('hidden');
      welcomeScreen.style.opacity = '1';
      welcomeScreen.style.visibility = 'visible';
      welcomeScreen.style.pointerEvents = 'auto';
    }
  });
}

if (sizeSelect) {
  sizeSelect.addEventListener('change', updateRoomDimensions);
}

window.addEventListener('resize', () => {
  const container = document.getElementById('blueprint-canvas');
  if (!container || !camera || !renderer) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
