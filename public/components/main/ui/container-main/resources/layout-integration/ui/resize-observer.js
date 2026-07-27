import { LAYOUT_EVENTS } from "../core/constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-integration.ui.resize-observer";
function setupResizeObserver(panelId, element, emit, onLayoutChange) {
  if (!element || typeof ResizeObserver === "undefined") {
    return null;
  }
  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const { width, height } = entry.contentRect;
      emit(LAYOUT_EVENTS.RESIZE_END, { panelId, width, height });
      onLayoutChange?.(panelId, "resize", { width, height });
    });
  });
  observer.observe(element);
  return observer;
}
var resize_observer_default = { setupResizeObserver };
export {
  MODULE_ID,
  VERSION,
  resize_observer_default as default,
  setupResizeObserver
};
