// 1. Preset Sizing & Catalog Data Sets
const sizePresets = {
  small: { width: 560, height: 440, readout: "14ft x 11ft", area: "154 sq ft" },
  medium: { width: 720, height: 520, readout: "18ft x 13ft", area: "234 sq ft" },
  large: { width: 880, height: 600, readout: "22ft x 15ft", area: "330 sq ft" }
};

const catalogs = {
  medsurg: {
    title: "Med-Surg Room Builder",
    desc: "Configure a standard clinical training slot",
    headline: "Template Workspace: Medical-Surgical Ward Simulation",
    themeClass: "medsurg-theme",
    accentZone: { text: "Simulated Overbed Headwall Zone (Oxygen / Vacuum)", style: "top: 6px; left: 50%; transform: translateX(-50%); background: #475569; color: white;" },
    items: [
      { label: "Patient Bed", icon: "🛏️", sub: "Multi-position electric model", bg: "#e0f2fe" },
      { label: "Adult Manikin", icon: "🧍", sub: "High-Fidelity Patient Simulator", bg: "#f1f5f9" },
      { label: "IV Pump", icon: "⚗️", sub: "Dual-line medication pole", bg: "#dcfce7" },
      { label: "Overbed Table", icon: "🪵", sub: "Height-adjustable tray", bg: "#fef3c7" },
      { label: "Bio-Waste", icon: "🟥", sub: "Regulated wall sharp box", bg: "#fee2e2" }
    ]
  },
  pharmacy: {
    title: "Pharmacy Lab Builder",
    desc: "Configure instructional compounding spaces",
    headline: "Template Workspace: Institutional Pharmacy Simulation",
    themeClass: "pharmacy-theme",
    accentZone: { text: "Sterile Cleanroom Compounding Area (Aseptic)", style: "top: 50%; left: 6px; transform: translateY(-50%) rotate(-90deg); background: #0f766e; color: white;" },
    items: [
      { label: "Laminar Hood", icon: "🌬️", sub: "Sterile compounding workbench", bg: "#ccfbf1" },
      { label: "Medication Cart", icon: "🛒", sub: "Locking rolling unit dose cart", bg: "#f1f5f9" },
      { label: "Supply Shelving", icon: "🗄️", sub: "Heavy-duty bulk storage rack", bg: "#f5f5f4" },
      { label: "POS Register", icon: "💻", sub: "Outpatient retail checkout terminal", bg: "#e0f2fe" },
      { label: "Pill Counter", icon: "🔢", sub: "Digital automatic counting tray", bg: "#fef9c3" }
    ]
  }
};

// 2. DOM Node Core Hooks
const welcomeScreen = document.getElementById('welcome-screen');
const canvas = document.getElementById('blueprint-canvas');
const catalogList = document.getElementById('catalog-list');
const sidebarTitle = document.getElementById('sidebar-title');
const sidebarDesc = document.getElementById('sidebar-desc');
const activeRoomTitle = document.getElementById('active-room-title');
const clearBtn = document.getElementById('clear-workspace');
const changeRoomBtn = document.getElementById('change-room');
const sizeSelect = document.getElementById('room-size-select');
const footprintDims = document.getElementById('footprint-dims');
const footprintArea = document.getElementById('footprint-area');

let scene, camera, renderer, floor;
const spawnedObjects = [];
let activeType = 'medsurg';

// 3. Application Lifecycle Handlers
function initializeWorkspace(type) {
  activeType = type;
  document.getElementById('welcome-screen').classList.add('hidden');
  init3DSpace();
}
// 4. Core Three.js Space Initialization Engine
function init3DSpace() {
  const container = document.getElementById('blueprint-canvas');
  // Clear any leftover 2D grids inside the viewport container box
  container.innerHTML = ''; 

  // Establish scene, perspective camera placement, and WebGL renderer
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcbd5e1); // Gray workspace field fill

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / 520, 0.1, 1000);
  camera.position.set(0, 15, 15); // Look down at the room structure from an angle
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, 520);
  container.appendChild(renderer.domElement);

  // Mount light nodes into the digital rendering environment
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Render the white rectangular room floor box geometry
  const floorGeo = new THREE.BoxGeometry(10, 0.2, 8); // scale metrics matching room ratios
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.1, 0);
  scene.add(floor);

  // Apply a technical line grid map accent overlay across the flooring plane
  const gridHelper = new THREE.GridHelper(10, 10, 0x475569, 0xe2e8f0);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  // Initialize continuous frame loop updates
  animate();
  load3DMenuCatalog();
}

// 5. Continuous Loop Animation Frame Render Cycles
function animate() {
  requestAnimationFrame(animate);
  
  // Apply a gentle slow rotation to visually showcase the true 3D layout tracking perspective
  if (scene) {
    scene.rotation.y += 0.002;
  }
  
  renderer.render(scene, camera);
}

// 6. Sidebar Menu Rendering Engine
function load3DMenuCatalog() {
  const config = catalogs[activeType];
  const sizeConfig = sizePresets[sizeSelect.value];
  
  // Set toolbar blueprint text variables
  footprintDims.textContent = sizeConfig.readout;
  footprintArea.textContent = sizeConfig.area;
  sidebarTitle.textContent = config.title;
  sidebarDesc.textContent = config.desc;
  activeRoomTitle.textContent = config.headline;

  catalogList.innerHTML = ''; // Wipe past button panels
  
  // Map hex color coordinates to your dynamic sidebar elements
  const objectColors = [0x2563eb, 0xdfb119, 0x10b981, 0xef4444, 0x8b5cf6];

  config.items.forEach((item, index) => {
    const btn = document.createElement('div');
    btn.className = 'draggable-item';
    btn.style.cursor = 'pointer'; 
    
    btn.innerHTML = `
      <div class="item-icon" style="background: ${item.bg}; font-size: 1.25rem;">📦</div>
      <div>
        <strong>${item.label}</strong>
        <p style="font-size: 0.75rem; color: #64748b;">Click to Spawn 3D Block</p>
      </div>
    `;
    
    // Wire button listener to throw a distinct 3D element box model onto the grid floor
    const assignedColor = objectColors[index % objectColors.length];
    btn.addEventListener('click', () => spawn3DObject(assignedColor));
    catalogList.appendChild(btn);
  });
}

function spawn3DObject(colorHex) {
  // Generate a distinct box shape vector mesh
  const geometry = new THREE.BoxGeometry(1.2, 1.5, 0.8);
  const material = new THREE.MeshStandardMaterial({ color: colorHex });
  const block = new THREE.Mesh(geometry, material);

  // Spread out object points organically so items don't clip on initial placement
  block.position.x = (Math.random() - 0.5) * 6;
  block.position.y = 0.75; 
  block.position.z = (Math.random() - 0.5) * 4;

  scene.add(block);
  spawnedObjects.push(block);
}

// 7. Core Command Clear/Reset Triggers
clearBtn.addEventListener('click', () => {
  if (scene) {
    spawnedObjects.forEach(obj => scene.remove(obj));
    spawnedObjects.length = 0;
  }
});

changeRoomBtn.addEventListener('click', () => {
  welcomeScreen.classList.remove('hidden');
});

sizeSelect.addEventListener('change', () => {
  if (scene) {
    const sizeConfig = sizePresets[sizeSelect.value];
    footprintDims.textContent = sizeConfig.readout;
    footprintArea.textContent = sizeConfig.area;
  }
});
