import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-notifications.state.store";
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
const initialState = { mounted: false, loading: false, saving: false, error: null, settings: null, isDirty: false, mountedAt: null };
let state = Object.assign({}, initialState);
const listeners = [];
function getState() {
  return Object.assign({}, state);
}
function setState(partial) {
  state = Object.assign({}, state, partial);
  for (let i = 0; i < listeners.length; i++) {
    try {
      listeners[i](state);
    } catch (e) {
    }
  }
}
function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx > -1) listeners.splice(idx, 1);
  };
}
function reset() {
  state = Object.assign({}, initialState);
}
function setSettings(settings) {
  setState({ settings, isDirty: false });
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
function setDirty(isDirty) {
  setState({ isDirty });
}
function updateSetting(category, key, value) {
  const settings = Object.assign({}, state.settings);
  if (!settings[category]) settings[category] = {};
  settings[category][key] = value;
  setState({ settings, isDirty: true });
}
function getAuthContext() {
  _initPorts();
  const auth = _getPort("auth");
  const gs = _getPort("globalState");
  if (auth && auth.isAuthenticated && auth.isAuthenticated()) {
    return { isAuthenticated: true, user: auth.getUser ? auth.getUser() : null };
  }
  if (gs && gs.auth) {
    return { isAuthenticated: true, user: gs.auth };
  }
  return { isAuthenticated: false, user: null };
}
function getHealthData() {
  return { mounted: state.mounted, loading: state.loading, saving: state.saving, hasError: !!state.error, hasSettings: !!state.settings, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0, portsInitialized: Ports.isInitialized() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, portsInitialized: Ports.isInitialized() } };
}
var store_default = { getState, setState, subscribe, reset, setSettings, setLoading, setSaving, setError, setMounted, setDirty, updateSetting, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts };
const StateStore = { getState, setState, subscribe, reset, setSettings, setLoading, setSaving, setError, setMounted, setDirty, updateSetting, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getAuthContext,
  getHealthData,
  getPorts,
  getState,
  healthCheck,
  info,
  injectPorts,
  reset,
  setDirty,
  setError,
  setLoading,
  setMounted,
  setSaving,
  setSettings,
  setState,
  subscribe,
  updateSetting
};
