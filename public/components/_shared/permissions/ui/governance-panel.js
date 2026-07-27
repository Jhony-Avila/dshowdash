import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.3.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions.ui.governance-panel";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const GP_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  minus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  ban: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>'
};
const API_BASE = "/api/permissions/uarps.php";
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, msg, data || "");
  } else if (level === "warn") {
    if (logger.warn) logger.warn(prefix, msg, data || "");
  } else {
    if (logger.info) logger.info(prefix, msg, data || "");
  }
};
const _state = {
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
  return fetch(`${API_BASE}?action=all-users`, { credentials: "include" }).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then((data) => data.ok ? data.users : []).catch((e) => {
    _log("error", "Failed to fetch users", e.message);
    return [];
  });
}
function _fetchUserMatrix(userId) {
  return fetch(`${API_BASE}?action=user-matrix&user_id=${userId}`, { credentials: "include" }).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then((data) => {
    if (data.ok) return { triggers: data.triggers || {}, regions: data.regions || {} };
    return { triggers: {}, regions: {} };
  }).catch((e) => {
    _log("error", "Failed to fetch user matrix", e.message);
    return { triggers: {}, regions: {} };
  });
}
function _saveTriggerPermission(userId, triggerId, state, reason) {
  return fetch(`${API_BASE}?action=set-trigger`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, trigger_id: triggerId, state, reason: reason || null })
  }).then((response) => response.json()).then((data) => data.ok).catch((e) => {
    _log("error", "Failed to save trigger permission", e.message);
    return false;
  });
}
function _saveRegionPermission(userId, regionId, state, reason) {
  return fetch(`${API_BASE}?action=set-region`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, region_id: regionId, state, reason: reason || null })
  }).then((response) => response.json()).then((data) => data.ok).catch((e) => {
    _log("error", "Failed to save region permission", e.message);
    return false;
  });
}
function _bulkSave(userId, permissions, reason) {
  const reasonText = reason || "Bulk update via Governance Panel";
  const triggers = {};
  const regions = {};
  for (const id in permissions) {
    if (permissions.hasOwnProperty(id)) {
      if (id.indexOf("trigger:") === 0) triggers[id] = permissions[id];
      else if (id.indexOf("region:") === 0) regions[id] = permissions[id];
    }
  }
  const promises = [];
  if (Object.keys(triggers).length > 0) {
    promises.push(
      fetch(`${API_BASE}?action=bulk-set-triggers`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, permissions: triggers, reason: reasonText })
      }).then((r) => r.json()).then((d) => d.ok).catch(() => false)
    );
  }
  if (Object.keys(regions).length > 0) {
    promises.push(
      fetch(`${API_BASE}?action=bulk-set-regions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, permissions: regions, reason: reasonText })
      }).then((r) => r.json()).then((d) => d.ok).catch(() => false)
    );
  }
  return Promise.all(promises).then((results) => results.every((r) => r));
}
function _render() {
  if (!_state.container) return;
  const pendingCount = Object.keys(_state.pendingChanges).length;
  const usersHtml = _state.loading ? '<div class="gov-panel__loading">Carregando...</div>' : _state.users.map((u) => `<div class="gov-panel__user-item ${_state.selectedUserId == u.id ? "gov-panel__user-item--active" : ""}" data-user-id="${u.id}"><strong>${u.nome_completo || u.username}</strong><small>${u.email}</small><span class="gov-panel__level">Level: ${u.level}</span></div>`).join("");
  const mainContent = !_state.selectedUserId ? '<div class="gov-panel__empty">Selecione um usu\xE1rio para gerenciar permiss\xF5es</div>' : `<div class="gov-panel__matrix"><h3>Triggers</h3><div class="gov-panel__triggers">${_renderTriggerMatrix()}</div><h3>Regi\xF5es</h3><div class="gov-panel__regions">${_renderRegionMatrix()}</div></div>`;
  const actionsHtml = pendingCount > 0 ? `<span class="gov-panel__badge">${pendingCount} altera\xE7\xF5es</span><button class="gov-panel__btn gov-panel__btn--save" data-action="save">Salvar</button><button class="gov-panel__btn gov-panel__btn--cancel" data-action="cancel">Cancelar</button>` : "";
  _state.container.innerHTML = `<div class="gov-panel"><div class="gov-panel__header"><h2 class="gov-panel__title">Governan\xE7a de Permiss\xF5es (UARPS)</h2><div class="gov-panel__actions">${actionsHtml}<button class="gov-panel__btn gov-panel__btn--refresh" data-action="refresh">Atualizar</button></div></div><div class="gov-panel__body"><aside class="gov-panel__sidebar"><h3>Usu\xE1rios</h3><div class="gov-panel__user-list">${usersHtml}</div></aside><main class="gov-panel__main">${mainContent}</main></div>${_state.error ? `<div class="gov-panel__error">${_state.error}</div>` : ""}</div>`;
  _attachEvents();
}
function _renderTriggerMatrix() {
  const triggers = hasWindow && window.Permissions && window.Permissions.getAllTriggers ? window.Permissions.getAllTriggers() : [];
  if (triggers.length === 0) return '<div class="gov-panel__empty">Nenhum trigger registrado</div>';
  const groups = {};
  triggers.forEach((t) => {
    const parts = t.id.split(":");
    const context = parts[1] || "other";
    if (!groups[context]) groups[context] = [];
    groups[context].push(t);
  });
  let html = "";
  for (const context in groups) {
    if (groups.hasOwnProperty(context)) {
      html += `<div class="gov-panel__group"><h4>${context.toUpperCase()}</h4>${groups[context].map((t) => _renderPermissionRow(t.id, t.name, _getCurrentState(t.id))).join("")}</div>`;
    }
  }
  return html;
}
function _renderRegionMatrix() {
  const regions = hasWindow && window.Permissions && window.Permissions.getAllRegions ? window.Permissions.getAllRegions() : [];
  if (regions.length === 0) return '<div class="gov-panel__empty">Nenhuma regi\xE3o registrada</div>';
  const groups = {};
  regions.forEach((r) => {
    const type = r.type || "other";
    if (!groups[type]) groups[type] = [];
    groups[type].push(r);
  });
  let html = "";
  for (const type in groups) {
    if (groups.hasOwnProperty(type)) {
      html += `<div class="gov-panel__group"><h4>${type.toUpperCase()}</h4>${groups[type].map((r) => _renderPermissionRow(r.id, r.name, _getCurrentState(r.id))).join("")}</div>`;
    }
  }
  return html;
}
function _renderPermissionRow(id, name, state) {
  const isPending = _state.pendingChanges.hasOwnProperty(id);
  const displayState = isPending ? _state.pendingChanges[id] : state;
  return `<div class="gov-panel__row ${isPending ? "gov-panel__row--pending" : ""}" data-entity-id="${id}"><span class="gov-panel__row-name" title="${id}">${name}</span><div class="gov-panel__row-controls"><button class="gov-panel__state-btn ${displayState === "allow" ? "gov-panel__state-btn--active" : ""}" data-state="allow">${GP_SVGS.check} Allow</button><button class="gov-panel__state-btn ${displayState === "inherit" ? "gov-panel__state-btn--active" : ""}" data-state="inherit">${GP_SVGS.minus} Inherit</button><button class="gov-panel__state-btn ${displayState === "deny" ? "gov-panel__state-btn--active" : ""}" data-state="deny">${GP_SVGS.ban} Deny</button></div></div>`;
}
function _getCurrentState(entityId) {
  if (entityId.indexOf("trigger:") === 0) return _state.userPermissions.triggers[entityId] || "inherit";
  return _state.userPermissions.regions[entityId] || "inherit";
}
function _attachEvents() {
  if (!_state.container) return;
  _state.container.querySelectorAll(".gov-panel__user-item").forEach((el) => {
    el.addEventListener("click", () => {
      _selectUser(el.dataset.userId);
    });
  });
  _state.container.querySelectorAll(".gov-panel__row").forEach((row) => {
    const entityId = row.dataset.entityId;
    row.querySelectorAll(".gov-panel__state-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        _setState(entityId, btn.dataset.state);
      });
    });
  });
  _state.container.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "save") _saveChanges();
      else if (action === "cancel") _cancelChanges();
      else if (action === "refresh") _refresh();
    });
  });
}
function _selectUser(userId) {
  _state.selectedUserId = userId;
  _state.pendingChanges = {};
  _state.loading = true;
  _render();
  _fetchUserMatrix(userId).then((data) => {
    _state.userPermissions = data;
    _state.loading = false;
    _render();
  });
}
function _setState(entityId, state) {
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
  _bulkSave(_state.selectedUserId, _state.pendingChanges).then((success) => {
    if (success) {
      for (const id in _state.pendingChanges) {
        if (_state.pendingChanges.hasOwnProperty(id)) {
          if (id.indexOf("trigger:") === 0) _state.userPermissions.triggers[id] = _state.pendingChanges[id];
          else _state.userPermissions.regions[id] = _state.pendingChanges[id];
        }
      }
      _state.pendingChanges = {};
      _log("info", "Permissions saved successfully");
    } else {
      _state.error = "Falha ao salvar permiss\xF5es";
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
  _fetchUsers().then((users) => {
    _state.users = users;
    if (_state.selectedUserId) {
      return _fetchUserMatrix(_state.selectedUserId).then((data) => {
        _state.userPermissions = data;
      });
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
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/_shared/permissions/ui/governance-panel.css";
  document.head.appendChild(link);
}
function mount(container) {
  if (_state.mounted) unmount();
  _initPorts();
  _state.container = container;
  _state.mounted = true;
  _state.loading = true;
  _render();
  _loadCSS();
  _fetchUsers().then((users) => {
    _state.users = users;
    _state.loading = false;
    _render();
  });
  _log("info", "Governance Panel mounted");
}
function unmount() {
  if (!_state.mounted) return;
  if (_state.container) _state.container.innerHTML = "";
  _state.mounted = false;
  _state.container = null;
  _state.users = [];
  _state.selectedUserId = null;
  _state.userPermissions = { triggers: {}, regions: {} };
  _state.pendingChanges = {};
  _log("info", "Governance Panel unmounted");
}
function refresh() {
  _refresh();
}
function isMounted() {
  return _state.mounted;
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort("logger");
  return {
    status: _state.mounted ? "HEALTHY" : "IDLE",
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
function info() {
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
if (hasWindow) window.GovernancePanel = GovernancePanel;
var governance_panel_default = GovernancePanel;
export {
  MODULE_ID,
  VERSION,
  governance_panel_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isMounted,
  mount,
  refresh,
  unmount
};
