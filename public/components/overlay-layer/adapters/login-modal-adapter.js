import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS, LOGIN_MODAL_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import * as Manager from "../core/manager.js";
const VERSION = "1.5.0-P21";
const MODULE_ID = "overlay-layer.adapters.login-modal-adapter";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const LOGIN_MODAL_ID = "login-modal";
const LOGIN_MODAL_PRIORITY = 9e3;
let _metrics = { opens: 0, closes: 0, currentState: "closed" };
let _cleanups = [];
function _setScrollLock(locked) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? "scroll-lock" : "scroll-unlock", source: MODULE_ID, timestamp: Date.now() });
    return true;
  }
  return false;
}
function open(options) {
  if (!options) options = {};
  _metrics.opens++;
  _metrics.currentState = "open";
  const result = Manager.open({ id: LOGIN_MODAL_ID, type: "login-modal", priority: LOGIN_MODAL_PRIORITY, blocking: true, content: "login-form", config: { closable: options.closable !== void 0 ? options.closable : false, escapable: options.escapable !== void 0 ? options.escapable : false, reason: options.reason || "auth-required" } });
  _setScrollLock(true);
  return result;
}
function close(reason) {
  if (!reason) reason = "authenticated";
  _metrics.closes++;
  _metrics.currentState = "closed";
  const result = Manager.close(LOGIN_MODAL_ID, reason);
  _setScrollLock(false);
  return result;
}
function isOpen() {
  const managerInfo = Manager.info ? Manager.info() : null;
  return managerInfo && managerInfo.currentStack && managerInfo.currentStack.includes(LOGIN_MODAL_ID) ? true : false;
}
function _openHandler(data) {
  open(data);
}
function _closeHandler(data) {
  close(data ? data.reason : void 0);
}
function _loginSuccessHandler() {
  close("authenticated");
}
function _logoutHandler() {
  open({ reason: "logout" });
}
function connectToLoginModal() {
  const eb = _getPort("eventBus");
  if (!eb || !eb.on) return { ok: false, reason: "EventBus not available" };
  const c1 = eb.on(LOGIN_MODAL_EVENTS.OPEN, _openHandler);
  if (typeof c1 === "function") _cleanups.push(c1);
  else _cleanups.push(() => {
    if (eb.off) eb.off(LOGIN_MODAL_EVENTS.OPEN, _openHandler);
  });
  const c2 = eb.on(LOGIN_MODAL_EVENTS.CLOSE, _closeHandler);
  if (typeof c2 === "function") _cleanups.push(c2);
  else _cleanups.push(() => {
    if (eb.off) eb.off(LOGIN_MODAL_EVENTS.CLOSE, _closeHandler);
  });
  const c3 = eb.on(AUTH_EVENTS.LOGIN_SUCCESS, _loginSuccessHandler);
  if (typeof c3 === "function") _cleanups.push(c3);
  else _cleanups.push(() => {
    if (eb.off) eb.off(AUTH_EVENTS.LOGIN_SUCCESS, _loginSuccessHandler);
  });
  const c4 = eb.on(AUTH_EVENTS.LOGOUT, _logoutHandler);
  if (typeof c4 === "function") _cleanups.push(c4);
  else _cleanups.push(() => {
    if (eb.off) eb.off(AUTH_EVENTS.LOGOUT, _logoutHandler);
  });
  return { ok: true, connected: true };
}
function disconnect() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  return { ok: true };
}
function destroy() {
  disconnect();
  close("destroy");
  _metrics = { opens: 0, closes: 0, currentState: "closed" };
}
function getMetrics() {
  return Object.assign({}, _metrics, { loginModalId: LOGIN_MODAL_ID, priority: LOGIN_MODAL_PRIORITY });
}
function healthCheck() {
  const eb = _getPort("eventBus");
  const checks = { managerAvailable: !!Manager, eventBusAvailable: !!(eb && eb.on), portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const k in checks) {
    if (checks.hasOwnProperty(k) && checks[k]) passed++;
  }
  const total = Object.keys(checks).length;
  return { status: passed >= 2 ? passed === total ? "HEALTHY" : "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p21Compliant: true, cleanups: _cleanups.length, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, loginModalId: LOGIN_MODAL_ID, priority: LOGIN_MODAL_PRIORITY, isOpen: isOpen(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p21Compliant: true, timestamp: Date.now() };
}
var login_modal_adapter_default = { open, close, isOpen, connectToLoginModal, disconnect, destroy, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  close,
  connectToLoginModal,
  login_modal_adapter_default as default,
  destroy,
  disconnect,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isOpen,
  open
};
