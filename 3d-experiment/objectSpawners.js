// objectSpawners.js
import * as THREE from 'three';

export function createSpawnerGeometry(itemData) {
  const group = new THREE.Group();

  if (itemData.sku === "PN-BED-102") {
    const baseGeo = new THREE.BoxGeometry(1.2, 0.25, 2.0);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.12;
    group.add(baseMesh);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const wheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wCoords = [[0.55, 0.06, 0.9], [-0.55, 0.06, 0.9], [0.55, 0.06, -0.9], [-0.55, 0.06, -0.9]];
    wCoords.forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(...pos);
      group.add(w);
    });

    const deckGroup = new THREE.Group();
    deckGroup.position.set(0, 0.35, 0);
    group.add(deckGroup);

    const mattressGeo = new THREE.BoxGeometry(1.1, 0.25, 1.9);
    const mattressMat = new THREE.MeshStandardMaterial({ color: itemData.color || 0x1d4ed8, roughness: 0.8 });
    const mattress = new THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.z = 0.05;
    deckGroup.add(mattress);

    const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.1), boardMat);
    headboard.position.set(0, 0.55, -0.95);
    group.add(headboard);

    const hbAccent = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.12), accentMat);
    hbAccent.position.set(0, 0.55, -0.95);
    group.add(hbAccent);

    const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 0.1), boardMat);
    footboard.position.set(0, 0.45, 0.95);
    group.add(footboard);

    const railMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2 });
    [-0.65, 0.65].forEach(xPos => {
      const hRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.7), railMat);
      hRail.position.set(xPos, 0.55, -0.4);
      group.add(hRail);
      const fRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.7), railMat);
      fRail.position.set(xPos, 0.55, 0.4);
      group.add(fRail);
    });

  } else if (itemData.sku === "PN-IV-201" || itemData.sku === "PN-IV-202" || itemData.label === "IV Pole") {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.3 });
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.08), baseMat);
    leg1.position.y = 0.02;
    group.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.5), baseMat);
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

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.2 })
    );
    pole.position.y = 0.85;
    group.add(pole);

    const hookMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    for (let i = 0; i < 4; i++) {
      const hookGroup = new THREE.Group();
      hookGroup.rotation.y = (i * Math.PI) / 2;
      
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.015), hookMat);
      arm.position.set(0.06, 1.62, 0);
      hookGroup.add(arm);

      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), hookMat);
      tip.rotation.x = Math.PI / 3;
      tip.position.set(0.11, 1.59, 0);
      hookGroup.add(tip);

      group.add(hookGroup);
    }

  } else if (itemData.label === "Patient Bed") {
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.15, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    baseMesh.position.y = 0.15;
    group.add(baseMesh);

    const mattressMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.25, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.7 })
    );
    mattressMesh.position.y = 0.35;
    group.add(mattressMesh);

  } else if (itemData.label === "Medical Headwall") {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    panel.position.set(0, 1.15, 0);
    group.add(panel);

  } else {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(itemData.dims[0], itemData.dims[1], itemData.dims[2]),
      new THREE.MeshStandardMaterial({ color: itemData.color || 0x64748b, roughness: 0.5 })
    );
    mesh.position.y = itemData.dims[1] / 2;
    group.add(mesh);
  }

  return group;
}
