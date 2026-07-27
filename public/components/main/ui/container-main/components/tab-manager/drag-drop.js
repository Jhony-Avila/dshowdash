const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-tab-manager-drag-drop";
function createDragDropHandler(state, callbacks = {}) {
  let _draggedTabId = null;
  let _dragOverTabId = null;
  const { onReorder, onRender } = callbacks;
  function onDragStart(e, tabId) {
    _draggedTabId = tabId;
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dsd-tab--dragging");
  }
  function onDragOver(e, tabId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (_draggedTabId && _draggedTabId !== tabId) {
      _dragOverTabId = tabId;
      const tabEl = state.tabBarEl?.querySelector(`[data-tab-id="${tabId}"]`);
      tabEl?.classList.add("dsd-tab--drag-over");
    }
  }
  function onDragLeave(e) {
    e.target?.classList.remove("dsd-tab--drag-over");
  }
  function onDrop(e, targetId) {
    e.preventDefault();
    if (_draggedTabId && _draggedTabId !== targetId) {
      const fromIndex = state.findTabIndex(_draggedTabId);
      const toIndex = state.findTabIndex(targetId);
      if (fromIndex !== -1 && toIndex !== -1) {
        state.reorderTabs(fromIndex, toIndex);
        onRender?.();
        onReorder?.(state.tabs.map((t) => t.id));
      }
    }
    cleanup();
  }
  function onDragEnd() {
    cleanup();
  }
  function cleanup() {
    _draggedTabId = null;
    _dragOverTabId = null;
    state.tabBarEl?.querySelectorAll(".dsd-tab").forEach((el) => {
      el.classList.remove("dsd-tab--dragging", "dsd-tab--drag-over");
    });
  }
  function attachListeners(tabEl, tabId) {
    tabEl.addEventListener("dragstart", (e) => onDragStart(e, tabId));
    tabEl.addEventListener("dragover", (e) => onDragOver(e, tabId));
    tabEl.addEventListener("dragleave", onDragLeave);
    tabEl.addEventListener("drop", (e) => onDrop(e, tabId));
    tabEl.addEventListener("dragend", onDragEnd);
  }
  function detachListeners(tabEl) {
    const clone = tabEl.cloneNode(true);
    tabEl.parentNode?.replaceChild(clone, tabEl);
    return clone;
  }
  return {
    attachListeners,
    detachListeners,
    cleanup,
    get draggedTabId() {
      return _draggedTabId;
    },
    get dragOverTabId() {
      return _dragOverTabId;
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { handlerReady: true } };
}
var drag_drop_default = { createDragDropHandler, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createDragDropHandler,
  drag_drop_default as default,
  healthCheck,
  info
};
