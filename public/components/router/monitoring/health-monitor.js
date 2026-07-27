import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const MODULE_ID = "components.router.monitoring.health-monitor";
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
const _state = { initialized: false, checks: {}, lastCheck: null, intervalId: null, intervalMs: 3e4 };
const _metrics = { checksRun: 0, healthy: 0, degraded: 0, unhealthy: 0 };
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
function registerCheck(name, checkFn) {
  if (!name || typeof checkFn !== "function") return { ok: false, error: "Invalid arguments" };
  _state.checks[name] = checkFn;
  return { ok: true, name };
}
function unregisterCheck(name) {
  if (_state.checks[name]) {
    delete _state.checks[name];
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function runChecks() {
  _metrics.checksRun++;
  const results = {};
  let overall = "HEALTHY";
  let score = 100;
  for (const name in _state.checks) {
    if (Object.prototype.hasOwnProperty.call(_state.checks, name)) {
      try {
        const result = _state.checks[name]();
        results[name] = result;
        if (result.status === "UNHEALTHY") {
          overall = "UNHEALTHY";
          score -= 30;
        } else if (result.status === "DEGRADED" && overall !== "UNHEALTHY") {
          overall = "DEGRADED";
          score -= 15;
        }
      } catch (e) {
        results[name] = { status: "UNHEALTHY", error: e.message };
        overall = "UNHEALTHY";
        score -= 30;
      }
    }
  }
  if (overall === "HEALTHY") _metrics.healthy++;
  else if (overall === "DEGRADED") _metrics.degraded++;
  else _metrics.unhealthy++;
  _state.lastCheck = { timestamp: Date.now(), results, overall, score: Math.max(0, score) };
  _emit(ROUTER_EVENTS.HEALTH_CHECKED, _state.lastCheck);
  _track("router:health:check", { overall, score });
  return _state.lastCheck;
}
function startMonitoring(intervalMs) {
  if (_state.intervalId) return { ok: false, reason: "Already monitoring" };
  _state.intervalMs = intervalMs || _state.intervalMs;
  _state.intervalId = setInterval(runChecks, _state.intervalMs);
  runChecks();
  return { ok: true, intervalMs: _state.intervalMs };
}
function stopMonitoring() {
  if (_state.intervalId) {
    clearInterval(_state.intervalId);
    _state.intervalId = null;
  }
  return { ok: true };
}
function getLastCheck() {
  return _state.lastCheck;
}
function isHealthy() {
  return _state.lastCheck && _state.lastCheck.overall === "HEALTHY";
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.intervalMs) _state.intervalMs = ctx.intervalMs;
  if (ctx && ctx.autoStart) startMonitoring(0);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  stopMonitoring();
  _state.checks = {};
  _state.lastCheck = null;
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  let score = _state.initialized ? 100 : 50;
  if (_state.lastCheck && _state.lastCheck.overall === "UNHEALTHY") score -= 30;
  return { status: score >= 80 ? "HEALTHY" : score >= 50 ? "DEGRADED" : "UNHEALTHY", score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "warn" }, monitoring: { ok: !!_state.intervalId, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, checksCount: Object.keys(_state.checks).length, isMonitoring: !!_state.intervalId, intervalMs: _state.intervalMs, lastCheck: _state.lastCheck, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var health_monitor_default = { MODULE_ID, VERSION, init, cleanup, registerCheck, unregisterCheck, runChecks, startMonitoring, stopMonitoring, getLastCheck, isHealthy, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  health_monitor_default as default,
  getLastCheck,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isHealthy,
  registerCheck,
  runChecks,
  startMonitoring,
  stopMonitoring,
  unregisterCheck
};
