// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin:store
// PURPOSE: Panel Session Admin - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   dispatch() — exported function
//   getState() — exported function
//   getSessions() — exported function
//   getFilteredSessions() — exported function
//   getSelectedIds() — exported function
//   getExpandedIds() — exported function
//   getFilter() — exported function
//   getConfirmModal() — exported function
//   isLoading() — exported function
//   getError() — exported function
//   isAdmin() — exported function
//   getCurrentUserId() — exported function
//   ensureAuth() — exported function
//   isRefreshInProgress() — exported function
//   canTerminateSelected() — exported function
//   ... and 6 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger (fallback with recordViolation in non-strict mode)
// ═══════════════════════════════════════════════════════════════
// @changelog v2.5.0-STRICT-MODE - NR-FULL strict mode migration with recordViolation
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-session-admin:store';

const _CorePorts = createCorePorts({ moduleId: MODULE_ID });

function _getLogger() {
  const logger = _CorePorts.get('logger');
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get('Logger');
    if (wl) return wl;
  }
  return null;
}

const _log = (level: string, ...args: unknown[]) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) { logger[level](prefix, ...args); }
  else if (level === 'error' || level === 'warn') { console.log(prefix, ...args); }
};

const UARPS_TRIGGERS = {
  VIEW_OWN: 'trigger:panel:session-admin:view-own',
  VIEW_ALL: 'trigger:panel:session-admin:view-all',
  ADMIN: 'trigger:panel:session-admin:admin'
};

const MIN_ADMIN_LEVEL = 80;

const initialState: {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  sessions: Record<string, unknown>[];
  filteredSessions: Record<string, unknown>[];
  selectedIds: string[];
  expandedIds: string[];
  filter: { search: string; status: string; user: string };
  inlineFilters: Record<string, string>;
  hiddenColumns: string[];
  sortBy: string;
  sortOrder: string;
  isAdmin: boolean;
  currentUserId: string | null;
  confirmModal: Record<string, unknown> | null;
} = {
  initialized: false, loading: false, error: null, sessions: [], filteredSessions: [],
  selectedIds: [], expandedIds: [], filter: { search: '', status: '', user: '' },
  inlineFilters: {}, hiddenColumns: [], sortBy: 'last_activity', sortOrder: 'desc',
  isAdmin: false, currentUserId: null, confirmModal: null
};

let _state = { ...initialState };
let _listeners: Array<(state: typeof initialState) => void> = [];
let _ports: Record<string, unknown> = {};

function _getPort(name: string) { return (_CorePorts.get(name) || _ports[name] || null) as Record<string, (...args: unknown[]) => unknown> | null; }

function _notify() {
  _listeners.forEach(listener => {
    try { listener(_state); }
    catch (e) { _log('error', 'Listener error:', e); }
  });
}

function _determineAuthContext() {
  const auth = _getPort('auth');
  if (!auth) return { isAdmin: false, userId: null, level: 0, authenticated: false };
  const user = (auth.getUser?.() || null) as Record<string, unknown> | null;
  const userId = (user?.id || user?.user_id || null) as string | null;
  const authenticated = !!user;
  let isAdmin = false;
  if (authenticated) {
    if (auth.can?.('sessions:admin')) { isAdmin = true; }
    else if (auth.can?.(UARPS_TRIGGERS.ADMIN)) { isAdmin = true; }
    else {
      const roles = (auth.getRoles?.() || (user?.roles as unknown[]) || []) as string[];
      if (roles.includes('super_admin') || roles.includes('admin')) { isAdmin = true; }
      else {
        const level = (auth.getLevel?.() || user?.level || 0) as number;
        if (level >= MIN_ADMIN_LEVEL) { isAdmin = true; }
      }
    }
  }
  return { isAdmin, userId, level: (auth.getLevel?.() || (user?.level as number) || 0) as number, authenticated };
}

export function dispatch(action: { type: string; payload?: unknown }) {
  switch (action.type) {
    case 'INIT':
      _state = { ...initialState, initialized: true };
      const context = _determineAuthContext();
      _state.isAdmin = context.isAdmin;
      _state.currentUserId = context.userId;
      break;
    case 'SET_LOADING': _state.loading = action.payload as boolean; break;
    case 'SET_ERROR': _state.error = action.payload as string | null; _state.loading = false; break;
    case 'SET_SESSIONS':
      _state.sessions = (action.payload as Record<string, unknown>[]) || [];
      _state.filteredSessions = _applyFilters(_state.sessions);
      _state.loading = false; _state.error = null;
      break;
    case 'SET_FILTER':
      _state.filter = { ..._state.filter, ...(action.payload as Record<string, string>) };
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    case 'SET_INLINE_FILTER':
      _state.inlineFilters = { ..._state.inlineFilters, ...(action.payload as Record<string, string>) };
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    case 'CLEAR_FILTERS':
      _state.filter = { search: '', status: '', user: '' };
      _state.inlineFilters = {};
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    case 'SET_SORT': {
      const sortPayload = action.payload as { sortBy: string; sortOrder: string };
      _state.sortBy = sortPayload.sortBy;
      _state.sortOrder = sortPayload.sortOrder;
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    }
    case 'TOGGLE_SELECT': {
      const id = action.payload as string;
      if (_state.selectedIds.includes(id)) { _state.selectedIds = _state.selectedIds.filter(i => i !== id); }
      else { _state.selectedIds = [..._state.selectedIds, id]; }
      break;
    }
    case 'SELECT_ALL': _state.selectedIds = _state.filteredSessions.map(s => s.id || s.session_id) as string[]; break;
    case 'DESELECT_ALL': _state.selectedIds = []; break;
    case 'TOGGLE_EXPAND': {
      const expandId = action.payload as string;
      if (_state.expandedIds.includes(expandId)) { _state.expandedIds = _state.expandedIds.filter(i => i !== expandId); }
      else { _state.expandedIds = [..._state.expandedIds, expandId]; }
      break;
    }
    case 'TOGGLE_COLUMN': {
      const col = action.payload as string;
      if (_state.hiddenColumns.includes(col)) { _state.hiddenColumns = _state.hiddenColumns.filter(c => c !== col); }
      else { _state.hiddenColumns = [..._state.hiddenColumns, col]; }
      break;
    }
    case 'SET_CONFIRM_MODAL': _state.confirmModal = action.payload as Record<string, unknown>; break;
    case 'CLOSE_CONFIRM_MODAL': _state.confirmModal = null; break;
    case 'REMOVE_SESSION': {
      const sessionId = action.payload as string;
      _state.sessions = _state.sessions.filter(s => (s.id || s.session_id) !== sessionId);
      _state.filteredSessions = _applyFilters(_state.sessions);
      _state.selectedIds = _state.selectedIds.filter(i => i !== sessionId);
      break;
    }
    case 'REMOVE_SESSIONS': {
      const sessionIds = (action.payload as string[]) || [];
      _state.sessions = _state.sessions.filter(s => !sessionIds.includes(s.id as string || s.session_id as string));
      _state.filteredSessions = _applyFilters(_state.sessions);
      _state.selectedIds = _state.selectedIds.filter(i => !sessionIds.includes(i));
      break;
    }
    case 'UPDATE_AUTH_CONTEXT': {
      const newContext = _determineAuthContext();
      _state.isAdmin = newContext.isAdmin;
      _state.currentUserId = newContext.userId;
      break;
    }
    case 'RESET': _state = { ...initialState }; break;
    default: _log('warn', 'Unknown action type', { type: action.type });
  }
  _notify();
}

function _applyFilters(sessions: Record<string, unknown>[]) {
  let result = [...sessions];
  if (_state.filter.search) {
    const search = _state.filter.search.toLowerCase();
    result = result.filter(s =>
      (String(s.user_agent || '')).toLowerCase().includes(search) ||
      (String(s.ip_address || '')).toLowerCase().includes(search) ||
      (String(s.user_name || s.userName || '')).toLowerCase().includes(search) ||
      (String(s.user_email || s.userEmail || '')).toLowerCase().includes(search)
    );
  }
  if (_state.filter.status) { result = result.filter(s => s.status === _state.filter.status); }
  if (_state.filter.user) {
    result = result.filter(s =>
      (s.user_id || s.userId) == _state.filter.user ||
      (String(s.user_name || s.userName || '')).toLowerCase().includes(_state.filter.user.toLowerCase())
    );
  }
  Object.entries(_state.inlineFilters).forEach(([field, value]) => {
    if (value) { result = result.filter(s => String((s as Record<string, unknown>)[field] || '').toLowerCase().includes(String(value).toLowerCase())); }
  });
  result.sort((a, b) => {
    const aVal = a[_state.sortBy] || '';
    const bVal = b[_state.sortBy] || '';
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    if (aVal > bVal) comparison = 1;
    return _state.sortOrder === 'desc' ? -comparison : comparison;
  });
  return result;
}

export function getState() { return { ..._state }; }
export function getSessions() { return _state.sessions; }
export function getFilteredSessions() { return _state.filteredSessions; }
export function getSelectedIds() { return _state.selectedIds; }
export function getExpandedIds() { return _state.expandedIds; }
export function getFilter() { return _state.filter; }
export function getConfirmModal() { return _state.confirmModal; }
export function isLoading() { return _state.loading; }
export function getError() { return _state.error; }
export function isAdmin() { return _state.isAdmin; }
export function getCurrentUserId() { return _state.currentUserId; }
export function ensureAuth() { const ctx = _determineAuthContext(); if (!ctx.authenticated) { _log("warn", "Auth check failed"); return { ok: false, context: ctx }; } _state.isAdmin = ctx.isAdmin; _state.currentUserId = ctx.userId; return { ok: true, context: ctx }; }
export function isRefreshInProgress() { return _state.loading; }

export function canTerminateSelected() {
  if (_state.selectedIds.length === 0) return false;
  if (_state.isAdmin) return true;
  return _state.selectedIds.every(id => {
    const session = _state.sessions.find(s => (s.id || s.session_id) === id);
    return session && (session.user_id || session.userId) === _state.currentUserId;
  });
}

export function subscribe(listener: (state: typeof initialState) => void) {
  _listeners.push(listener);
  return () => { _listeners = _listeners.filter(l => l !== listener); };
}

export function injectPorts(ports: Record<string, unknown>) {
  _ports = ports || {};
  if (ports && ports.logger) { _CorePorts.inject({ logger: ports.logger }); }
  if (_state.initialized) { dispatch({ type: 'UPDATE_AUTH_CONTEXT' }); }
}

export function getPorts() { return { ..._ports }; }

export function healthCheck() {
  return { status: 'healthy', initialized: _state.initialized, sessionsCount: _state.sessions.length, isAdmin: _state.isAdmin, listenersCount: _listeners.length, portsInjected: Object.keys(_ports).length, portsInitialized: _CorePorts.isInitialized(), strictMode: isStrict(), version: VERSION };
}

export function getVersion() { return VERSION; }

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: { initialized: _state.initialized, sessionsCount: _state.sessions.length, filteredCount: _state.filteredSessions.length, selectedCount: _state.selectedIds.length, isAdmin: _state.isAdmin }, uarps_triggers: UARPS_TRIGGERS };
}

export default { VERSION, MODULE_ID, dispatch, getState, getSessions, getFilteredSessions, getSelectedIds, getExpandedIds, getFilter, getConfirmModal, isLoading, getError, isAdmin, getCurrentUserId, ensureAuth, isRefreshInProgress, canTerminateSelected, subscribe, injectPorts, getPorts, healthCheck, getVersion, info };
