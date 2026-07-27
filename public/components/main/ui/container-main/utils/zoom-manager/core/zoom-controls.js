import { ZOOM_PRESETS } from "../constants.js";
import { getConfig, getContainer, getContent, getCurrentZoom } from "../state.js";
import { applyZoom } from "./zoom-apply.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "main.ui.container-main.utils.zoom-manager.core.zoom-controls";
function setZoom(zoom, options) {
  options = options || {};
  const origin = options.origin || null;
  const animate = options.animate !== false;
  return applyZoom(zoom, origin, animate);
}
function zoomIn(amount) {
  const config = getConfig();
  if (amount === void 0) amount = config.zoomStep;
  return applyZoom(getCurrentZoom() + amount);
}
function zoomOut(amount) {
  const config = getConfig();
  if (amount === void 0) amount = config.zoomStep;
  return applyZoom(getCurrentZoom() - amount);
}
function zoomTo(preset) {
  switch (preset) {
    case ZOOM_PRESETS.FIT:
      return zoomToFit();
    case ZOOM_PRESETS.FILL:
      return zoomToFill();
    case ZOOM_PRESETS.ACTUAL:
      return zoomToActual();
    default:
      if (typeof preset === "number") {
        return applyZoom(preset);
      }
      return getCurrentZoom();
  }
}
function zoomToFit() {
  const container = getContainer();
  const content = getContent();
  if (!container || !content) return getCurrentZoom();
  const containerRect = container.getBoundingClientRect();
  const originalTransform = content.style.transform;
  content.style.transform = "none";
  const realContentRect = content.getBoundingClientRect();
  content.style.transform = originalTransform;
  const scaleX = containerRect.width / realContentRect.width;
  const scaleY = containerRect.height / realContentRect.height;
  const fitZoom = Math.min(scaleX, scaleY, 1);
  return applyZoom(fitZoom);
}
function zoomToFill() {
  const container = getContainer();
  const content = getContent();
  if (!container || !content) return getCurrentZoom();
  const containerRect = container.getBoundingClientRect();
  const originalTransform = content.style.transform;
  content.style.transform = "none";
  const realContentRect = content.getBoundingClientRect();
  content.style.transform = originalTransform;
  const scaleX = containerRect.width / realContentRect.width;
  const scaleY = containerRect.height / realContentRect.height;
  const fillZoom = Math.max(scaleX, scaleY);
  return applyZoom(fillZoom);
}
function zoomToActual() {
  return applyZoom(1);
}
function resetZoom() {
  const config = getConfig();
  return applyZoom(config.defaultZoom);
}
function setMinZoom(min) {
  const config = getConfig();
  config.minZoom = Math.max(0.1, min);
  if (getCurrentZoom() < config.minZoom) {
    applyZoom(config.minZoom);
  }
}
function setMaxZoom(max) {
  const config = getConfig();
  config.maxZoom = Math.min(10, max);
  if (getCurrentZoom() > config.maxZoom) {
    applyZoom(config.maxZoom);
  }
}
var zoom_controls_default = {
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
};
export {
  MODULE_ID,
  VERSION,
  zoom_controls_default as default,
  resetZoom,
  setMaxZoom,
  setMinZoom,
  setZoom,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToActual,
  zoomToFill,
  zoomToFit
};
