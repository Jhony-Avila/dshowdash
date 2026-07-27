const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-region-resize";
const RESIZE_CONFIGS = {
  sidebar: {
    property: "width",
    min: 200,
    max: 500,
    default: 280,
    unit: "px",
    cssVar: "--dsd-sidebar-width",
    persist: true,
    persistKey: "sidebar.width"
  },
  footer: {
    property: "height",
    min: 32,
    max: 120,
    default: 48,
    unit: "px",
    cssVar: "--dsd-footer-height",
    persist: true,
    persistKey: "footer.height"
  },
  "nav-rail": {
    property: "width",
    min: 48,
    max: 280,
    default: 64,
    unit: "px",
    cssVar: "--dsd-navrail-width",
    persist: false
  },
  header: {
    property: "height",
    min: 48,
    max: 80,
    default: 56,
    unit: "px",
    cssVar: "--dsd-header-height",
    persist: false
  }
};
export {
  MODULE_ID,
  RESIZE_CONFIGS,
  VERSION
};
