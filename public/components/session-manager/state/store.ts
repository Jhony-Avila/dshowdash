// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-manager.state.store
// PURPOSE: Session Manager - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   deepClone, generateSessionId from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   sessionStore — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   MUTATION_SOURCES — exported value
//   SESSION_SHAPE — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { deepClone, generateSessionId } from '../utils/helpers.js';

export const VERSION = '6.0.0-P18EC';
export const MODULE_ID = 'session-manager.state.store';

const hasWindow = typeof window !== 'undefined';

const SESSION_SHAPE = Object.freeze({ authenticated: false, user: null, userId: null, roles: [], token: null, csrf: null, sessionId: null, expiresAt: null, lastActivity: null, loginAt: null, timeout: 1800000 });

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown> = {}) { const logger: any = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; logger[level](msg, { component: MODULE_ID, ...ctx }); }

const MUTATION_SOURCES = Object.freeze({ USER: 'user', SYSTEM: 'system', API: 'api', SYNC: 'sync', INTERNAL: 'internal' });

let _state: Readonly<typeof SESSION_SHAPE> = Object.freeze({ ...SESSION_SHAPE });
let _stateVersion = 0;
let _pendingTransaction: { snapshot: unknown; source: string; changes: Record<string, unknown>; startedAt: number } | null = null;
const _history: { version: number; action: string; source: string; timestamp: number; state: unknown }[] = [];
const MAX_HISTORY = 10;
const _listeners: Set<Function> = new Set();
const _metrics: { updates: number; sets: number; clears: number; resets: number; commits: number; rollbacks: number; notifications: number; listenerErrors: number; lastUpdateAt: number | null; lastSource: string | null } = { updates: 0, sets: 0, clears: 0, resets: 0, commits: 0, rollbacks: 0, notifications: 0, listenerErrors: 0, lastUpdateAt: null, lastSource: null };

function _createSnapshot() { return { state: deepClone(_state), version: _stateVersion, timestamp: Date.now() }; }
function _saveToHistory(snapshot: { state: unknown; version: number; timestamp: number }, action: string, source: string) { _history.push({ ...snapshot, action, source }); if (_history.length > MAX_HISTORY) _history.shift(); }

function _notify(action: string, source: string, key: string | null = null, newValue: unknown = null, oldValue: unknown = null) { const payload = { action, source, key, newValue, oldValue, state: getState(), version: _stateVersion, timestamp: Date.now() }; _listeners.forEach(fn => { try { fn(payload); _metrics.notifications++; } catch (e) { _metrics.listenerErrors++; _log('error', 'Listener error', { error: (e as Error).message }); } }); _metrics.updates++; _metrics.lastUpdateAt = Date.now(); _metrics.lastSource = source; }

function _applyChange(changes: Record<string, unknown>, source: string = MUTATION_SOURCES.INTERNAL) { const snapshot = _createSnapshot(); _saveToHistory(snapshot, 'change', source); _state = Object.freeze({ ..._state, ...changes }); _stateVersion++; return snapshot; }

function beginTransaction(source: string = MUTATION_SOURCES.INTERNAL) { if (_pendingTransaction) { _log('warn', 'Transaction already in progress, committing previous'); commit(); } _pendingTransaction = { snapshot: _createSnapshot(), source, changes: {}, startedAt: Date.now() }; return true; }
function addToTransaction(changes: Record<string, unknown>) { if (!_pendingTransaction) { _log('warn', 'No transaction in progress, starting one'); beginTransaction(MUTATION_SOURCES.INTERNAL); } Object.assign(_pendingTransaction!.changes, changes); return true; }
function commit() { if (!_pendingTransaction) { _log('warn', 'No transaction to commit'); return false; } const { changes, source } = _pendingTransaction; _applyChange(changes, source); _metrics.commits++; const snap = _pendingTransaction.snapshot as { state: unknown }; _notify('commit', source, null, changes, snap.state); _pendingTransaction = null; return true; }
function rollback() { if (!_pendingTransaction) { _log('warn', 'No transaction to rollback'); return false; } _metrics.rollbacks++; _log('info', 'Transaction rolled back', { source: _pendingTransaction.source }); _pendingTransaction = null; return true; }
function rollbackToVersion(targetVersion: number) { const historyEntry = _history.find(h => h.version === targetVersion); if (!historyEntry) { _log('warn', 'Version not found in history', { targetVersion }); return false; } _metrics.rollbacks++; _state = Object.freeze({ ...(historyEntry.state as typeof SESSION_SHAPE) }); _stateVersion++; _notify('rollback-to-version', MUTATION_SOURCES.SYSTEM, null, _state, null); _log('info', 'Rolled back to version', { targetVersion, newVersion: _stateVersion }); return true; }

function getState() { return deepClone(_state); }
function get(key: string) { if (key) return (_state as Record<string, unknown>)[key]; return getState(); }
function set(key: string, value: unknown, source: string = MUTATION_SOURCES.INTERNAL) { _metrics.sets++; const oldValue = (_state as Record<string, unknown>)[key]; _applyChange({ [key]: value }, source); _notify('set', source, key, value, oldValue); return true; }
function update(patch: Record<string, unknown>, source: string = MUTATION_SOURCES.INTERNAL) { const oldState = getState(); _applyChange(patch, source); _notify('update', source, null, patch, oldState); return true; }
function clear(source: string = MUTATION_SOURCES.INTERNAL) { _metrics.clears++; const oldState = getState(); _applyChange({ ...SESSION_SHAPE }, source); _state = Object.freeze({ ...SESSION_SHAPE }); _notify('clear', source, null, null, oldState); return true; }
function reset(source: string = MUTATION_SOURCES.SYSTEM) { _metrics.resets++; const oldState = getState(); _state = Object.freeze({ ...SESSION_SHAPE }); _stateVersion++; _history.length = 0; _pendingTransaction = null; _notify('reset', source, null, null, oldState); return true; }

function isAuthenticated() { return !!_state.authenticated; }
function getUser() { return _state.user ? deepClone(_state.user) : null; }
// @ts-expect-error strict migration — TS2339
function getUserId() { return _state.userId || _state.user?.id || null; }
// @ts-expect-error strict migration — TS2339
function getRoles() { return [...(_state.roles || _state.user?.roles || [])]; }
function getToken() { return _state.token; }
function getCsrf() { return _state.csrf; }
function getSessionId() { return _state.sessionId; }
function getExpiresAt() { return _state.expiresAt; }
function getLastActivity() { return _state.lastActivity; }
function getLoginAt() { return _state.loginAt; }
function getTimeout() { return _state.timeout || 1800000; }
function getDuration() { if (!_state.loginAt) return 0; return Date.now() - _state.loginAt; }
function getVersion() { return VERSION; }
function getStateVersion() { return _stateVersion; }

function setUser(user: unknown, source: string = MUTATION_SOURCES.API) { const oldUser = _state.user; const u: any = user; _applyChange({ user, userId: u?.id || null, roles: u?.roles || [], authenticated: user !== null, lastActivity: Date.now() }, source); _notify('user-set', source, 'user', user, oldUser); return true; }
function clearUser(source: string = MUTATION_SOURCES.API) { const oldUser = _state.user; _applyChange({ user: null, userId: null, roles: [], authenticated: false }, source); _notify('user-cleared', source, 'user', null, oldUser); return true; }
function setToken(token: string | null, source: string = MUTATION_SOURCES.API) { const oldToken = _state.token; _applyChange({ token }, source); _notify('token-set', source, 'token', token ? '[SET]' : null, oldToken ? '[WAS_SET]' : null); return true; }
function clearToken(source: string = MUTATION_SOURCES.API) { const oldToken = _state.token; _applyChange({ token: null }, source); _notify('token-cleared', source, 'token', null, oldToken ? '[WAS_SET]' : null); return true; }
function setCsrf(csrf: string | null, source: string = MUTATION_SOURCES.API) { const oldCsrf = _state.csrf; _applyChange({ csrf }, source); _notify('csrf-set', source, 'csrf', csrf ? '[SET]' : null, oldCsrf ? '[WAS_SET]' : null); return true; }
function clearCsrf(source: string = MUTATION_SOURCES.API) { _applyChange({ csrf: null }, source); _notify('csrf-cleared', source, 'csrf', null, null); return true; }
function setSessionId(id: string | null, source: string = MUTATION_SOURCES.SYSTEM) { const sessionId = id || generateSessionId(); _applyChange({ sessionId }, source); _notify('session-started', source, 'sessionId', sessionId, null); return sessionId; }
function updateActivity(source: string = MUTATION_SOURCES.USER) { _applyChange({ lastActivity: Date.now() }, source); _notify('activity', source, 'lastActivity', _state.lastActivity, null); return true; }
function setTimeoutValue(timeoutMs: number, source: string = MUTATION_SOURCES.SYSTEM) { _applyChange({ timeout: timeoutMs }, source); return true; }

function subscribe(callback: (...args: unknown[]) => void) { if (typeof callback === 'function') { _listeners.add(callback); return () => _listeners.delete(callback); } return () => {}; }
function clearListeners() { _listeners.clear(); }

function toJSON() { return { ...getState(), token: _state.token ? '[REDACTED]' : null, csrf: _state.csrf ? '[REDACTED]' : null }; }
function getStats() { return { updates: _metrics.updates, lastUpdateAt: _metrics.lastUpdateAt, lastSource: _metrics.lastSource, listenerCount: _listeners.size, stateVersion: _stateVersion, historyLength: _history.length, hasPendingTransaction: !!_pendingTransaction }; }
function getHistory() { return _history.map(h => ({ version: h.version, action: h.action, source: h.source, timestamp: h.timestamp })); }

function info() { return { moduleId: MODULE_ID, version: VERSION, stateVersion: _stateVersion, authenticated: _state.authenticated, userId: _state.userId, sessionId: _state.sessionId, hasToken: !!_state.token, hasCsrf: !!_state.csrf, rolesCount: _state.roles?.length || 0, listenerCount: _listeners.size, historyLength: _history.length, hasPendingTransaction: !!_pendingTransaction, portsInitialized: Ports.isInitialized(), metrics: { ..._metrics }, timestamp: Date.now() }; }

function healthCheck() { const checks = { stateImmutable: Object.isFrozen(_state), stateInitialized: _state !== null, shapeValid: typeof _state.authenticated === 'boolean', versionTracked: _stateVersion >= 0, listenersHealthy: _metrics.listenerErrors === 0 || (_metrics.listenerErrors / Math.max(_metrics.notifications, 1)) < 0.1, lowErrorRate: _metrics.listenerErrors < 10, historyManaged: _history.length <= MAX_HISTORY, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, stateVersion: _stateVersion, authenticated: _state.authenticated, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export const sessionStore = { getState, get, set, update, clear, reset, beginTransaction, addToTransaction, commit, rollback, rollbackToVersion, MUTATION_SOURCES, isAuthenticated, getUser, getUserId, getRoles, getToken, getCsrf, getSessionId, getExpiresAt, getLastActivity, getLoginAt, getTimeout, getDuration, getVersion, getStateVersion, setUser, clearUser, setToken, clearToken, setCsrf, clearCsrf, setSessionId, updateActivity, setTimeout: setTimeoutValue, subscribe, clearListeners, toJSON, getStats, getHistory, info, healthCheck, injectPorts, getPorts };
export { MUTATION_SOURCES, SESSION_SHAPE };
export default sessionStore;
