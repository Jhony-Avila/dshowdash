// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-core
// PURPOSE: UARPS Admin - Core State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   _getState() — exported function
//   _setState() — exported function
//   _getInitialState() — exported function
//   _isInitialized() — exported function
//   _setInitialized() — exported function
//   notify() — exported function
//   init() — exported function
//   reset() — exported function
//   subscribe() — exported function
//   getListenerCount() — exported function
//   getState() — exported function
//   getUsers() — exported function
//   getTriggers() — exported function
//   ... and 23 more exports
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
export const MODULE_ID = 'uarps-admin-core';

interface StateType {
  users: Record<string, unknown>[];
  triggers: Record<string, unknown>[];
  regions: Record<string, unknown>[];
  userPermissions: Map<string, { triggers: string[]; regions: string[] }>;
  selectedUserId: string | number | null;
  selectedUser: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  filter: { search: string; type: string };
  userFilter: { status: string; sort: string };
  view: string;
  lastSync: number | null;
  bulkSelection: Set<string>;
  bulkMode: boolean;
}

// Estado inicial
const _initialState: StateType = {
  users: [],
  triggers: [],
  regions: [],
  userPermissions: new Map(),
  selectedUserId: null,
  selectedUser: null,
  loading: false,
  error: null,
  filter: { search: '', type: 'all' },
  userFilter: { status: 'all', sort: 'name' },
  view: 'matrix',
  lastSync: null,
  bulkSelection: new Set(),
  bulkMode: false
};

let _state = { ..._initialState };
let _listeners = new Set();
let _initialized = false;

// === INTERNAL ===
export function _getState() { return _state; }
export function _setState(newState: StateType) { _state = newState; }
export function _getInitialState() { return _initialState; }
export function _isInitialized() { return _initialized; }
export function _setInitialized(val: boolean) { _initialized = val; }

// === NOTIFY ===
export function notify(key: string) {
  _listeners.forEach(fn => {

    // @ts-expect-error TS migration - TS2349
    try { fn({ key, state: getState() }); } catch {}
  });
}

// === INIT / RESET ===
export function init() {
  if (_initialized) return;
  if (!_state.userPermissions) {
    _state.userPermissions = new Map();
  }
  if (!_state.bulkSelection) {
    _state.bulkSelection = new Set();
  }
  _initialized = true;
}

export function reset() {
  _state = { 
    ..._initialState, 
    userPermissions: new Map(),
    bulkSelection: new Set()
  };
  _listeners.clear();
  _initialized = false;
}

// === SUBSCRIPTIONS ===
export function subscribe(listener: (change: { key: string; state: StateType }) => void) {
  if (typeof listener !== 'function') return () => {};
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export function getListenerCount() {
  return _listeners.size;
}

// === GETTERS ===
export function getState() { return { ..._state }; }
export function getUsers() { return [..._state.users]; }
export function getTriggers() { return [..._state.triggers]; }
export function getRegions() { return [..._state.regions]; }
export function getSelectedUserId() { return _state.selectedUserId; }
export function getSelectedUser() { return _state.selectedUser; }
export function isLoading() { return _state.loading; }
export function getError() { return _state.error; }
export function getFilter() { return { ..._state.filter }; }
export function getView() { return _state.view; }
export function getLastSync() { return _state.lastSync; }

export function getUserPermissions(userId: string | number) {
  return _state.userPermissions.get(String(userId)) || { triggers: [], regions: [] };
}

export function getSelectedUserPermissions() {
  if (!_state.selectedUserId) return { triggers: [], regions: [] };
  return getUserPermissions(_state.selectedUserId);
}

// === SETTERS ===
export function setUsers(users: Record<string, unknown>[]) {
  _state.users = Array.isArray(users) ? users : [];
  notify('users');
}

export function setTriggers(triggers: Record<string, unknown>[]) {
  _state.triggers = Array.isArray(triggers) ? triggers : [];
  notify('triggers');
}

export function setRegions(regions: Record<string, unknown>[]) {
  _state.regions = Array.isArray(regions) ? regions : [];
  notify('regions');
}

export function setSelectedUser(userId: string | number) {
  _state.selectedUserId = userId;
  _state.selectedUser = _state.users.find(u => String(u.id) === String(userId)) || null;
  notify('selectedUser');
}

export function setLoading(loading: boolean) {
  _state.loading = !!loading;
  notify('loading');
}

export function setError(error: string | null) {
  _state.error = error;
  notify('error');
}

export function setFilter(filter: Partial<{ search: string; type: string }>) {
  _state.filter = { ..._state.filter, ...filter };
  notify('filter');
}

export function setView(view: string) {
  _state.view = view;
  notify('view');
}

export function setUserPermissions(userId: string | number, permissions: { triggers?: string[]; regions?: string[] }) {
  _state.userPermissions.set(String(userId), {
    triggers: permissions.triggers || [],
    regions: permissions.regions || []
  });
  notify('permissions');
}

export function setLastSync(timestamp: number | null) {
  _state.lastSync = timestamp;
  notify('sync');
}

// === STATS ===
export function getStats() {
  const selectedPerms = getSelectedUserPermissions();
  return {
    totalUsers: _state.users.length,
    totalTriggers: _state.triggers.length,
    totalRegions: _state.regions.length,
    selectedTriggers: selectedPerms.triggers.length,
    selectedRegions: selectedPerms.regions.length
  };
}

// === DIAGNOSTICS ===
export function healthCheck() {
  return {
    status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    stats: getStats(),
    listenerCount: _listeners.size
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    state: {
      usersCount: _state.users.length,
      triggersCount: _state.triggers.length,
      regionsCount: _state.regions.length,
      selectedUserId: _state.selectedUserId,
      loading: _state.loading,
      view: _state.view,
      lastSync: _state.lastSync
    }
  };
}
