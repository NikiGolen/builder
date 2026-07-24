// catalogData.js

export const sizePresets = {
  small: { width: 560, height: 440, readout: "14ft x 11ft", area: "154 sq ft", floorScale: { x: 7, z: 5.5 } },
  medium: { width: 720, height: 520, readout: "18ft x 13ft", area: "234 sq ft", floorScale: { x: 10, z: 8 } },
  large: { width: 880, height: 600, readout: "22ft x 15ft", area: "330 sq ft", floorScale: { x: 13, z: 9 } }
};

export const catalogs = {
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
