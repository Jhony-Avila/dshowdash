import * as persist from "../state/persist.js";
import { showConfirmModal, showCustomModal as closeAdapterModal } from "/components/overlay-layer/adapters/modal-adapter.js";
const MODULE_ID = "panel-12-ui-modals";
const VERSION = "9.3.0-P2-ENTERPRISE";
let modalOpen = false;
let lastFocusedElement = null;
function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
function showConfirm(title, message, onConfirm, pausePollingCallback) {
  if (pausePollingCallback) pausePollingCallback(6e4);
  lastFocusedElement = document.activeElement;
  modalOpen = true;
  return showConfirmModal({
    id: "panel-12-confirm",
    title,
    message,
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    danger: false,
    scope: "panel-12"
  }).then((confirmed) => {
    if (confirmed && onConfirm) onConfirm();
  }).finally(() => {
    modalOpen = false;
    if (lastFocusedElement && lastFocusedElement.isConnected) {
      lastFocusedElement.focus();
    } else {
      const searchInput = document.querySelector("#painel-12 #search-input-painel-12");
      if (searchInput) searchInput.focus();
    }
  });
}
function showColumnSelector(allColumns, onApply, pausePollingCallback, showToast) {
  const container = document.querySelector("#painel-12");
  if (!container) return Promise.resolve();
  const visibleColumns = persist.getVisibleColumns();
  if (pausePollingCallback) pausePollingCallback(6e4);
  lastFocusedElement = document.activeElement;
  modalOpen = true;
  const columnListHTML = Object.keys(allColumns).map((key) => {
    const col = allColumns[key];
    const isChecked = visibleColumns.indexOf(key) !== -1;
    const isRequired = key === "id" || key === "job_name";
    return `<label class="painel-12-column-item" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;cursor:pointer;"><input type="checkbox" value="${key}"${isChecked ? " checked" : ""}${isRequired ? " disabled" : ""} style="width:18px;height:18px;accent-color:#3B82F6;"><span style="color:rgba(255,255,255,0.9);">${col.label}</span>${isRequired ? '<small style="color:#F59E0B;">(obrigat\xF3rio)</small>' : ""}</label>`;
  }).join("");
  const bodyHTML = `<p style="color:rgba(255,255,255,0.7);margin-bottom:1rem;">Marque as colunas que deseja visualizar na tabela:</p><div class="painel-12-column-list" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:0.25rem;">${columnListHTML}</div>`;
  return showCustomModal({
    id: "panel-12-column-selector",
    title: "Selecionar Colunas",
    bodyHTML,
    buttons: [
      { id: "reset", text: "Restaurar Padr\xE3o", variant: "secondary", action: "reset" },
      { id: "apply", text: "Aplicar", variant: "primary", action: "apply" }
    ],
    scope: "panel-12",
    onBeforeClose(action, modalEl) {
      if (action === "apply") {
        const checkboxes = modalEl.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkboxes).map((cb) => cb.value);
        if (selected.length === 0) {
          if (showToast) showToast("Selecione pelo menos uma coluna", "error");
          return false;
        }
        onApply(selected, false);
        if (showToast) showToast("Colunas atualizadas!", "success");
      } else if (action === "reset") {
        onApply(null, true);
        if (showToast) showToast("Colunas restauradas para o padr\xE3o", "success");
      }
      return true;
    }
  }).finally(() => {
    modalOpen = false;
    if (lastFocusedElement && lastFocusedElement.isConnected) {
      lastFocusedElement.focus();
    } else {
      const searchInput = container.querySelector("#search-input-painel-12");
      if (searchInput) searchInput.focus();
    }
  });
}
function isOpen() {
  return modalOpen;
}
function cleanup() {
  closeAdapterModal("panel-12-confirm", "cleanup");
  closeAdapterModal("panel-12-column-selector", "cleanup");
  modalOpen = false;
  lastFocusedElement = null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modalOpen };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { modalsReady: true } };
}
var modals_default = { showConfirm, showColumnSelector, isOpen, cleanup, info };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  modals_default as default,
  healthCheck,
  info,
  isOpen,
  showColumnSelector,
  showConfirm
};
