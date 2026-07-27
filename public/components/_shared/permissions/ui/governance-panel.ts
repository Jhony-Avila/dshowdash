// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.ui.governance-panel
// PURPOSE: Governance Panel UI for UARPS permission management
// ───────────────────────────────────────────────────────────────
// @contract MOUNT - mount(container) mounts the panel to DOM
// @contract UNMOUNT - unmount() unmounts the panel from DOM
// @contract REFRESH - refresh() refreshes user list and matrix
// @contract IS_MOUNTED - isMounted() returns mount state
// @contract HEALTH - healthCheck() and info() for observability
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES: mount, unmount, refresh, isMounted, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v2.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.3.0-P17WI: Ports via PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions.ui.governance-panel';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const GP_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  minus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  ban: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>'
};

const API_BASE = '/api/permissions/uarps.php';

const _log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string, data?: unknown) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(prefix, msg, data || ''); }
  else if (level === 'warn') { if (logger.warn) logger.warn(prefix, msg, data || ''); }
  else { if (logger.info) logger.info(prefix, msg, data || ''); }
};

const _state: {
  mounted: boolean;
  container: HTMLElement | null;
  users: Array<Record<string, any>>;
  selectedUserId: string | number | null;
  userPermissions: { triggers: Record<string, string>; regions: Record<string, string> };
  pendingChanges: Record<string, string>;
  loading: boolean;
  error: string | null;
} = {
  mounted: false,
  container: null,
  users: [],
  selectedUserId: null,
  userPermissions: { triggers: {}, regions: {} },
  pendingChanges: {},
  loading: false,
  error: null
};

function _fetchUsers() {
  return fetch(`${API_BASE}?action=all-users`, { credentials: 'include' })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => data.ok ? data.users : [] as Array<Record<string, any>>)
    .catch((e): Array<Record<string, any>> => { _log('error', 'Failed to fetch users', e.message); return []; });
}

function _fetchUserMatrix(userId: string | number) {
  return fetch(`${API_BASE}?action=user-matrix&user_id=${userId}`, { credentials: 'include' })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data.ok) return { triggers: data.triggers || {}, regions: data.regions || {} };
      return { triggers: {}, regions: {} };
    })
    .catch(e => { _log('error', 'Failed to fetch user matrix', e.message); return { triggers: {}, regions: {} }; });
}

function _saveTriggerPermission(userId: string | number, triggerId: string, state: string, reason: string | null) {
  return fetch(`${API_BASE}?action=set-trigger`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, trigger_id: triggerId, state, reason: reason || null })
  })
    .then(response => response.json())
    .then(data => data.ok)
    .catch(e => { _log('error', 'Failed to save trigger permission', e.message); return false; });
}

function _saveRegionPermission(userId: string | number, regionId: string, state: string, reason: string | null) {
  return fetch(`${API_BASE}?action=set-region`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, region_id: regionId, state, reason: reason || null })
  })
    .then(response => response.json())
    .then(data => data.ok)
    .catch(e => { _log('error', 'Failed to save region permission', e.message); return false; });
}

function _bulkSave(userId: string | number, permissions: Record<string, unknown>, reason?: string) {
  const reasonText = reason || 'Bulk update via Governance Panel';
  const triggers: Record<string, unknown> = {};
  const regions: Record<string, unknown> = {};
  for (const id in permissions) {
    if (permissions.hasOwnProperty(id)) {
      if (id.indexOf('trigger:') === 0) triggers[id] = permissions[id];
      else if (id.indexOf('region:') === 0) regions[id] = permissions[id];
    }
  }
  const promises = [];
  if (Object.keys(triggers).length > 0) {
    promises.push(
      fetch(`${API_BASE}?action=bulk-set-triggers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, permissions: triggers, reason: reasonText })
      }).then(r => r.json()).then(d => d.ok).catch(() => false)
    );
  }
  if (Object.keys(regions).length > 0) {
    promises.push(
      fetch(`${API_BASE}?action=bulk-set-regions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, permissions: regions, reason: reasonText })
      }).then(r => r.json()).then(d => d.ok).catch(() => false)
    );
  }
  return Promise.all(promises).then(results => results.every(r => r));
}

function _render() {
  if (!_state.container) return;
  const pendingCount = Object.keys(_state.pendingChanges).length;
  const usersHtml = _state.loading
    ? '<div class="gov-panel__loading">Carregando...</div>'
    : _state.users.map(u => `<div class="gov-panel__user-item ${_state.selectedUserId == u.id ? 'gov-panel__user-item--active' : ''}" data-user-id="${u.id}"><strong>${u.nome_completo || u.username}</strong><small>${u.email}</small><span class="gov-panel__level">Level: ${u.level}</span></div>`).join('');
  const mainContent = !_state.selectedUserId
    ? '<div class="gov-panel__empty">Selecione um usuário para gerenciar permissões</div>'
    : `<div class="gov-panel__matrix"><h3>Triggers</h3><div class="gov-panel__triggers">${_renderTriggerMatrix()}</div><h3>Regiões</h3><div class="gov-panel__regions">${_renderRegionMatrix()}</div></div>`;
  const actionsHtml = pendingCount > 0
    ? `<span class="gov-panel__badge">${pendingCount} alterações</span><button class="gov-panel__btn gov-panel__btn--save" data-action="save">Salvar</button><button class="gov-panel__btn gov-panel__btn--cancel" data-action="cancel">Cancelar</button>`
    : '';
  _state.container.innerHTML = `<div class="gov-panel"><div class="gov-panel__header"><h2 class="gov-panel__title">Governança de Permissões (UARPS)</h2><div class="gov-panel__actions">${actionsHtml}<button class="gov-panel__btn gov-panel__btn--refresh" data-action="refresh">Atualizar</button></div></div><div class="gov-panel__body"><aside class="gov-panel__sidebar"><h3>Usuários</h3><div class="gov-panel__user-list">${usersHtml}</div></aside><main class="gov-panel__main">${mainContent}</main></div>${_state.error ? `<div class="gov-panel__error">${_state.error}</div>` : ''}</div>`;
  _attachEvents();
}

function _renderTriggerMatrix() {
  const triggers = hasWindow && (window as any).Permissions && (window as any).Permissions.getAllTriggers ? (window as any).Permissions.getAllTriggers() : [];
  if (triggers.length === 0) return '<div class="gov-panel__empty">Nenhum trigger registrado</div>';
  const groups: Record<string, Array<Record<string, any>>> = {};
  triggers.forEach((t: Record<string, any>) => {
    const parts = t.id.split(':');
    const context = parts[1] || 'other';
    if (!groups[context]) groups[context] = [];
    groups[context].push(t);
  });
  let html = '';
  for (const context in groups) {
    if (groups.hasOwnProperty(context)) {
      html += `<div class="gov-panel__group"><h4>${context.toUpperCase()}</h4>${groups[context].map((t: Record<string, any>) => _renderPermissionRow(t.id, t.name, _getCurrentState(t.id))).join('')}</div>`;
    }
  }
  return html;
}

function _renderRegionMatrix() {
  const regions = hasWindow && (window as any).Permissions && (window as any).Permissions.getAllRegions ? (window as any).Permissions.getAllRegions() : [];
  if (regions.length === 0) return '<div class="gov-panel__empty">Nenhuma região registrada</div>';
  const groups: Record<string, Array<Record<string, any>>> = {};
  regions.forEach((r: Record<string, any>) => {
    const type = r.type || 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(r);
  });
  let html = '';
  for (const type in groups) {
    if (groups.hasOwnProperty(type)) {
      html += `<div class="gov-panel__group"><h4>${type.toUpperCase()}</h4>${groups[type].map((r: Record<string, any>) => _renderPermissionRow(r.id, r.name, _getCurrentState(r.id))).join('')}</div>`;
    }
  }
  return html;
}

function _renderPermissionRow(id: string, name: string, state: string) {
  const isPending = _state.pendingChanges.hasOwnProperty(id);
  const displayState = isPending ? _state.pendingChanges[id] : state;
  return `<div class="gov-panel__row ${isPending ? 'gov-panel__row--pending' : ''}" data-entity-id="${id}"><span class="gov-panel__row-name" title="${id}">${name}</span><div class="gov-panel__row-controls"><button class="gov-panel__state-btn ${displayState === 'allow' ? 'gov-panel__state-btn--active' : ''}" data-state="allow">${GP_SVGS.check} Allow</button><button class="gov-panel__state-btn ${displayState === 'inherit' ? 'gov-panel__state-btn--active' : ''}" data-state="inherit">${GP_SVGS.minus} Inherit</button><button class="gov-panel__state-btn ${displayState === 'deny' ? 'gov-panel__state-btn--active' : ''}" data-state="deny">${GP_SVGS.ban} Deny</button></div></div>`;
}

function _getCurrentState(entityId: string) {
  if (entityId.indexOf('trigger:') === 0) return _state.userPermissions.triggers[entityId] || 'inherit';
  return _state.userPermissions.regions[entityId] || 'inherit';
}

function _attachEvents() {
  if (!_state.container) return;
  // @ts-expect-error strict migration — TS2345
  _state.container.querySelectorAll('.gov-panel__user-item').forEach((el: HTMLElement) => {
    el.addEventListener('click', () => { _selectUser(el.dataset.userId!); });
  });
  // @ts-expect-error strict migration — TS2345
  _state.container.querySelectorAll('.gov-panel__row').forEach((row: HTMLElement) => {
    const entityId = row.dataset.entityId;
    // @ts-expect-error strict migration — TS2345
    row.querySelectorAll('.gov-panel__state-btn').forEach((btn: HTMLElement) => {
      btn.addEventListener('click', () => { _setState(entityId!, btn.dataset.state!); });
    });
  });
  // @ts-expect-error strict migration — TS2345
  _state.container.querySelectorAll('[data-action]').forEach((btn: HTMLElement) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'save') _saveChanges();
      else if (action === 'cancel') _cancelChanges();
      else if (action === 'refresh') _refresh();
    });
  });
}

function _selectUser(userId: string) {
  _state.selectedUserId = userId;
  _state.pendingChanges = {};
  _state.loading = true;
  _render();
  _fetchUserMatrix(userId).then(data => {
    _state.userPermissions = data;
    _state.loading = false;
    _render();
  });
}

function _setState(entityId: string, state: string) {
  const currentState = _getCurrentState(entityId);
  if (state === currentState && !_state.pendingChanges[entityId]) return;
  if (state === currentState) delete _state.pendingChanges[entityId];
  else _state.pendingChanges[entityId] = state;
  _render();
}

function _saveChanges() {
  if (!_state.selectedUserId || Object.keys(_state.pendingChanges).length === 0) return;
  _state.loading = true;
  _state.error = null;
  _render();
  _bulkSave(_state.selectedUserId, _state.pendingChanges).then(success => {
    if (success) {
      for (const id in _state.pendingChanges) {
        if (_state.pendingChanges.hasOwnProperty(id)) {
          if (id.indexOf('trigger:') === 0) _state.userPermissions.triggers[id] = _state.pendingChanges[id];
          else _state.userPermissions.regions[id] = _state.pendingChanges[id];
        }
      }
      _state.pendingChanges = {};
      _log('info', 'Permissions saved successfully');
    } else {
      _state.error = 'Falha ao salvar permissões';
    }
    _state.loading = false;
    _render();
  });
}

function _cancelChanges() {
  _state.pendingChanges = {};
  _render();
}

function _refresh() {
  _state.loading = true;
  _render();
  _fetchUsers().then(users => {
    _state.users = users;
    if (_state.selectedUserId) {
      return _fetchUserMatrix(_state.selectedUserId).then(data => { _state.userPermissions = data; });
    }
  }).then(() => {
    _state.loading = false;
    _state.pendingChanges = {};
    _render();
  });
}

function _loadCSS() {
  if (!hasDocument) return;
  if (document.querySelector('link[href*="governance-panel.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/components/_shared/permissions/ui/governance-panel.css';
  document.head.appendChild(link);
}

export function mount(container: HTMLElement) {
  if (_state.mounted) unmount();
  _initPorts();
  _state.container = container;
  _state.mounted = true;
  _state.loading = true;
  _render();
  _loadCSS();
  _fetchUsers().then(users => {
    _state.users = users;
    _state.loading = false;
    _render();
  });
  _log('info', 'Governance Panel mounted');
}

export function unmount() {
  if (!_state.mounted) return;
  if (_state.container) _state.container.innerHTML = '';
  _state.mounted = false;
  _state.container = null;
  _state.users = [];
  _state.selectedUserId = null;
  _state.userPermissions = { triggers: {}, regions: {} };
  _state.pendingChanges = {};
  _log('info', 'Governance Panel unmounted');
}

export function refresh() { _refresh(); }
export function isMounted() { return _state.mounted; }

export function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort('logger');
  return {
    status: _state.mounted ? 'HEALTHY' : 'IDLE',
    version: VERSION,
    moduleId: MODULE_ID,
    mounted: _state.mounted,
    usersLoaded: _state.users.length,
    selectedUser: _state.selectedUserId,
    pendingChanges: Object.keys(_state.pendingChanges).length,
    loggerAvailable: !!logger,
    portsInitialized: portsSnapshot._initialized,
    timestamp: Date.now()
  };
}

export function info() {
  const portsSnapshot = Ports.snapshot();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    mounted: _state.mounted,
    users: _state.users.length,
    selectedUserId: _state.selectedUserId,
    pendingChanges: Object.keys(_state.pendingChanges).length,
    portsInitialized: portsSnapshot._initialized,
    timestamp: Date.now()
  };
}

const GovernancePanel = {
  mount,
  unmount,
  refresh,
  isMounted,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};

if (hasWindow) (window as any).GovernancePanel = GovernancePanel;

export default GovernancePanel;
