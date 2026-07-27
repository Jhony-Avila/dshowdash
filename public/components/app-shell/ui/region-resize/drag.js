import LayoutPersistence from "../../state/layout-persistence.js";
import { RESIZE_CONFIGS } from "./constants.js";
import { sizes, resizing, metrics, dragState } from "./state.js";
import { notifyListeners } from "./helpers.js";
import { setSize } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.region-resize.drag";
function onDragMove(event) {
  if (!dragState.active) return;
  event.preventDefault();
  const currentPos = dragState.config.property === "width" ? event.clientX || event.touches?.[0]?.clientX || 0 : event.clientY || event.touches?.[0]?.clientY || 0;
  const delta = currentPos - dragState.startPos;
  const newSize = dragState.startSize + delta;
  setSize(dragState.region, newSize, { persist: false, animate: false });
}
function onDragEnd(event) {
  if (!dragState.active) return;
  const config = dragState.config;
  const regionName = dragState.region;
  if (config.persist && config.persistKey) {
    LayoutPersistence.setPreference(config.persistKey, sizes[regionName]);
  }
  metrics.dragResizes++;
  notifyListeners("drag-end", { region: regionName, size: sizes[regionName] });
  dragState.active = false;
  dragState.region = null;
  dragState.config = null;
  resizing.value = null;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
  document.removeEventListener("touchmove", onDragMove);
  document.removeEventListener("touchend", onDragEnd);
}
function startDragResize(regionName, event) {
  const config = RESIZE_CONFIGS[regionName];
  if (!config) return false;
  event.preventDefault();
  const startPos = config.property === "width" ? event.clientX || event.touches?.[0]?.clientX || 0 : event.clientY || event.touches?.[0]?.clientY || 0;
  dragState.active = true;
  dragState.region = regionName;
  dragState.startPos = startPos;
  dragState.startSize = sizes[regionName];
  dragState.config = config;
  resizing.value = regionName;
  document.body.style.cursor = config.property === "width" ? "col-resize" : "row-resize";
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("touchend", onDragEnd);
  notifyListeners("drag-start", { region: regionName, startSize: dragState.startSize });
  return true;
}
function isDragging() {
  return dragState.active;
}
function getDraggingRegion() {
  return resizing.value;
}
export {
  MODULE_ID,
  VERSION,
  getDraggingRegion,
  isDragging,
  startDragResize
};
