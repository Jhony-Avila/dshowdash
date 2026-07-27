// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail.state.store
// PURPOSE: Panel Audit Trail - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   TABS from ../core/contracts.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   MUTATION_SOURCES — exported value
//   getState() — exported function
//   select() — exported function
//   getCurrentLogs() — exported function
//   getFilteredLogs() — exported function
//   dispatch() — exported function
//   subscribe() — exported function
//   unsubscribe() — exported function
//   clearListeners() — exported function
//   beginTransaction() — exported function
//   addToTransaction() — exported function
//   ... and 9 more exports
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
import { TABS } from '../core/contracts.js';

const MODULE_ID = 'panel-audit-trail.state.store';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const MUTATION_SOURCES = Object.freeze({ USER: 'user', SYSTEM: 'system', API: 'api', SYNC: 'sync', INTERNAL: 'internal' });

const INITIAL_STATE = Object.freeze({ activeTab: TABS.AUDIT, loading: false, error: null, auditLogs: [], permissionLogs: [], frontendLogs: [], securityLogs: [], filters: Object.freeze({ search: '', actionType: '', severity: '', module: '', userId: '', timePreset: 'LAST_30_DAYS' }), pagination: Object.freeze({ offset: 0, limit: 20, total: 0 }), sort: Object.freeze({ key: 'created_at', direction: 'desc' }), groupBy: '', healthStats: Object.freeze({ error: 0, warning: 0, info: 0, security: 0 }), lastFetchAt: null });

let _state = Object.freeze(Object.assign({}, INITIAL_STATE));
let _stateVersion = 0;
let _pendingTransaction: { snapshot: Record<string, unknown>; source: string; changes: Record<string, unknown>; startedAt: number } | null = null;
let _history: Array<{ state: Record<string, unknown>; version: number; timestamp: number; action: string; source: string }> = [];
const MAX_HISTORY = 10;
const _listeners = new Set();
const _metrics: { dispatches: number; commits: number; rollbacks: number; notifications: number; listenerErrors: number; lastDispatchAt: number | null; lastSource: string | null } = { dispatches: 0, commits: 0, rollbacks: 0, notifications: 0, listenerErrors: 0, lastDispatchAt: null, lastSource: null };

function _deepClone(obj: unknown): unknown { if (obj === null || typeof obj !== 'object') return obj; if (Array.isArray(obj)) return obj.map((v: unknown) => _deepClone(v)); const clone: Record<string, unknown> = {}; for (const key of Object.keys(obj as Record<string, unknown>)) clone[key] = _deepClone((obj as Record<string, unknown>)[key]); return clone; }
function _createSnapshot() { return { state: _deepClone(_state) as Record<string, unknown>, version: _stateVersion, timestamp: Date.now() }; }
function _saveToHistory(snapshot: { state: Record<string, unknown>; version: number; timestamp: number }, action: string, source: string) { _history.push(Object.assign({}, snapshot, { action, source })); if (_history.length > MAX_HISTORY) _history.shift(); }

function _notify(action: string, source: string) {
    const payload = { action, source, state: getState(), version: _stateVersion, timestamp: Date.now() };

    // @ts-expect-error TS migration - TS2349
    _listeners.forEach((fn) => { try { fn(payload.state); _metrics.notifications++; } catch (e) { _metrics.listenerErrors++; _getPort('logger')?.error('[store] Listener error:', e); } });
    _metrics.lastDispatchAt = Date.now(); _metrics.lastSource = source;
}

function _applyChange(changes: Record<string, unknown>, source?: string) {
    source = source || MUTATION_SOURCES.INTERNAL;
    const snapshot = _createSnapshot(); _saveToHistory(snapshot, 'change', source);
    const newState = Object.assign({}, _state) as Record<string, unknown>;
    for (const key of Object.keys(changes)) {
        const value = changes[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) { newState[key] = Object.freeze(Object.assign({}, (_state as Record<string, unknown>)[key], value)); }
        else if (Array.isArray(value)) { newState[key] = Object.freeze(value.slice()); }
        else { newState[key] = value; }
    }
    _state = Object.freeze(newState) as typeof _state; _stateVersion++;
    return snapshot;
}

function beginTransaction(source?: string) { source = source || MUTATION_SOURCES.INTERNAL; if (_pendingTransaction) commit(); _pendingTransaction = { snapshot: _createSnapshot(), source, changes: {}, startedAt: Date.now() }; return true; }
function addToTransaction(changes: Record<string, unknown>) { if (!_pendingTransaction) beginTransaction(MUTATION_SOURCES.INTERNAL); Object.assign(_pendingTransaction!.changes, changes); return true; }
function commit() { if (!_pendingTransaction) return false; const { changes, source } = _pendingTransaction; _applyChange(changes, source); _metrics.commits++; _notify('commit', source); _pendingTransaction = null; return true; }
function rollback() { if (!_pendingTransaction) return false; _metrics.rollbacks++; _pendingTransaction = null; return true; }
function rollbackToVersion(targetVersion: number) { const historyEntry = _history.find(h => h.version === targetVersion); if (!historyEntry) return false; _metrics.rollbacks++; _state = Object.freeze(Object.assign({}, historyEntry.state)) as typeof _state; _stateVersion++; _notify('rollback-to-version', MUTATION_SOURCES.SYSTEM); return true; }

function getState() { return _deepClone(_state) as Record<string, unknown>; }
function select(selector: ((state: unknown) => unknown) | string) { if (typeof selector === 'function') return selector(_state); if (typeof selector === 'string') return _deepClone((_state as Record<string, unknown>)[selector]); return null; }
function getCurrentLogs() { const logMap = { [TABS.AUDIT]: _state.auditLogs, [TABS.PERMISSIONS]: _state.permissionLogs, [TABS.FRONTEND]: (_state as any).frontendLogs, [TABS.SECURITY]: _state.securityLogs }; return (logMap[_state.activeTab] || _state.auditLogs).slice(); }

// @ts-expect-error TS migration - TS2339
function getFilteredLogs() { let logs = getCurrentLogs(); const { search, actionType, severity } = _state.filters; if (search) { const term = search.toLowerCase(); logs = logs.filter((log) => JSON.stringify(log).toLowerCase().includes(term)); } if (actionType) { logs = logs.filter((log) => (log.action_type || log.event_type || '').toUpperCase().includes(actionType.toUpperCase())); } if (severity) { logs = logs.filter((log) => (log.severity || log.log_level || '').toUpperCase() === severity.toUpperCase()); } return logs; }

function dispatch(action: { type: string; payload?: unknown }, source?: string) {
    source = source || MUTATION_SOURCES.INTERNAL;
    const { type, payload } = action;
    _metrics.dispatches++;
    switch (type) {
        case 'SET_TAB': _applyChange({ activeTab: payload, pagination: Object.assign({}, _state.pagination, { offset: 0 }) }, source); break;
        case 'SET_LOADING': _applyChange({ loading: payload }, source); break;
        case 'SET_ERROR': _applyChange({ error: payload, loading: false }, source); break;
        case 'SET_AUDIT_LOGS': _applyChange({ auditLogs: payload || [], error: null }, source); break;
        case 'SET_PERMISSION_LOGS': _applyChange({ permissionLogs: payload || [], error: null }, source); break;
        case 'SET_FRONTEND_LOGS': _applyChange({ frontendLogs: payload || [], error: null }, source); break;
        case 'SET_SECURITY_LOGS': _applyChange({ securityLogs: payload || [], error: null }, source); break;
        case 'SET_FILTERS': _applyChange({ filters: Object.assign({}, _state.filters, payload), pagination: Object.assign({}, _state.pagination, { offset: 0 }) }, source); break;
        case 'CLEAR_FILTERS': _applyChange({ filters: Object.assign({}, INITIAL_STATE.filters), pagination: Object.assign({}, _state.pagination, { offset: 0 }) }, source); break;
        case 'SET_PAGINATION': _applyChange({ pagination: Object.assign({}, _state.pagination, payload) }, source); break;
        case 'SET_SORT': _applyChange({ sort: Object.assign({}, _state.sort, payload) }, source); break;
        case 'SET_GROUP_BY': _applyChange({ groupBy: payload || '' }, source); break;
        case 'SET_HEALTH_STATS': _applyChange({ healthStats: Object.assign({}, _state.healthStats, payload) }, source); break;
        case 'SET_LAST_FETCH': _applyChange({ lastFetchAt: payload }, source); break;
        case 'RESET': _state = Object.freeze(Object.assign({}, INITIAL_STATE)); _stateVersion++; _history.length = 0; break;
        default: return;
    }
    _notify(type, source);
}

function subscribe(callback: (state: Record<string, unknown>) => void) { if (typeof callback === 'function' && !_listeners.has(callback)) _listeners.add(callback); return () => unsubscribe(callback); }
function unsubscribe(callback: (state: Record<string, unknown>) => void) { _listeners.delete(callback); }
function clearListeners() { _listeners.clear(); }
function reset() { dispatch({ type: 'RESET' }, MUTATION_SOURCES.SYSTEM); }
function getHistory() { return _history.map((h) => ({ version: h.version, action: h.action, source: h.source, timestamp: h.timestamp })); }
function getVersion() { return VERSION; }
function getStateVersion() { return _stateVersion; }

function info() { return { moduleId: MODULE_ID, version: VERSION, stateVersion: _stateVersion, activeTab: _state.activeTab, loading: _state.loading, hasError: !!_state.error, logsCount: { audit: _state.auditLogs.length, permissions: _state.permissionLogs.length, frontend: _state.frontendLogs.length, security: _state.securityLogs.length }, listenerCount: _listeners.size, historyLength: _history.length, hasPendingTransaction: !!_pendingTransaction, metrics: Object.assign({}, _metrics), timestamp: Date.now() }; }

function healthCheck() {
    const checks = { stateImmutable: Object.isFrozen(_state), stateInitialized: _state !== null, shapeValid: typeof _state.activeTab === 'string', versionTracked: _stateVersion >= 0, listenersHealthy: _metrics.listenerErrors === 0 || (_metrics.listenerErrors / Math.max(_metrics.notifications, 1)) < 0.1, historyManaged: _history.length <= MAX_HISTORY };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, stateVersion: _stateVersion, activeTab: _state.activeTab, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export { VERSION, MODULE_ID, MUTATION_SOURCES, getState, select, getCurrentLogs, getFilteredLogs, dispatch, subscribe, unsubscribe, clearListeners, beginTransaction, addToTransaction, commit, rollback, rollbackToVersion, reset, getHistory, getVersion, getStateVersion, info, healthCheck };
export default { VERSION, MODULE_ID, MUTATION_SOURCES, getState, select, getCurrentLogs, getFilteredLogs, dispatch, subscribe, unsubscribe, clearListeners, beginTransaction, addToTransaction, commit, rollback, rollbackToVersion, reset, getHistory, getVersion, getStateVersion, info, healthCheck, injectPorts, getPorts };
