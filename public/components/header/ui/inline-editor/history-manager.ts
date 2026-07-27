// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/inline-editor/history-manager
// PURPOSE: Undo/redo stack manager for inline editor state
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   createHistoryManager(options) — factory returning undo/redo manager
// ═══════════════════════════════════════════════════════════════
// Inline Editor - History Manager
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B04: var → const/let
// Gerencia undo/redo do editor
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/ui/inline-editor/history-manager';

export function createHistoryManager(options: Record<string,unknown>) {
  options = options || {};
  const maxSize = options.maxSize || 20;
  
  // @ts-expect-error strict migration — TS7034
  let _undoStack = [];
  // @ts-expect-error strict migration — TS7034
  let _redoStack = [];
  // @ts-expect-error strict migration — TS7034
  const _changeHistory = [];
  
  return {
    push(state: Record<string,unknown>) {
      _undoStack.push(JSON.parse(JSON.stringify(state)));
      _redoStack = [];
      // @ts-expect-error TS migration - TS2365
      if (_undoStack.length > maxSize) {
        // @ts-expect-error strict migration — TS7005
        _undoStack.shift();
      }
      _changeHistory.push({ action: 'push', timestamp: Date.now(), stateLength: state.length });
    },
    
    undo(currentState: string) {
      if (_undoStack.length === 0) {
        return { success: false };
      }
      _redoStack.push(JSON.parse(JSON.stringify(currentState)));
      // @ts-expect-error strict migration — TS7005
      const previousState = _undoStack.pop();
      _changeHistory.push({ action: 'undo', timestamp: Date.now() });
      return { success: true, state: previousState };
    },
    
    redo(currentState: string) {
      if (_redoStack.length === 0) {
        return { success: false };
      }
      _undoStack.push(JSON.parse(JSON.stringify(currentState)));
      // @ts-expect-error strict migration — TS7005
      const nextState = _redoStack.pop();
      _changeHistory.push({ action: 'redo', timestamp: Date.now() });
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
      // @ts-expect-error strict migration — TS7005
      return _changeHistory.slice();
    }
  };
}

export default { VERSION, createHistoryManager };
