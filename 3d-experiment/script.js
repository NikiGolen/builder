// script.js
import * as THREE from 'three';
import { sizePresets, catalogs } from './catalogData.js';
import { createSpawnerGeometry } from './objectSpawners.js';

let scene, camera, renderer;
let activeType = 'medsurg'; 
let activeRoomFootprint = 'medium'; 
let spawnedObjects = [];

document.addEventListener('DOMContentLoaded', () => {
  const welcomeScreen = document.getElementById('welcome-screen');
  const medsurgBtn = document.getElementById('choose-medsurg');
  const pharmacyBtn = document.getElementById('choose-pharmacy');
  const changeRoomBtn = document.getElementById('change-room');
  const roomSizeSelect = document.getElementById('room-size-select');

  if (medsurgBtn) {
    medsurgBtn.addEventListener('click', () => {
      activeType = 'medsurg';
      launchWorkspace();
    });
  }

  if (pharmacyBtn) {
    pharmacyBtn.addEventListener('click', () => {
      activeType = 'pharmacy';
      launchWorkspace();
    });
  }

  if (changeRoomBtn) {
    changeRoomBtn.addEventListener('click', () => {
      if (welcomeScreen) welcomeScreen.classList.remove('hidden');
    });
  }

  if (roomSizeSelect) {
    roomSizeSelect.addEventListener('change', (e) => {
      activeRoomFootprint = e.target.value;
      updateFootprintStats();
      buildRoomEnvironment();
    });
  }
});

function launchWorkspace() {
  const welcomeScreen = document.getElementById('welcome-screen');
  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
  }

  updateFootprintStats();
  
  setTimeout(() => {
    initThreeJS();
    load3DMenuCatalog();
  }, 50);
}

function updateFootprintStats() {
  const preset = sizePresets[activeRoomFootprint] || sizePresets.medium;
  const dimsEl = document.getElementById('footprint-dims');
  const areaEl = document.getElementById('footprint-area');
  if (dimsEl) dimsEl.textContent = preset.readout;
  if (areaEl) areaEl.textContent = preset.area;
}

function load3DMenuCatalog() {
  const config = catalogs[activeType];
  const sidebarTitle = document.getElementById('sidebar-title');
  const sidebarDesc = document.getElementById('sidebar-desc');
  const activeRoomTitle = document.getElementById('active-room-title');
  const catalogList = document.getElementById('catalog-list');

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
          <strong>${item.label}</strong>
          <span class="item-sku">SKU: ${item.sku}</span>
          <p class="item-desc">${item.sub}</p>
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
  const container = document.getElementById('blueprint-canvas');
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
  const width = preset.floorScale.x;
  const depth = preset.floorScale.z;
  const wallHeight = 3.2;

  // Floor
  const floorGeo = new THREE.PlaneGeometry(width, depth);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData.isEnvironment = true;
  scene.add(floor);

  // Room Walls
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9, side: THREE.DoubleSide });

  // Back Wall
  const backWallGeo = new THREE.PlaneGeometry(width, wallHeight);
  const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
  backWall.position.set(0, wallHeight / 2, -depth / 2);
  backWall.receiveShadow = true;
  backWall.userData.isEnvironment = true;
  scene.add(backWall);

  // Left Wall
  const sideWallGeo = new THREE.PlaneGeometry(depth, wallHeight);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial);
  leftWall.position.set(-width / 2, wallHeight / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  leftWall.userData.isEnvironment = true;
  scene.add(leftWall);

  // Right Wall
  const rightWall = new THREE.Mesh(sideWallGeo, wallMaterial);
  rightWall.position.set(width / 2, wallHeight / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  rightWall.userData.isEnvironment = true;
  scene.add(rightWall);
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
