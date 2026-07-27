import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { state, injectPorts as injectStatePorts } from "../state/store.js";
import { render, renderAuthBlockedView, renderSkeletonView } from "../ui/renderer.js";
import { loadData, viewUser, createUser, deleteUser, exportUsers, bulkUpdateStatus, updateUserStatus } from "../handlers/crud.js";
import { setupEventHandlers } from "../handlers/events.js";
import { tracker } from "../telemetry/tracker.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-management:lifecycle";
const UARPS_TRIGGERS = {
  VIEW: "trigger:panel:user-management:view",
  CREATE: "trigger:panel:user-management:create",
  UPDATE: "trigger:panel:user-management:update",
  DELETE: "trigger:panel:user-management:delete",
  ADMIN: "trigger:panel:user-management:admin"
};
const ADMIN_ROLES = ["super_admin", "admin"];
const MIN_ACCESS_LEVEL = 80;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  Ports.inject(p);
  injectStatePorts(p);
  return Ports.snapshot();
}
function getPorts() {
  return Ports.snapshot();
}
let _mounted = false;
let _container = null;
let _stateUnsubscribe = null;
let _bulkMode = false;
let _selectedIds = /* @__PURE__ */ new Set();
const metrics = {
  loadCount: 0,
  errorCount: 0,
  authFailCount: 0,
  permissionDeniedCount: 0,
  lastActivity: null
};
function _log(level, message, data = null) {
  const logger = _getPort("logger");
  if (logger?.[level]) {
    logger[level](`[${MODULE_ID}] ${message}`, data);
  } else {
    console[level === "error" ? "error" : "log"](`[${MODULE_ID}] ${message}`, data || "");
  }
}
function _validateAccess() {
  const auth = _getPort("auth");
  if (!auth) {
    _log("warn", "Auth port not injected");
    return false;
  }
  const user = auth.getUser?.();
  if (!user) {
    _log("warn", "User not authenticated");
    return false;
  }
  if (auth.can?.("user-management:view")) {
    return true;
  }
  const roles = auth.getRoles?.() || user.roles || [];
  if (roles.some((r) => ADMIN_ROLES.includes(r))) {
    return true;
  }
  const level = auth.getLevel?.() || user.level || 0;
  if (level >= MIN_ACCESS_LEVEL) {
    return true;
  }
  _log("warn", "Access denied - insufficient permissions");
  return false;
}
function ensureAuth(action) {
  _initPorts();
  const auth = _getPort("auth");
  if (!auth?.isAuthenticated?.()) {
    tracker.trackAuthRequired(action);
    metrics.authFailCount++;
    return false;
  }
  return true;
}
function checkAction(action, targetId = null) {
  _initPorts();
  const auth = _getPort("auth");
  if (auth?.can?.(`user-management:${action}`)) {
    return true;
  }
  const roles = auth?.getRoles?.() || [];
  if (roles.some((r) => ADMIN_ROLES.includes(r))) {
    return true;
  }
  tracker.trackAccessDenied(action, "insufficient_permissions");
  metrics.permissionDeniedCount++;
  return false;
}
function _toggleBulkMode() {
  _bulkMode = !_bulkMode;
  if (!_bulkMode) {
    _selectedIds.clear();
  }
  _render();
}
function _toggleSelect(userId) {
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
    users.forEach((u) => {
      _selectedIds.add(u.id);
    });
  }
  _render();
}
function _handleBulkAction(action) {
  const ids = Array.from(_selectedIds);
  if (ids.length === 0) return;
  switch (action) {
    case "activate":
      bulkUpdateStatus(ids, "active").then(() => {
        _selectedIds.clear();
        _bulkMode = false;
      });
      break;
    case "deactivate":
      bulkUpdateStatus(ids, "disabled").then(() => {
        _selectedIds.clear();
        _bulkMode = false;
      });
      break;
    case "delete":
      if (confirm(`Tem certeza que deseja excluir ${ids.length} usu\xE1rios?`)) {
        let chain = Promise.resolve();
        ids.forEach((id) => {
          chain = chain.then(() => deleteUser(id));
        });
        chain.then(() => {
          _selectedIds.clear();
          _bulkMode = false;
          loadData();
        });
      }
      break;
    default:
      _log("warn", `Unknown bulk action: ${action}`);
  }
}
function _createHandlers() {
  return {
    // Navigation
    back: () => {
      state.setSelectedUser(null);
      _render();
    },
    // CRUD
    viewUser: (userId) => viewUser(userId),
    editUser: (userId) => {
      const user = state.getUsers().find((u) => u.id == userId);
      if (user) {
        state.setSelectedUser(user);
        _render();
      }
    },
    deleteUser: (userId) => {
      if (confirm("Tem certeza que deseja excluir este usu\xE1rio?")) {
        deleteUser(userId);
      }
    },
    createUser: () => {
      createUser({
        username: "",
        email: "",
        status: "active"
      });
    },
    toggleStatus: (userId) => {
      const user = state.getUsers().find((u) => u.id == userId);
      if (user) {
        const newStatus = user.status === "active" ? "disabled" : "active";
        updateUserStatus(userId, newStatus);
      }
    },
    // Pagination
    goToPage: (page) => {
      state.setPage(page);
      _render();
    },
    // Search & Filters
    search: (value) => {
      state.setFilters({ search: value });
      _render();
    },
    filter: (filterName, value) => {
      state.setFilters({ [filterName]: value });
      _render();
    },
    // Bulk operations
    toggleBulkMode: () => _toggleBulkMode(),
    toggleSelect: (userId) => _toggleSelect(userId),
    selectAll: () => _selectAll(),
    bulkAction: (action) => _handleBulkAction(action),
    // Actions
    refresh: () => loadData(),
    retry: () => loadData(),
    exportUsers: () => exportUsers("csv"),
    openLogin: () => {
      const eventBus = _getPort("eventBus");
      eventBus?.emit?.("auth:login-required", { source: MODULE_ID });
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
    search: currentState.filters?.search || "",
    filters: currentState.filters,
    bulkMode: _bulkMode,
    selectedIds: Array.from(_selectedIds)
    // @ts-expect-error strict migration — TS2345
  }, handlers);
}
function _setupExternalListeners() {
  const eventBus = _getPort("eventBus");
  if (!eventBus) return;
  eventBus.on?.("users:refresh", () => loadData());
}
function _removeExternalListeners() {
  const eventBus = _getPort("eventBus");
  if (!eventBus) return;
  eventBus.off?.("users:refresh");
}
function mount(container, ports = {}) {
  if (_mounted) {
    _log("warn", "Already mounted");
    return false;
  }
  _container = container;
  if (Object.keys(ports).length > 0) {
    injectPorts(ports);
  }
  _initPorts();
  if (!_validateAccess()) {
    _log("error", "Access denied");
    tracker.trackAccessDenied("mount", "validation_failed");
    renderAuthBlockedView(_container, _createHandlers());
    return false;
  }
  _mounted = true;
  tracker.trackMount();
  _stateUnsubscribe = state.subscribe(() => {
    if (_mounted) _render();
  });
  _setupExternalListeners();
  setupEventHandlers(_container);
  renderSkeletonView(_container);
  loadData();
  return true;
}
function unmount() {
  if (!_mounted) return false;
  tracker.trackUnmount();
  if (_stateUnsubscribe) {
    _stateUnsubscribe();
    _stateUnsubscribe = null;
  }
  _removeExternalListeners();
  if (_container) {
    _container.innerHTML = "";
  }
  state.reset();
  _bulkMode = false;
  _selectedIds.clear();
  _mounted = false;
  _container = null;
  return true;
}
function refresh() {
  if (!_mounted) return Promise.resolve(false);
  return loadData();
}
function cleanup() {
  return unmount();
}
function healthCheck() {
  const stateHealth = state.healthCheck?.() || { status: "unknown" };
  const portsSnapshot = Ports.snapshot();
  const checks = {
    mounted: _mounted,
    hasContainer: !!_container,
    portsInitialized: portsSnapshot._initialized,
    stateHealthy: stateHealth.status === "healthy",
    noErrors: !state.getError(),
    hasData: state.getUsers().length > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed >= 5 ? "healthy" : passed >= 3 ? "degraded" : "unhealthy",
    score: passed,
    maxScore: 6,
    version: VERSION,
    moduleId: MODULE_ID,
    checks,
    metrics,
    stateHealth
  };
}
function info() {
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
function getVersion() {
  return VERSION;
}
var lifecycle_default = {
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
const LifecycleManager = {
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
export {
  LifecycleManager,
  MODULE_ID,
  VERSION,
  checkAction,
  cleanup,
  lifecycle_default as default,
  ensureAuth,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  metrics,
  mount,
  refresh,
  unmount
};
