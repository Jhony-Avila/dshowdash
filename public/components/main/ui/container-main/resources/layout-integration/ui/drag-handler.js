import { LAYOUT_EVENTS } from "../core/constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-integration.ui.drag-handler";
function setupDragListeners(panelId, element, layoutManager, emit, handle = null) {
  if (!element) return null;
  const dragHandle = handle || element.querySelector("[data-drag-handle]") || element;
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  const onMouseDown = (e) => {
    if (e.target !== dragHandle && !dragHandle.contains(e.target)) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    emit(LAYOUT_EVENTS.MOVE_START, { panelId });
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    layoutManager.move(panelId, startLeft + dx, startTop + dy, { animate: false });
  };
  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    emit(LAYOUT_EVENTS.MOVE_END, { panelId });
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
  dragHandle.addEventListener("mousedown", onMouseDown);
  return () => {
    dragHandle.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
}
var drag_handler_default = { setupDragListeners };
export {
  MODULE_ID,
  VERSION,
  drag_handler_default as default,
  setupDragListeners
};
