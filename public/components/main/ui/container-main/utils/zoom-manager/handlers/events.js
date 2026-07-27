import {
  getConfig,
  getCurrentZoom,
  isPinching,
  setPinching,
  getInitialPinchDistance,
  setInitialPinchDistance,
  getInitialPinchZoom,
  setInitialPinchZoom,
  incrementMetric
} from "../state.js";
import { applyZoom } from "../core/zoom-apply.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "main.ui.container-main.utils.zoom-manager.handlers.events";
function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}
function getPinchCenter(touches) {
  return {
    // @ts-expect-error TS migration - TS2339
    x: (touches[0].clientX + touches[1].clientX) / 2,
    // @ts-expect-error TS migration - TS2339
    y: (touches[0].clientY + touches[1].clientY) / 2
  };
}
function handleWheel(e) {
  const config = getConfig();
  const modifierMap = {
    // @ts-expect-error TS migration - TS2339
    ctrl: e.ctrlKey,
    // @ts-expect-error TS migration - TS2339
    alt: e.altKey,
    // @ts-expect-error TS migration - TS2339
    shift: e.shiftKey,
    none: true
  };
  const modifierPressed = modifierMap[config.scrollZoomModifier];
  if (!modifierPressed) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? -config.zoomStep : config.zoomStep;
  const newZoom = getCurrentZoom() + delta;
  const origin = { x: e.clientX, y: e.clientY };
  applyZoom(newZoom, origin, false);
  incrementMetric("scrollZooms");
}
function handleTouchStart(e) {
  const config = getConfig();
  if (e.touches.length === 2 && config.enablePinchZoom) {
    setPinching(true);
    setInitialPinchDistance(getPinchDistance(e.touches));
    setInitialPinchZoom(getCurrentZoom());
  }
}
function handleTouchMove(e) {
  if (!isPinching() || e.touches.length !== 2) return;
  e.preventDefault();
  const currentDistance = getPinchDistance(e.touches);
  const scale = currentDistance / getInitialPinchDistance();
  const newZoom = getInitialPinchZoom() * scale;
  const origin = getPinchCenter(e.touches);
  applyZoom(newZoom, origin, false);
  incrementMetric("pinchZooms");
}
function handleTouchEnd(e) {
  if (e.touches.length < 2) {
    setPinching(false);
  }
}
function handleDoubleClick(e) {
  const config = getConfig();
  if (!config.enableDoubleClickZoom) return;
  e.preventDefault();
  const currentZoom = getCurrentZoom();
  const targetZoom = currentZoom >= config.defaultZoom + config.doubleClickZoomAmount ? config.defaultZoom : currentZoom + config.doubleClickZoomAmount;
  const origin = { x: e.clientX, y: e.clientY };
  applyZoom(targetZoom, origin, true);
}
var events_default = {
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleDoubleClick
};
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  handleDoubleClick,
  handleTouchEnd,
  handleTouchMove,
  handleTouchStart,
  handleWheel
};
