import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.monitoring.mock-mode";
const VERSION = "2.1.1-P17WI";
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
const _state = { initialized: false, enabled: false, mocks: {}, interceptedCalls: [] };
const _metrics = { intercepted: 0, passthrough: 0 };
function enable() {
  _state.enabled = true;
  return { ok: true };
}
function disable() {
  _state.enabled = false;
  return { ok: true };
}
function isEnabled() {
  return _state.enabled;
}
function registerMock(path, response) {
  _state.mocks[path] = response;
  return { ok: true, path };
}
function unregisterMock(path) {
  if (_state.mocks[path]) {
    delete _state.mocks[path];
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function clearMocks() {
  _state.mocks = {};
  return { ok: true };
}
function intercept(path) {
  if (!_state.enabled) {
    _metrics.passthrough++;
    return { intercepted: false };
  }
  if (_state.mocks[path]) {
    _metrics.intercepted++;
    _state.interceptedCalls.push({ path, timestamp: Date.now() });
    return { intercepted: true, response: _state.mocks[path] };
  }
  _metrics.passthrough++;
  return { intercepted: false };
}
function getInterceptedCalls() {
  return _state.interceptedCalls.slice();
}
function clearInterceptedCalls() {
  _state.interceptedCalls = [];
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.enabled) _state.enabled = ctx.enabled;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.mocks = {};
  _state.interceptedCalls = [];
  _state.enabled = false;
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, mockMode: { ok: !_state.enabled, severity: "info", message: _state.enabled ? "Mock mode active" : "Production mode" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, enabled: _state.enabled, mocksCount: Object.keys(_state.mocks).length, interceptedCount: _state.interceptedCalls.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var mock_mode_default = { MODULE_ID, VERSION, init, cleanup, enable, disable, isEnabled, registerMock, unregisterMock, clearMocks, intercept, getInterceptedCalls, clearInterceptedCalls, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  clearInterceptedCalls,
  clearMocks,
  mock_mode_default as default,
  disable,
  enable,
  getInterceptedCalls,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  intercept,
  isEnabled,
  registerMock,
  unregisterMock
};
