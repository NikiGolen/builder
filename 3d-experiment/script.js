// script.js
import * as THREE from 'three';
import { sizePresets, catalogs } from './catalogData.js';
import { createSpawnerGeometry } from './objectSpawners.js';

let scene, camera, renderer;
let activeType = 'medsurg'; 
let activeRoomFootprint = 'medium'; 
let spawnedObjects = [];

// DOM Elements
let welcomeScreen, workspaceScreen, catalogList, sidebarTitle, sidebarDesc, activeRoomTitle, roomSizeSelector;

document.addEventListener('DOMContentLoaded', () => {
  welcomeScreen = document.getElementById('welcome-screen');
  workspaceScreen = document.getElementById('workspace-screen');
  catalogList = document.getElementById('catalog-list');
  sidebarTitle = document.getElementById('sidebar-title');
  sidebarDesc = document.getElementById('sidebar-desc');
  activeRoomTitle = document.getElementById('active-room-title');
  roomSizeSelector = document.getElementById('room-size-selector');

  // Direct click bindings for room selection cards
  const roomCards = document.querySelectorAll('.room-card');
  roomCards.forEach(card => {
    card.addEventListener('click', () => {
      activeType = card.getAttribute('data-room-type') || 'medsurg';
      initializeWorkspace();
    });
  });

  if (roomSizeSelector) {
    roomSizeSelector.addEventListener('change', (e) => {
      activeRoomFootprint = e.target.value;
      buildRoomEnvironment();
    });
  }
});

function initializeWorkspace() {
  if (welcomeScreen) welcomeScreen.style.display = 'none';
  if (workspaceScreen) workspaceScreen.style.display = 'flex';
  
  initThreeJS();
  load3DMenuCatalog();
}

function load3DMenuCatalog() {
  const config = catalogs[activeType];
  if (sidebarTitle) sidebarTitle.textContent = config.title;
  if (sidebarDesc) sidebarDesc.textContent = config.desc;
  if (activeRoomTitle) activeRoomTitle.textContent = config.headline;

  if (!catalogList) return;
  catalogList.innerHTML = ''; 

  config.items.forEach((catGroup, index) => {
    const header = document.createElement('div');
    header.className = 'catalog-category-header';
    header.textContent = catGroup.category;
    
    const variantsContainer = document.createElement('div');
    variantsContainer.className = 'catalog-variants-container';

    if (index === 0) {
      header.classList.add('is-expanded');
      variantsContainer.classList.add('is-expanded');
    }

    header.addEventListener('click', () => {
      header.classList.toggle('is-expanded');
      variantsContainer.classList.toggle('is-expanded');
    });

    catGroup.variants.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'catalog-item-card';
      card.innerHTML = `
        <div class="item-info">
          <strong style="font-size: 0.85rem; color: #0f172a; display: block;">${item.label}</strong>
          <span class="item-sku" style="font-size: 0.75rem; color: #2563eb; font-family: monospace;">SKU: ${item.sku}</span>
          <p class="item-desc" style="font-size: 0.75rem; color: #64748b; margin: 4px 0 0 0;">${item.sub}</p>
        </div>
        <button class="spawn-action-btn">Spawn Item ➕</button>
      `;

      card.querySelector('.spawn-action-btn').addEventListener('click', () => spawn3DObject(item));
      variantsContainer.appendChild(card);
    });

    catalogList.appendChild(header);
    catalogList.appendChild(variantsContainer);
  });
}

function initThreeJS() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8fafc);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 10, 14);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(6, 14, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  buildRoomEnvironment();

  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
}

function buildRoomEnvironment() {
  if (!scene) return;
  scene.children.slice().forEach(child => {
    if (child.userData && child.userData.isEnvironment) {
      scene.remove(child);
    }
  });

  const preset = sizePresets[activeRoomFootprint] || sizePresets.medium;
  
  const floorGeo = new THREE.PlaneGeometry(preset.floorScale.x, preset.floorScale.z);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData.isEnvironment = true;
  scene.add(floor);
}

function spawn3DObject(itemData) {
  const meshGroup = createSpawnerGeometry(itemData);

  if (itemData.isWallItem) {
    attachToWall(meshGroup);
  } else {
    meshGroup.position.set(0, 0, 0);
  }

  scene.add(meshGroup);
  spawnedObjects.push(meshGroup);
}

function attachToWall(objectGroup) {
  const preset = sizePresets[activeRoomFootprint] || sizePresets.medium;
  const halfZ = preset.floorScale.z / 2;

  objectGroup.position.set(0, 1.8, -halfZ + 0.05);
  objectGroup.rotation.y = 0;
  
  objectGroup.userData.isWallItem = true;
  objectGroup.userData.constrainedWallZ = -halfZ + 0.05;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
