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
    desc: "Simulated medical-surgical room equipment and furniture",
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
          }
        ]
      }
    ]
  }
};
