const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:panels";
export * from "./video-panel.js";
export * from "./chart-panel.js";
export * from "./stream-panel.js";
const AVAILABLE_PANELS = [
  "video-panel",
  "chart-panel",
  "stream-panel"
];
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    panels: AVAILABLE_PANELS
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    panelCount: AVAILABLE_PANELS.length
  };
}
var panels_default = {
  VERSION,
  MODULE_ID,
  AVAILABLE_PANELS,
  info,
  healthCheck
};
export {
  AVAILABLE_PANELS,
  MODULE_ID,
  VERSION,
  panels_default as default,
  healthCheck,
  info
};
