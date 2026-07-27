// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-preferences-events-state
// PURPOSE: Panel User Preferences Events - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAX_UNDO from ./constants.js
//
// PROVIDES:
//   _container — exported value
//   _state — exported value
//   _handlers — exported value
//   _pendingImportData — exported value
//   _pendingDeleteAction — exported value
//   _autoSaveTimeout — exported value
//   _draggedItem — exported value
//   _originalTheme — exported value
//   _undoStack — exported value
//   setContainer() — exported function
//   setState() — exported function
//   setHandlers() — exported function
//   setOriginalTheme() — exported function
//   setPendingImportData() — exported function
//   setPendingDeleteAction() — exported function
//   ... and 10 more exports
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

import { MAX_UNDO } from './constants.js';

export let _container: Element | null = null;
export let _state: Record<string, unknown> | null = null;
export let _handlers: Record<string, unknown> | null = null;
export let _pendingImportData: Record<string, unknown> | null = null;
export let _pendingDeleteAction: Record<string, unknown> | null = null;
export let _autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
export let _draggedItem: Element | null = null;
export let _originalTheme: string | null = null;
export let _undoStack: Array<{ key: string; value: unknown; timestamp: number }> = [];

export function setContainer(c: Element | null) { _container = c; }
export function setState(s: Record<string, unknown> | null) { _state = s; }
export function setHandlers(h: Record<string, unknown> | null) { _handlers = h; }
export function setOriginalTheme(t: string | null) { _originalTheme = t; }
export function setPendingImportData(d: Record<string, unknown> | null) { _pendingImportData = d; }
export function setPendingDeleteAction(a: Record<string, unknown> | null) { _pendingDeleteAction = a; }
export function setDraggedItem(i: Element | null) { _draggedItem = i; }
export function setAutoSaveTimeout(t: ReturnType<typeof setTimeout> | null) { _autoSaveTimeout = t; }

export function pushUndo(key: string, oldValue: unknown) { _undoStack.push({ key, value: oldValue, timestamp: Date.now() }); if (_undoStack.length > MAX_UNDO) _undoStack.shift(); }
export function popUndo() { return _undoStack.pop(); }
export function clearUndoStack() { _undoStack = []; }

export function resetState() {
  _container = null; _state = null; _handlers = null;
  _pendingImportData = null; _pendingDeleteAction = null;
  _autoSaveTimeout = null; _draggedItem = null; _originalTheme = null;
  _undoStack = [];
}

export default { setContainer, setState, setHandlers, setOriginalTheme, setPendingImportData, setPendingDeleteAction, setDraggedItem, setAutoSaveTimeout, pushUndo, popUndo, clearUndoStack, resetState };

export const MODULE_ID = 'panels-panel-user-preferences-events-state';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true } }; }
