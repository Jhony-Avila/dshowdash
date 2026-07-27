// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.events.undo-autosave
// PURPOSE: Panel User Preferences - Undo & AutoSave
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   showToast from ./helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   scheduleAutoSave() — exported function
//   cancelAutoSave() — exported function
//   pushUndo() — exported function
//   popUndo() — exported function
//   clearUndoStack() — exported function
//   getUndoStackSize() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { showToast } from './helpers.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-user-preferences.events.undo-autosave';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: unknown) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const AUTO_SAVE_DELAY = 3000;
const MAX_UNDO = 10;

let _autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
let _undoStack: Array<{ key: string; value: unknown; timestamp: number }> = [];

function scheduleAutoSave(state: Record<string, unknown>, handlers: Record<string, unknown>) {
    cancelAutoSave();
    _autoSaveTimeout = setTimeout(() => {
        if (state?.isDirty && handlers?.saveAllChanges) {
            const logger = _getPort('logger');
            logger?.log?.('[Events] Auto-save triggered');
            (handlers.saveAllChanges as () => Promise<void>)().then(() => showToast('Alterações salvas automaticamente', 'info'));
        }
    }, AUTO_SAVE_DELAY);
}

function cancelAutoSave() {
    if (_autoSaveTimeout) {
        clearTimeout(_autoSaveTimeout);
        _autoSaveTimeout = null;
    }
}

function pushUndo(key: string, oldValue: unknown) {
    _undoStack.push({ key, value: oldValue, timestamp: Date.now() });
    if (_undoStack.length > MAX_UNDO) _undoStack.shift();
}

function popUndo() { return _undoStack.pop(); }
function clearUndoStack() { _undoStack = []; }
function getUndoStackSize() { return _undoStack.length; }

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), undoStackSize: _undoStack.length }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { undoReady: true } }; }

export { VERSION, MODULE_ID, scheduleAutoSave, cancelAutoSave, pushUndo, popUndo, clearUndoStack, getUndoStackSize, info, healthCheck, injectPorts, getPorts };
export default { VERSION, MODULE_ID, scheduleAutoSave, cancelAutoSave, pushUndo, popUndo, clearUndoStack, getUndoStackSize, info, healthCheck, injectPorts, getPorts };
