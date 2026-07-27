import { VERSION as MODULE_ID, ZOOM_PRESETS, ZOOM_ORIGINS } from "./constants.js";
import {
  getInstance,
  setInstance,
  getConfig,
  setConfig,
  getContainer,
  setContainer,
  setContent,
  getCurrentZoom,
  isInitialized,
  setInitialized,
  getListeners,
  loadZoom,
  resetState
} from "./state.js";
import { applyZoom, emit } from "./core/zoom-apply.js";
import {
  setZoom,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToFit,
  zoomToFill,
  zoomToActual,
  resetZoom,
  setMinZoom,
  setMaxZoom
} from "./core/zoom-controls.js";
import {
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleDoubleClick
} from "./handlers/events.js";
import { removeZoomIndicator } from "./ui/indicator.js";
import { healthCheck, info } from "./diagnostics/health.js";
import { createLogger } from "../logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const logger = createLogger(MODULE_ID);
function createZoomManager(options) {
  options = options || {};
  setConfig(options);
  const initialZoom = loadZoom();
  applyZoom(initialZoom, void 0, false);
  logger.debug("Zoom Manager created", { defaultZoom: initialZoom });
  return {
    init,
    destroy,
    setZoom,
    getZoom() {
      return getCurrentZoom();
    },
    zoomIn,
    zoomOut,
    zoomTo,
    zoomToFit,
    zoomToFill,
    zoomToActual,
    resetZoom,
    setMinZoom,
    setMaxZoom,
    getZoomRange() {
      const config = getConfig();
      return { min: config.minZoom, max: config.maxZoom };
    },
    subscribe,
    healthCheck,
    info
  };
}
function getZoomManager(options) {
  let instance = getInstance();
  if (!instance) {
    instance = createZoomManager(options);
    setInstance(instance);
  }
  return instance;
}
function init(container, content) {
  if (isInitialized()) return true;
  const containerEl = typeof container === "string" ? document.querySelector(container) : container;
  const contentEl = content ? typeof content === "string" ? document.querySelector(content) : content : containerEl;
  if (!containerEl) {
    logger.error("Container not found");
    return false;
  }
  setContainer(containerEl);
  setContent(contentEl);
  const config = getConfig();
  if (config.enableScrollZoom) {
    containerEl.addEventListener("wheel", handleWheel, { passive: false });
  }
  if (config.enablePinchZoom) {
    containerEl.addEventListener("touchstart", handleTouchStart, { passive: true });
    containerEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    containerEl.addEventListener("touchend", handleTouchEnd, { passive: true });
  }
  if (config.enableDoubleClickZoom) {
    containerEl.addEventListener("dblclick", handleDoubleClick);
  }
  applyZoom(getCurrentZoom(), void 0, false);
  setInitialized(true);
  emit("initialized", { zoom: getCurrentZoom() });
  logger.debug("Initialized");
  return true;
}
function destroy() {
  if (!isInitialized()) return true;
  const container = getContainer();
  if (container) {
    container.removeEventListener("wheel", handleWheel);
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
    container.removeEventListener("dblclick", handleDoubleClick);
  }
  removeZoomIndicator();
  resetState();
  logger.debug("Destroyed");
  return true;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  const listeners = getListeners();
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
var zoom_manager_default = {
  VERSION,
  MODULE_ID,
  ZOOM_PRESETS,
  ZOOM_ORIGINS,
  createZoomManager,
  getZoomManager,
  init,
  destroy,
  setZoom,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToFit,
  zoomToFill,
  zoomToActual,
  resetZoom,
  setMinZoom,
  setMaxZoom,
  subscribe,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  ZOOM_ORIGINS,
  ZOOM_PRESETS,
  createZoomManager,
  zoom_manager_default as default,
  destroy,
  getZoomManager,
  healthCheck,
  info,
  init,
  resetZoom,
  setMaxZoom,
  setMinZoom,
  setZoom,
  subscribe,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToActual,
  zoomToFill,
  zoomToFit
};
