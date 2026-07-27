import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const STORE_MODULE_ID = "panel-user-profile.state.store";
const Ports = createPanelPorts({ moduleId: STORE_MODULE_ID });
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
function _debug() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug;
}
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${STORE_MODULE_ID}]`].concat(args));
}
const initialState = { mounted: false, loading: false, saving: false, error: null, profile: null, avatars: [], showAvatarPicker: false, isDirty: false, mountedAt: null, lastRefresh: null };
let state = Object.assign({}, initialState);
const listeners = /* @__PURE__ */ new Set();
function getState() {
  return Object.assign({}, state);
}
function setState(partial) {
  state = Object.assign({}, state, partial);
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      _log("error", "Listener error:", e.message);
    }
  });
}
function subscribe(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function reset() {
  state = Object.assign({}, initialState);
  listeners.forEach((fn) => {
    fn(state);
  });
}
function setProfile(profile) {
  setState({ profile, isDirty: false, error: null });
}
function setAvatars(avatars) {
  setState({ avatars: avatars || [] });
}
function updateProfileField(field, value) {
  if (!state.profile) return;
  const profile = Object.assign({}, state.profile);
  profile[field] = value;
  setState({ profile, isDirty: true });
}
function setAvatar(avatarUrl) {
  if (!state.profile) return;
  const profile = Object.assign({}, state.profile, { avatarUrl });
  setState({ profile, isDirty: true, showAvatarPicker: false });
}
function setLoading(loading) {
  setState({ loading });
}
function setSaving(saving) {
  setState({ saving });
}
function setError(error) {
  setState({ error });
}
function setMounted(mounted) {
  setState({ mounted, mountedAt: mounted ? Date.now() : null });
}
function setShowAvatarPicker(show) {
  setState({ showAvatarPicker: show });
}
function setDirty(isDirty2) {
  setState({ isDirty: isDirty2 });
}
function setLastRefresh() {
  setState({ lastRefresh: Date.now() });
}
function getProfile() {
  return state.profile;
}
function getAvatars() {
  return state.avatars;
}
function isLoading() {
  return state.loading;
}
function isSaving() {
  return state.saving;
}
function isDirty() {
  return state.isDirty;
}
function hasError() {
  return !!state.error;
}
function isMounted() {
  return state.mounted;
}
function getAuthContext() {
  _initPorts();
  const auth = _getPort("auth");
  if (auth && auth.isAuthenticated && auth.isAuthenticated()) {
    return { isAuthenticated: true, user: auth.getUser ? auth.getUser() : null };
  }
  return { isAuthenticated: false, user: null };
}
function getHealthData() {
  return { moduleId: MODULE_ID, mounted: state.mounted, loading: state.loading, saving: state.saving, hasError: !!state.error, hasProfile: !!state.profile, avatarsCount: state.avatars.length, isDirty: state.isDirty, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0, lastRefresh: state.lastRefresh };
}
function healthCheck() {
  _initPorts();
  const logger = _getPort("logger");
  const checks = { storeReady: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, moduleId: STORE_MODULE_ID, version: VERSION };
}
function info() {
  return { moduleId: STORE_MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
var store_default = { getState, setState, subscribe, reset, setProfile, setAvatars, updateProfileField, setAvatar, setLoading, setSaving, setError, setMounted, setShowAvatarPicker, setDirty, setLastRefresh, getProfile, getAvatars, isLoading, isSaving, isDirty, hasError, isMounted, getAuthContext, getHealthData, healthCheck, info, injectPorts, getPorts };
const StateStore = { getState, setState, subscribe, reset, setProfile, setAvatars, updateProfileField, setAvatar, setLoading, setSaving, setError, setMounted, setShowAvatarPicker, setDirty, setLastRefresh, getProfile, getAvatars, isLoading, isSaving, isDirty, hasError, isMounted, getAuthContext, getHealthData, healthCheck, info, injectPorts, getPorts, VERSION, STORE_MODULE_ID };
export {
  STORE_MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getAuthContext,
  getAvatars,
  getHealthData,
  getPorts,
  getProfile,
  getState,
  hasError,
  healthCheck,
  info,
  injectPorts,
  isDirty,
  isLoading,
  isMounted,
  isSaving,
  reset,
  setAvatar,
  setAvatars,
  setDirty,
  setError,
  setLastRefresh,
  setLoading,
  setMounted,
  setProfile,
  setSaving,
  setShowAvatarPicker,
  setState,
  subscribe,
  updateProfileField
};
