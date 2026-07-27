import { Icons } from "./icons.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-renderer:ui-updates";
function updateUndoRedoButtons(elements, store) {
  if (elements.undoBtn) {
    elements.undoBtn.disabled = store.canUndo ? !store.canUndo() : true;
    const undoCount = store.getUndoCount ? store.getUndoCount() : 0;
    elements.undoBtn.dataset.tooltip = undoCount > 0 ? `Desfazer (${undoCount})` : "Nada para desfazer";
  }
  if (elements.redoBtn) {
    elements.redoBtn.disabled = store.canRedo ? !store.canRedo() : true;
    const redoCount = store.getRedoCount ? store.getRedoCount() : 0;
    elements.redoBtn.dataset.tooltip = redoCount > 0 ? `Refazer (${redoCount})` : "Nada para refazer";
  }
}
function updateBulkUI(elements, store) {
  const count = store.getBulkCount ? store.getBulkCount() : 0;
  if (elements.bulkActions) {
    elements.bulkActions.style.display = count > 0 ? "flex" : "none";
    const countEl = elements.bulkActions.querySelector(".uarps-bulk-count");
    if (countEl) countEl.textContent = `${count} selecionado${count !== 1 ? "s" : ""}`;
  }
}
function updateViewToggle(container, activeView) {
  if (!container) return;
  const btns = container.querySelectorAll("[data-view]");
  for (let i = 0; i < btns.length; i++) {
    const btn = btns[i];
    if (btn.dataset.view === activeView) btn.classList.add("uarps-btn--active");
    else btn.classList.remove("uarps-btn--active");
  }
}
function updateCacheIndicator(elements, store) {
  if (!elements.cache) return;
  const age = store.getCacheAge ? store.getCacheAge() : 0;
  if (age) {
    const mins = Math.floor(age / 6e4);
    elements.cache.textContent = mins < 1 ? "Cache: agora" : `Cache: ${mins}m atr\xE1s`;
  } else {
    elements.cache.textContent = "";
  }
}
function showModal(elements, title, message, requireReason) {
  if (!elements.modal) return;
  if (elements.modalTitle) elements.modalTitle.innerHTML = `${Icons.alertTriangle || ""} ${title}`;
  if (elements.modalBody) elements.modalBody.innerHTML = `<p>${message}</p>`;
  if (elements.modalReason) {
    elements.modalReason.value = "";
    if (elements.modalReason.parentElement) elements.modalReason.parentElement.style.display = requireReason ? "block" : "none";
  }
  if (elements.modalConfirm) elements.modalConfirm.disabled = requireReason;
  elements.modal.style.display = "flex";
}
function hideModal(elements) {
  if (elements.modal) elements.modal.style.display = "none";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var ui_updates_default = { updateUndoRedoButtons, updateBulkUI, updateViewToggle, updateCacheIndicator, showModal, hideModal };
export {
  MODULE_ID,
  VERSION,
  ui_updates_default as default,
  hideModal,
  info,
  showModal,
  updateBulkUI,
  updateCacheIndicator,
  updateUndoRedoButtons,
  updateViewToggle
};
