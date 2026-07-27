const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator-manager:lifecycle";
const PANEL_ID = "panel-orchestrator-manager";
const PANEL_NAME = "Orchestrator Manager";
const metrics = {};
function loadCSS() {
  const id = `css-${PANEL_ID}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `/components/panels/${PANEL_ID}/${PANEL_ID}.css`;
  document.head.appendChild(link);
}
const UARPS_TRIGGERS = {
  VIEW: "trigger:panel:orchestrator-manager:view",
  ADMIN: "trigger:panel:orchestrator-manager:admin"
};
const MIN_ACCESS_LEVEL = 80;
let _mounted = false;
let _container = null;
let _ports = {};
let _state = {
  loading: false,
  error: null,
  data: null,
  lastUpdate: null
};
let _listeners = [];
function _getPort(name) {
  const val = _ports[name];
  return val && typeof val === "object" ? val : null;
}
function _log(level, message, data = null) {
  const logger = _getPort("logger");
  if (logger) {
    const fn = logger[level];
    if (typeof fn === "function") {
      fn(`[${MODULE_ID}] ${message}`, data);
      return;
    }
  }
  console[level === "error" ? "error" : "log"](`[${MODULE_ID}] ${message}`, data || "");
}
function _track(event, data = {}) {
  const telemetry = _getPort("telemetry");
  if (telemetry) {
    const fn = telemetry["track"];
    if (typeof fn === "function") fn(`${MODULE_ID}:${event}`, data);
  }
}
function _checkPermissions() {
  const auth = _getPort("auth");
  if (!auth) {
    _log("warn", "Auth port not injected");
    return false;
  }
  const isAuthFn = auth["isAuthenticated"];
  const getUserFn = auth["getUser"];
  const isAuthenticated = typeof isAuthFn === "function" && isAuthFn() || !!(typeof getUserFn === "function" && getUserFn());
  if (!isAuthenticated) {
    _log("warn", "User not authenticated");
    return false;
  }
  const canFn = auth["can"];
  if (typeof canFn === "function" && canFn("orchestrator-manager:view")) {
    return true;
  }
  const getRolesFn = auth["getRoles"];
  const roles = typeof getRolesFn === "function" && getRolesFn() || [];
  if (roles.includes("super_admin") || roles.includes("admin")) {
    return true;
  }
  const getLevelFn = auth["getLevel"];
  const level = typeof getLevelFn === "function" && getLevelFn() || 0;
  return level >= MIN_ACCESS_LEVEL;
}
function _setupEventListeners() {
  const eventBus = _getPort("eventBus");
  if (!eventBus) return;
  const refreshHandler = () => {
    _refreshData();
  };
  const onFn = typeof eventBus["on"] === "function" ? eventBus["on"].bind(eventBus) : null;
  if (!onFn) return;
  onFn("orchestrator:refresh", refreshHandler);
  _listeners.push({ event: "orchestrator:refresh", handler: refreshHandler });
  const authHandler = () => {
    if (!_checkPermissions()) {
      _log("warn", "Permissions revoked, unmounting");
      unmount();
    }
  };
  onFn("auth:changed", authHandler);
  _listeners.push({ event: "auth:changed", handler: authHandler });
}
function _removeEventListeners() {
  const eventBus = _getPort("eventBus");
  if (!eventBus) return;
  const offFn = typeof eventBus["off"] === "function" ? eventBus["off"].bind(eventBus) : null;
  _listeners.forEach(({ event, handler }) => {
    if (offFn) offFn(event, handler);
  });
  _listeners = [];
}
async function _loadInitialData() {
  _state.loading = true;
  _render();
  try {
    const apiClient = _getPort("apiClient");
    if (!apiClient) {
      throw new Error("API client not available");
    }
    const getFn = typeof apiClient["get"] === "function" ? apiClient["get"].bind(apiClient) : null;
    if (!getFn) throw new Error("API client.get not available");
    const response = await getFn("/api/admin/orchestrator/status");
    if (response.success) {
      _state.data = response.data;
      _state.lastUpdate = Date.now();
      _state.error = null;
      const components = _state.data?.components;
      _track("data:loaded", { componentsCount: Array.isArray(components) ? components.length : 0 });
    } else {
      throw new Error(response.error || "Failed to load data");
    }
  } catch (error) {
    const err = error;
    _state.error = err.message;
    _log("error", "Failed to load initial data", { error: err.message });
    _track("data:error", { error: err.message });
  } finally {
    _state.loading = false;
    _render();
  }
}
async function _refreshData() {
  if (_state.loading) return;
  _track("refresh:start");
  await _loadInitialData();
  _track("refresh:complete");
}
function _render() {
  if (!_container) return;
  const template = _getPort("template");
  if (template) {
    const renderFn = template["render"];
    if (typeof renderFn === "function") {
      renderFn(_container, _state);
      return;
    }
  }
  {
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
    return '<div class="pom-empty">Nenhum dado dispon\xEDvel</div>';
  }
  const components = Array.isArray(_state.data.components) ? _state.data.components : [];
  const stats = _state.data.stats;
  return `
    <div class="pom-container">
      <div class="pom-header">
        <h2>Orchestrator Manager</h2>
        <span class="pom-status">${_state.data.status || "unknown"}</span>
      </div>
      <div class="pom-stats">
        <span>Componentes: ${components.length}</span>
        <span>Healthy: ${stats?.healthy || 0}</span>
        <span>Degraded: ${stats?.degraded || 0}</span>
      </div>
      <div class="pom-components">
        ${components.map((c) => `
          <div class="pom-component" data-key="${c.component_key}">
            <span class="pom-component-name">${c.component_name || c.component_key}</span>
            <span class="pom-component-status pom-status-${c.status}">${c.status}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
function _handleAction(action, data) {
  _track("action", { action, data });
  switch (action) {
    case "refresh":
      _refreshData();
      break;
    case "sync":
      _syncComponent(data);
      break;
    case "sync-all":
      _syncAllComponents();
      break;
    default:
      _log("warn", "Unknown action", { action });
  }
}
async function _syncComponent(componentKey) {
  if (!componentKey) return;
  const apiClient = _getPort("apiClient");
  if (!apiClient) return;
  try {
    _track("sync:start", { componentKey });
    const postFn = typeof apiClient["post"] === "function" ? apiClient["post"].bind(apiClient) : null;
    if (!postFn) throw new Error("API client.post not available");
    const response = await postFn("/api/admin/orchestrator/sync", { component_key: componentKey });
    if (response.success) {
      _track("sync:success", { componentKey });
      _refreshData();
    } else {
      throw new Error(response.error || "Sync failed");
    }
  } catch (error) {
    const err = error;
    _log("error", "Sync failed", { componentKey, error: err.message });
    _track("sync:error", { componentKey, error: err.message });
  }
}
async function _syncAllComponents() {
  const apiClient = _getPort("apiClient");
  if (!apiClient) return;
  try {
    _track("sync-all:start");
    const postFn = typeof apiClient["post"] === "function" ? apiClient["post"].bind(apiClient) : null;
    if (!postFn) throw new Error("API client.post not available");
    const response = await postFn("/api/admin/orchestrator/sync-all", {});
    if (response.success) {
      _track("sync-all:success", { results: response.data });
      _refreshData();
    } else {
      throw new Error(response.error || "Sync all failed");
    }
  } catch (error) {
    const err = error;
    _log("error", "Sync all failed", { error: err.message });
    _track("sync-all:error", { error: err.message });
  }
}
function mount(container, ports = {}) {
  if (_mounted) {
    _log("warn", "Already mounted");
    return false;
  }
  _container = container;
  _ports = ports;
  if (!_checkPermissions()) {
    _log("error", "Access denied");
    _track("mount:denied");
    _container.innerHTML = '<div class="pom-access-denied">Acesso negado</div>';
    return false;
  }
  _mounted = true;
  _track("mount");
  _setupEventListeners();
  _loadInitialData();
  return true;
}
function unmount() {
  if (!_mounted) return false;
  _track("unmount");
  _removeEventListeners();
  _mounted = false;
  _container = null;
  _state = { loading: false, error: null, data: null, lastUpdate: null };
  return true;
}
function init(ports = {}) {
  _ports = { ..._ports, ...ports };
  _track("init");
  return true;
}
function cleanup() {
  return unmount();
}
function refresh() {
  return _refreshData();
}
function handleAction(action, data) {
  return _handleAction(action, data);
}
function getState() {
  return { ..._state };
}
function healthCheck() {
  return {
    status: _mounted ? "healthy" : "unmounted",
    mounted: _mounted,
    hasContainer: !!_container,
    portsInjected: Object.keys(_ports).length,
    hasData: !!_state.data,
    lastUpdate: _state.lastUpdate,
    version: VERSION
  };
}
function getVersion() {
  return VERSION;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: _mounted,
    state: getState(),
    ports: Object.keys(_ports),
    uarps_triggers: UARPS_TRIGGERS
  };
}
function ensureAuth() {
  const auth = _getPort("auth");
  if (!auth) return false;
  const isAuthFn = auth["isAuthenticated"];
  const getUserFn = auth["getUser"];
  return typeof isAuthFn === "function" && isAuthFn() || !!(typeof getUserFn === "function" && getUserFn());
}
function checkPanelAccess() {
  return _checkPermissions();
}
var lifecycle_default = {
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
export {
  MODULE_ID,
  PANEL_ID,
  PANEL_NAME,
  VERSION,
  checkPanelAccess,
  cleanup,
  lifecycle_default as default,
  ensureAuth,
  getState,
  getVersion,
  handleAction,
  healthCheck,
  info,
  init,
  loadCSS,
  metrics,
  mount,
  refresh,
  unmount
};
