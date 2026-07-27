// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-ui-inline-editor-history-manager
// PURPOSE: Inline Editor - History Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createHistoryManager() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'header-ui-inline-editor-history-manager';

let _metrics = { pushes: 0, undos: 0, redos: 0 };

export function createHistoryManager(options: { maxSize?: number } = {}) {
  const maxSize = options.maxSize || 20;
  // @ts-expect-error strict migration — TS7034
  let undoStack = [];
  // @ts-expect-error strict migration — TS7034
  let redoStack = [];
  // @ts-expect-error strict migration — TS7034
  let changeHistory = [];

  // @ts-expect-error TS migration - TS7005, TS2349
  function push(state: Record<string,unknown>) { _metrics.pushes++; undoStack.push(state); if (undoStack.length > maxSize) undoStack.shift(); redoStack = []; changeHistory.push({ timestamp: Date.now(), state: state.slice ? state.slice() : { ...state } }); if (changeHistory.length > maxSize) changeHistory.shift(); }
  // @ts-expect-error strict migration — TS7005
  function undo(currentState: string) { if (undoStack.length === 0) return { success: false, state: null }; _metrics.undos++; redoStack.push(currentState); return { success: true, state: undoStack.pop() }; }
  // @ts-expect-error strict migration — TS7005
  function redo(currentState: string) { if (redoStack.length === 0) return { success: false, state: null }; _metrics.redos++; undoStack.push(currentState); return { success: true, state: redoStack.pop() }; }
  function canUndo() { return undoStack.length > 0; }
  function canRedo() { return redoStack.length > 0; }
  function clear() { undoStack = []; redoStack = []; }
  function clearAll() { undoStack = []; redoStack = []; changeHistory = []; }
  function getUndoStackSize() { return undoStack.length; }
  function getRedoStackSize() { return redoStack.length; }
  // @ts-expect-error strict migration — TS7005
  function getChangeHistory() { return [...changeHistory]; }
  function getStats() { return { undoStackSize: undoStack.length, redoStackSize: redoStack.length, changeHistorySize: changeHistory.length, maxSize }; }

  return { push, undo, redo, canUndo, canRedo, clear, clearAll, getUndoStackSize, getRedoStackSize, getChangeHistory, getStats };
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { historyReady: true }, metrics: getMetrics() }; }

export default { createHistoryManager, getMetrics, info, healthCheck };
