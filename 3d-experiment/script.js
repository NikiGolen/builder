// script.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sizePresets, catalogs } from './catalogData.js';
import { createSpawnerGeometry } from './objectSpawners.js';

// DOM Node Core Hooks
const welcomeScreen = document.getElementById('welcome-screen');
const catalogList = document.getElementById('catalog-list');
const sidebarTitle = document.getElementById('sidebar-title');
const sidebarDesc = document.getElementById('sidebar-desc');
const activeRoomTitle = document.getElementById('active-room-title');
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
let isDragging = false;
const routingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

let actionOverlay = null;
let haloMesh = null;
let placedItemsContainer = null;

// Application Lifecycle Setup
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

  createActionOverlayUI();
  createPlacedItemsSidebar();
});

function createPlacedItemsSidebar() {
  const sidebar = document.createElement('div');
  sidebar.id = 'placed-items-sidebar';
  sidebar.style.cssText = `
    position: fixed;
    right: 20px;
    top: 100px;
    width: 280px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    z-index: 90;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 140px);
    overflow: hidden;
    font-family: inherit;
  `;

  sidebar.innerHTML = `
    <div style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
      <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #0f172a;">Placed Room Items</h3>
      <span style="font-size: 0.75rem; color: #64748b;">Manage added simulation equipment</span>
    </div>
    <div id="placed-items-list" style="overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; flex-grow: 1;">
      <div style="text-align: center; color: #94a3b8; font-size: 0.8rem; padding: 20px 0;">No items added yet</div>
    </div>
  `;
  document.body.appendChild(sidebar);
  placedItemsContainer = document.getElementById('placed-items-list');
}

function updatePlacedItemsUI() {
  if (!placedItemsContainer) return;

  if (spawnedObjects.length === 0) {
    placedItemsContainer.innerHTML = `<div style="text-align: center; color: #94a3b8; font-size: 0.8rem; padding: 20px 0;">No items added yet</div>`;
    return;
  }

  placedItemsContainer.innerHTML = '';
  spawnedObjects.forEach((obj, index) => {
    const isSelected = obj === selectedMesh;
    const itemCard = document.createElement('div');
    itemCard.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: ${isSelected ? '#eff6ff' : '#f8fafc'};
      border: 1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'};
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    itemCard.innerHTML = `
      <div style="overflow: hidden; padding-right: 8px; flex-grow: 1;">
        <div style="font-size: 0.85rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${obj.userData.label || 'Equipment Item'}</div>
        <div style="font-size: 0.75rem; font-family: monospace; color: #2563eb;">SKU: ${obj.userData.sku || 'N/A'}</div>
      </div>
      <button title="Delete Item" class="delete-placed-btn" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">🗑️</button>
    `;

    itemCard.addEventListener('click', (e) => {
      if (e.target.closest('.delete-placed-btn')) {
        e.stopPropagation();
        removeObjectByIndex(index);
        return;
      }
      selectedMesh = obj;
      updateHaloGeometry(selectedMesh);
      updatePlacedItemsUI();
    });

    placedItemsContainer.appendChild(itemCard);
  });
}

function removeObjectByIndex(index) {
  const targetObj = spawnedObjects[index];
  if (!targetObj) return;

  scene.remove(targetObj);
  spawnedObjects.splice(index, 1);

  if (selectedMesh === targetObj) {
    selectedMesh = null;
    if (haloMesh) haloMesh.visible = false;
    if (actionOverlay) actionOverlay.style.display = 'none';
  }
  updatePlacedItemsUI();
}

function createActionOverlayUI() {
  actionOverlay = document.createElement('div');
  actionOverlay.id = 'item-action-overlay';
  actionOverlay.style.cssText = `
    position: absolute;
    display: none;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 6px 10px;
    border-radius: 9999px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 100;
    gap: 8px;
    align-items: center;
    pointer-events: auto;
  `;
  
  actionOverlay.innerHTML = `
    <button id="overlay-rotate" title="Rotate 90°" style="background: transparent; color: #f8fafc; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px;">🔄</button>
    <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2);"></div>
    <button id="overlay-delete" title="Delete Item" style="background: transparent; color: #f87171; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px;">🗑️</button>
  `;
  document.body.appendChild(actionOverlay);

  document.getElementById('overlay-rotate').addEventListener('click', (e) => {
    e.stopPropagation();
    if (selectedMesh) performRotation(selectedMesh);
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
  const index = spawnedObjects.indexOf(selectedMesh);
  if (index > -1) {
    removeObjectByIndex(index);
  }
}

function cycleWallAttachment(mesh) {
  const walls = ['back', 'right', 'front', 'left'];
  let currentWall = mesh.userData.wallName || 'back';
  let nextIdx = (walls.indexOf(currentWall) + 1) % walls.length;
  attachToWall(mesh, walls[nextIdx], mesh.userData.relativeX || 0);
}

// Core Three.js Space Initialization Engine
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
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.05 });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.1, 0);
  scene.add(floor);

  gridHelper = new THREE.GridHelper(1, 1, 0x1e3a8a, 0x93c5fd);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  const haloGeo = new THREE.RingGeometry(0.8, 0.9, 32);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false });
  haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.renderOrder = 999;
  haloMesh.visible = false;
  scene.add(haloMesh);

  if (sizeSelect) {
    sizeSelect.addEventListener('change', () => updateRoomDimensions());
  }

  updateRoomDimensions();
  setupInteractionEvents(container);

  animate();
  load3DMenuCatalog();
}

// Interaction & Wall Dragging Logic
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
      isDragging = true;
      controls.enabled = false; 
    } else {
      selectedMesh = null;
      if (haloMesh) haloMesh.visible = false;
      if (actionOverlay) actionOverlay.style.display = 'none';
      isDragging = false;
    }
    updatePlacedItemsUI();
  });

  container.addEventListener('pointermove', (e) => {
    if (!isDragging || !selectedMesh) return;

    const bounds = container.getBoundingClientRect();
    mouseVector.x = ((e.clientX - bounds.left) / container.clientWidth) * 2 - 1;
    mouseVector.y = -((e.clientY - bounds.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouseVector, camera);

    if (selectedMesh.userData.isWallItem) {
      const wallName = selectedMesh.userData.wallName || 'back';
      const sizeConfig = sizePresets[sizeSelect ? sizeSelect.value : 'medium'];
      const halfX = sizeConfig.floorScale.x / 2 - 0.8;

      if (raycaster.ray.intersectPlane(routingPlane, planeIntersectionPoint)) {
        let relX = planeIntersectionPoint.x;
        if (wallName === 'left' || wallName === 'right') relX = planeIntersectionPoint.z;
        const clampedX = Math.max(-halfX, Math.min(halfX, relX));
        attachToWall(selectedMesh, wallName, Math.round(clampedX / 0.5) * 0.5);
      }
    } else {
      if (raycaster.ray.intersectPlane(routingPlane, planeIntersectionPoint)) {
        const sizeConfig = sizePresets[sizeSelect ? sizeSelect.value : 'medium'];
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
    isDragging = false;
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
  const sizeConfig = sizePresets[sizeSelect ? sizeSelect.value : 'medium'];
  const halfX = sizeConfig.floorScale.x / 2;
  const halfZ = sizeConfig.floorScale.z / 2;
  const wallOffset = 0.02;

  mesh.userData.wallName = wallName;
  mesh.userData.relativeX = relativeX;
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

// Wall & Room Generation
function updateRoomWalls() {
  Object.values(wallsData).forEach(data => scene.remove(data.mesh));
  wallsData = {};

  const sizeConfig = sizePresets[sizeSelect ? sizeSelect.value : 'medium'];
  const halfX = sizeConfig.floorScale.x / 2;
  const halfZ = sizeConfig.floorScale.z / 2;
  const wallThickness = 0.2;
  const fullHeight = 3.2;

  const createWallMaterial = () => new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9, transparent: true, opacity: 1.0, side: THREE.DoubleSide });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(sizeConfig.floorScale.x, fullHeight, wallThickness), createWallMaterial());
  backWall.position.set(0, fullHeight / 2, -halfZ - (wallThickness / 2));
  scene.add(backWall);
  wallsData.back = { mesh: backWall, normal: new THREE.Vector3(0, 0, -1) };

  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(sizeConfig.floorScale.x, fullHeight, wallThickness), createWallMaterial());
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
  const sizeConfig = sizePresets[sizeSelect ? sizeSelect.value : 'medium'];
  
  if (footprintDims) footprintDims.textContent = sizeConfig.readout;
  if (footprintArea) footprintArea.textContent = sizeConfig.area;

  floor.scale.set(sizeConfig.floorScale.x, 1, sizeConfig.floorScale.z);
  
  scene.remove(gridHelper);
  gridHelper = new THREE.GridHelper(Math.max(sizeConfig.floorScale.x, sizeConfig.floorScale.z), Math.max(sizeConfig.floorScale.x, sizeConfig.floorScale.z), 0x1e3a8a, 0x93c5fd);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  updateRoomWalls();
}

// Animation Loop & UI Overlay Position Updates
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
    tempV.y += selectedMesh.userData.isWallItem ? 0.4 : 0.8;
    tempV.project(camera);

    const container = document.getElementById('blueprint-canvas');
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = (tempV.x * .5 + .5) * rect.width;
      const y = (tempV.y * -.5 + .5) * rect.height;

      const clampedX = Math.max(rect.left + 30, Math.min(rect.right - 80, rect.left + x - 40));
      const clampedY = Math.max(rect.top + 30, Math.min(rect.bottom - 40, rect.top + y - 20));

      actionOverlay.style.display = 'flex';
      actionOverlay.style.left = `${clampedX}px`;
      actionOverlay.style.top = `${clampedY}px`;
    }
  } else if (actionOverlay) {
    actionOverlay.style.display = 'none';
  }

  if (renderer && scene && camera) renderer.render(scene, camera);
}

// Catalog & Object Spawners Integration
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
      card.querySelector('.spawn-action-btn').addEventListener('click', () => spawn3DObject(item));
      catalogList.appendChild(card);
    });
  });
}

function spawn3DObject(itemData) {
  if (!scene) return;
  const group = createSpawnerGeometry(itemData);
  
  group.userData.label = itemData.label;
  group.userData.sku = itemData.sku;

  if (itemData.isWallItem) {
    group.userData.isWallItem = true;
    attachToWall(group, 'back', 0);
  } else {
    group.position.set(0, 0, 0);
  }

  scene.add(group);
  spawnedObjects.push(group);
  selectedMesh = group;
  updateHaloGeometry(group);
  updatePlacedItemsUI();
}
