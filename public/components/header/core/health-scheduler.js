import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as HealthAggregator from "./health-aggregator.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/health-scheduler";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
let _initialized = false;
let _running = false;
let _intervalId = null;
let _headerInstance = null;
const _config = { interval: 6e4, alertThreshold: 60, criticalThreshold: 30, maxHistorySize: 50, emitEvents: true };
let _metrics = { checksPerformed: 0, alertsEmitted: 0, criticalAlertsEmitted: 0, lastCheckAt: null, lastAlertAt: null, avgCheckDurationMs: 0 };
const _history = [];
const _listeners = [];
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _log(level, msg, data) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, msg, data || "");
  else if (level === "warn" && logger.warn) logger.warn(prefix, msg, data || "");
  else if (level === "info" && logger.info) logger.info(prefix, msg, data || "");
}
function _emitEvent(eventName, data) {
  if (!_config.emitEvents) return;
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(`header:health:${eventName}`, Object.assign({ timestamp: Date.now(), moduleId: MODULE_ID }, data));
  }
}
function _notifyListeners(result) {
  _listeners.forEach((listener) => {
    try {
      listener(result);
    } catch (e) {
      _log("error", "Listener error", e.message);
    }
  });
}
function _performCheck() {
  if (!_headerInstance) {
    _log("warn", "No header instance configured");
    return null;
  }
  const startTime = Date.now();
  _metrics.checksPerformed++;
  _metrics.lastCheckAt = startTime;
  const result = HealthAggregator.aggregateHeader ? HealthAggregator.aggregateHeader(_headerInstance) : null;
  if (!result) {
    _log("warn", "Health aggregation returned null");
    return null;
  }
  const duration = Date.now() - startTime;
  _metrics.avgCheckDurationMs = (_metrics.avgCheckDurationMs * (_metrics.checksPerformed - 1) + duration) / _metrics.checksPerformed;
  _history.push({ timestamp: startTime, score: result.overallScore, status: result.overallStatus, duration });
  if (_history.length > _config.maxHistorySize) _history.shift();
  if (result.overallScore <= _config.criticalThreshold) {
    _metrics.criticalAlertsEmitted++;
    _metrics.lastAlertAt = Date.now();
    _emitEvent("critical", { score: result.overallScore, status: result.overallStatus, problematic: HealthAggregator.getProblematicComponents ? HealthAggregator.getProblematicComponents() : [] });
    _log("error", "CRITICAL: Health score below threshold", { score: result.overallScore, threshold: _config.criticalThreshold });
  } else if (result.overallScore <= _config.alertThreshold) {
    _metrics.alertsEmitted++;
    _metrics.lastAlertAt = Date.now();
    _emitEvent("alert", { score: result.overallScore, status: result.overallStatus, problematic: HealthAggregator.getProblematicComponents ? HealthAggregator.getProblematicComponents() : [] });
    _log("warn", "ALERT: Health score degraded", { score: result.overallScore, threshold: _config.alertThreshold });
  } else {
    _emitEvent("ok", { score: result.overallScore, status: result.overallStatus });
  }
  _notifyListeners(result);
  return result;
}
function init(headerInstance, config) {
  _initPorts();
  _headerInstance = headerInstance;
  if (config) {
    Object.assign(_config, config);
  }
  _initialized = true;
  _log("info", "HealthScheduler inicializado");
}
function start() {
  if (!_initialized) {
    _log("warn", "Nao inicializado");
    return;
  }
  if (_running) {
    _log("debug", "Ja esta rodando");
    return;
  }
  _running = true;
  _performCheck();
  _intervalId = setInterval(_performCheck, _config.interval);
  _log("info", "HealthScheduler iniciado, intervalo:", `${_config.interval}ms`);
}
function stop() {
  if (!_running) return;
  _running = false;
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _log("info", "HealthScheduler parado");
}
function checkNow() {
  return _performCheck();
}
function onCheck(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx > -1) _listeners.splice(idx, 1);
  };
}
function getHistory() {
  return _history.slice();
}
function getLastResult() {
  return _history.length > 0 ? _history[_history.length - 1] : null;
}
function getTrend() {
  if (_history.length < 2) return "stable";
  const recent = _history.slice(-5);
  const first = recent[0].score;
  const last = recent[recent.length - 1].score;
  if (last > first + 5) return "improving";
  if (last < first - 5) return "degrading";
  return "stable";
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { checksPerformed: 0, alertsEmitted: 0, criticalAlertsEmitted: 0, lastCheckAt: null, lastAlertAt: null, avgCheckDurationMs: 0 };
}
function healthCheck() {
  _initPorts();
  const recentCheck = _metrics.lastCheckAt ? Date.now() - _metrics.lastCheckAt < _config.interval * 2 : false;
  const checks = { initialized: _initialized, hasHeaderInstance: !!_headerInstance, running: _running, recentCheck: recentCheck || !_running, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, running: _running, interval: _config.interval, trend: getTrend(), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, running: _running, config: Object.assign({}, _config), metrics: getMetrics(), historySize: _history.length, trend: getTrend(), lastResult: getLastResult(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var health_scheduler_default = { VERSION, MODULE_ID, init, start, stop, checkNow, onCheck, getHistory, getTrend, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  checkNow,
  health_scheduler_default as default,
  getHistory,
  getLastResult,
  getMetrics,
  getPorts,
  getTrend,
  healthCheck,
  info,
  init,
  injectPorts,
  onCheck,
  resetMetrics,
  start,
  stop
};
