import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const MODULE_ID = "components.router.monitoring.error-tracker";
const VERSION = "2.2.0-P18EC";
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
const _state = { initialized: false, errors: [], maxErrors: 100 };
const _metrics = { tracked: 0, notFound: 0, serverErrors: 0, clientErrors: 0 };
function _track(eventName, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function trackError(error, context) {
  _metrics.tracked++;
  const entry = { id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, message: error.message || String(error), stack: error.stack || null, code: error.code || null, path: context && context.path || null, timestamp: Date.now(), context: context || {} };
  if (error.code === 404 || error.message && error.message.indexOf("not found") >= 0) _metrics.notFound++;
  else if (error.code >= 500) _metrics.serverErrors++;
  else _metrics.clientErrors++;
  _state.errors.unshift(entry);
  if (_state.errors.length > _state.maxErrors) _state.errors.pop();
  _emit(ROUTER_EVENTS.ERROR_TRACKED, entry);
  _track("router:error", { code: entry.code, path: entry.path });
  return { ok: true, id: entry.id };
}
function trackNotFound(path) {
  return trackError({ message: "Route not found", code: 404 }, { path, type: "not-found" });
}
function trackNavigationError(path, error) {
  return trackError(error, { path, type: "navigation" });
}
function getErrors(limit) {
  return _state.errors.slice(0, limit || 20);
}
function getErrorById(id) {
  return _state.errors.find((e) => e.id === id) || null;
}
function clearErrors() {
  _state.errors = [];
  return { ok: true };
}
function getErrorStats() {
  return { total: _state.errors.length, notFound: _metrics.notFound, serverErrors: _metrics.serverErrors, clientErrors: _metrics.clientErrors };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.maxErrors) _state.maxErrors = ctx.maxErrors;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.errors = [];
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  let score = 100;
  if (_state.errors.length > 50) score -= 20;
  if (_metrics.serverErrors > 10) score -= 15;
  return { status: score >= 80 ? "HEALTHY" : score >= 50 ? "DEGRADED" : "UNHEALTHY", score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, errorCount: { ok: _state.errors.length < 50, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, errorCount: _state.errors.length, maxErrors: _state.maxErrors, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var error_tracker_default = { MODULE_ID, VERSION, init, cleanup, trackError, trackNotFound, trackNavigationError, getErrors, getErrorById, clearErrors, getErrorStats, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  clearErrors,
  error_tracker_default as default,
  getErrorById,
  getErrorStats,
  getErrors,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  trackError,
  trackNavigationError,
  trackNotFound
};
