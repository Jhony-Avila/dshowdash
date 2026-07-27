import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.security.circular-check";
const VERSION = "2.2.0-P18EC";
const CIRCULAR_TELEMETRY = {
  DETECTED: "router:circular:detected",
  CLEARED: "router:circular:cleared"
};
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
const _state = { initialized: false, navigationStack: [], maxDepth: 10 };
const _metrics = { checks: 0, detected: 0, cleared: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function pushNavigation(path) {
  _metrics.checks++;
  if (_state.navigationStack.length >= _state.maxDepth) {
    const isCircular = _state.navigationStack.filter((p) => p === path).length >= 2;
    if (isCircular) {
      _metrics.detected++;
      _track(CIRCULAR_TELEMETRY.DETECTED, { path, stack: _state.navigationStack });
      return { ok: false, circular: true, path, stack: _state.navigationStack.slice() };
    }
    _state.navigationStack.shift();
  }
  _state.navigationStack.push(path);
  return { ok: true, depth: _state.navigationStack.length };
}
function popNavigation() {
  return _state.navigationStack.pop();
}
function clearStack() {
  _metrics.cleared++;
  _state.navigationStack = [];
  return { ok: true };
}
function getStack() {
  return _state.navigationStack.slice();
}
function getDepth() {
  return _state.navigationStack.length;
}
function setMaxDepth(depth) {
  _state.maxDepth = depth;
  return { ok: true };
}
function checkCircular(path) {
  const occurrences = _state.navigationStack.filter((p) => p === path).length;
  return { isCircular: occurrences >= 2, occurrences, depth: _state.navigationStack.length };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.maxDepth) _state.maxDepth = ctx.maxDepth;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.navigationStack = [];
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  let score = 100;
  if (_state.navigationStack.length > _state.maxDepth * 0.8) score -= 20;
  return { status: score >= 80 ? "HEALTHY" : "DEGRADED", score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, stackNotFull: { ok: _state.navigationStack.length < _state.maxDepth, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, stackDepth: _state.navigationStack.length, maxDepth: _state.maxDepth, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var circular_check_default = { MODULE_ID, VERSION, CIRCULAR_TELEMETRY, init, cleanup, pushNavigation, popNavigation, clearStack, getStack, getDepth, setMaxDepth, checkCircular, healthCheck, info, injectPorts, getPorts };
export {
  CIRCULAR_TELEMETRY,
  MODULE_ID,
  VERSION,
  checkCircular,
  cleanup,
  clearStack,
  circular_check_default as default,
  getDepth,
  getPorts,
  getStack,
  healthCheck,
  info,
  init,
  injectPorts,
  popNavigation,
  pushNavigation,
  setMaxDepth
};
