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
      { label: "Patient Bed", icon: "🛏️", sub: "Multi-position electric model", bg: "#e0f2fe", dims: [1.4, 1.0, 2.2], color: 0x0284c7 },
      { label: "Adult Manikin", icon: "🧍", sub: "High-Fidelity Patient Simulator", bg: "#f1f5f9", dims: [0.6, 0.4, 1.8], color: 0x64748b },
      { label: "IV Pump", icon: "⚗️", sub: "Dual-line medication pole", bg: "#dcfce7", dims: [0.8, 2.0, 0.8], color: 0x22c55e },
      { label: "Overbed Table", icon: "🪵", sub: "Height-adjustable tray", bg: "#fef3c7", dims: [1.0, 0.9, 0.5], color: 0xd97706 },
      { label: "Bio-Waste", icon: "🟥", sub: "Regulated wall sharp box", bg: "#fee2e2", dims: [0.4, 0.5, 0.3], color: 0xdc2626 }
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
let roomWalls = [];
let activeType = 'medsurg';

// Interaction State Properties
const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2();
let planeIntersectionPoint = new THREE.Vector3();
let selectedMesh = null;
const routingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Flat invisible drag constraint plane

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

// Fixed Fail-Safe Click Bridge
document.addEventListener('DOMContentLoaded', () => {
  const choiceButtons = document.querySelectorAll('.choice-btn');
  if (choiceButtons.length >= 2) {
    choiceButtons[0].addEventListener('click', () => initializeWorkspace('medsurg'));
    choiceButtons[1].addEventListener('click', () => initializeWorkspace('pharmacy'));
  }
});

// 4. Core Three.js Space Initialization Engine
function init3DSpace() {
  const container = document.getElementById('blueprint-canvas');
  if (!container) return;
  container.innerHTML = ''; 

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e293b);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 12, 14); 

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(15, 25, 10);
  scene.add(directionalLight);

  const floorGeo = new THREE.BoxGeometry(1, 0.2, 1); 
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.1, 0);
  scene.add(floor);

  gridHelper = new THREE.GridHelper(1, 1, 0x475569, 0xcbd5e1);
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
    const hits = raycaster.intersectObjects(spawnedObjects);

    if (hits.length > 0) {
      selectedMesh = hits[0].object;
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

// 6. Sizing & Wall Synchronization Modifiers
function updateRoomWalls() {
  roomWalls.forEach(wall => scene.remove(wall));
  roomWalls = [];

  const sizeConfig = sizePresets[sizeSelect.value];
  const halfX = sizeConfig.floorScale.x / 2;
  const halfZ = sizeConfig.floorScale.z / 2;
  const wallHeight = 2.5;
  const wallThickness = 0.2;

  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0xe2e8f0, 
    roughness: 0.8,
    side: THREE.DoubleSide 
  });

  // Back Wall
  const backGeo = new THREE.BoxGeometry(sizeConfig.floorScale.x, wallHeight, wallThickness);
  const backWall = new THREE.Mesh(backGeo, wallMat);
  backWall.position.set(0, wallHeight / 2, -halfZ - (wallThickness / 2));
  scene.add(backWall);
  roomWalls.push(backWall);

  // Left Wall
  const leftGeo = new THREE.BoxGeometry(wallThickness, wallHeight, sizeConfig.floorScale.z);
  const leftWall = new THREE.Mesh(leftGeo, wallMat);
  leftWall.position.set(-halfX - (wallThickness / 2), wallHeight / 2, 0);
  scene.add(leftWall);
  roomWalls.push(leftWall);
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
    0x64748b, 0x94a3b8
  );
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  updateRoomWalls();
}

// 7. Continuous Loop Animation Frame Render Cycles
function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
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
    
    btn.addEventListener('click', () => spawn3DObject(item));
    catalogList.appendChild(btn);
  });
}

function spawn3DObject(itemData) {
  if (!scene) return;
  
  const geometry = new THREE.BoxGeometry(itemData.dims[0], itemData.dims[1], itemData.dims[2]);
  const material = new THREE.MeshStandardMaterial({ 
    color: itemData.color, 
    roughness: 0.5,
    metalness: 0.1
  });
  const block = new THREE.Mesh(geometry, material);

  block.position.x = (Math.random() - 0.5) * 2;
  block.position.y = itemData.dims[1] / 2;
  block.position.z = (Math.random() - 0.5) * 2;

  scene.add(block);
  spawnedObjects.push(block);
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
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
