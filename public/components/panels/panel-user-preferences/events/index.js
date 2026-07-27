import { setContainer, setState, setHandlers, setOriginalTheme, resetState } from "./state.js";
import { cancelAutoSave } from "./utils.js";
import { createKeyboardHandler } from "./keyboard.js";
import { setupThemeHandlers, setupDensityHandlers, setupToggleHandlers, setupDragDropHandlers, setupActionHandlers, setupCustomThemeHandlers } from "./handlers.js";
let _abortController = null;
function setupEventHandlers(container, state, handlers) {
  if (!container) return;
  setContainer(container);
  setState(state);
  setHandlers(handlers);
  setOriginalTheme(state?.preferences?.theme || "dark");
  _abortController = new AbortController();
  const keyHandler = createKeyboardHandler();
  document.addEventListener("keydown", keyHandler, { signal: _abortController.signal });
  container._cleanupKeyHandler = () => {
    if (_abortController) {
      _abortController.abort();
      _abortController = null;
    }
  };
  setupThemeHandlers(container);
  setupDensityHandlers(container);
  setupToggleHandlers(container);
  setupDragDropHandlers(container);
  setupActionHandlers(container);
  setupCustomThemeHandlers(container);
}
function cleanup() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  cancelAutoSave();
  resetState();
}
var events_default = { setupEventHandlers, cleanup };
const MODULE_ID = "panels-panel-user-preferences-events-index";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  cleanup,
  events_default as default,
  healthCheck,
  info,
  setupEventHandlers
};
