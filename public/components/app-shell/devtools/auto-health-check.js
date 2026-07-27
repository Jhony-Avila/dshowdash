import { APP_SHELL_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "1.4.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-auto-health-check";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getEventBus() {
  _initPorts();
  return Ports.get("eventBus");
}
function _resolveAppShell() {
  const fromPorts = Ports.get("appShell");
  if (fromPorts) return fromPorts;
  if (hasWindow && window.Core && window.Core.windowAdapter) {
    const fromAdapter = window.Core.windowAdapter.get("AppShell");
    if (fromAdapter) return fromAdapter;
  }
  if (hasWindow && window.AppShell) {
    if (isStrict()) {
      recordViolation("WINDOW_ACCESS", {
        target: "(window as any).AppShell",
        module: MODULE_ID,
        suggestion: "Use Ports.get('appShell') ou Core.windowAdapter.get('AppShell')"
      });
      return null;
    }
    recordViolation("WINDOW_FALLBACK", {
      target: "(window as any).AppShell",
      module: MODULE_ID,
      suggestion: "Migre para Ports.get('appShell')"
    });
    return window.AppShell;
  }
  return null;
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _intervalId = null;
let _running = false;
let _lastCheck = null;
let _lastStatus = null;
let _checkCount = 0;
let _statusHistory = [];
const _subscribers = [];
const _config = { enabled: true, interval: 3e4, emitEvents: true, logChanges: true, onDegraded: null, onUnhealthy: null, onRecovered: null };
const _metrics = { totalChecks: 0, healthy: 0, degraded: 0, unhealthy: 0, transitions: 0, errors: 0 };
function _notify(event, data) {
  _subscribers.forEach((cb) => {
    try {
      cb(event, data);
    } catch (e) {
    }
  });
}
function _emitEvent(eventName, data) {
  if (!_config.emitEvents) return;
  const eb = _getEventBus();
  if (eb && eb.emit) {
    eb.emit(APP_SHELL_EVENT_NAMES.HEALTH_PREFIX + eventName, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}
function _runCheck() {
  _metrics.totalChecks++;
  _checkCount++;
  _lastCheck = Date.now();
  let result;
  try {
    const appShell = _resolveAppShell();
    if (appShell && appShell.healthCheck) {
      result = appShell.healthCheck();
    } else {
      result = { status: "HEALTHY", score: "1/1", checks: { autoCheck: true } };
    }
  } catch (e) {
    _metrics.errors++;
    result = { status: "UNHEALTHY", score: "0/1", checks: { error: false }, error: e.message };
  }
  const previousStatus = _lastStatus;
  _lastStatus = result.status;
  if (result.status === "HEALTHY") _metrics.healthy++;
  else if (result.status === "DEGRADED") _metrics.degraded++;
  else _metrics.unhealthy++;
  _statusHistory.push({ status: result.status, score: result.score, timestamp: _lastCheck });
  if (_statusHistory.length > 50) _statusHistory.shift();
  if (previousStatus && previousStatus !== result.status) {
    _metrics.transitions++;
    _emitEvent("status-changed", { previous: previousStatus, current: result.status, result });
    _notify("status-changed", { previous: previousStatus, current: result.status, result });
    if (_config.logChanges) {
      console.log(`[AutoHealthCheck] Status changed: ${previousStatus} -> ${result.status}`);
    }
    if (result.status === "DEGRADED" && _config.onDegraded) {
      try {
        _config.onDegraded(result);
      } catch (e) {
      }
    } else if (result.status === "UNHEALTHY" && _config.onUnhealthy) {
      try {
        _config.onUnhealthy(result);
      } catch (e) {
      }
    } else if (result.status === "HEALTHY" && previousStatus !== "HEALTHY" && _config.onRecovered) {
      try {
        _config.onRecovered(result);
      } catch (e) {
      }
    }
  }
  return result;
}
function start(options) {
  if (_running) return { ok: false, error: "Already running" };
  options = options || {};
  if (options.interval !== void 0) _config.interval = Math.max(1e3, Math.min(3e5, options.interval));
  if (options.emitEvents !== void 0) _config.emitEvents = !!options.emitEvents;
  if (options.logChanges !== void 0) _config.logChanges = !!options.logChanges;
  if (options.onDegraded !== void 0) _config.onDegraded = options.onDegraded;
  if (options.onUnhealthy !== void 0) _config.onUnhealthy = options.onUnhealthy;
  if (options.onRecovered !== void 0) _config.onRecovered = options.onRecovered;
  _runCheck();
  _intervalId = setInterval(_runCheck, _config.interval);
  _running = true;
  _emitEvent("started", { interval: _config.interval });
  _notify("started", { interval: _config.interval });
  return { ok: true, interval: _config.interval };
}
function stop() {
  if (!_running) return { ok: false, error: "Not running" };
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _running = false;
  _emitEvent("stopped", {});
  _notify("stopped", {});
  return { ok: true };
}
function checkNow() {
  return _runCheck();
}
function isRunning() {
  return _running;
}
function configure(options) {
  if (options.interval !== void 0) _config.interval = Math.max(1e3, Math.min(3e5, options.interval));
  if (options.emitEvents !== void 0) _config.emitEvents = !!options.emitEvents;
  if (options.logChanges !== void 0) _config.logChanges = !!options.logChanges;
  if (options.onDegraded !== void 0) _config.onDegraded = options.onDegraded;
  if (options.onUnhealthy !== void 0) _config.onUnhealthy = options.onUnhealthy;
  if (options.onRecovered !== void 0) _config.onRecovered = options.onRecovered;
  if (_running) {
    clearInterval(_intervalId);
    _intervalId = setInterval(_runCheck, _config.interval);
  }
}
function getConfig() {
  return { enabled: _config.enabled, interval: _config.interval, emitEvents: _config.emitEvents, logChanges: _config.logChanges, hasCallbacks: { onDegraded: !!_config.onDegraded, onUnhealthy: !!_config.onUnhealthy, onRecovered: !!_config.onRecovered } };
}
function getStatus() {
  return { running: _running, lastCheck: _lastCheck, lastStatus: _lastStatus, checkCount: _checkCount };
}
function getLastStatus() {
  return _lastStatus;
}
function getLastCheckTime() {
  return _lastCheck;
}
function getHistory() {
  return _statusHistory.slice();
}
function getStatusHistory() {
  return getHistory();
}
function setCheckInterval(ms) {
  if (typeof ms === "number" && ms >= 1e3) {
    _config.interval = ms;
    if (_running) {
      clearInterval(_intervalId);
      _intervalId = globalThis.setInterval(_runCheck, _config.interval);
    }
  }
}
function subscribe(callback) {
  if (typeof callback === "function") _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function getMetrics() {
  return Object.assign({}, _metrics, { healthyRate: _metrics.totalChecks > 0 ? Math.round(_metrics.healthy / _metrics.totalChecks * 100) : 100 });
}
function healthCheck() {
  const checks = { running: _running, noErrors: _metrics.errors === 0, recentCheckHealthy: _lastStatus === "HEALTHY", portsInitialized: _portsInitialized, strictModeCompliant: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/5`, checks, metrics: getMetrics(), p0Enterprise: true, strictMode: isStrict(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, running: _running, config: getConfig(), status: getStatus(), metrics: getMetrics(), historyLength: _statusHistory.length, strictMode: isStrict(), timestamp: Date.now() };
}
const AutoHealthCheck = {
  VERSION,
  MODULE_ID,
  start,
  stop,
  checkNow,
  isRunning,
  configure,
  getConfig,
  getStatus,
  getLastStatus,
  getLastCheckTime,
  getHistory,
  getStatusHistory,
  setInterval: setCheckInterval,
  subscribe,
  getMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
if (hasWindow) {
  if (typeof window.__DEVTOOLS__ !== "undefined") {
    window.__DEVTOOLS__.AutoHealthCheck = AutoHealthCheck;
  }
}
var auto_health_check_default = AutoHealthCheck;
export {
  MODULE_ID,
  VERSION,
  checkNow,
  configure,
  auto_health_check_default as default,
  getConfig,
  getHistory,
  getLastCheckTime,
  getLastStatus,
  getMetrics,
  getPorts,
  getStatus,
  getStatusHistory,
  healthCheck,
  info,
  injectPorts,
  isRunning,
  setCheckInterval as setInterval,
  start,
  stop,
  subscribe
};
