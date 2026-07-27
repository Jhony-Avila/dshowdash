import { RESIZE_CONFIGS } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.region-resize.state";
const sizes = {};
const resizing = { value: null };
const listeners = [];
const initialized = { value: false };
const metrics = {
  resizes: 0,
  dragResizes: 0,
  errors: 0
};
const dragState = {
  active: false,
  region: null,
  startPos: 0,
  startSize: 0,
  config: null
};
const configKeys = Object.keys(RESIZE_CONFIGS);
for (let i = 0; i < configKeys.length; i++) {
  sizes[configKeys[i]] = RESIZE_CONFIGS[configKeys[i]].default;
}
export {
  MODULE_ID,
  VERSION,
  dragState,
  initialized,
  listeners,
  metrics,
  resizing,
  sizes
};
