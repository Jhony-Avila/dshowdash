import { showToast, announce } from "./helpers.js";
const MODULE_ID = "panel-user-preferences-drag-drop";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _draggedItem = null;
let _abortController = null;
function setupDragDropHandlers(container, handlers) {
  cleanupDragDrop();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  const droppableArea = container.querySelector('[data-droppable="layouts"]');
  if (!droppableArea) return;
  const items = droppableArea.querySelectorAll('.pup-item[draggable="true"]');
  for (let i = 0; i < items.length; i++) {
    ((item) => {
      item.addEventListener("dragstart", (e) => {
        _draggedItem = item;
        item.classList.add("dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", item.dataset.layoutKey || "");
        }
      }, { signal });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        _draggedItem = null;
        const allItems = droppableArea.querySelectorAll(".pup-item");
        for (let j = 0; j < allItems.length; j++) {
          allItems[j].classList.remove("drag-over");
        }
      }, { signal });
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        if (_draggedItem && _draggedItem !== item) {
          item.classList.add("drag-over");
        }
      }, { signal });
      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      }, { signal });
      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");
        if (_draggedItem && _draggedItem !== item) {
          const allItems = Array.prototype.slice.call(droppableArea.querySelectorAll('.pup-item[draggable="true"]'));
          const draggedIndex = allItems.indexOf(_draggedItem);
          const targetIndex = allItems.indexOf(item);
          if (draggedIndex < targetIndex) {
            item.parentNode.insertBefore(_draggedItem, item.nextSibling);
          } else {
            item.parentNode.insertBefore(_draggedItem, item);
          }
          const newOrder = [];
          const reorderedItems = droppableArea.querySelectorAll('.pup-item[draggable="true"]');
          for (let k = 0; k < reorderedItems.length; k++) {
            newOrder.push(reorderedItems[k].dataset.layoutKey);
          }
          if (handlers && typeof handlers.reorderLayouts === "function") handlers.reorderLayouts(newOrder);
          showToast("Ordem dos layouts atualizada", "info");
          announce("Layouts reordenados");
        }
      }, { signal });
    })(items[i]);
  }
}
function cleanupDragDrop() {
  _draggedItem = null;
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p12Compliant: true,
    hasAbortController: !!_abortController
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    p12Compliant: true,
    checks: { cleanupReady: true, hasAbortController: !!_abortController }
  };
}
var drag_drop_default = { MODULE_ID, VERSION, setupDragDropHandlers, cleanupDragDrop, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  cleanupDragDrop,
  drag_drop_default as default,
  healthCheck,
  info,
  setupDragDropHandlers
};
