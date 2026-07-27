const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.ui.region-resize.core";
import { getRegion } from "../../core/dom-regions/index.js";
import LayoutPersistence from "../../state/layout-persistence.js";
import { RESIZE_CONFIGS } from "./constants.js";
import { sizes, initialized, metrics } from "./state.js";
import { notifyListeners, clamp, applySize } from "./helpers.js";
function init() {
  if (initialized.value) return true;
  const keys = Object.keys(RESIZE_CONFIGS);
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const config = RESIZE_CONFIGS[regionName];
    if (config.persist && config.persistKey) {
      const persisted = LayoutPersistence.getPreference(config.persistKey);
      if (persisted !== null && persisted !== void 0) {
        sizes[regionName] = clamp(persisted, config.min, config.max);
      }
    }
    applySize(regionName, sizes[regionName]);
  }
  initialized.value = true;
  notifyListeners("initialized", { sizes: getSizes() });
  return true;
}
function getSize(regionName) {
  return sizes[regionName] !== void 0 ? sizes[regionName] : null;
}
function getSizes() {
  const result = {};
  const keys = Object.keys(sizes);
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = sizes[keys[i]];
  }
  return result;
}
function setSize(regionName, size, options) {
  const config = RESIZE_CONFIGS[regionName];
  if (!config) {
    metrics.errors++;
    return false;
  }
  options = options || {};
  const persist = options.persist !== false;
  const animate = options.animate === true;
  const oldSize = sizes[regionName];
  const newSize = clamp(size, config.min, config.max);
  const region = getRegion(regionName);
  if (!region) {
    metrics.errors++;
    return false;
  }
  if (animate) {
    region.style.transition = `${config.property} 0.2s ease`;
  }
  applySize(regionName, newSize);
  sizes[regionName] = newSize;
  if (animate) {
    setTimeout(() => {
      region.style.transition = "";
    }, 200);
  }
  if (persist && config.persist && config.persistKey) {
    LayoutPersistence.setPreference(config.persistKey, newSize);
  }
  metrics.resizes++;
  notifyListeners("resize", {
    region: regionName,
    oldSize,
    newSize,
    property: config.property
  });
  return true;
}
function resetSize(regionName, options) {
  const config = RESIZE_CONFIGS[regionName];
  if (!config) return false;
  return setSize(regionName, config.default, options);
}
function resetAllSizes(options) {
  const keys = Object.keys(RESIZE_CONFIGS);
  for (let i = 0; i < keys.length; i++) {
    resetSize(keys[i], options);
  }
  notifyListeners("reset-all", { sizes: getSizes() });
  return true;
}
function getConfig(regionName) {
  const config = RESIZE_CONFIGS[regionName];
  return config ? Object.assign({}, config) : null;
}
function isResizable(regionName) {
  return RESIZE_CONFIGS[regionName] !== void 0;
}
function getResizableRegions() {
  return Object.keys(RESIZE_CONFIGS);
}
export {
  MODULE_ID,
  VERSION,
  getConfig,
  getResizableRegions,
  getSize,
  getSizes,
  init,
  isResizable,
  resetAllSizes,
  resetSize,
  setSize
};
