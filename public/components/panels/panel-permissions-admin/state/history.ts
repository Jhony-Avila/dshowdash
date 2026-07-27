// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-history
// PURPOSE: UARPS Admin - History (Undo/Redo)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   notify, getUserPermissions, setUserPermissions from ./core.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   saveToHistory() — exported function
//   saveCurrentToHistory() — exported function
//   canUndo() — exported function
//   canRedo() — exported function
//   getUndoCount() — exported function
//   getRedoCount() — exported function
//   undo() — exported function
//   redo() — exported function
//   clearHistory() — exported function
//   resetHistory() — exported function
//   getHistoryInfo() — exported function
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

import { notify, getUserPermissions, setUserPermissions } from './core.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-history';

const MAX_HISTORY = 50;
interface HistorySnapshot {
  action: string;
  timestamp: number;
  userId: string | number;
  permissions: string | null;
}

let _undoStack: HistorySnapshot[] = [];
let _redoStack: HistorySnapshot[] = [];

export function saveToHistory(action: string, userId: string | number, permissions: unknown) {
    const snapshot = { action, timestamp: Date.now(), userId, permissions: permissions ? JSON.stringify(permissions) : null };
    _undoStack.push(snapshot);
    if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
    _redoStack = [];
    notify('history');
}

export function saveCurrentToHistory(action: string, userId: string | number) { if (!userId) return; const perms = getUserPermissions(userId); saveToHistory(action, userId, perms); }

export function canUndo() { return _undoStack.length > 0; }
export function canRedo() { return _redoStack.length > 0; }
export function getUndoCount() { return _undoStack.length; }
export function getRedoCount() { return _redoStack.length; }

export function undo() {
    if (!canUndo()) return false;
    const snapshot = _undoStack.pop();
    if (snapshot?.permissions && snapshot.userId) {
        const currentPerms = JSON.stringify(getUserPermissions(snapshot.userId));
        _redoStack.push({ action: 'redo', timestamp: Date.now(), userId: snapshot.userId, permissions: currentPerms });
        const perms = JSON.parse(snapshot.permissions);
        setUserPermissions(snapshot.userId, perms);
        notify('history');
        return true;
    }
    return false;
}

export function redo() {
    if (!canRedo()) return false;
    const snapshot = _redoStack.pop();
    if (snapshot?.permissions && snapshot.userId) {
        const currentPerms = JSON.stringify(getUserPermissions(snapshot.userId));
        _undoStack.push({ action: 'undo', timestamp: Date.now(), userId: snapshot.userId, permissions: currentPerms });
        const perms = JSON.parse(snapshot.permissions);
        setUserPermissions(snapshot.userId, perms);
        notify('history');
        return true;
    }
    return false;
}

export function clearHistory() { _undoStack = []; _redoStack = []; notify('history'); }
export function resetHistory() { _undoStack = []; _redoStack = []; }
export function getHistoryInfo() { return { undoCount: _undoStack.length, redoCount: _redoStack.length, maxHistory: MAX_HISTORY }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { undoStackReady: Array.isArray(_undoStack), redoStackReady: Array.isArray(_redoStack) } }; }
