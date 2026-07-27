declare const _state: { _initialized?: boolean } | null;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-status/state/store
// PURPOSE: Panel Status - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   get() — exported function
//   set() — exported function
//   setStatus() — exported function
//   setStatuses() — exported function
//   getStatus() — exported function
//   getAllStatuses() — exported function
//   setLoading() — exported function
//   setError() — exported function
//   reset() — exported function
//   subscribe() — exported function
//   getOverallHealth() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-status/state/store';

let _listeners: Array<(state: Record<string, unknown>) => void> = [];
let _store: {
    statuses: Record<string, Record<string, unknown>>;
    loading: boolean;
    error: unknown;
    mounted: boolean;
    lastUpdate: number | null;
    refreshInterval: number;
    _initialized: boolean;
} = {
    statuses: {},
    loading: false,
    error: null,
    mounted: false,
    lastUpdate: null,
    refreshInterval: 30000,
    _initialized: false
};

export function getState() { return Object.assign({}, _store); }
export function get(key: string) { return key ? _store[key as keyof typeof _store] : getState(); }

export function set(key: string | Record<string, unknown>, value?: unknown) {
    if (typeof key === 'object') { Object.assign(_store, key); }
    else { (_store as Record<string, unknown>)[key] = value; }
    _store.lastUpdate = Date.now();
    _notify();
}

export function setStatus(statusId: string, data: Record<string, unknown>) {
    _store.statuses[statusId] = Object.assign({}, _store.statuses[statusId], data, { updatedAt: Date.now() });
    _notify();
}

export function setStatuses(statuses: Record<string, Record<string, unknown>>) { _store.statuses = statuses || {}; _store.lastUpdate = Date.now(); _notify(); }
export function getStatus(statusId: string) { return _store.statuses[statusId] || null; }
export function getAllStatuses() { return Object.assign({}, _store.statuses); }

export function setLoading(statusId: string | null, loading: boolean) {
    if (statusId) { if (!_store.statuses[statusId]) _store.statuses[statusId] = {}; _store.statuses[statusId].loading = loading; }
    else { _store.loading = loading; }
    _notify();
}

export function setError(statusId: string | null, error: unknown) {
    if (statusId) { if (!_store.statuses[statusId]) _store.statuses[statusId] = {}; _store.statuses[statusId].error = error; _store.statuses[statusId].level = 'error'; }
    else { _store.error = error; }
    _notify();
}

export function reset() {
    _store = { statuses: {}, loading: false, error: null, mounted: false, lastUpdate: null, refreshInterval: 30000, _initialized: false };
    _notify();
}

export function subscribe(fn: (state: Record<string, unknown>) => void) { _listeners.push(fn); return () => { _listeners = _listeners.filter((l) => l !== fn); }; }
function _notify() { _listeners.forEach((fn) => { try { fn(getState()); } catch (e) {} }); }

export function getOverallHealth() {
    const statuses = Object.values(_store.statuses);
    if (statuses.length === 0) return 'unknown';
    const errors = statuses.filter(s => (s as any).level === 'error').length;
    const warnings = statuses.filter(s => (s as any).level === 'warning').length;
    if (errors > 0) return 'error';
    if (warnings > 0) return 'warning';
    return 'ok';
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, overallHealth: getOverallHealth() }; }

export default { getState, get, set, setStatus, setStatuses, getStatus, getAllStatuses, setLoading, setError, reset, subscribe, getOverallHealth };
