const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "header-ui-inline-editor-history-manager";
let _metrics = { pushes: 0, undos: 0, redos: 0 };
function createHistoryManager(options = {}) {
  const maxSize = options.maxSize || 20;
  let undoStack = [];
  let redoStack = [];
  let changeHistory = [];
  function push(state) {
    _metrics.pushes++;
    undoStack.push(state);
    if (undoStack.length > maxSize) undoStack.shift();
    redoStack = [];
    changeHistory.push({ timestamp: Date.now(), state: state.slice ? state.slice() : { ...state } });
    if (changeHistory.length > maxSize) changeHistory.shift();
  }
  function undo(currentState) {
    if (undoStack.length === 0) return { success: false, state: null };
    _metrics.undos++;
    redoStack.push(currentState);
    return { success: true, state: undoStack.pop() };
  }
  function redo(currentState) {
    if (redoStack.length === 0) return { success: false, state: null };
    _metrics.redos++;
    undoStack.push(currentState);
    return { success: true, state: redoStack.pop() };
  }
  function canUndo() {
    return undoStack.length > 0;
  }
  function canRedo() {
    return redoStack.length > 0;
  }
  function clear() {
    undoStack = [];
    redoStack = [];
  }
  function clearAll() {
    undoStack = [];
    redoStack = [];
    changeHistory = [];
  }
  function getUndoStackSize() {
    return undoStack.length;
  }
  function getRedoStackSize() {
    return redoStack.length;
  }
  function getChangeHistory() {
    return [...changeHistory];
  }
  function getStats() {
    return { undoStackSize: undoStack.length, redoStackSize: redoStack.length, changeHistorySize: changeHistory.length, maxSize };
  }
  return { push, undo, redo, canUndo, canRedo, clear, clearAll, getUndoStackSize, getRedoStackSize, getChangeHistory, getStats };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { historyReady: true }, metrics: getMetrics() };
}
var history_manager_default = { createHistoryManager, getMetrics, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createHistoryManager,
  history_manager_default as default,
  getMetrics,
  healthCheck,
  info
};
