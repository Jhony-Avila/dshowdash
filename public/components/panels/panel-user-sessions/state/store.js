import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-sessions.state.store";
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
const initialState = { mounted: false, loading: false, terminating: null, error: null, sessions: [], currentSessionId: null, loginHistory: [], mountedAt: null };
let state = Object.assign({}, initialState);
const listeners = /* @__PURE__ */ new Set();
function getState() {
  return Object.assign({}, state);
}
function setState(partial) {
  state = Object.assign({}, state, partial);
  listeners.forEach((fn) => {
    fn(state);
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
}
function setSessions(sessions) {
  setState({ sessions });
}
function setCurrentSessionId(id) {
  setState({ currentSessionId: id });
}
function setLoginHistory(history) {
  setState({ loginHistory: history });
}
function setLoading(loading) {
  setState({ loading });
}
function setTerminating(sessionId) {
  setState({ terminating: sessionId });
}
function setError(error) {
  setState({ error });
}
function setMounted(mounted) {
  setState({ mounted, mountedAt: mounted ? Date.now() : null });
}
function removeSession(sessionId) {
  setState({ sessions: state.sessions.filter((s) => s["id"] !== sessionId) });
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
  return { mounted: state.mounted, loading: state.loading, hasError: !!state.error, sessionsCount: state.sessions.length, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0 };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, portsInitialized: Ports.isInitialized() } };
}
var store_default = { getState, setState, subscribe, reset, setSessions, setCurrentSessionId, setLoginHistory, setLoading, setTerminating, setError, setMounted, removeSession, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts };
const StateStore = { getState, setState, subscribe, reset, setSessions, setCurrentSessionId, setLoginHistory, setLoading, setTerminating, setError, setMounted, removeSession, getAuthContext, getHealthData, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
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
  removeSession,
  reset,
  setCurrentSessionId,
  setError,
  setLoading,
  setLoginHistory,
  setMounted,
  setSessions,
  setState,
  setTerminating,
  subscribe
};
