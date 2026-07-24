// catalogData.js

export const sizePresets = {
  small: { 
    width: 560, 
    height: 440, 
    readout: "14ft x 11ft", 
    area: "154 sq ft", 
    floorScale: { x: 7, z: 5.5 } 
  },
  medium: { 
    width: 720, 
    height: 520, 
    readout: "18ft x 13ft", 
    area: "234 sq ft", 
    floorScale: { x: 10, z: 8 } 
  },
  large: { 
    width: 880, 
    height: 600, 
    readout: "22ft x 15ft", 
    area: "330 sq ft", 
    floorScale: { x: 13, z: 9 } 
  }
};

export const catalogs = {
  medsurg: {
    title: "Med-Surg Catalog",
    desc: "Simulated hospital room equipment and furniture",
    headline: "Medical-Surgical Simulation Lab",
    items: [
      {
        category: "Patient Beds",
        variants: [
          {
            label: "Synergy 5000 Basic Training Bed Package",
            sku: "04-50-5812P",
            sub: "Includes bed, overbed table, and 1-drawer cabinet",
            isWallItem: false
          },
          {
            label: "Synergy 5000 Deluxe Training Bed Kit",
            sku: "04-50-5804P",
            sub: "Full electric with integrated staff controls and four rails",
            isWallItem: false
          },
          {
            label: "CAREdge Electric Hospital Bed",
            sku: "04-50-7688",
            sub: "Advanced acute care simulation bed frame",
            isWallItem: false
          }
        ]
      },
      {
        category: "Infusion & Support",
        variants: [
          {
            label: "Bed Socket Telescoping IV Pole",
            sku: "04-54-2101",
            sub: "Adjustable height aluminum tubing for bed sockets",
            isWallItem: false
          },
          {
            label: "Standard Non-Tilt Overbed Table",
            sku: "04-50-1060P",
            sub: "Light oak finish mobile overbed workspace",
            isWallItem: false
          }
        ]
      },
      {
        category: "Wall Infrastructure & Signage",
        variants: [
          {
            label: "Standard Medical Headwall",
            sku: "HW-MED-100",
            sub: "Pre-plumbed clinical service panel with medical gas outlets",
            isWallItem: true
          },
          {
            label: "Anatomical Educational Poster",
            sku: "PST-ANAT-202",
            sub: "Vascular and skeletal system reference wall chart",
            isWallItem: true
          }
        ]
      }
    ]
  },
  pharmacy: {
    title: "Pharmacy Catalog",
    desc: "Simulated pharmacy and medication management workspace",
    headline: "Pharmacy Simulation Lab",
    items: [
      {
        category: "Storage & Dispensing",
        variants: [
          {
            label: "Automatic Dispensing Cabinet",
            sku: "PN-PHARM-301",
            sub: "Secure medication storage simulation unit",
            isWallItem: false
          },
          {
            label: "Pharmacy Workflow Workstation",
            sku: "PN-PHARM-405",
            sub: "Stainless steel prep counter with integrated locking bin storage",
            isWallItem: false
          }
        ]
      },
      {
        category: "Medication Prep & Safety",
        variants: [
          {
            label: "Vertical Laminar Flow Hood",
            sku: "PN-PHARM-810",
            sub: "Clean bench simulation unit for compounding training",
            isWallItem: false
          },
          {
            label: "Demo Dose Medication Supply Kit",
            sku: "PN-MED-900",
            sub: "Assorted simulation vials and blister packs for student practice",
            isWallItem: false
          }
        ]
      }
    ]
  }
};
