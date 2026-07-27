import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { showToast } from "./helpers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences.events.undo-autosave";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const AUTO_SAVE_DELAY = 3e3;
const MAX_UNDO = 10;
let _autoSaveTimeout = null;
let _undoStack = [];
function scheduleAutoSave(state, handlers) {
  cancelAutoSave();
  _autoSaveTimeout = setTimeout(() => {
    if (state?.isDirty && handlers?.saveAllChanges) {
      const logger = _getPort("logger");
      logger?.log?.("[Events] Auto-save triggered");
      handlers.saveAllChanges().then(() => showToast("Altera\xE7\xF5es salvas automaticamente", "info"));
    }
  }, AUTO_SAVE_DELAY);
}
function cancelAutoSave() {
  if (_autoSaveTimeout) {
    clearTimeout(_autoSaveTimeout);
    _autoSaveTimeout = null;
  }
}
function pushUndo(key, oldValue) {
  _undoStack.push({ key, value: oldValue, timestamp: Date.now() });
  if (_undoStack.length > MAX_UNDO) _undoStack.shift();
}
function popUndo() {
  return _undoStack.pop();
}
function clearUndoStack() {
  _undoStack = [];
}
function getUndoStackSize() {
  return _undoStack.length;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), undoStackSize: _undoStack.length };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { undoReady: true } };
}
var undo_autosave_default = { VERSION, MODULE_ID, scheduleAutoSave, cancelAutoSave, pushUndo, popUndo, clearUndoStack, getUndoStackSize, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cancelAutoSave,
  clearUndoStack,
  undo_autosave_default as default,
  getPorts,
  getUndoStackSize,
  healthCheck,
  info,
  injectPorts,
  popUndo,
  pushUndo,
  scheduleAutoSave
};
