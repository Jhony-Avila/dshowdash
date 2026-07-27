import { getRegion } from "../../core/dom-regions/index.js";
import { RESIZE_CONFIGS } from "./constants.js";
import { listeners, metrics } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.region-resize.helpers";
function notifyListeners(event, data) {
  for (let i = 0; i < listeners.length; i++) {
    try {
      listeners[i]({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      metrics.errors++;
    }
  }
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function setCSSVariable(name, value, unit) {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.style.setProperty(name, value + unit);
  }
}
function applySize(regionName, size) {
  const config = RESIZE_CONFIGS[regionName];
  if (!config) return false;
  const region = getRegion(regionName);
  if (!region) return false;
  region.style[config.property] = size + config.unit;
  if (config.cssVar) {
    setCSSVariable(config.cssVar, size, config.unit);
  }
  return true;
}
export {
  MODULE_ID,
  VERSION,
  applySize,
  clamp,
  notifyListeners,
  setCSSVariable
};
