// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-bulk
// PURPOSE: UARPS Admin - Bulk Selection
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _getState, notify, getUserPermissions, setUserPermissions from ./core.js
//   saveCurrentToHistory from ./history.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getBulkSelection() — exported function
//   getBulkCount() — exported function
//   isBulkMode() — exported function
//   setBulkMode() — exported function
//   toggleBulkMode() — exported function
//   addToBulk() — exported function
//   removeFromBulk() — exported function
//   toggleBulkItem() — exported function
//   selectAllBulk() — exported function
//   clearBulk() — exported function
//   bulkGrant() — exported function
//   bulkRevoke() — exported function
//   info() — exported function
//   ... and 1 more exports
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

import { _getState, notify, getUserPermissions, setUserPermissions } from './core.js';
import { saveCurrentToHistory } from './history.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-bulk';

export function getBulkSelection() { const sel = _getState().bulkSelection; const result = new Set(); sel.forEach((v) => result.add(v)); return result; }
export function getBulkCount() { return _getState().bulkSelection.size; }
export function isBulkMode() { return _getState().bulkMode; }

export function setBulkMode(enabled: boolean) { const state = _getState(); state.bulkMode = !!enabled; if (!enabled) state.bulkSelection.clear(); notify('bulk'); }
export function toggleBulkMode() { setBulkMode(!isBulkMode()); }
export function addToBulk(triggerId: string) { _getState().bulkSelection.add(triggerId); notify('bulk'); }
export function removeFromBulk(triggerId: string) { _getState().bulkSelection.delete(triggerId); notify('bulk'); }
export function toggleBulkItem(triggerId: string) { const selection = _getState().bulkSelection; if (selection.has(triggerId)) selection.delete(triggerId); else selection.add(triggerId); notify('bulk'); }
export function selectAllBulk(triggerIds: string[]) { const selection = _getState().bulkSelection; triggerIds.forEach((id: string) => selection.add(id)); notify('bulk'); }
export function clearBulk() { _getState().bulkSelection.clear(); notify('bulk'); }

export function bulkGrant(userId: string | number) {
    const state = _getState();
    if (!userId || state.bulkSelection.size === 0) return 0;
    saveCurrentToHistory('bulk-grant', userId);
    const perms = getUserPermissions(userId);
    let count = 0;
    state.bulkSelection.forEach((triggerId) => { if (perms.triggers.indexOf(triggerId) === -1) { perms.triggers.push(triggerId); count++; } });
    setUserPermissions(userId, perms);
    clearBulk();
    return count;
}

export function bulkRevoke(userId: string | number) {
    const state = _getState();
    if (!userId || state.bulkSelection.size === 0) return 0;
    saveCurrentToHistory('bulk-revoke', userId);
    const perms = getUserPermissions(userId);
    const bulkSet = state.bulkSelection;
    const before = perms.triggers.length;
    perms.triggers = perms.triggers.filter((t: string) => !bulkSet.has(t));
    setUserPermissions(userId, perms);
    clearBulk();
    return before - perms.triggers.length;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { bulkSelectionReady: !!_getState().bulkSelection } }; }
