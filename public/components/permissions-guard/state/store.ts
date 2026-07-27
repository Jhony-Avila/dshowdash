// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-guard.state.store
// PURPOSE: Permissions Guard - Store v4.4.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   deepClone from ../utils/helpers.js
//
// PROVIDES:
//   permissionsStore — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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
import { deepClone } from '../utils/helpers.js';
const VERSION = '4.4.0-P17WI';
const MODULE_ID = 'permissions-guard.state.store';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; } if (_debug() && logger.debug) logger.debug.apply(logger, [prefix].concat(args)); };
const initialState: { roles: string[]; capabilities: string[]; scopes: string[]; policies: Record<string, unknown>; userLevel: number; userId: string | null; lastSync: number | null; [key: string]: unknown } = { roles: [], capabilities: [], scopes: [], policies: {}, userLevel: 0, userId: null, lastSync: null };
let state: typeof initialState = Object.assign({}, initialState);
const listeners = new Set();
const _metrics: { updates: number; sets: number; clears: number; roleChanges: number; capabilityChanges: number; notifications: number; listenerErrors: number; lastUpdateAt: number | null } = { updates: 0, sets: 0, clears: 0, roleChanges: 0, capabilityChanges: 0, notifications: 0, listenerErrors: 0, lastUpdateAt: null };

// @ts-expect-error TS migration - TS2349, TS2554
function notify(action, key, newValue, oldValue) { if (key === undefined) key = null; if (newValue === undefined) newValue = null; if (oldValue === undefined) oldValue = null; const payload = { action, key, newValue, oldValue, state: getState(), timestamp: Date.now() }; listeners.forEach(fn => { try { fn(payload); _metrics.notifications++; } catch (e) { _metrics.listenerErrors++; _log('error', 'Listener error:', e); } }); _metrics.updates++; _metrics.lastUpdateAt = Date.now(); }
function getState() { return deepClone(state); }
function get(key: string) { if (key) return state[key]; return getState(); }
function set(key: string, value: unknown) { if (!key) return false; _metrics.sets++; const oldValue = state[key]; state[key] = value; state.lastSync = Date.now(); notify('set', key, value, oldValue); return true; }
function update(patch: Record<string, unknown>) { if (!patch || typeof patch !== 'object') return false; const oldData = deepClone(state); const keys = Object.keys(patch); for (let i = 0; i < keys.length; i++) { state[keys[i]] = patch[keys[i]]; } state.lastSync = Date.now(); notify('update', null, patch, oldData); return true; }
function clear() { _metrics.clears++; const oldData = deepClone(state); state = Object.assign({}, initialState); notify('clear', null, null, oldData); return true; }
function reset() { return clear(); }
function getRoles() { return state.roles.slice(); }
function setRoles(roles: string[]) { _metrics.roleChanges++; const oldRoles = state.roles.slice(); state.roles = Array.isArray(roles) ? roles.slice() : []; state.lastSync = Date.now(); notify('roles-changed', 'roles', state.roles, oldRoles); return true; }
function addRole(role: string) { if (!role || state.roles.indexOf(role) !== -1) return false; state.roles.push(role); state.lastSync = Date.now(); notify('role-added', 'roles', role, null); return true; }
function removeRole(role: string) { const index = state.roles.indexOf(role); if (index === -1) return false; state.roles.splice(index, 1); state.lastSync = Date.now(); notify('role-removed', 'roles', role, null); return true; }
function hasRole(role: string) { return state.roles.indexOf(role) !== -1; }
function getCapabilities() { return state.capabilities.slice(); }
function setCapabilities(capabilities: string[]) { _metrics.capabilityChanges++; const oldCaps = state.capabilities.slice(); state.capabilities = Array.isArray(capabilities) ? capabilities.slice() : []; state.lastSync = Date.now(); notify('capabilities-changed', 'capabilities', state.capabilities, oldCaps); return true; }
function hasCapability(capability: string) { return state.capabilities.indexOf(capability) !== -1; }
function getScopes() { return state.scopes.slice(); }
function setScopes(scopes: string[]) { const oldScopes = state.scopes.slice(); state.scopes = Array.isArray(scopes) ? scopes.slice() : []; state.lastSync = Date.now(); notify('scopes-changed', 'scopes', state.scopes, oldScopes); return true; }
function getUserLevel() { return state.userLevel; }
function setUserLevel(level: number) { const oldLevel = state.userLevel; state.userLevel = typeof level === 'number' ? level : 0; state.lastSync = Date.now(); notify('level-changed', 'userLevel', state.userLevel, oldLevel); return true; }
function getUserId() { return state.userId; }
function setUserId(id: string | null) { state.userId = id; state.lastSync = Date.now(); return true; }
function getPolicies() { return deepClone(state.policies); }
function setPolicies(policies: Record<string, unknown>) { state.policies = policies || {}; state.lastSync = Date.now(); notify('policies-changed', 'policies', state.policies, null); return true; }
function subscribe(callback: (payload: Record<string, unknown>) => void) { if (typeof callback === 'function') { listeners.add(callback); return () => { listeners.delete(callback); }; } return () => {}; }
function clearListeners() { listeners.clear(); }
function toJSON() { return getState(); }
function info() { return { moduleId: MODULE_ID, version: VERSION, rolesCount: state.roles.length, capabilitiesCount: state.capabilities.length, scopesCount: state.scopes.length, policiesCount: Object.keys(state.policies).length, userLevel: state.userLevel, userId: state.userId, lastSync: state.lastSync, listenerCount: listeners.size, metrics: Object.assign({}, _metrics), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
function healthCheck() { const checks = { stateInitialized: state !== null, rolesValid: Array.isArray(state.roles), capabilitiesValid: Array.isArray(state.capabilities), listenersHealthy: _metrics.listenerErrors === 0 || (_metrics.listenerErrors / Math.max(_metrics.notifications, 1)) < 0.1, lowErrorRate: _metrics.listenerErrors < 10, portsInitialized: Ports.isInitialized() }; const values = Object.values(checks); const passed = values.filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, rolesCount: state.roles.length, userId: state.userId, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
function getStats() { return { updates: _metrics.updates, lastUpdateAt: _metrics.lastUpdateAt, listenerCount: listeners.size }; }
function getVersion() { return VERSION; }
const permissionsStore = { getState, get, set, update, clear, reset, getRoles, setRoles, addRole, removeRole, hasRole, getCapabilities, setCapabilities, hasCapability, getScopes, setScopes, getUserLevel, setUserLevel, getUserId, setUserId, getPolicies, setPolicies, subscribe, clearListeners, toJSON, info, healthCheck, getStats, getVersion, injectPorts, getPorts };
export { permissionsStore, injectPorts, getPorts, VERSION, MODULE_ID };
export default permissionsStore;
