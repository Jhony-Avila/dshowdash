const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "header-ui-inline-editor-drag-handler";
let _metrics = { dragStarts: 0, drops: 0, setups: 0 };
function createDragHandler(deps) {
  const { getHeaderRight, getDropIndicator, getEditableItems, pushToUndoStack, markUnsavedChanges, updatePositionBadges, scheduleAutoSave, playDropSound, announceToScreenReader, onDragCountIncrement } = deps;
  let isDragging = false;
  let draggedElement = null;
  function onDragStart(e, wrapper) {
    if (wrapper.dataset.draggable === "false") {
      e.preventDefault();
      wrapper.classList.add("hie-shake");
      setTimeout(() => wrapper.classList.remove("hie-shake"), 400);
      announceToScreenReader?.("Este item n\xE3o pode ser movido");
      return;
    }
    _metrics.dragStarts++;
    pushToUndoStack?.();
    isDragging = true;
    draggedElement = wrapper;
    onDragCountIncrement?.();
    wrapper.classList.add("hie-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", wrapper.dataset.componentKey || "");
    const ghost = wrapper.cloneNode(true);
    ghost.style.cssText = "opacity: 0.7; transform: scale(1.05); position: absolute; top: -9999px; pointer-events: none;";
    ghost.classList.remove("hie-dragging");
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, wrapper.offsetWidth / 2, wrapper.offsetHeight / 2);
    setTimeout(() => ghost.remove(), 0);
    announceToScreenReader?.(`Arrastando ${wrapper.dataset.componentLabel}`);
  }
  function onDragEnd(e, wrapper) {
    isDragging = false;
    draggedElement = null;
    wrapper.classList.remove("hie-dragging");
    getEditableItems?.().forEach(({ element }) => {
      element.classList.remove("hie-drag-over");
    });
    const dropIndicator = getDropIndicator?.();
    dropIndicator?.classList.remove("hie-visible");
  }
  function onDragOver(e, wrapper) {
    if (!isDragging || wrapper === draggedElement) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = wrapper.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const insertBefore = e.clientX < midX;
    const dropIndicator = getDropIndicator?.();
    if (dropIndicator) {
      dropIndicator.style.top = `${rect.top + (rect.height - 36) / 2}px`;
      dropIndicator.style.left = insertBefore ? `${rect.left - 6}px` : `${rect.right + 2}px`;
      dropIndicator.classList.add("hie-visible");
    }
  }
  function onDragEnter(e, wrapper) {
    if (!isDragging || wrapper === draggedElement) return;
    e.preventDefault();
    wrapper.classList.add("hie-drag-over");
  }
  function onDragLeave(e, wrapper) {
    if (!wrapper.contains(e.relatedTarget)) wrapper.classList.remove("hie-drag-over");
  }
  function onDrop(e, targetWrapper) {
    e.preventDefault();
    if (!draggedElement || targetWrapper === draggedElement) return;
    _metrics.drops++;
    targetWrapper.classList.remove("hie-drag-over");
    const dropIndicator = getDropIndicator?.();
    dropIndicator?.classList.remove("hie-visible");
    const headerRight = getHeaderRight?.();
    if (!headerRight) return;
    const rect = targetWrapper.getBoundingClientRect();
    const insertBefore = e.clientX < rect.left + rect.width / 2;
    if (insertBefore) {
      headerRight.insertBefore(draggedElement, targetWrapper);
    } else {
      const nextSibling = targetWrapper.nextElementSibling;
      if (nextSibling && nextSibling.classList.contains("header-component-wrapper")) {
        headerRight.insertBefore(draggedElement, nextSibling);
      } else {
        const firstNonWrapper = Array.from(headerRight.children).find((el) => !el.classList.contains("header-component-wrapper") && el !== draggedElement);
        if (firstNonWrapper) {
          headerRight.insertBefore(draggedElement, firstNonWrapper);
        } else {
          headerRight.appendChild(draggedElement);
        }
      }
    }
    updatePositionBadges?.();
    markUnsavedChanges?.();
    playDropSound?.();
    announceToScreenReader?.(`${draggedElement.dataset.componentLabel} movido`);
    scheduleAutoSave?.();
  }
  function setupWrapper(wrapper) {
    _metrics.setups++;
    const isDraggable = wrapper.dataset.draggable !== "false";
    if (isDraggable) {
      wrapper.setAttribute("draggable", "true");
    } else {
      wrapper.classList.add("hie-locked");
    }
    const handlers = { dragstart: (e) => onDragStart(e, wrapper), dragend: (e) => onDragEnd(e, wrapper), dragover: (e) => onDragOver(e, wrapper), dragenter: (e) => onDragEnter(e, wrapper), dragleave: (e) => onDragLeave(e, wrapper), drop: (e) => onDrop(e, wrapper) };
    Object.entries(handlers).forEach(([event, handler]) => {
      wrapper.addEventListener(event, handler);
    });
    return handlers;
  }
  function cleanupWrapper(wrapper, handlers) {
    wrapper.removeAttribute("draggable");
    wrapper.classList.remove("hie-dragging", "hie-drag-over", "hie-locked");
    Object.entries(handlers).forEach(([event, handler]) => {
      wrapper.removeEventListener(event, handler);
    });
  }
  function getState() {
    return { isDragging, draggedElement };
  }
  return { setupWrapper, cleanupWrapper, getState };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { dragReady: true }, metrics: getMetrics() };
}
var drag_handler_default = { createDragHandler, getMetrics, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createDragHandler,
  drag_handler_default as default,
  getMetrics,
  healthCheck,
  info
};
