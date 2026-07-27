const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-layout-presets";
const PRESETS = Object.freeze({
  DEFAULT: "default",
  COMPACT: "compact",
  EXPANDED: "expanded",
  FOCUS: "focus",
  DASHBOARD: "dashboard",
  PRESENTATION: "presentation",
  MOBILE: "mobile"
});
const PRESET_CONFIGS = {
  default: {
    name: "Default",
    regions: {
      header: { visible: true, height: "60px" },
      sidebar: { visible: true, width: "280px", collapsed: false },
      "nav-rail": { visible: true, width: "72px" },
      main: { visible: true },
      footer: { visible: true, height: "40px" },
      ticker: { visible: false }
    },
    cssVars: {}
  },
  compact: {
    name: "Compact",
    regions: {
      header: { visible: true, height: "48px" },
      sidebar: { visible: true, width: "200px", collapsed: true },
      "nav-rail": { visible: true, width: "56px" },
      main: { visible: true },
      footer: { visible: false },
      ticker: { visible: false }
    },
    cssVars: { "--spacing-base": "8px" }
  },
  expanded: {
    name: "Expanded",
    regions: {
      header: { visible: true, height: "72px" },
      sidebar: { visible: true, width: "360px", collapsed: false },
      "nav-rail": { visible: true, width: "80px" },
      main: { visible: true },
      footer: { visible: true, height: "48px" },
      ticker: { visible: true, height: "32px" }
    },
    cssVars: { "--spacing-base": "16px" }
  },
  focus: {
    name: "Focus Mode",
    regions: {
      header: { visible: false },
      sidebar: { visible: false },
      "nav-rail": { visible: false },
      main: { visible: true, fullscreen: true },
      footer: { visible: false },
      ticker: { visible: false }
    },
    cssVars: {}
  },
  dashboard: {
    name: "Dashboard",
    regions: {
      header: { visible: true, height: "56px", fixed: true },
      sidebar: { visible: true, width: "240px", collapsed: false },
      "nav-rail": { visible: false },
      main: { visible: true },
      footer: { visible: false },
      ticker: { visible: true, height: "28px" }
    },
    cssVars: {}
  },
  presentation: {
    name: "Presentation",
    regions: {
      header: { visible: false },
      sidebar: { visible: false },
      "nav-rail": { visible: false },
      main: { visible: true, fullscreen: true },
      footer: { visible: false },
      ticker: { visible: false }
    },
    cssVars: { "--content-max-width": "100%" }
  },
  mobile: {
    name: "Mobile",
    regions: {
      header: { visible: true, height: "56px", fixed: true },
      sidebar: { visible: false, overlay: true },
      "nav-rail": { visible: false },
      main: { visible: true },
      footer: { visible: true, height: "56px", fixed: true },
      ticker: { visible: false }
    },
    cssVars: { "--spacing-base": "12px" }
  }
};
function applyRegionConfig(regionName, config) {
  const region = document.getElementById(regionName) || document.querySelector(`[data-region="${regionName}"]`);
  if (!region) return false;
  if (config.visible !== void 0) {
    region.style.display = config.visible ? "" : "none";
  }
  if (config.width) region.style.width = config.width;
  if (config.height) region.style.height = config.height;
  if (config.collapsed) region.classList.add("collapsed");
  else region.classList.remove("collapsed");
  if (config.overlay) region.classList.add("overlay");
  else region.classList.remove("overlay");
  if (config.fixed) region.classList.add("fixed");
  else region.classList.remove("fixed");
  if (config.fullscreen) region.classList.add("fullscreen");
  else region.classList.remove("fullscreen");
  return true;
}
function applyCssVars(vars) {
  const root = document.documentElement;
  const keys = Object.keys(vars);
  for (let i = 0; i < keys.length; i++) {
    root.style.setProperty(keys[i], vars[keys[i]]);
  }
}
function clearCssVars(vars) {
  const root = document.documentElement;
  const keys = Object.keys(vars);
  for (let i = 0; i < keys.length; i++) {
    root.style.removeProperty(keys[i]);
  }
}
var constants_default = {
  VERSION,
  MODULE_ID,
  PRESETS,
  PRESET_CONFIGS,
  applyRegionConfig,
  applyCssVars,
  clearCssVars
};
export {
  MODULE_ID,
  PRESETS,
  PRESET_CONFIGS,
  VERSION,
  applyCssVars,
  applyRegionConfig,
  clearCssVars,
  constants_default as default
};
