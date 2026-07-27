import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-management.state.store";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error && logger.error(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "warn") {
    logger.warn && logger.warn(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (_debug()) logger.debug && logger.debug(...[`[${MODULE_ID}]`].concat(args));
};
const initialState = { users: [], roles: [], selectedUser: null, filters: { search: "", status: "", role: "" }, pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }, loading: false, error: null, lastLoadedAt: null };
const state = (() => {
  let currentState = Object.assign({}, initialState);
  const listeners = /* @__PURE__ */ new Set();
  const _metrics = { updates: 0, resets: 0, subscriptions: 0 };
  function notify() {
    listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (e) {
        _log("error", "Listener error:", e);
      }
    });
  }
  function setState(partial) {
    currentState = Object.assign({}, currentState, partial);
    _metrics.updates++;
    notify();
  }
  return {
    getState() {
      return Object.assign({}, currentState);
    },
    getUsers() {
      return currentState.users.slice();
    },
    getRoles() {
      return currentState.roles.slice();
    },
    getSelectedUser() {
      return currentState.selectedUser ? Object.assign({}, currentState.selectedUser) : null;
    },
    getFilters() {
      return Object.assign({}, currentState.filters);
    },
    getPagination() {
      return Object.assign({}, currentState.pagination);
    },
    isLoading() {
      return currentState.loading;
    },
    getError() {
      return currentState.error;
    },
    setUsers(users) {
      setState({ users, lastLoadedAt: Date.now(), pagination: Object.assign({}, currentState.pagination, { total: users.length, totalPages: Math.ceil(users.length / currentState.pagination.pageSize) }) });
    },
    setRoles(roles) {
      setState({ roles });
    },
    setSelectedUser(user) {
      setState({ selectedUser: user });
    },
    setFilters(filters) {
      setState({ filters: Object.assign({}, currentState.filters, filters), pagination: Object.assign({}, currentState.pagination, { page: 1 }) });
    },
    setPagination(pagination) {
      setState({ pagination: Object.assign({}, currentState.pagination, pagination) });
    },
    setPage(page) {
      setState({ pagination: Object.assign({}, currentState.pagination, { page }) });
    },
    setLoading(loading) {
      setState({ loading });
    },
    setError(error) {
      setState({ error });
    },
    subscribe(fn) {
      listeners.add(fn);
      _metrics.subscriptions++;
      return () => {
        listeners.delete(fn);
      };
    },
    reset() {
      currentState = Object.assign({}, initialState);
      _metrics.resets++;
      notify();
    },
    clearFilters() {
      setState({ filters: { search: "", status: "", role: "" }, pagination: Object.assign({}, currentState.pagination, { page: 1 }) });
    },
    healthCheck() {
      _initPorts();
      const logger = _getPort("logger");
      const checks = { hasState: !!currentState, hasListeners: listeners.size > 0, noError: !currentState.error, notStale: !currentState.lastLoadedAt || Date.now() - currentState.lastLoadedAt < 3e5, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
      let passed = 0;
      for (const k in checks) {
        if (Object.prototype.hasOwnProperty.call(checks, k) && checks[k]) passed++;
      }
      return { status: passed === 6 ? "healthy" : passed >= 4 ? "degraded" : "unhealthy", score: passed, maxScore: 6, checks };
    },
    info() {
      return { version: VERSION, moduleId: MODULE_ID, state: { usersCount: currentState.users.length, rolesCount: currentState.roles.length, hasSelectedUser: !!currentState.selectedUser, filters: currentState.filters, pagination: currentState.pagination, loading: currentState.loading, hasError: !!currentState.error, lastLoadedAt: currentState.lastLoadedAt }, listeners: listeners.size, metrics: Object.assign({}, _metrics), portsInitialized: Ports.isInitialized(), healthCheck: state.healthCheck() };
    },
    getMetrics() {
      return Object.assign({}, _metrics);
    }
  };
})();
var store_default = state;
const StateStore = state;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getPorts,
  injectPorts,
  state
};
