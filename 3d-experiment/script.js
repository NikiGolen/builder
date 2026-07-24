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
      {
        category: "Patient Beds",
        variants: [
          { label: "Patient Bed", sku: "PN-BED-101", sub: "Multi-position electric model", bg: "#e0f2fe", dims: [1.4, 0.7, 2.2], color: 0x0284c7 },
          { label: "Hill-Rom Advanced Care Bed", sku: "PN-BED-102", sub: "Full electric with scale & exit alarm", bg: "#e0f2fe", dims: [1.4, 0.7, 2.2], color: 0x1d4ed8 }
        ]
      },
      {
        category: "Infusion & Support",
        variants: [
          { label: "IV Pole", sku: "PN-IV-201", sub: "Mobile rolling infusion stand", bg: "#dcfce7", dims: [0.6, 1.8, 0.6], color: 0x64748b },
          { label: "Heavy-Duty Dual IV Pole", sku: "PN-IV-202", sub: "4-leg weighted base, 2 hooks", bg: "#dcfce7", dims: [0.6, 1.8, 0.6], color: 0x475569 }
        ]
      },
      {
        category: "Overbed Tables",
        variants: [
          { label: "Overbed Table", sku: "PN-TBL-301", sub: "C-base rolling medical tray", bg: "#fef3c7", dims: [1.0, 0.9, 0.5], color: 0xd97706 },
          { label: "Bariatric Split-Top Table", sku: "PN-TBL-302", sub: "Extra-wide heavy-duty base", bg: "#fef3c7", dims: [1.2, 0.9, 0.6], color: 0xb45309 }
        ]
      },
      {
        category: "Wall & Infrastructure",
        variants: [
          { label: "Medical Headwall", sku: "PN-HW-401", sub: "Integrated gas & electrical panel", bg: "#f8fafc", dims: [1.4, 0.4, 0.04], color: 0xf8fafc, isWallItem: true },
          { label: "Bio-Waste", sku: "PN-BIO-501", sub: "Regulated wall sharp box", bg: "#fee2e2", dims: [0.4, 0.5, 0.3], color: 0xdc2626, isWallItem: true },
          { label: "Anatomical Poster", sku: "PN-POS-601", sub: "Skeletal system educational chart", bg: "#fef08a", dims: [1.0, 1.2, 0.02], color: 0xfffbeb, isWallItem: true }
        ]
      }
    ]
  },
  pharmacy: {
    title: "Pharmacy Lab Builder",
    desc: "Configure instructional compounding spaces",
    headline: "Template Workspace: Institutional Pharmacy Simulation",
    themeClass: "pharmacy-theme",
    items: [
      {
        category: "Compounding & Storage",
        variants: [
          { label: "Laminar Hood", sku: "PN-PH-101", sub: "Sterile compounding workbench", bg: "#ccfbf1", dims: [1.8, 2.0, 0.9], color: 0x0d9488 },
          { label: "Medication Cart", sku: "PN-PH-102", sub: "Locking rolling unit dose cart", bg: "#f1f5f9", dims: [1.0, 1.1, 0.7], color: 0x475569 },
          { label: "Supply Shelving", sku: "PN-PH-103", sub: "Heavy-duty bulk storage rack", bg: "#f5f5f4", dims: [2.0, 2.2, 0.6], color: 0x78716c }
        ]
      },
      {
        category: "Dispensary & Checkout",
        variants: [
          { label: "POS Register", sku: "PN-PH-201", sub: "Outpatient retail checkout terminal", bg: "#e0f2fe", dims: [0.8, 1.0, 0.8], color: 0x2563eb },
          { label: "Pill Counter", sku: "PN-PH-202", sub: "Digital automatic counting tray", bg: "#fef9c3", dims: [0.8, 0.3, 0.8], color: 0xca8a04 }
        ]
      }
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

// UI Overlays for Selection Halo and Modern Sleek Floating Action Bar
let actionOverlay = null;
let haloMesh = null;

// 3. Application Lifecycle Setup
function initializeWorkspace(type) {
  activeType = type;
  
  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.visibility = 'hidden';
    welcomeScreen.style.pointerEvents = 'none';
    welcomeScreen.style.display = 'none';
  }
  
  init3DSpace();
}

document.addEventListener('DOMContentLoaded', () => {
  const choiceButtons = document.querySelectorAll('.choice-btn, [id*="medsurg"], [id*="pharmacy"], .room-choice, #welcome-screen div[style*="cursor"], #welcome-screen img, #welcome-screen button, .welcome-card, div > strong');
  
  if (choiceButtons.length >= 2) {
    choiceButtons[0].addEventListener('click', () => initializeWorkspace('medsurg'));
    choiceButtons[1].addEventListener('click', () => initializeWorkspace('pharmacy'));
  }

  const welcomeContainer = document.getElementById('welcome-screen');
  if (welcomeContainer) {
    welcomeContainer.addEventListener('click', (e) => {
      const targetCard = e.target.closest('div[style*="cursor"], div[class*="choice"], div');
      if (targetCard && (targetCard.textContent.includes('Med-Surg') || targetCard.textContent.includes('Hospital'))) {
        initializeWorkspace('medsurg');
      } else if (targetCard && targetCard.textContent.includes('Pharmacy')) {
        initializeWorkspace('pharmacy');
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!selectedMesh) return;
    if (e.key === 'r' || e.key === 'R') {
      performRotation(selectedMesh);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      removeSelectedItem();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      spawnedObjects.forEach(obj => scene.remove(obj));
      spawnedObjects.length = 0;
      selectedMesh = null;
      if (haloMesh) haloMesh.visible = false;
      if (actionOverlay) actionOverlay.style.display = 'none';
    });
  }

  if (changeRoomBtn) {
    changeRoomBtn.addEventListener('click', () => {
      if (welcomeScreen) {
        welcomeScreen.classList.remove('hidden');
        welcomeScreen.style.opacity = '1';
        welcomeScreen.style.visibility = 'visible';
        welcomeScreen.style.pointerEvents = 'auto';
        welcomeScreen.style.display = 'flex';
      }
    });
  }

  if (sizeSelect) {
    sizeSelect.addEventListener('change', () => {
      updateRoomDimensions();
    });
  }

  createActionOverlayUI();
});

function createActionOverlayUI() {
  actionOverlay = document.createElement('div');
  actionOverlay.id = 'item-action-overlay';
  actionOverlay.style.cssText = `
    position: absolute;
    display: none;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 4px;
    border-radius: 9999px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.12);
    z-index: 100;
    gap: 4px;
    align-items: center;
    pointer-events: auto;
    transition: opacity 0.2s ease, transform 0.2s ease;
  `;
  
  actionOverlay.innerHTML = `
    <button id="overlay-rotate" title="Rotate 90°" style="
      background: transparent; 
      color: #f8fafc; 
      border: none; 
      width: 34px; 
      height: 34px; 
      border-radius: 50%; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 16px; 
      transition: background 0.15s ease, transform 0.15s ease;
    " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='transparent'">🔄</button>
    <div style="width: 1px; height: 18px; background: rgba(255,255,255,0.2); margin: 0 2px;"></div>
    <button id="overlay-delete" title="Delete Item" style="
      background: transparent; 
      color: #f87171; 
      border: none; 
      width: 34px; 
      height: 34px; 
      border-radius: 50%; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 16px; 
      transition: background 0.15s ease, transform 0.15s ease;
    " onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='transparent'">🗑️</button>
  `;
  document.body.appendChild(actionOverlay);

  document.getElementById('overlay-rotate').addEventListener('click', (e) => {
    e.stopPropagation();
    if (selectedMesh) {
      performRotation(selectedMesh);
    }
  });

  document.getElementById('overlay-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    removeSelectedItem();
  });
}

function performRotation(mesh) {
  if (mesh.userData.isWallItem) {
    cycleWallAttachment(mesh);
  } else {
    mesh.rotation.y += Math.PI / 2;
  }
  updateHaloGeometry(mesh);
}

function removeSelectedItem() {
  if (!selectedMesh) return;
  scene.remove(selectedMesh);
  const index = spawnedObjects.indexOf(selectedMesh);
  if (index > -1) {
    spawnedObjects.splice(index, 1);
  }
  selectedMesh = null;
  if (haloMesh) haloMesh.visible = false;
  if (actionOverlay) actionOverlay.style.display = 'none';
  if (controls) controls.enabled = true;
}

function cycleWallAttachment(mesh) {
  const walls = ['back', 'right', 'front', 'left'];
  let currentWall = mesh.userData.wallName || 'back';
  let nextIdx = (walls.indexOf(currentWall) + 1) % walls.length;
  attachToWall(mesh, walls[nextIdx], mesh.userData.relativeX || 0);
}

// 4. Core Three.js Space Initialization Engine
function init3DSpace() {
  const container = document.getElementById('blueprint-canvas');
  if (!container) return;
  container.innerHTML = ''; 

  scene = new THREE.Scene();

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

  const haloGeo = new THREE.RingGeometry(0.8, 0.9, 32);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({ 
    color: 0x3b82f6, 
    side: THREE.DoubleSide, 
    transparent: true, 
    opacity: 0.9,
    depthWrite: false 
  });
  haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.renderOrder = 999;
  haloMesh.visible = false;
  scene.add(haloMesh);

  updateRoomDimensions();
  setupInteractionEvents(container);

  animate();
  load3DMenuCatalog();
}

// 5. Interaction & Wall Dragging Logic
function setupInteractionEvents(container) {
  container.addEventListener('pointerdown', (e) => {
    if (actionOverlay && actionOverlay.contains(e.target)) return;

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
      updateHaloGeometry(selectedMesh);
      controls.enabled = false;
    } else {
      selectedMesh = null;
      if (haloMesh) haloMesh.visible = false;
      if (actionOverlay) actionOverlay.style.display = 'none';
    }
  });

  container.addEventListener('dblclick', (e) => {
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
      updateHaloGeometry(selectedMesh);
    } else {
      selectedMesh = null;
      if (haloMesh) haloMesh.visible = false;
      if (actionOverlay) actionOverlay.style.display = 'none';
    }
  });

  container.addEventListener('pointermove', (e) => {
    if (!selectedMesh) return;

    const bounds = container.getBoundingClientRect();
    mouseVector.x = ((e.clientX - bounds.left) / container.clientWidth) * 2 - 1;
    mouseVector.y = -((e.clientY - bounds.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouseVector, camera);

    if (selectedMesh.userData.isWallItem) {
      const wallName = selectedMesh.userData.wallName || 'back';
      const sizeConfig = sizePresets[sizeSelect.value];
      const halfX = sizeConfig.floorScale.x / 2 - 0.8;

      if (raycaster.ray.intersectPlane(routingPlane, planeIntersectionPoint)) {
        let relX = planeIntersectionPoint.x;
        if (wallName === 'left' || wallName === 'right') {
          relX = planeIntersectionPoint.z;
        }
        const clampedX = Math.max(-halfX, Math.min(halfX, relX));
        attachToWall(selectedMesh, wallName, Math.round(clampedX / 0.5) * 0.5);
      }
    } else {
      if (raycaster.ray.intersectPlane(routingPlane, planeIntersectionPoint)) {
        const sizeConfig = sizePresets[sizeSelect.value];
        const maxX = (sizeConfig.floorScale.x / 2) - 0.5;
        const maxZ = (sizeConfig.floorScale.z / 2) - 0.5;

        const clampedX = Math.max(-maxX, Math.min(maxX, planeIntersectionPoint.x));
        const clampedZ = Math.max(-maxZ, Math.min(maxZ, planeIntersectionPoint.z));

        selectedMesh.position.x = Math.round(clampedX / 0.5) * 0.5;
        selectedMesh.position.z = Math.round(clampedZ / 0.5) * 0.5;
      }
    }
    updateHaloGeometry(selectedMesh);
  });
 
  window.addEventListener('pointerup', () => {
    selectedMesh = null;
    if (controls) controls.enabled = true;
  });
}

function updateHaloGeometry(mesh) {
  if (!haloMesh || !mesh) return;
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.z, 0.8) * 0.75;
  
  haloMesh.scale.set(maxDim, 1, maxDim);
  haloMesh.position.set(mesh.position.x, 0.02, mesh.position.z);
  haloMesh.visible = true;
}

function attachToWall(mesh, wallName, relativeX) {
  const sizeConfig = sizePresets[sizeSelect.value];
  const halfX = sizeConfig.floorScale.x / 2;
  const halfZ = sizeConfig.floorScale.z / 2;
  const wallOffset = 0.02;

  mesh.userData.wallName = wallName;
  mesh.userData.relativeX = relativeX;
  mesh.userData.isWallItem = true;

  mesh.rotation.set(0, 0, 0);

  if (wallName === 'back') {
    mesh.position.set(relativeX, 0, -halfZ + wallOffset);
    mesh.rotation.y = 0;
  } else if (wallName === 'front') {
    mesh.position.set(-relativeX, 0, halfZ - wallOffset);
    mesh.rotation.y = Math.PI;
  } else if (wallName === 'left') {
    mesh.position.set(-halfX + wallOffset, 0, relativeX);
    mesh.rotation.y = Math.PI / 2;
  } else if (wallName === 'right') {
    mesh.position.set(halfX - wallOffset, 0, -relativeX);
    mesh.rotation.y = -Math.PI / 2;
  }
}

// 6. Wall & Room Generation
function updateRoomWalls() {
  Object.values(wallsData).forEach(data => scene.remove(data.mesh));
  wallsData = {};

  const sizeConfig = sizePresets[sizeSelect.value];
  const halfX = sizeConfig.floorScale.x / 2;
  const halfZ = sizeConfig.floorScale.z / 2;
  const wallThickness = 0.2;
  const fullHeight = 3.2;

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

// 7. Animation Loop & UI Overlay Position Updates
function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();

  if (camera && Object.keys(wallsData).length > 0) {
    const cameraDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();

    Object.values(wallsData).forEach(data => {
      const dot = cameraDir.dot(data.normal);
      const targetOpacity = dot > 0.05 ? 0.0 : 1.0; 
      
      data.mesh.material.opacity += (targetOpacity - data.mesh.material.opacity) * 0.15;
      data.mesh.material.transparent = true;
      data.mesh.visible = data.mesh.material.opacity > 0.05;
    });
  }

  if (selectedMesh && haloMesh && haloMesh.visible && actionOverlay) {
    const tempV = new THREE.Vector3();
    selectedMesh.getWorldPosition(tempV);
    tempV.y += selectedMesh.userData.isWallItem ? 0.6 : 1.4;
    tempV.project(camera);

    const container = document.getElementById('blueprint-canvas');
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = (tempV.x *  .5 + .5) * rect.width;
      const y = (tempV.y * -.5 + .5) * rect.height;

      actionOverlay.style.display = 'flex';
      actionOverlay.style.left = `${rect.left + x - 40}px`;
      actionOverlay.style.top = `${rect.top + y - 46}px`;
    }
  } else if (actionOverlay) {
    actionOverlay.style.display = 'none';
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// 8. Catalog & Object Spawners
function load3DMenuCatalog() {
  const config = catalogs[activeType];
  
  if (sidebarTitle) sidebarTitle.textContent = config.title;
  if (sidebarDesc) sidebarDesc.textContent = config.desc;
  if (activeRoomTitle) activeRoomTitle.textContent = config.headline;

  if (!catalogList) return;
  catalogList.innerHTML = ''; 

  config.items.forEach((catGroup) => {
    const header = document.createElement('div');
    header.className = 'catalog-category-header';
    header.textContent = catGroup.category;
    catalogList.appendChild(header);

    catGroup.variants.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'catalog-item-card';
      
      card.innerHTML = `
        <div class="item-info">
          <strong style="font-size: 0.85rem; color: #0f172a;">${item.label}</strong>
          <span class="item-sku">SKU: ${item.sku}</span>
          <p class="item-desc">${item.sub}</p>
        </div>
        <button class="spawn-action-btn">Spawn Item ➕</button>
      `;
      
      card.querySelector('.spawn-action-btn').addEventListener('click', () => {
        spawn3DObject(item);
      });
      
      catalogList.appendChild(card);
    });
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
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.7 });
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
    const panelGeo = new THREE.BoxGeometry(1.4, 0.4, 0.03);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 1.15, 0);
    group.add(panel);

    const stripGeo = new THREE.BoxGeometry(1.3, 0.12, 0.01);
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4, roughness: 0.3 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 1.15, 0.02);
    group.add(strip);

    const outletGeo = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const colors = [0x22c55e, 0xef4444, 0x3b82f6];
    
    for (let i = -1; i <= 1; i++) {
      const outletMat = new THREE.MeshStandardMaterial({ color: colors[i + 1] });
      const outlet = new THREE.Mesh(outletGeo, outletMat);
      outlet.position.set(i * 0.35, 1.15, 0.03);
      group.add(outlet);
    }

  } else if (itemData.label === "Anatomical Poster") {
    const posterGeo = new THREE.BoxGeometry(0.9, 1.1, 0.02);
    const posterMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.5 });
    const poster = new THREE.Mesh(posterGeo, posterMat);
    poster.position.set(0, 2.1, 0);
    group.add(poster);

    const frameGeo = new THREE.BoxGeometry(0.94, 1.14, 0.01);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.1, -0.01);
    group.add(frame);

    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.6 });
    
    const spineGeo = new THREE.BoxGeometry(0.06, 0.7, 0.01);
    const spine = new THREE.Mesh(spineGeo, boneMat);
    spine.position.set(0, 2.1, 0.015);
    group.add(spine);

    const skullGeo = new THREE.BoxGeometry(0.12, 0.16, 0.015);
    const skull = new THREE.Mesh(skullGeo, boneMat);
    skull.position.set(0, 2.45, 0.015);
    group.add(skull);

  } else if (itemData.label === "Bio-Waste") {
    const mountGeo = new THREE.BoxGeometry(0.35, 0.45, 0.02);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const mountPlate = new THREE.Mesh(mountGeo, mountMat);
    mountPlate.position.set(0, 1.1, 0.01);
    group.add(mountPlate);

    const shelfGeo = new THREE.BoxGeometry(0.38, 0.02, 0.28);
    const shelf = new THREE.Mesh(shelfGeo, mountMat);
    shelf.position.set(0, 0.88, 0.13);
    group.add(shelf);

    const binGeo = new THREE.BoxGeometry(0.32, 0.38, 0.24);
    const binMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const bin = new THREE.Mesh(binGeo, binMat);
    bin.position.set(0, 1.09, 0.13);
    group.add(bin);

    const labelGeo = new THREE.PlaneGeometry(0.18, 0.22);
    const canvasLabel = document.createElement('canvas');
    canvasLabel.width = 256;
    canvasLabel.height = 320;
    const lCtx = canvasLabel.getContext('2d');
    lCtx.fillStyle = '#ffffff';
    lCtx.fillRect(0, 0, 256, 320);
    lCtx.fillStyle = '#000000';
    lCtx.font = 'bold 22px sans-serif';
    lCtx.fillText('BIOHAZARD', 60, 40);
    lCtx.font = '14px sans-serif';
    lCtx.fillText('SHARPS CONTAINER', 45, 70);
    lCtx.fillStyle = '#dc2626';
    lCtx.beginPath();
    lCtx.arc(128, 150, 35, 0, Math.PI * 2);
    lCtx.fill();
    const labelMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvasLabel) });
    const sticker = new THREE.Mesh(labelGeo, labelMat);
    sticker.position.set(0, 1.1, 0.252);
    group.add(sticker);

    const lidBaseGeo = new THREE.BoxGeometry(0.34, 0.04, 0.26);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.7 });
    const lidBase = new THREE.Mesh(lidBaseGeo, lidMat);
    lidBase.position.set(0, 1.29, 0.13);
    group.add(lidBase);

    const lidTopGeo = new THREE.BoxGeometry(0.28, 0.08, 0.2);
    const lidTop = new THREE.Mesh(lidTopGeo, lidMat);
    lidTop.position.set(0, 1.35, 0.13);
    group.add(lidTop);

    const strapGeo = new THREE.BoxGeometry(0.34, 0.06, 0.26);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(0, 1.2, 0.13);
    group.add(strap);

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
    pole.position.y = 0.82;
    group.add(pole);

    const hookGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8);
    for (let i = 0; i < 2; i++) {
      const hook = new THREE.Mesh(hookGeo, poleMat);
      hook.position.set((i === 0 ? 0.06 : -0.06), 1.55, 0);
      hook.rotation.z = (i === 0 ? -Math.PI / 6 : Math.PI / 6);
      group.add(hook);
    }
  }
}
