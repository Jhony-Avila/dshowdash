import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin:store";
const _CorePorts = createCorePorts({ moduleId: MODULE_ID });
function _getLogger() {
  const logger = _CorePorts.get("logger");
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get("Logger");
    if (wl) return wl;
  }
  return null;
}
const _log = (level, ...args) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) {
    logger[level](prefix, ...args);
  } else if (level === "error" || level === "warn") {
    console.log(prefix, ...args);
  }
};
const UARPS_TRIGGERS = {
  VIEW_OWN: "trigger:panel:session-admin:view-own",
  VIEW_ALL: "trigger:panel:session-admin:view-all",
  ADMIN: "trigger:panel:session-admin:admin"
};
const MIN_ADMIN_LEVEL = 80;
const initialState = {
  initialized: false,
  loading: false,
  error: null,
  sessions: [],
  filteredSessions: [],
  selectedIds: [],
  expandedIds: [],
  filter: { search: "", status: "", user: "" },
  inlineFilters: {},
  showInlineFilters: false,
  hiddenColumns: [],
  sort: [{ field: "last_activity", dir: "desc" }],
  isAdmin: false,
  currentUserId: null,
  confirmModal: null
};
let _state = { ...initialState };
let _listeners = [];
let _ports = {};
function _getPort(name) {
  return _CorePorts.get(name) || _ports[name] || null;
}
function _notify() {
  _listeners.forEach((listener) => {
    try {
      listener(_state);
    } catch (e) {
      _log("error", "Listener error:", e);
    }
  });
}
function _determineAuthContext() {
  const auth = _getPort("auth");
  if (!auth) return { isAdmin: false, userId: null, level: 0, authenticated: false };
  const user = auth.getUser?.() || null;
  const userId = user?.id || user?.user_id || null;
  const authenticated = !!user;
  let isAdmin2 = false;
  if (authenticated) {
    if (auth.can?.("sessions:admin")) {
      isAdmin2 = true;
    } else if (auth.can?.(UARPS_TRIGGERS.ADMIN)) {
      isAdmin2 = true;
    } else {
      const roles = auth.getRoles?.() || user?.roles || [];
      if (roles.includes("super_admin") || roles.includes("admin")) {
        isAdmin2 = true;
      } else {
        const level = auth.getLevel?.() || user?.level || 0;
        if (level >= MIN_ADMIN_LEVEL) {
          isAdmin2 = true;
        }
      }
    }
  }
  return { isAdmin: isAdmin2, userId, level: auth.getLevel?.() || user?.level || 0, authenticated };
}
function dispatch(action) {
  switch (action.type) {
    case "INIT":
      _state = { ...initialState, initialized: true };
      const context = _determineAuthContext();
      _state.isAdmin = context.isAdmin;
      _state.currentUserId = context.userId;
      break;
    case "SET_LOADING":
      _state.loading = action.payload;
      break;
    case "SET_ERROR":
      _state.error = action.payload;
      _state.loading = false;
      break;
    case "SET_SESSIONS":
      _state.sessions = action.payload || [];
      _state.filteredSessions = _applyFilters(_state.sessions);
      _state.loading = false;
      _state.error = null;
      break;
    case "SET_FILTER":
      _state.filter = { ..._state.filter, ...action.payload };
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    case "SET_INLINE_FILTER":
      _state.inlineFilters = { ..._state.inlineFilters, ...action.payload };
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    case "CLEAR_FILTERS":
      _state.filter = { search: "", status: "", user: "" };
      _state.inlineFilters = {};
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    case "SET_SORT": {
      const { field, additive } = action.payload || {};
      if (!field) break;
      const stack = Array.isArray(_state.sort) ? _state.sort.slice() : [];
      const idx = stack.findIndex((s) => s.field === field);
      if (additive) {
        if (idx >= 0) stack[idx] = { field, dir: stack[idx].dir === "asc" ? "desc" : "asc" };
        else stack.push({ field, dir: "asc" });
        _state.sort = stack;
      } else if (stack.length === 1 && idx === 0) {
        _state.sort = [{ field, dir: stack[0].dir === "asc" ? "desc" : "asc" }];
      } else {
        _state.sort = [{ field, dir: "asc" }];
      }
      _state.filteredSessions = _applyFilters(_state.sessions);
      break;
    }
    case "TOGGLE_INLINE_FILTERS":
      _state.showInlineFilters = !_state.showInlineFilters;
      break;
    case "TOGGLE_SELECT": {
      const id = action.payload;
      if (_state.selectedIds.includes(id)) {
        _state.selectedIds = _state.selectedIds.filter((i) => i !== id);
      } else {
        _state.selectedIds = [..._state.selectedIds, id];
      }
      break;
    }
    case "SELECT_ALL":
      _state.selectedIds = _state.filteredSessions.filter((s) => !s.is_current).map((s) => s.session_token);
      break;
    case "DESELECT_ALL":
      _state.selectedIds = [];
      break;
    case "TOGGLE_EXPAND": {
      const expandId = action.payload;
      if (_state.expandedIds.includes(expandId)) {
        _state.expandedIds = _state.expandedIds.filter((i) => i !== expandId);
      } else {
        _state.expandedIds = [..._state.expandedIds, expandId];
      }
      break;
    }
    case "TOGGLE_COLUMN": {
      const col = action.payload;
      if (_state.hiddenColumns.includes(col)) {
        _state.hiddenColumns = _state.hiddenColumns.filter((c) => c !== col);
      } else {
        _state.hiddenColumns = [..._state.hiddenColumns, col];
      }
      break;
    }
    case "SET_CONFIRM_MODAL":
      _state.confirmModal = action.payload;
      break;
    case "CLOSE_CONFIRM_MODAL":
      _state.confirmModal = null;
      break;
    case "REMOVE_SESSION": {
      const sessionId = action.payload;
      _state.sessions = _state.sessions.filter((s) => (s.id || s.session_id) !== sessionId);
      _state.filteredSessions = _applyFilters(_state.sessions);
      _state.selectedIds = _state.selectedIds.filter((i) => i !== sessionId);
      break;
    }
    case "REMOVE_SESSIONS": {
      const sessionIds = action.payload || [];
      _state.sessions = _state.sessions.filter((s) => !sessionIds.includes(s.id || s.session_id));
      _state.filteredSessions = _applyFilters(_state.sessions);
      _state.selectedIds = _state.selectedIds.filter((i) => !sessionIds.includes(i));
      break;
    }
    case "UPDATE_AUTH_CONTEXT": {
      const newContext = _determineAuthContext();
      _state.isAdmin = newContext.isAdmin;
      _state.currentUserId = newContext.userId;
      break;
    }
    case "RESET":
      _state = { ...initialState };
      break;
    default:
      _log("warn", "Unknown action type", { type: action.type });
  }
  _notify();
}
function _applyFilters(sessions) {
  let result = [...sessions];
  if (_state.filter.search) {
    const search = _state.filter.search.toLowerCase();
    result = result.filter(
      (s) => String(s.user_agent || "").toLowerCase().includes(search) || String(s.ip_address || "").toLowerCase().includes(search) || String(s.user_name || s.userName || "").toLowerCase().includes(search) || String(s.user_email || s.userEmail || "").toLowerCase().includes(search)
    );
  }
  if (_state.filter.status) {
    result = result.filter((s) => s.status === _state.filter.status);
  }
  if (_state.filter.user) {
    result = result.filter(
      (s) => (s.user_id || s.userId) == _state.filter.user || String(s.user_name || s.userName || "").toLowerCase().includes(_state.filter.user.toLowerCase())
    );
  }
  Object.entries(_state.inlineFilters).forEach(([key, value]) => {
    if (value === "" || value == null) return;
    const dm = key.match(/^(.*)__(from|to)$/);
    if (dm) {
      const field = dm[1];
      const bound = new Date(String(value).replace(" ", "T")).getTime();
      if (isNaN(bound)) return;
      result = result.filter((s) => {
        const t = new Date(String(s[field] || "").replace(" ", "T")).getTime();
        if (isNaN(t)) return false;
        return dm[2] === "from" ? t >= bound : t <= bound;
      });
    } else {
      const v = String(value).toLowerCase();
      result = result.filter((s) => String(s[key] || "").toLowerCase().includes(v));
    }
  });
  const _stack = Array.isArray(_state.sort) && _state.sort.length ? _state.sort : [{ field: "last_activity", dir: "desc" }];
  const _dateFields = { created_at: 1, last_activity: 1, expires_at: 1 };
  result.sort((a, b) => {
    for (const { field, dir } of _stack) {
      let av = a[field], bv = b[field];
      if (_dateFields[field]) {
        av = new Date(String(av || "").replace(" ", "T")).getTime() || 0;
        bv = new Date(String(bv || "").replace(" ", "T")).getTime() || 0;
      } else {
        av = String(av == null ? "" : av).toLowerCase();
        bv = String(bv == null ? "" : bv).toLowerCase();
      }
      let c = 0;
      if (av < bv) c = -1;
      else if (av > bv) c = 1;
      if (c !== 0) return dir === "desc" ? -c : c;
    }
    return 0;
  });
  return result;
}
function getState() {
  return { ..._state };
}
function getSessions() {
  return _state.sessions;
}
function getFilteredSessions() {
  return _state.filteredSessions;
}
function getSelectedIds() {
  return _state.selectedIds;
}
function getExpandedIds() {
  return _state.expandedIds;
}
function getFilter() {
  return _state.filter;
}
function getSort() {
  return _state.sort;
}
function getConfirmModal() {
  return _state.confirmModal;
}
function isLoading() {
  return _state.loading;
}
function getError() {
  return _state.error;
}
function isAdmin() {
  return _state.isAdmin;
}
function getCurrentUserId() {
  return _state.currentUserId;
}
function ensureAuth() {
  const ctx = _determineAuthContext();
  if (!ctx.authenticated) {
    _log("warn", "Auth check failed");
    return { ok: false, context: ctx };
  }
  _state.isAdmin = ctx.isAdmin;
  _state.currentUserId = ctx.userId;
  return { ok: true, context: ctx };
}
function isRefreshInProgress() {
  return _state.loading;
}
function canTerminateSelected() {
  if (_state.selectedIds.length === 0) return false;
  if (_state.isAdmin) return true;
  return _state.selectedIds.every((id) => {
    const session = _state.sessions.find((s) => (s.id || s.session_id) === id);
    return session && (session.user_id || session.userId) === _state.currentUserId;
  });
}
function subscribe(listener) {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
}
function injectPorts(ports) {
  _ports = ports || {};
  if (ports && ports.logger) {
    _CorePorts.inject({ logger: ports.logger });
  }
  if (_state.initialized) {
    dispatch({ type: "UPDATE_AUTH_CONTEXT" });
  }
}
function getPorts() {
  return { ..._ports };
}
function healthCheck() {
  return { status: "healthy", initialized: _state.initialized, sessionsCount: _state.sessions.length, isAdmin: _state.isAdmin, listenersCount: _listeners.length, portsInjected: Object.keys(_ports).length, portsInitialized: _CorePorts.isInitialized(), strictMode: isStrict(), version: VERSION };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: { initialized: _state.initialized, sessionsCount: _state.sessions.length, filteredCount: _state.filteredSessions.length, selectedCount: _state.selectedIds.length, isAdmin: _state.isAdmin }, uarps_triggers: UARPS_TRIGGERS };
}
var store_default = { VERSION, MODULE_ID, dispatch, getState, getSessions, getFilteredSessions, getSelectedIds, getExpandedIds, getFilter, getSort, getConfirmModal, isLoading, getError, isAdmin, getCurrentUserId, ensureAuth, isRefreshInProgress, canTerminateSelected, subscribe, injectPorts, getPorts, healthCheck, getVersion, info };
export {
  MODULE_ID,
  VERSION,
  canTerminateSelected,
  store_default as default,
  dispatch,
  ensureAuth,
  getConfirmModal,
  getSort,
  getCurrentUserId,
  getError,
  getExpandedIds,
  getFilter,
  getFilteredSessions,
  getPorts,
  getSelectedIds,
  getSessions,
  getState,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  isAdmin,
  isLoading,
  isRefreshInProgress,
  subscribe
};
