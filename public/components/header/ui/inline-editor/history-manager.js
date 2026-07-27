const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/ui/inline-editor/history-manager";
function createHistoryManager(options) {
  options = options || {};
  const maxSize = options.maxSize || 20;
  let _undoStack = [];
  let _redoStack = [];
  const _changeHistory = [];
  return {
    push(state) {
      _undoStack.push(JSON.parse(JSON.stringify(state)));
      _redoStack = [];
      if (_undoStack.length > maxSize) {
        _undoStack.shift();
      }
      _changeHistory.push({ action: "push", timestamp: Date.now(), stateLength: state.length });
    },
    undo(currentState) {
      if (_undoStack.length === 0) {
        return { success: false };
      }
      _redoStack.push(JSON.parse(JSON.stringify(currentState)));
      const previousState = _undoStack.pop();
      _changeHistory.push({ action: "undo", timestamp: Date.now() });
      return { success: true, state: previousState };
    },
    redo(currentState) {
      if (_redoStack.length === 0) {
        return { success: false };
      }
      _undoStack.push(JSON.parse(JSON.stringify(currentState)));
      const nextState = _redoStack.pop();
      _changeHistory.push({ action: "redo", timestamp: Date.now() });
      return { success: true, state: nextState };
    },
    canUndo() {
      return _undoStack.length > 0;
    },
    canRedo() {
      return _redoStack.length > 0;
    },
    clearAll() {
      _undoStack = [];
      _redoStack = [];
    },
    getStats() {
      return {
        undoStackSize: _undoStack.length,
        redoStackSize: _redoStack.length,
        changeHistorySize: _changeHistory.length
      };
    },
    getChangeHistory() {
      return _changeHistory.slice();
    }
  };
}
var history_manager_default = { VERSION, createHistoryManager };
export {
  MODULE_ID,
  VERSION,
  createHistoryManager,
  history_manager_default as default
};
