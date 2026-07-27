const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-core";
const _initialState = {
  users: [],
  triggers: [],
  regions: [],
  userPermissions: /* @__PURE__ */ new Map(),
  selectedUserId: null,
  selectedUser: null,
  loading: false,
  error: null,
  filter: { search: "", type: "all" },
  userFilter: { status: "all", sort: "name" },
  view: "matrix",
  lastSync: null,
  bulkSelection: /* @__PURE__ */ new Set(),
  bulkMode: false
};
let _state = { ..._initialState };
let _listeners = /* @__PURE__ */ new Set();
let _initialized = false;
function _getState() {
  return _state;
}
function _setState(newState) {
  _state = newState;
}
function _getInitialState() {
  return _initialState;
}
function _isInitialized() {
  return _initialized;
}
function _setInitialized(val) {
  _initialized = val;
}
function notify(key) {
  _listeners.forEach((fn) => {
    try {
      fn({ key, state: getState() });
    } catch {
    }
  });
}
function init() {
  if (_initialized) return;
  if (!_state.userPermissions) {
    _state.userPermissions = /* @__PURE__ */ new Map();
  }
  if (!_state.bulkSelection) {
    _state.bulkSelection = /* @__PURE__ */ new Set();
  }
  _initialized = true;
}
function reset() {
  _state = {
    ..._initialState,
    userPermissions: /* @__PURE__ */ new Map(),
    bulkSelection: /* @__PURE__ */ new Set()
  };
  _listeners.clear();
  _initialized = false;
}
function subscribe(listener) {
  if (typeof listener !== "function") return () => {
  };
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}
function getListenerCount() {
  return _listeners.size;
}
function getState() {
  return { ..._state };
}
function getUsers() {
  return [..._state.users];
}
function getTriggers() {
  return [..._state.triggers];
}
function getRegions() {
  return [..._state.regions];
}
function getSelectedUserId() {
  return _state.selectedUserId;
}
function getSelectedUser() {
  return _state.selectedUser;
}
function isLoading() {
  return _state.loading;
}
function getError() {
  return _state.error;
}
function getFilter() {
  return { ..._state.filter };
}
function getView() {
  return _state.view;
}
function getLastSync() {
  return _state.lastSync;
}
function getUserPermissions(userId) {
  return _state.userPermissions.get(String(userId)) || { triggers: [], regions: [] };
}
function getSelectedUserPermissions() {
  if (!_state.selectedUserId) return { triggers: [], regions: [] };
  return getUserPermissions(_state.selectedUserId);
}
function setUsers(users) {
  _state.users = Array.isArray(users) ? users : [];
  notify("users");
}
function setTriggers(triggers) {
  _state.triggers = Array.isArray(triggers) ? triggers : [];
  notify("triggers");
}
function setRegions(regions) {
  _state.regions = Array.isArray(regions) ? regions : [];
  notify("regions");
}
function setSelectedUser(userId) {
  _state.selectedUserId = userId;
  _state.selectedUser = _state.users.find((u) => String(u.id) === String(userId)) || null;
  notify("selectedUser");
}
function setLoading(loading) {
  _state.loading = !!loading;
  notify("loading");
}
function setError(error) {
  _state.error = error;
  notify("error");
}
function setFilter(filter) {
  _state.filter = { ..._state.filter, ...filter };
  notify("filter");
}
function setView(view) {
  _state.view = view;
  notify("view");
}
function setUserPermissions(userId, permissions) {
  _state.userPermissions.set(String(userId), {
    triggers: permissions.triggers || [],
    regions: permissions.regions || []
  });
  notify("permissions");
}
function setLastSync(timestamp) {
  _state.lastSync = timestamp;
  notify("sync");
}
function getStats() {
  const selectedPerms = getSelectedUserPermissions();
  return {
    totalUsers: _state.users.length,
    totalTriggers: _state.triggers.length,
    totalRegions: _state.regions.length,
    selectedTriggers: selectedPerms.triggers.length,
    selectedRegions: selectedPerms.regions.length
  };
}
function healthCheck() {
  return {
    status: _initialized ? "HEALTHY" : "NOT_INITIALIZED",
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    stats: getStats(),
    listenerCount: _listeners.size
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    state: {
      usersCount: _state.users.length,
      triggersCount: _state.triggers.length,
      regionsCount: _state.regions.length,
      selectedUserId: _state.selectedUserId,
      loading: _state.loading,
      view: _state.view,
      lastSync: _state.lastSync
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  _getInitialState,
  _getState,
  _isInitialized,
  _setInitialized,
  _setState,
  getError,
  getFilter,
  getLastSync,
  getListenerCount,
  getRegions,
  getSelectedUser,
  getSelectedUserId,
  getSelectedUserPermissions,
  getState,
  getStats,
  getTriggers,
  getUserPermissions,
  getUsers,
  getView,
  healthCheck,
  info,
  init,
  isLoading,
  notify,
  reset,
  setError,
  setFilter,
  setLastSync,
  setLoading,
  setRegions,
  setSelectedUser,
  setTriggers,
  setUserPermissions,
  setUsers,
  setView,
  subscribe
};
