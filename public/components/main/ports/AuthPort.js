import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const MODULE_ID = "components.main.ports.auth";
const VERSION = "2.3.0-P18EC";
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
const _metrics = { checks: 0, logins: 0, logouts: 0 };
function isAuthenticated() {
  _metrics.checks++;
  const sessionManager = _getPort("sessionManager");
  if (sessionManager && sessionManager.isAuthenticated) return sessionManager.isAuthenticated();
  const gs = _getPort("globalState");
  if (gs && gs.get) {
    const auth = gs.get("auth");
    return auth && auth.isAuthenticated;
  }
  return false;
}
function getUser() {
  const sessionManager = _getPort("sessionManager");
  if (sessionManager && sessionManager.getUser) return sessionManager.getUser();
  const gs = _getPort("globalState");
  if (gs && gs.get) {
    const auth = gs.get("auth");
    return auth && auth.user;
  }
  return null;
}
function getUserLevel() {
  const user = getUser();
  return user && user.level ? user.level : 0;
}
function login(credentials) {
  _metrics.logins++;
  const sessionManager = _getPort("sessionManager");
  if (sessionManager && sessionManager.login) return sessionManager.login(credentials);
  return Promise.reject(new Error("SessionManager not available"));
}
function logout() {
  _metrics.logouts++;
  const sessionManager = _getPort("sessionManager");
  if (sessionManager && sessionManager.logout) return sessionManager.logout();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(AUTH_INTENTS.LOGOUT, { source: MODULE_ID });
  return Promise.resolve({ ok: true });
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasSessionManager: { ok: !!_getPort("sessionManager"), severity: "warn" }, isAuthenticated: { ok: isAuthenticated(), severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, isAuthenticated: isAuthenticated(), userLevel: getUserLevel(), metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createAuthPort(options) {
  options = options || {};
  init(options);
  return {
    isAuthenticated,
    getUser,
    getUserLevel,
    login,
    logout,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}
function createNullAuthPort() {
  return { isAuthenticated: () => false, getUser: () => null, getUserLevel: () => 0, login: () => Promise.reject(new Error("Null auth port")), logout: () => Promise.resolve({ ok: true }) };
}
function validateAuthPort(port) {
  return port && typeof port.isAuthenticated === "function" && typeof port.getUser === "function";
}
var AuthPort_default = { MODULE_ID, VERSION, createAuthPort, createNullAuthPort, validateAuthPort, init, isAuthenticated, getUser, getUserLevel, login, logout, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createAuthPort,
  createNullAuthPort,
  AuthPort_default as default,
  getPorts,
  getUser,
  getUserLevel,
  healthCheck,
  info,
  init,
  injectPorts,
  isAuthenticated,
  login,
  logout,
  validateAuthPort
};
