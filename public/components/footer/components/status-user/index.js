import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.status-user";
const VERSION = "2.2.0-P18EC";
const USER_EVENTS = { CHANGED: "footer:user:changed" };
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const _state = { initialized: false, user: null };
const _metrics = { updates: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function setUser(user) {
  _state.user = user;
  _metrics.updates++;
  _emit(USER_EVENTS.CHANGED, { user });
  return { ok: true };
}
function getUser() {
  return _state.user;
}
function getUserName() {
  return _state.user ? _state.user.name || _state.user.username : "Visitante";
}
function getUserLevel() {
  return _state.user && _state.user.level ? _state.user.level : 0;
}
function isAuthenticated() {
  return !!_state.user;
}
function render() {
  return `<span class="footer-user">${getUserName()}</span>`;
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.user) _state.user = ctx.user;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, isAuthenticated: isAuthenticated(), userName: getUserName(), metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var status_user_default = { MODULE_ID, VERSION, USER_EVENTS, init, setUser, getUser, getUserName, getUserLevel, isAuthenticated, render, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  USER_EVENTS,
  VERSION,
  status_user_default as default,
  getPorts,
  getUser,
  getUserLevel,
  getUserName,
  healthCheck,
  info,
  init,
  injectPorts,
  isAuthenticated,
  render,
  setUser
};
