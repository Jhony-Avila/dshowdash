

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management:lifecycle
// PURPOSE: Panel User Management - Lifecycle Orchestrator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   state, injectPorts as injectStatePorts from ../state/store.js
//   render, renderAuthBlockedView, renderSkeletonView from ../ui/renderer.js
//   loadData, viewUser, editUser, createUser, deleteUser, exportUsers, bulkUpdate...
//   setupEventHandlers from ../handlers/events.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   metrics — exported value
//   ensureAuth() — exported function
//   checkAction() — exported function
//   mount() — exported function
//   unmount() — exported function
//   refresh() — exported function
//   cleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getVersion() — exported function
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

// Core


// State
import { state, injectPorts as injectStatePorts } from '../state/store.js';

// UI
import { render, renderAuthBlockedView, renderSkeletonView } from '../ui/renderer.js';

// Handlers
import { loadData, viewUser, editUser, createUser, deleteUser, exportUsers, bulkUpdateStatus, updateUserStatus } from '../handlers/crud.js';
import { setupEventHandlers } from '../handlers/events.js';

// Telemetry
import { tracker } from '../telemetry/tracker.js';

// ============================================
// CONSTANTS
// ============================================

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-management:lifecycle';

// P3.2: UARPS Triggers
const UARPS_TRIGGERS = {
  VIEW: 'trigger:panel:user-management:view',
  CREATE: 'trigger:panel:user-management:create',
  UPDATE: 'trigger:panel:user-management:update',
  DELETE: 'trigger:panel:user-management:delete',
  ADMIN: 'trigger:panel:user-management:admin'
};

// P3.2: DEPRECATED - Fallback roles/levels
const ADMIN_ROLES = ['super_admin', 'admin'];
const MIN_ACCESS_LEVEL = 80;

// ============================================
// PORTS
// ============================================

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() {
  Ports.init();
}

function _getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>) {
  Ports.inject(p);
  injectStatePorts(p);
  return Ports.snapshot();
}

export function getPorts() {
  return Ports.snapshot();
}

// ============================================
// INTERNAL STATE
// ============================================

let _mounted = false;
let _container: HTMLElement | null = null;
let _stateUnsubscribe: (() => void) | null = null;
let _bulkMode = false;
let _selectedIds = new Set<string | number>();

// Métricas exportadas para handlers/crud.js
export const metrics: {
  loadCount: number;
  errorCount: number;
  authFailCount: number;
  permissionDeniedCount: number;
  lastActivity: number | null;
} = {
  loadCount: 0,
  errorCount: 0,
  authFailCount: 0,
  permissionDeniedCount: 0,
  lastActivity: null
};

// ============================================
// LOGGING & TELEMETRY
// ============================================

function _log(level: string, message: string, data: unknown = null) {
  const logger = _getPort('logger');
  if (logger?.[level]) {
    logger[level](`[${MODULE_ID}] ${message}`, data);
  } else {
    console[level === 'error' ? 'error' : 'log'](`[${MODULE_ID}] ${message}`, data || '');
  }
}

// ============================================
// AUTH & ACCESS VALIDATION
// ============================================

function _validateAccess() {
  const auth = _getPort('auth');

  if (!auth) {
    _log('warn', 'Auth port not injected');
    return false;
  }

  const user = auth.getUser?.();
  if (!user) {
    _log('warn', 'User not authenticated');
    return false;
  }

  // P3.2: Tenta via porta auth (UARPS)
  if (auth.can?.('user-management:view')) {
    return true;
  }

  // P3.2: Fallback por roles (DEPRECATED)
  const roles: string[] = auth.getRoles?.() || user.roles || [];
  if (roles.some((r: string) => ADMIN_ROLES.includes(r))) {
    return true;
  }

  // P3.2: Fallback por nível (DEPRECATED)
  const level = auth.getLevel?.() || user.level || 0;
  if (level >= MIN_ACCESS_LEVEL) {
    return true;
  }

  _log('warn', 'Access denied - insufficient permissions');
  return false;
}

// Exportado para uso em handlers/crud.js
export function ensureAuth(action: string) {
  _initPorts();
  const auth = _getPort('auth');

  if (!auth?.isAuthenticated?.()) {
    tracker.trackAuthRequired(action);
    metrics.authFailCount++;
    return false;
  }

  return true;
}

// Exportado para uso em handlers/crud.js
export function checkAction(action: string, targetId: string | number | null = null) {
  _initPorts();
  const auth = _getPort('auth');

  // P3.2: Tenta via UARPS
  if (auth?.can?.(`user-management:${action}`)) {
    return true;
  }

  // Fallback: admins podem tudo
  const roles: string[] = auth?.getRoles?.() || [];
  if (roles.some((r: string) => ADMIN_ROLES.includes(r))) {
    return true;
  }

  tracker.trackAccessDenied(action, 'insufficient_permissions');
  metrics.permissionDeniedCount++;
  return false;
}

// ============================================
// BULK MODE MANAGEMENT
// ============================================

function _toggleBulkMode() {
  _bulkMode = !_bulkMode;
  if (!_bulkMode) {
    _selectedIds.clear();
  }
  _render();
}

function _toggleSelect(userId: string | number) {
  if (_selectedIds.has(userId)) {
    _selectedIds.delete(userId);
  } else {
    _selectedIds.add(userId);
  }
  _render();
}

function _selectAll() {
  const users = state.getUsers();
  if (_selectedIds.size === users.length) {
    _selectedIds.clear();
  } else {
    users.forEach((u: Record<string, unknown>) => { _selectedIds.add(u.id as string | number); });
  }
  _render();
}

function _handleBulkAction(action: string) {
  const ids = Array.from(_selectedIds);
  if (ids.length === 0) return;

  switch (action) {
    case 'activate':
      bulkUpdateStatus(ids, 'active').then(() => { _selectedIds.clear(); _bulkMode = false; });
      break;
    case 'deactivate':
      bulkUpdateStatus(ids, 'disabled').then(() => { _selectedIds.clear(); _bulkMode = false; });
      break;
    case 'delete':
      if (confirm(`Tem certeza que deseja excluir ${ids.length} usuários?`)) {
        let chain = Promise.resolve();
        // @ts-expect-error strict migration — TS2322
        ids.forEach(id => { chain = chain.then(() => deleteUser(id)); });
        chain.then(() => { _selectedIds.clear(); _bulkMode = false; loadData(); });
      }
      break;
    default:
      _log('warn', `Unknown bulk action: ${action}`);
  }
}

// ============================================
// RENDER ORCHESTRATION
// ============================================

function _createHandlers() {
  return {
    // Navigation
    back: () => {
      state.setSelectedUser(null);
      _render();
    },

    // CRUD
    viewUser: (userId: string | number) => viewUser(userId),
    editUser: (userId: string | number) => {
      const user = state.getUsers().find((u: Record<string, unknown>) => u.id == userId);
      if (user) {
        state.setSelectedUser(user);
        _render();
      }
    },
    deleteUser: (userId: string | number) => {
      if (confirm('Tem certeza que deseja excluir este usuário?')) {
        deleteUser(userId);
      }
    },
    createUser: () => {
      createUser({
        username: '',
        email: '',
        status: 'active'
      });
    },
    toggleStatus: (userId: string | number) => {
      const user = state.getUsers().find((u: Record<string, unknown>) => u.id == userId);
      if (user) {
        const newStatus = (user as Record<string, unknown>).status === 'active' ? 'disabled' : 'active';
        updateUserStatus(userId, newStatus);
      }
    },

    // Pagination
    goToPage: (page: number) => {
      state.setPage(page);
      _render();
    },

    // Search & Filters
    search: (value: string) => {
      state.setFilters({ search: value });
      _render();
    },
    filter: (filterName: string, value: string) => {
      state.setFilters({ [filterName]: value });
      _render();
    },

    // Bulk operations
    toggleBulkMode: () => _toggleBulkMode(),
    toggleSelect: (userId: string | number) => _toggleSelect(userId),
    selectAll: () => _selectAll(),
    bulkAction: (action: string) => _handleBulkAction(action),

    // Actions
    refresh: () => loadData(),
    retry: () => loadData(),
    exportUsers: () => exportUsers('csv'),
    openLogin: () => {
      const eventBus = _getPort('eventBus');
      eventBus?.emit?.('auth:login-required', { source: MODULE_ID });
    }
  };
}

function _render() {
  if (!_container || !_mounted) return;

  const currentState = state.getState();
  const handlers = _createHandlers();

  render(_container, {
    loading: currentState.loading,
    error: currentState.error,
    users: currentState.users,
    selectedUser: currentState.selectedUser,
    pagination: currentState.pagination,
    search: currentState.filters?.search || '',
    filters: currentState.filters,
    bulkMode: _bulkMode,
    selectedIds: Array.from(_selectedIds)
  // @ts-expect-error strict migration — TS2345
  }, handlers);
}

// ============================================
// LIFECYCLE
// ============================================

function _setupExternalListeners() {
  const eventBus = _getPort('eventBus');
  if (!eventBus) return;

  // Escuta refresh externo
  eventBus.on?.('users:refresh', () => loadData());
}

function _removeExternalListeners() {
  const eventBus = _getPort('eventBus');
  if (!eventBus) return;

  eventBus.off?.('users:refresh');
}

// ============================================
// PUBLIC API
// ============================================

export function mount(container: HTMLElement, ports: Record<string, unknown> = {}) {
  if (_mounted) {
    _log('warn', 'Already mounted');
    return false;
  }

  _container = container;

  // Injeta ports
  if (Object.keys(ports).length > 0) {
    injectPorts(ports);
  }

  _initPorts();

  // P3.2: Valida acesso
  if (!_validateAccess()) {
    _log('error', 'Access denied');
    tracker.trackAccessDenied('mount', 'validation_failed');
    // @ts-expect-error strict migration — TS2345
    renderAuthBlockedView(_container, _createHandlers());
    return false;
  }

  _mounted = true;
  tracker.trackMount();

  // Subscribe para re-render automático
  _stateUnsubscribe = state.subscribe(() => {
    if (_mounted) _render();
  });

  // Setup listeners externos
  _setupExternalListeners();

  // Setup event handlers no container
  setupEventHandlers(_container);

  // Render inicial (skeleton)
  renderSkeletonView(_container);

  // Carrega dados
  loadData();

  return true;
}

export function unmount() {
  if (!_mounted) return false;

  tracker.trackUnmount();

  // Remove subscription
  if (_stateUnsubscribe) {
    _stateUnsubscribe();
    _stateUnsubscribe = null;
  }

  // Remove listeners externos
  _removeExternalListeners();

  // Limpa container
  if (_container) {
    _container.innerHTML = '';
  }

  // Reset state
  state.reset();
  _bulkMode = false;
  _selectedIds.clear();

  _mounted = false;
  _container = null;

  return true;
}

export function refresh() {
  if (!_mounted) return Promise.resolve(false);
  return loadData();
}

export function cleanup() {
  return unmount();
}

// ============================================
// HEALTH & INFO
// ============================================

export function healthCheck() {
  const stateHealth = state.healthCheck?.() || { status: 'unknown' };
  const portsSnapshot = Ports.snapshot();

  const checks = {
    mounted: _mounted,
    hasContainer: !!_container,
    portsInitialized: portsSnapshot._initialized,
    stateHealthy: stateHealth.status === 'healthy',
    noErrors: !state.getError(),
    hasData: state.getUsers().length > 0
  };

  const passed = Object.values(checks).filter(Boolean).length;

  return {
    status: passed >= 5 ? 'healthy' : passed >= 3 ? 'degraded' : 'unhealthy',
    score: passed,
    maxScore: 6,
    version: VERSION,
    moduleId: MODULE_ID,
    checks,
    metrics,
    stateHealth
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: _mounted,
    usersCount: state.getUsers().length,
    bulkMode: _bulkMode,
    selectedCount: _selectedIds.size,
    ports: Object.keys(Ports.snapshot()),
    uarps_triggers: UARPS_TRIGGERS,
    metrics,
    stateInfo: state.info?.()
  };
}

export function getVersion() {
  return VERSION;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  VERSION,
  MODULE_ID,
  mount,
  unmount,
  refresh,
  cleanup,
  healthCheck,
  info,
  getVersion,
  injectPorts,
  getPorts,
  ensureAuth,
  checkAction,
  metrics
};

// Alias export: consumers import { LifecycleManager } from this module
export const LifecycleManager = {
  mount,
  unmount,
  refresh,
  cleanup,
  healthCheck,
  info,
  getVersion,
  injectPorts,
  getPorts,
  ensureAuth,
  checkAction,
  metrics,
  VERSION,
  MODULE_ID
};
