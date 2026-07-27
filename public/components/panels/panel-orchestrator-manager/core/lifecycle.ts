

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator-manager:lifecycle
// PURPOSE: Panel Orchestrator Manager - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   mount() — exported function
//   unmount() — exported function
//   init() — exported function
//   cleanup() — exported function
//   refresh() — exported function
//   handleAction() — exported function
//   getState() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'auth:changed'
//   'orchestrator:refresh'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════

'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-orchestrator-manager:lifecycle';
export const PANEL_ID = 'panel-orchestrator-manager';
export const PANEL_NAME = 'Orchestrator Manager';
export const metrics: Record<string, number> = {};
export function loadCSS(): void {
  const id = `css-${PANEL_ID}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `/components/panels/${PANEL_ID}/${PANEL_ID}.css`;
  document.head.appendChild(link);
}

// P3.2: Triggers UARPS
const UARPS_TRIGGERS = {
  VIEW: 'trigger:panel:orchestrator-manager:view',
  ADMIN: 'trigger:panel:orchestrator-manager:admin'
};

// P3.2: DEPRECATED - Nível mínimo fallback
const MIN_ACCESS_LEVEL = 80;

// Estado interno
let _mounted = false;
let _container: HTMLElement | null = null;
let _ports: Record<string, unknown> = {};
let _state: {
  loading: boolean;
  error: string | null;
  data: Record<string, unknown> | null;
  lastUpdate: number | null;
} = {
  loading: false,
  error: null,
  data: null,
  lastUpdate: null
};
let _listeners: Array<{ event: string; handler: () => void }> = [];

function _getPort(name: string): Record<string, unknown> | null {
  const val = (_ports as Record<string, unknown>)[name];
  return (val && typeof val === 'object') ? (val as Record<string, unknown>) : null;
}

function _log(level: string, message: string, data: Record<string, unknown> | null = null) {
  const logger = _getPort('logger');
  if (logger) {
    const fn = logger[level];
    if (typeof fn === 'function') {
      fn(`[${MODULE_ID}] ${message}`, data);
      return;
    }
  }
  console[level === 'error' ? 'error' : 'log'](`[${MODULE_ID}] ${message}`, data || '');
}

function _track(event: string, data: Record<string, unknown> = {}) {
  const telemetry = _getPort('telemetry');
  if (telemetry) {
    const fn = telemetry['track'];
    if (typeof fn === 'function') fn(`${MODULE_ID}:${event}`, data);
  }
}

// P3.2: Verifica permissões com UARPS + fallback
function _checkPermissions() {
  const auth = _getPort('auth');
  
  if (!auth) {
    _log('warn', 'Auth port not injected');
    return false;
  }
  
  // Verifica autenticação
  const isAuthFn = auth['isAuthenticated'];
  const getUserFn = auth['getUser'];
  const isAuthenticated = (typeof isAuthFn === 'function' && isAuthFn()) || !!(typeof getUserFn === 'function' && getUserFn());
  if (!isAuthenticated) {
    _log('warn', 'User not authenticated');
    return false;
  }

  // P3.2: Tenta via porta auth (que pode usar UARPS internamente)
  const canFn = auth['can'];
  if (typeof canFn === 'function' && canFn('orchestrator-manager:view')) {
    return true;
  }

  // Verifica roles admin
  const getRolesFn = auth['getRoles'];
  const roles: string[] = (typeof getRolesFn === 'function' && getRolesFn()) || [];
  if (roles.includes('super_admin') || roles.includes('admin')) {
    return true;
  }

  // P3.2: Fallback por nível (DEPRECATED)
  const getLevelFn = auth['getLevel'];
  const level: number = (typeof getLevelFn === 'function' && getLevelFn()) || 0;
  return level >= MIN_ACCESS_LEVEL;
}

function _setupEventListeners() {
  const eventBus = _getPort('eventBus');
  if (!eventBus) return;
  
  // Listener para refresh
  const refreshHandler = () => {
    _refreshData();
  };
  const onFn = typeof eventBus['on'] === 'function' ? eventBus['on'].bind(eventBus) : null;
  if (!onFn) return;
  onFn('orchestrator:refresh', refreshHandler);
  _listeners.push({ event: 'orchestrator:refresh', handler: refreshHandler });

  // Listener para mudança de auth
  const authHandler = () => {
    if (!_checkPermissions()) {
      _log('warn', 'Permissions revoked, unmounting');
      unmount();
    }
  };
  onFn('auth:changed', authHandler);
  _listeners.push({ event: 'auth:changed', handler: authHandler });
}

function _removeEventListeners() {
  const eventBus = _getPort('eventBus');
  if (!eventBus) return;
  
  const offFn = typeof eventBus['off'] === 'function' ? eventBus['off'].bind(eventBus) : null;
  _listeners.forEach(({ event, handler }) => {
    if (offFn) offFn(event, handler);
  });
  _listeners = [];
}

async function _loadInitialData() {
  _state.loading = true;
  _render();
  
  try {
    const apiClient = _getPort('apiClient');
    if (!apiClient) {
      throw new Error('API client not available');
    }
    
    const getFn = typeof apiClient['get'] === 'function' ? apiClient['get'].bind(apiClient) : null;
    if (!getFn) throw new Error('API client.get not available');
    const response = await getFn('/api/admin/orchestrator/status') as Record<string, unknown>;

    if (response.success) {
      _state.data = response.data as Record<string, unknown>;
      _state.lastUpdate = Date.now();
      _state.error = null;
      const components = (_state.data as Record<string, unknown>)?.components;
      _track('data:loaded', { componentsCount: Array.isArray(components) ? components.length : 0 });
    } else {
      throw new Error((response.error as string) || 'Failed to load data');
    }
  } catch (error) {
    const err = error as Error;
    _state.error = err.message;
    _log('error', 'Failed to load initial data', { error: err.message });
    _track('data:error', { error: err.message });
  } finally {
    _state.loading = false;
    _render();
  }
}

async function _refreshData() {
  if (_state.loading) return;
  
  _track('refresh:start');
  await _loadInitialData();
  _track('refresh:complete');
}

function _render() {
  if (!_container) return;
  
  const template = _getPort('template');
  if (template) {
    const renderFn = template['render'];
    if (typeof renderFn === 'function') {
      renderFn(_container, _state);
      return;
    }
  }
  {
    // Fallback render
    _container.innerHTML = _buildFallbackHTML();
  }
}

function _buildFallbackHTML() {
  if (_state.loading) {
    return '<div class="pom-loading">Carregando...</div>';
  }
  
  if (_state.error) {
    return `<div class="pom-error">Erro: ${_state.error}</div>`;
  }
  
  if (!_state.data) {
    return '<div class="pom-empty">Nenhum dado disponível</div>';
  }
  
  const components = (Array.isArray(_state.data.components) ? _state.data.components : []) as Record<string, unknown>[];
  const stats = _state.data.stats as Record<string, unknown> | undefined;
  return `
    <div class="pom-container">
      <div class="pom-header">
        <h2>Orchestrator Manager</h2>
        <span class="pom-status">${_state.data.status || 'unknown'}</span>
      </div>
      <div class="pom-stats">
        <span>Componentes: ${components.length}</span>
        <span>Healthy: ${stats?.healthy || 0}</span>
        <span>Degraded: ${stats?.degraded || 0}</span>
      </div>
      <div class="pom-components">
        ${components.map((c: Record<string, unknown>) => `
          <div class="pom-component" data-key="${c.component_key}">
            <span class="pom-component-name">${c.component_name || c.component_key}</span>
            <span class="pom-component-status pom-status-${c.status}">${c.status}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _handleAction(action: string, data: unknown) {
  _track('action', { action, data });
  
  switch (action) {
    case 'refresh':
      _refreshData();
      break;
    case 'sync':
      _syncComponent(data as string);
      break;
    case 'sync-all':
      _syncAllComponents();
      break;
    default:
      _log('warn', 'Unknown action', { action });
  }
}

async function _syncComponent(componentKey: string) {
  if (!componentKey) return;
  
  const apiClient = _getPort('apiClient');
  if (!apiClient) return;
  
  try {
    _track('sync:start', { componentKey });
    const postFn = typeof apiClient['post'] === 'function' ? apiClient['post'].bind(apiClient) : null;
    if (!postFn) throw new Error('API client.post not available');
    const response = await postFn('/api/admin/orchestrator/sync', { component_key: componentKey }) as Record<string, unknown>;

    if (response.success) {
      _track('sync:success', { componentKey });
      _refreshData();
    } else {
      throw new Error((response.error as string) || 'Sync failed');
    }
  } catch (error) {
    const err = error as Error;
    _log('error', 'Sync failed', { componentKey, error: err.message });
    _track('sync:error', { componentKey, error: err.message });
  }
}

async function _syncAllComponents() {
  const apiClient = _getPort('apiClient');
  if (!apiClient) return;

  try {
    _track('sync-all:start');
    const postFn = typeof apiClient['post'] === 'function' ? apiClient['post'].bind(apiClient) : null;
    if (!postFn) throw new Error('API client.post not available');
    const response = await postFn('/api/admin/orchestrator/sync-all', {}) as Record<string, unknown>;

    if (response.success) {
      _track('sync-all:success', { results: response.data });
      _refreshData();
    } else {
      throw new Error((response.error as string) || 'Sync all failed');
    }
  } catch (error) {
    const err = error as Error;
    _log('error', 'Sync all failed', { error: err.message });
    _track('sync-all:error', { error: err.message });
  }
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
  _ports = ports;
  
  // P3.2: Verifica permissões
  if (!_checkPermissions()) {
    _log('error', 'Access denied');
    _track('mount:denied');
    _container.innerHTML = '<div class="pom-access-denied">Acesso negado</div>';
    return false;
  }
  
  _mounted = true;
  _track('mount');
  
  // Setup
  _setupEventListeners();
  _loadInitialData();
  
  return true;
}

export function unmount() {
  if (!_mounted) return false;
  
  _track('unmount');
  _removeEventListeners();
  
  _mounted = false;
  _container = null;
  _state = { loading: false, error: null, data: null, lastUpdate: null };
  
  return true;
}

export function init(ports = {}) {
  _ports = { ..._ports, ...ports };
  _track('init');
  return true;
}

export function cleanup() {
  return unmount();
}

export function refresh() {
  return _refreshData();
}

export function handleAction(action: string, data: unknown) {
  return _handleAction(action, data);
}

export function getState() {
  return { ..._state };
}

export function healthCheck() {
  return {
    status: _mounted ? 'healthy' : 'unmounted',
    mounted: _mounted,
    hasContainer: !!_container,
    portsInjected: Object.keys(_ports).length,
    hasData: !!_state.data,
    lastUpdate: _state.lastUpdate,
    version: VERSION
  };
}

export function getVersion() {
  return VERSION;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: _mounted,
    state: getState(),
    ports: Object.keys(_ports),
    uarps_triggers: UARPS_TRIGGERS
  };
}

// Alias exports for compatibility
export function ensureAuth(): boolean {
  const auth = _getPort('auth');
  if (!auth) return false;
  const isAuthFn = auth['isAuthenticated'];
  const getUserFn = auth['getUser'];
  return (typeof isAuthFn === 'function' && isAuthFn()) || !!(typeof getUserFn === 'function' && getUserFn());
}

export function checkPanelAccess(): boolean {
  return _checkPermissions();
}

export default {
  VERSION,
  MODULE_ID,
  mount,
  unmount,
  init,
  cleanup,
  refresh,
  handleAction,
  getState,
  healthCheck,
  getVersion,
  info,
  ensureAuth,
  checkPanelAccess
};
