import { getPort } from "../core/ports.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-renderer:event-binders";
const UARPS_EVENTS = Object.freeze({ MODAL_SHOW: "uarps:modal:show", MODAL_HIDE: "uarps:modal:hide" });
let _abortController = null;
let _listenerCount = 0;
let _eventBusCleanups = [];
function _ensureAbortController() {
  if (!_abortController) {
    _abortController = new AbortController();
  }
  return _abortController.signal;
}
function bindControlEvents(elements, controller, store, updateBulkUI) {
  const signal = _ensureAbortController();
  if (elements.search) {
    elements.search.addEventListener("input", (e) => {
      if (controller.setFilter) controller.setFilter({ search: e.target.value });
    }, { signal });
    _listenerCount++;
  }
  if (elements.filterType) {
    elements.filterType.addEventListener("change", (e) => {
      if (controller.setFilter) controller.setFilter({ type: e.target.value });
    }, { signal });
    _listenerCount++;
  }
  if (elements.filterStatus) {
    elements.filterStatus.addEventListener("change", (e) => {
      if (controller.setUserFilter) controller.setUserFilter({ status: e.target.value });
    }, { signal });
    _listenerCount++;
  }
  if (elements.sortUsers) {
    elements.sortUsers.addEventListener("change", (e) => {
      if (controller.setUserFilter) controller.setUserFilter({ sort: e.target.value });
    }, { signal });
    _listenerCount++;
  }
  if (elements.undoBtn) {
    elements.undoBtn.addEventListener("click", () => {
      if (controller.undo) controller.undo();
    }, { signal });
    _listenerCount++;
  }
  if (elements.redoBtn) {
    elements.redoBtn.addEventListener("click", () => {
      if (controller.redo) controller.redo();
    }, { signal });
    _listenerCount++;
  }
  if (elements.syncBtn) {
    elements.syncBtn.addEventListener("click", () => {
      if (controller.syncInventoryFromDOM) controller.syncInventoryFromDOM();
    }, { signal });
    _listenerCount++;
  }
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener("click", () => {
      if (controller.refresh) controller.refresh();
    }, { signal });
    _listenerCount++;
  }
}
function bindUserGridEvents(userGrid, controller) {
  if (!userGrid) return;
  const signal = _ensureAbortController();
  userGrid.addEventListener("click", (e) => {
    const userCard = e.target.closest("[data-user-id]");
    if (userCard && controller.selectUser) controller.selectUser(userCard.dataset.userId);
  }, { signal });
  _listenerCount++;
  userGrid.addEventListener("keydown", (e) => {
    const ke = e;
    if (ke.key === "Enter" || ke.key === " ") {
      const userCard = ke.target.closest("[data-user-id]");
      if (userCard) {
        ke.preventDefault();
        if (controller.selectUser) controller.selectUser(userCard.dataset.userId);
      }
    }
  }, { signal });
  _listenerCount++;
}
function bindMatrixEvents(matrix, controller, store, updateBulkUI) {
  if (!matrix) return;
  const signal = _ensureAbortController();
  matrix.addEventListener("click", (e) => {
    const checkbox = e.target.closest(".uarps-checkbox");
    if (checkbox && checkbox.dataset.triggerId) {
      if (controller.toggleBulkItem) controller.toggleBulkItem(checkbox.dataset.triggerId);
      updateBulkUI();
      return;
    }
    if (checkbox && checkbox.dataset.area) {
      if (controller.selectAllInArea) controller.selectAllInArea(checkbox.dataset.area);
      updateBulkUI();
      return;
    }
    const dot = e.target.closest(".uarps-minimap__dot");
    if (dot && dot.dataset.triggerId) {
      if (controller.toggleTrigger) controller.toggleTrigger(dot.dataset.triggerId);
      return;
    }
    const cell = e.target.closest("[data-trigger-id]");
    if (cell && !checkbox) {
      if (store.isBulkMode && store.isBulkMode()) {
        if (controller.toggleBulkItem) controller.toggleBulkItem(cell.dataset.triggerId || "");
        updateBulkUI();
      } else {
        if (controller.toggleTrigger) controller.toggleTrigger(cell.dataset.triggerId || "");
      }
      return;
    }
    const regionCell = e.target.closest("[data-region-id]");
    if (regionCell && controller.toggleRegion) controller.toggleRegion(regionCell.dataset.regionId || "");
  }, { signal });
  _listenerCount++;
  matrix.addEventListener("keydown", (e) => {
    const ke = e;
    if (ke.key === "Enter" || ke.key === " ") {
      const cell = ke.target.closest("[data-trigger-id]");
      if (cell) {
        ke.preventDefault();
        if (controller.toggleTrigger) controller.toggleTrigger(cell.dataset.triggerId || "");
      }
    }
  }, { signal });
  _listenerCount++;
}
function bindUserFocusEvents(userFocus, controller) {
  if (!userFocus) return;
  const signal = _ensureAbortController();
  userFocus.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    const action = actionEl ? actionEl.dataset.action : null;
    if (action === "grant-all-triggers") {
      if (controller.grantAllTriggers) controller.grantAllTriggers();
    } else if (action === "revoke-all-triggers") {
      if (controller.revokeAllTriggers) controller.revokeAllTriggers();
    }
  }, { signal });
  _listenerCount++;
}
function bindViewToggleEvents(container, controller, updateViewToggle, renderMatrix) {
  const viewBtns = container.querySelectorAll("[data-view]");
  const signal = _ensureAbortController();
  for (let i = 0; i < viewBtns.length; i++) {
    ((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view || "";
        if (controller.setView) controller.setView(view);
        updateViewToggle(view);
        renderMatrix();
      }, { signal });
      _listenerCount++;
    })(viewBtns[i]);
  }
}
function bindBulkActionEvents(container, controller, updateBulkUI) {
  const signal = _ensureAbortController();
  const bulkGrantBtn = container.querySelector('[data-action="bulk-grant"]');
  if (bulkGrantBtn) {
    bulkGrantBtn.addEventListener("click", () => {
      if (controller.bulkGrant) controller.bulkGrant();
    }, { signal });
    _listenerCount++;
  }
  const bulkRevokeBtn = container.querySelector('[data-action="bulk-revoke"]');
  if (bulkRevokeBtn) {
    bulkRevokeBtn.addEventListener("click", () => {
      if (controller.bulkRevoke) controller.bulkRevoke();
    }, { signal });
    _listenerCount++;
  }
  const bulkClearBtn = container.querySelector('[data-action="bulk-clear"]');
  if (bulkClearBtn) {
    bulkClearBtn.addEventListener("click", () => {
      if (controller.clearBulk) controller.clearBulk();
      updateBulkUI();
    }, { signal });
    _listenerCount++;
  }
}
function bindModalEvents(container, elements, controller) {
  const signal = _ensureAbortController();
  const closeModalBtns = container.querySelectorAll('[data-action="modal-close"], [data-action="modal-cancel"]');
  for (let j = 0; j < closeModalBtns.length; j++) {
    closeModalBtns[j].addEventListener("click", () => {
      if (controller.cancelModal) controller.cancelModal();
    }, { signal });
    _listenerCount++;
  }
  const confirmBtn = container.querySelector('[data-action="modal-confirm"]');
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const reason = elements.modalReason ? elements.modalReason.value : "";
      if (controller.confirmModal) controller.confirmModal(reason);
    }, { signal });
    _listenerCount++;
  }
  if (elements.modalReason) {
    elements.modalReason.addEventListener("input", (e) => {
      const hasReason = e.target.value.trim().length > 0;
      if (elements.modalConfirm) elements.modalConfirm.disabled = !hasReason;
    }, { signal });
    _listenerCount++;
  }
}
function bindGlobalEvents(showModal, hideModal) {
  const eventBus = getPort("eventBus");
  if (!eventBus || !eventBus.on) return [];
  eventBus.on(UARPS_EVENTS.MODAL_SHOW, showModal);
  eventBus.on(UARPS_EVENTS.MODAL_HIDE, hideModal);
  const cleanupShow = () => {
    const eb = getPort("eventBus");
    if (eb && eb.off) eb.off(UARPS_EVENTS.MODAL_SHOW, showModal);
  };
  const cleanupHide = () => {
    const eb = getPort("eventBus");
    if (eb && eb.off) eb.off(UARPS_EVENTS.MODAL_HIDE, hideModal);
  };
  _eventBusCleanups.push(cleanupShow, cleanupHide);
  return [cleanupShow, cleanupHide];
}
function unbindAll() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
  _eventBusCleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _eventBusCleanups = [];
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, eventBusCleanups: _eventBusCleanups.length, hasAbortController: _abortController !== null };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      bindersReady: typeof bindControlEvents === "function",
      cleanupAvailable: typeof unbindAll === "function",
      listenersTracked: _abortController !== null || _listenerCount === 0
    }
  };
}
var event_binders_default = { bindControlEvents, bindUserGridEvents, bindMatrixEvents, bindUserFocusEvents, bindViewToggleEvents, bindBulkActionEvents, bindModalEvents, bindGlobalEvents, unbindAll, UARPS_EVENTS, info, healthCheck };
export {
  MODULE_ID,
  UARPS_EVENTS,
  VERSION,
  bindBulkActionEvents,
  bindControlEvents,
  bindGlobalEvents,
  bindMatrixEvents,
  bindModalEvents,
  bindUserFocusEvents,
  bindUserGridEvents,
  bindViewToggleEvents,
  event_binders_default as default,
  healthCheck,
  info,
  unbindAll
};
