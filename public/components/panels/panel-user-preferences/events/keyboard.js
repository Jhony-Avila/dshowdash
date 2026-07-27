import { applyTheme, applyDensity } from "../theme-applier.js";
import { announce, showToast } from "./helpers.js";
import { cancelAutoSave, popUndo } from "./undo-autosave.js";
const MODULE_ID = "panel-user-preferences-keyboard";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _keyHandler = null;
let _abortController = null;
const setupKeyboardHandlers = (container, state, handlers) => {
  _abortController = new AbortController();
  _keyHandler = async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (state?.isDirty) {
        cancelAutoSave();
        if (typeof handlers?.saveAllChanges === "function") await handlers.saveAllChanges();
        showToast("Prefer\xEAncias salvas", "success");
        announce("Prefer\xEAncias salvas");
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      const undo = popUndo();
      if (undo) {
        if (typeof handlers?.markDirty === "function") handlers.markDirty(undo.key, undo.value);
        if (undo.key === "theme") applyTheme(undo.value);
        if (undo.key === "density") applyDensity(undo.value);
        showToast("Altera\xE7\xE3o desfeita", "info");
        announce("Desfeito");
      } else {
        showToast("Nada para desfazer", "info");
      }
      return;
    }
    if (e.key === "Escape") {
      const openModal = container.querySelector(".pup-modal-overlay.visible");
      if (openModal) {
        openModal.classList.remove("visible");
      } else if (state?.isDirty) {
        cancelAutoSave();
        if (typeof handlers?.discardChanges === "function") handlers.discardChanges();
        showToast("Altera\xE7\xF5es descartadas", "info");
        announce("Altera\xE7\xF5es descartadas");
      }
      return;
    }
  };
  document.addEventListener("keydown", _keyHandler, { signal: _abortController.signal });
};
const cleanupKeyboardHandlers = () => {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _keyHandler = null;
  }
};
const createKeyboardHandler = () => {
  return async (e) => {
    if (_keyHandler) await _keyHandler(e);
  };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var keyboard_default = { MODULE_ID, VERSION, setupKeyboardHandlers, cleanupKeyboardHandlers, createKeyboardHandler, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  cleanupKeyboardHandlers,
  createKeyboardHandler,
  keyboard_default as default,
  healthCheck,
  info,
  setupKeyboardHandlers
};
