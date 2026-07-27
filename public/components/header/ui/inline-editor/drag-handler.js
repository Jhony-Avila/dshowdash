const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/ui/inline-editor/drag-handler";
function createDragHandler(callbacks) {
  let _draggedElement = null;
  let _dragStartIndex = -1;
  let _placeholderIndex = -1;
  function _onDragStart(e) {
    _draggedElement = e.currentTarget;
    _dragStartIndex = Array.from(callbacks.getHeaderRight().children).indexOf(_draggedElement);
    _draggedElement.classList.add("hie-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", _draggedElement.dataset.componentKey || "");
    callbacks.pushToUndoStack();
  }
  function _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const headerRight = callbacks.getHeaderRight();
    const dropIndicator = callbacks.getDropIndicator();
    if (!headerRight || !dropIndicator) return;
    const wrappers = callbacks.getEditableItems().map((item) => item.element);
    const mouseX = e.clientX;
    let insertIndex = wrappers.length;
    for (let i = 0; i < wrappers.length; i++) {
      const rect = wrappers[i].getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (mouseX < midX) {
        insertIndex = i;
        break;
      }
    }
    _placeholderIndex = insertIndex;
    if (wrappers.length > 0) {
      const targetWrapper = wrappers[insertIndex] || wrappers[wrappers.length - 1];
      const targetRect = targetWrapper.getBoundingClientRect();
      const headerRect = headerRight.getBoundingClientRect();
      dropIndicator.style.height = `${targetRect.height}px`;
      dropIndicator.style.top = `${targetRect.top}px`;
      if (insertIndex < wrappers.length) {
        dropIndicator.style.left = `${targetRect.left - 2}px`;
      } else {
        dropIndicator.style.left = `${targetRect.right + 2}px`;
      }
      dropIndicator.classList.add("hie-visible");
    }
  }
  function _onDragLeave(e) {
    const dropIndicator = callbacks.getDropIndicator();
    if (dropIndicator && !e.currentTarget.contains(e.relatedTarget)) {
      dropIndicator.classList.remove("hie-visible");
    }
  }
  function _onDrop(e) {
    e.preventDefault();
    const dropIndicator = callbacks.getDropIndicator();
    if (dropIndicator) dropIndicator.classList.remove("hie-visible");
    if (!_draggedElement) return;
    const headerRight = callbacks.getHeaderRight();
    const wrappers = callbacks.getEditableItems().map((item) => item.element);
    if (_placeholderIndex >= 0 && _placeholderIndex !== _dragStartIndex) {
      if (_placeholderIndex >= wrappers.length) {
        headerRight.appendChild(_draggedElement);
      } else {
        const targetElement = wrappers[_placeholderIndex];
        if (targetElement !== _draggedElement) {
          headerRight.insertBefore(_draggedElement, targetElement);
        }
      }
      callbacks.onDragCountIncrement();
      callbacks.markUnsavedChanges();
      callbacks.updatePositionBadges();
      callbacks.scheduleAutoSave();
      callbacks.playDropSound();
      callbacks.announceToScreenReader(`Item movido para posi\xE7\xE3o ${_placeholderIndex + 1}`);
    }
  }
  function _onDragEnd(e) {
    if (_draggedElement) {
      _draggedElement.classList.remove("hie-dragging");
    }
    _draggedElement = null;
    _dragStartIndex = -1;
    _placeholderIndex = -1;
    const dropIndicator = callbacks.getDropIndicator();
    if (dropIndicator) dropIndicator.classList.remove("hie-visible");
  }
  return {
    setupWrapper(wrapper) {
      wrapper.setAttribute("draggable", "true");
      const handlers = {
        dragstart: _onDragStart,
        dragover: _onDragOver,
        dragleave: _onDragLeave,
        drop: _onDrop,
        dragend: _onDragEnd
      };
      Object.keys(handlers).forEach((event) => {
        wrapper.addEventListener(event, handlers[event]);
      });
      return handlers;
    },
    cleanupWrapper(wrapper, handlers) {
      wrapper.removeAttribute("draggable");
      if (handlers) {
        Object.keys(handlers).forEach((event) => {
          wrapper.removeEventListener(event, handlers[event]);
        });
      }
    }
  };
}
var drag_handler_default = { VERSION, createDragHandler };
export {
  MODULE_ID,
  VERSION,
  createDragHandler,
  drag_handler_default as default
};
