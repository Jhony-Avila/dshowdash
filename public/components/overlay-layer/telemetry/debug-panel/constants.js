const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-debug-panel.constants";
const DEFAULT_CONFIG = Object.freeze({
  enabled: false,
  position: "bottom-right",
  collapsed: true,
  opacity: 0.95,
  showMetrics: true,
  showStack: true,
  showEvents: true,
  showHealth: true,
  maxEvents: 50,
  refreshInterval: 1e3,
  hotkey: "ctrl+shift+o"
});
var constants_default = {
  VERSION,
  MODULE_ID,
  DEFAULT_CONFIG
};
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  VERSION,
  constants_default as default
};
