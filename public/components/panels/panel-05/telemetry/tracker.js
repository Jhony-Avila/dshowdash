import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
const MODULE_ID = "panel-05.telemetry.tracker";
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
let _metrics = { mounts: 0, unmounts: 0, refreshes: 0, apiCalls: 0, apiErrors: 0, renderCycles: 0, userActions: 0, avgRefreshTime: 0, avgApiTime: 0, lastActivity: null, errors: [] };
const _timers = /* @__PURE__ */ new Map();
const _config = { enabled: true, maxErrors: 50, emitToEventBus: true, logLevel: "info" };
function startTimer(name) {
  _timers.set(name, performance.now());
  return name;
}
function endTimer(name) {
  const start = _timers.get(name);
  if (!start) return 0;
  const duration = performance.now() - start;
  _timers.delete(name);
  return duration;
}
function track(event, data = {}) {
  if (!_config.enabled) return;
  _initPorts();
  _metrics.lastActivity = Date.now();
  const payload = Object.assign({ event, moduleId: MODULE_ID, timestamp: Date.now() }, data);
  switch (event) {
    case "mount":
      _metrics.mounts++;
      break;
    case "unmount":
      _metrics.unmounts++;
      break;
    case "refresh":
    case "refresh:done":
      _metrics.refreshes++;
      if (data.duration) {
        _metrics.avgRefreshTime = (_metrics.avgRefreshTime * (_metrics.refreshes - 1) + Number(data.duration)) / _metrics.refreshes;
      }
      break;
    case "api:call":
      _metrics.apiCalls++;
      break;
    case "api:success":
      if (data.duration) {
        const apiSuccessCount = _metrics.apiCalls - _metrics.apiErrors;
        _metrics.avgApiTime = (_metrics.avgApiTime * (apiSuccessCount - 1) + Number(data.duration)) / apiSuccessCount;
      }
      break;
    case "api:error":
      _metrics.apiErrors++;
      break;
    case "render":
      _metrics.renderCycles++;
      break;
    case "action":
    case "user:action":
      _metrics.userActions++;
      break;
    case "error":
      _addError(data);
      break;
  }
  if (_config.emitToEventBus) {
    const eventBus = _getPort("eventBus");
    if (eventBus?.emit) eventBus.emit(PANEL_EVENTS.PANEL_05_TELEMETRY, payload);
  }
  const logger = _getPort("logger");
  if (_config.logLevel === "debug" && logger?.debug) logger.debug("[panel-05:telemetry]", event, data);
  return payload;
}
function _addError(data) {
  _metrics.errors.push({ timestamp: Date.now(), message: data.message || data.error || "Unknown error", stack: data.stack, context: data.context });
  if (_metrics.errors.length > _config.maxErrors) _metrics.errors = _metrics.errors.slice(-_config.maxErrors);
}
function trackAction(action, data = {}) {
  return track("user:action", Object.assign({ action }, data));
}
function trackError(error, context = {}) {
  return track("error", { message: error?.message || String(error), stack: error?.stack || null, context });
}
function trackApi(endpoint, success, duration, data = {}) {
  const event = success ? "api:success" : "api:error";
  return track(event, Object.assign({ endpoint, duration }, data));
}
function trackRender(component, duration) {
  return track("render", { component, duration });
}
function getMetrics() {
  return Object.assign({}, _metrics, { uptime: _metrics.lastActivity ? Date.now() - _metrics.lastActivity : 0, errorRate: _metrics.apiCalls > 0 ? _metrics.apiErrors / _metrics.apiCalls : 0 });
}
function resetMetrics() {
  _metrics = { mounts: 0, unmounts: 0, refreshes: 0, apiCalls: 0, apiErrors: 0, renderCycles: 0, userActions: 0, avgRefreshTime: 0, avgApiTime: 0, lastActivity: null, errors: [] };
  return { ok: true };
}
function getErrors(limit = 10) {
  return _metrics.errors.slice(-limit);
}
function clearErrors() {
  const count = _metrics.errors.length;
  _metrics.errors = [];
  return { ok: true, cleared: count };
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  Object.assign(_config, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}
function healthCheck() {
  const checks = { enabled: _config.enabled, lowErrorRate: _metrics.apiCalls === 0 || _metrics.apiErrors / _metrics.apiCalls < 0.2, recentActivity: !_metrics.lastActivity || Date.now() - _metrics.lastActivity < 3e5, errorLogNotFull: _metrics.errors.length < _config.maxErrors * 0.8 };
  const values = Object.values(checks);
  const passed = values.filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), metrics: getMetrics(), recentErrors: getErrors(5), timestamp: Date.now() };
}
var tracker_default = { track, trackAction, trackError, trackApi, trackRender, startTimer, endTimer, getMetrics, resetMetrics, getErrors, clearErrors, getConfig, setConfig, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearErrors,
  tracker_default as default,
  endTimer,
  getConfig,
  getErrors,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  setConfig,
  startTimer,
  track,
  trackAction,
  trackApi,
  trackError,
  trackRender
};
