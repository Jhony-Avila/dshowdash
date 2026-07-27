import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-account-security.state.store";
const VERSION = "9.3.0-P2-ENTERPRISE";
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
const initialState = { mounted: false, loading: false, saving: false, error: null, securityInfo: null, showPasswordForm: false, passwordForm: { current: "", new: "", confirm: "" }, mountedAt: null };
let state = Object.assign({}, initialState);
const listeners = [];
function getState() {
  return Object.assign({}, state);
}
function setState(partial) {
  state = Object.assign({}, state, partial);
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](state);
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
function setSecurityInfo(info2) {
  setState({ securityInfo: info2 });
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
function setShowPasswordForm(show) {
  setState({ showPasswordForm: show, passwordForm: { current: "", new: "", confirm: "" } });
}
function updatePasswordField(field, value) {
  const pf = Object.assign({}, state.passwordForm);
  pf[field] = value;
  setState({ passwordForm: pf });
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
  return { mounted: state.mounted, loading: state.loading, saving: state.saving, hasError: !!state.error, hasSecurityInfo: !!state.securityInfo, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0 };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, portsInitialized: Ports.isInitialized() } };
}
var store_default = { getState, setState, subscribe, reset, setSecurityInfo, setLoading, setSaving, setError, setMounted, setShowPasswordForm, updatePasswordField, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
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
  setError,
  setLoading,
  setMounted,
  setSaving,
  setSecurityInfo,
  setShowPasswordForm,
  setState,
  subscribe,
  updatePasswordField
};
