const VERSION = "1.0.0";
const MODULE_ID = "container-main:zoom-manager";
const ZOOM_PRESETS = Object.freeze({
  FIT: "fit",
  FILL: "fill",
  ACTUAL: "actual",
  CUSTOM: "custom"
});
const ZOOM_ORIGINS = Object.freeze({
  CENTER: "center",
  CURSOR: "cursor",
  TOP_LEFT: "top-left"
});
const DEFAULT_CONFIG = Object.freeze({
  minZoom: 0.25,
  maxZoom: 4,
  defaultZoom: 1,
  zoomStep: 0.1,
  smoothZoom: true,
  animationDuration: 200,
  enablePinchZoom: true,
  enableScrollZoom: true,
  enableDoubleClickZoom: true,
  scrollZoomModifier: "ctrl",
  doubleClickZoomAmount: 0.5,
  zoomOrigin: "cursor",
  persistZoom: true,
  showZoomIndicator: true
});
const STORAGE_KEY = "dsd:container-main:zoom";
var constants_default = {
  VERSION,
  MODULE_ID,
  ZOOM_PRESETS,
  ZOOM_ORIGINS,
  DEFAULT_CONFIG,
  STORAGE_KEY
};
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  STORAGE_KEY,
  VERSION,
  ZOOM_ORIGINS,
  ZOOM_PRESETS,
  constants_default as default
};
