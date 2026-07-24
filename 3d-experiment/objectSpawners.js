// objectSpawners.js
import * as THREE from 'three';

export function createSpawnerGeometry(itemData) {
  const group = new THREE.Group();
  const label = itemData.label || "";
  const sku = itemData.sku || "";

  group.userData.isWallItem = itemData.isWallItem || false;

  // 1. Medical Headwall
  if (sku === "HW-MED-100" || label.toLowerCase().includes("headwall")) {
    const panelGeo = new THREE.BoxGeometry(1.8, 0.9, 0.08);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 0, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    const stripGeo = new THREE.BoxGeometry(1.6, 0.15, 0.02);
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 0.1, 0.05);
    group.add(strip);

    const outletGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16);
    outletGeo.rotateX(Math.PI / 2);
    
    const colors = [0x22c55e, 0xef4444, 0x3b82f6]; // Green, Red, Blue
    for (let i = -1; i <= 1; i++) {
      const outletMat = new THREE.MeshStandardMaterial({ color: colors[i + 1], roughness: 0.2 });
      const outlet = new THREE.Mesh(outletGeo, outletMat);
      outlet.position.set(i * 0.35, 0.1, 0.07);
      group.add(outlet);
    }
  } 
  // 2. Anatomical Educational Poster
  else if (sku === "PST-ANAT-202" || label.toLowerCase().includes("poster")) {
    const frameGeo = new THREE.BoxGeometry(0.85, 1.15, 0.02);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    const canvasGeo = new THREE.BoxGeometry(0.75, 1.05, 0.01);
    const canvasMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.set(0, 0, 0.015);
    group.add(canvas);

    const diagramGeo = new THREE.BoxGeometry(0.4, 0.7, 0.01);
    const diagramMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const diagram = new THREE.Mesh(diagramGeo, diagramMat);
    diagram.position.set(0, 0, 0.02);
    group.add(diagram);
  } 
  // 3. Realistic Hospital Beds (Hill-Rom style multi-part assembly)
  else if (sku.includes("04-50-") || label.toLowerCase().includes("bed")) {
    const bedGroup = new THREE.Group();

    // Main Mattress Section
    const mattressGeo = new THREE.BoxGeometry(1.9, 0.28, 0.9);
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const mattress = new THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.set(0, 0.5, 0);
    mattress.castShadow = true;
    bedGroup.add(mattress);

    // Articulating Deck / Base Frame
    const deckGeo = new THREE.BoxGeometry(1.92, 0.12, 0.92);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 0.34, 0);
    deck.castShadow = true;
    bedGroup.add(deck);

    // Lower Mobile Chassis & Hi-Lo Columns
    const chassisGeo = new THREE.BoxGeometry(1.5, 0.2, 0.75);
    const chassisMat = new THREE.MeshStandardMaterial({ color: itemData.color || 0x1e293b, roughness: 0.3 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.set(0, 0.12, 0);
    chassis.castShadow = true;
    bedGroup.add(chassis);

    // Headboard & Footboard Panels
    const headBoardGeo = new THREE.BoxGeometry(0.08, 0.85, 0.98);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    
    const headBoard = new THREE.Mesh(headBoardGeo, boardMat);
    headBoard.position.set(-0.98, 0.55, 0);
    headBoard.castShadow = true;
    bedGroup.add(headBoard);

    const footBoard = new THREE.Mesh(headBoardGeo, boardMat);
    footBoard.position.set(0.98, 0.55, 0);
    footBoard.castShadow = true;
    bedGroup.add(footBoard);

    // Side Safety Rails (Left & Right pairs)
    const railGeo = new THREE.BoxGeometry(1.0, 0.15, 0.04);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    
    [-0.48, 0.48].forEach((zPos) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0.48, zPos);
      bedGroup.add(rail);
    });

    group.add(bedGroup);
  } 
  // 4. Overbed Tables (C-Base Design)
  else if (sku.includes("1060P") || label.toLowerCase().includes("overbed table")) {
    const tableGroup = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(0.6, 0.05, 0.5);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.2 });
    const base = new THREE.Mesh(baseGeo, chromeMat);
    base.position.set(0, 0.025, 0);
    tableGroup.add(base);

    const colGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16);
    const col = new THREE.Mesh(colGeo, chromeMat);
    col.position.set(-0.2, 0.42, 0);
    tableGroup.add(col);

    const topGeo = new THREE.BoxGeometry(0.5, 0.04, 0.9);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const tabletop = new THREE.Mesh(topGeo, woodMat);
    tabletop.position.set(0.1, 0.82, 0);
    tabletop.castShadow = true;
    tableGroup.add(tabletop);

    group.add(tableGroup);
  }
  // 5. Cabinets & Consoles
  else if (sku.includes("PHARM-301") || sku.includes("5812P") || label.toLowerCase().includes("cabinet") || label.toLowerCase().includes("dispensing")) {
    const cabGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: itemData.color || 0x475569, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.4, 0);
    body.castShadow = true;
    cabGroup.add(body);

    const drawerGeo = new THREE.BoxGeometry(0.02, 0.18, 0.52);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    
    for (let i = 0; i < 2; i++) {
      const drawer = new THREE.Mesh(drawerGeo, handleMat);
      drawer.position.set(0.31, 0.55 - (i * 0.25), 0);
      cabGroup.add(drawer);
    }

    group.add(cabGroup);
  }
  // 6. Generic Fallback
  else {
    const dims = itemData.dims || [1, 1, 1];
    const boxGeo = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
    const boxMat = new THREE.MeshStandardMaterial({ 
      color: itemData.color || 0x64748b, 
      roughness: 0.5 
    });
    const mesh = new THREE.Mesh(boxGeo, boxMat);
    mesh.position.set(0, dims[1] / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}
