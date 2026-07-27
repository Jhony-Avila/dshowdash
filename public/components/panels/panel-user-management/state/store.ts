// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management.state.store
// PURPOSE: Panel User Management - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   state() — exported function
//   VERSION — module constant
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

const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-management.state.store';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
const _log = function(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { logger.error && logger.error(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (level === 'warn') { logger.warn && logger.warn(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (_debug()) logger.debug && logger.debug(...[`[${MODULE_ID}]`].concat(args));
};

const initialState: {
  users: Record<string, unknown>[];
  roles: Record<string, unknown>[];
  selectedUser: Record<string, unknown> | null;
  filters: { search: string; status: string; role: string };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
} = { users: [], roles: [], selectedUser: null, filters: { search: '', status: '', role: '' }, pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }, loading: false, error: null, lastLoadedAt: null };

const state = (() => {
  let currentState = Object.assign({}, initialState);
  const listeners = new Set();
  const _metrics = { updates: 0, resets: 0, subscriptions: 0 };


  // @ts-expect-error TS migration - TS2349, TS2554
  function notify() { listeners.forEach((fn: (s: typeof currentState) => void) => { try { fn(currentState); } catch (e) { _log('error', 'Listener error:', e); } }); }
  function setState(partial: Partial<typeof currentState>) { currentState = Object.assign({}, currentState, partial); _metrics.updates++; notify(); }

  return {
    getState() { return Object.assign({}, currentState); },
    getUsers() { return currentState.users.slice(); },
    getRoles() { return currentState.roles.slice(); },
    getSelectedUser() { return currentState.selectedUser ? Object.assign({}, currentState.selectedUser) : null; },
    getFilters() { return Object.assign({}, currentState.filters); },
    getPagination() { return Object.assign({}, currentState.pagination); },
    isLoading() { return currentState.loading; },
    getError() { return currentState.error; },
    setUsers(users: Record<string, unknown>[]) { setState({ users, lastLoadedAt: Date.now(), pagination: Object.assign({}, currentState.pagination, { total: users.length, totalPages: Math.ceil(users.length / currentState.pagination.pageSize) }) }); },
    setRoles(roles: Record<string, unknown>[]) { setState({ roles }); },
    setSelectedUser(user: Record<string, unknown> | null) { setState({ selectedUser: user }); },
    setFilters(filters: Partial<{ search: string; status: string; role: string }>) { setState({ filters: Object.assign({}, currentState.filters, filters), pagination: Object.assign({}, currentState.pagination, { page: 1 }) }); },
    setPagination(pagination: Partial<{ page: number; pageSize: number; total: number; totalPages: number }>) { setState({ pagination: Object.assign({}, currentState.pagination, pagination) }); },
    setPage(page: number) { setState({ pagination: Object.assign({}, currentState.pagination, { page }) }); },
    setLoading(loading: boolean) { setState({ loading }); },
    setError(error: string | null) { setState({ error }); },
    subscribe(fn: (s: typeof currentState) => void) { listeners.add(fn); _metrics.subscriptions++; return () => { listeners.delete(fn); }; },
    reset() { currentState = Object.assign({}, initialState); _metrics.resets++; notify(); },
    clearFilters() { setState({ filters: { search: '', status: '', role: '' }, pagination: Object.assign({}, currentState.pagination, { page: 1 }) }); },
    healthCheck() { _initPorts(); const logger = _getPort('logger'); const checks: Record<string, boolean> = { hasState: !!currentState, hasListeners: listeners.size > 0, noError: !currentState.error, notStale: !currentState.lastLoadedAt || (Date.now() - currentState.lastLoadedAt) < 300000, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; let passed = 0; for (const k in checks) { if (Object.prototype.hasOwnProperty.call(checks, k) && checks[k]) passed++; } return { status: passed === 6 ? 'healthy' : passed >= 4 ? 'degraded' : 'unhealthy', score: passed, maxScore: 6, checks }; },
    info() { return { version: VERSION, moduleId: MODULE_ID, state: { usersCount: currentState.users.length, rolesCount: currentState.roles.length, hasSelectedUser: !!currentState.selectedUser, filters: currentState.filters, pagination: currentState.pagination, loading: currentState.loading, hasError: !!currentState.error, lastLoadedAt: currentState.lastLoadedAt }, listeners: listeners.size, metrics: Object.assign({}, _metrics), portsInitialized: Ports.isInitialized(), healthCheck: state.healthCheck() }; },
    getMetrics() { return Object.assign({}, _metrics); }
  };
})();

export { state, VERSION, injectPorts, getPorts };
export default state;

// Alias export: consumers import { StateStore } from this module
export const StateStore = state;
