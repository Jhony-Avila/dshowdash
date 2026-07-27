import { ZOOM_ORIGINS } from "../constants.js";
import {
  getConfig,
  getContent,
  getCurrentZoom,
  setCurrentZoom,
  getListeners,
  getMetrics,
  incrementMetric,
  saveZoom
} from "../state.js";
import { showZoomIndicator } from "../ui/indicator.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "main.ui.container-main.utils.zoom-manager.core.zoom-apply";
function clampZoom(zoom) {
  const config = getConfig();
  return Math.max(config.minZoom, Math.min(config.maxZoom, zoom));
}
function emit(event, data) {
  const listeners = getListeners();
  const metrics = getMetrics();
  listeners.forEach((listener) => {
    try {
      listener({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      metrics.errors++;
    }
  });
}
function applyZoom(zoom, origin, animate) {
  if (animate === void 0) animate = true;
  const content = getContent();
  if (!content) return getCurrentZoom();
  const config = getConfig();
  const clampedZoom = clampZoom(zoom);
  const previousZoom = getCurrentZoom();
  setCurrentZoom(clampedZoom);
  let transformOrigin = "center center";
  if (origin && config.zoomOrigin === ZOOM_ORIGINS.CURSOR) {
    const rect = content.getBoundingClientRect();
    const x = (origin.x - rect.left) / rect.width * 100;
    const y = (origin.y - rect.top) / rect.height * 100;
    transformOrigin = `${x}% ${y}%`;
  } else if (config.zoomOrigin === ZOOM_ORIGINS.TOP_LEFT) {
    transformOrigin = "top left";
  }
  content.style.transformOrigin = transformOrigin;
  if (animate && config.smoothZoom) {
    content.style.transition = `transform ${config.animationDuration}ms ease-out`;
  } else {
    content.style.transition = "none";
  }
  content.style.transform = `scale(${clampedZoom})`;
  if (config.showZoomIndicator) {
    showZoomIndicator(clampedZoom);
  }
  incrementMetric("zoomChanges");
  saveZoom();
  emit("zoomChanged", {
    zoom: clampedZoom,
    previousZoom,
    origin
  });
  return clampedZoom;
}
var zoom_apply_default = {
  clampZoom,
  emit,
  applyZoom
};
export {
  MODULE_ID,
  VERSION,
  applyZoom,
  clampZoom,
  zoom_apply_default as default,
  emit
};
