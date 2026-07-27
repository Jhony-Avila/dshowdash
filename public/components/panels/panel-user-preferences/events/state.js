import { MAX_UNDO } from "./constants.js";
let _container = null;
let _state = null;
let _handlers = null;
let _pendingImportData = null;
let _pendingDeleteAction = null;
let _autoSaveTimeout = null;
let _draggedItem = null;
let _originalTheme = null;
let _undoStack = [];
function setContainer(c) {
  _container = c;
}
function setState(s) {
  _state = s;
}
function setHandlers(h) {
  _handlers = h;
}
function setOriginalTheme(t) {
  _originalTheme = t;
}
function setPendingImportData(d) {
  _pendingImportData = d;
}
function setPendingDeleteAction(a) {
  _pendingDeleteAction = a;
}
function setDraggedItem(i) {
  _draggedItem = i;
}
function setAutoSaveTimeout(t) {
  _autoSaveTimeout = t;
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
function resetState() {
  _container = null;
  _state = null;
  _handlers = null;
  _pendingImportData = null;
  _pendingDeleteAction = null;
  _autoSaveTimeout = null;
  _draggedItem = null;
  _originalTheme = null;
  _undoStack = [];
}
var state_default = { setContainer, setState, setHandlers, setOriginalTheme, setPendingImportData, setPendingDeleteAction, setDraggedItem, setAutoSaveTimeout, pushUndo, popUndo, clearUndoStack, resetState };
const MODULE_ID = "panels-panel-user-preferences-events-state";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  _autoSaveTimeout,
  _container,
  _draggedItem,
  _handlers,
  _originalTheme,
  _pendingDeleteAction,
  _pendingImportData,
  _state,
  _undoStack,
  clearUndoStack,
  state_default as default,
  healthCheck,
  info,
  popUndo,
  pushUndo,
  resetState,
  setAutoSaveTimeout,
  setContainer,
  setDraggedItem,
  setHandlers,
  setOriginalTheme,
  setPendingDeleteAction,
  setPendingImportData,
  setState
};
