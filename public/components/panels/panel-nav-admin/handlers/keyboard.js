import * as crud from "./crud.js";
import * as uiActions from "./ui-actions.js";
import { PANEL_ID } from "../core/contracts.js";
import { clearEditState } from "./inline-edit.js";
const MODULE_ID = "panel-nav-admin-handlers-keyboard";
const VERSION = "11.7.0-ESCAPE-EDIT";
function createKeyboardHandlers(deps) {
  const { container, refs, scheduler } = deps;
  function handleGlobalKeydown(e) {
    if (!container) return;
    const activeEl = document.activeElement;
    if (!activeEl || !activeEl.closest || !activeEl.closest(`[data-panel-id="${PANEL_ID}"]`)) return;
    const isInputFocused = ["INPUT", "TEXTAREA", "SELECT"].indexOf(e.target?.tagName) !== -1;
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      clearEditState();
      uiActions.closeAllModals(container);
      if (refs?.quickActions) refs.quickActions.classList.remove("open");
      if (refs?.searchWrapper) refs.searchWrapper.classList.remove("has-results");
      return;
    }
    if (isInputFocused) return;
    if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      scheduler.refresh();
      return;
    }
    if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      crud.openItemForm(container);
      return;
    }
    if (e.key === "/") {
      e.preventDefault();
      if (refs?.filterSearch) refs.filterSearch.focus();
      return;
    }
    if (e.key === "?" && e.shiftKey) {
      e.preventDefault();
      return;
    }
  }
  function handleInputKeydown(e) {
    if (e.key === "Enter" && e.target?.dataset?.input === "validate-route") {
      e.preventDefault();
      return { action: "validate-route" };
    }
    if (e.key === "Escape" && refs?.searchWrapper?.classList.contains("has-results")) {
      refs.searchWrapper.classList.remove("has-results");
      return { action: "close-autocomplete" };
    }
    return null;
  }
  return { handleGlobalKeydown, handleInputKeydown };
}
const KEYBOARD_SHORTCUTS = {
  "r": "Atualizar dados (refresh)",
  "n": "Novo item (abrir formul\xE1rio)",
  "/": "Focar busca",
  "Escape": "Cancelar edi\xE7\xE3o ativa / Fechar modais",
  "Ctrl+S": "Salvar (prevenido)",
  "?": "Mostrar atalhos"
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { keyboardReady: true } };
}
export {
  KEYBOARD_SHORTCUTS,
  MODULE_ID,
  VERSION,
  createKeyboardHandlers,
  healthCheck,
  info
};
