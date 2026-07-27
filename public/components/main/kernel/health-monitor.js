import { createLogger } from "/assets/js/core/logger-global/index.js";
const MODULE_ID = "main-kernel-health-monitor";
const _logger = createLogger(MODULE_ID);
const VERSION = "1.2.0-ENTERPRISE";
const DEFAULT_CONFIG = {
  intervalMs: 3e4,
  degradedThreshold: 80,
  unhealthyThreshold: 50,
  autoRecover: true,
  maxRecoveryAttempts: 3,
  logLevel: 1,
  onDegraded: null,
  onUnhealthy: null,
  onRecovered: null
};
let _kernel = null;
let _config = { ...DEFAULT_CONFIG };
let _intervalId = null;
let _running = false;
let _recoveryAttempts = /* @__PURE__ */ new Map();
let _metrics = {
  checksPerformed: 0,
  degradedEvents: 0,
  unhealthyEvents: 0,
  recoveryAttempts: 0,
  recoverySuccesses: 0,
  lastCheckTime: null,
  lastStatus: null
};
let _history = [];
const MAX_HISTORY = 100;
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };
function _log(level, msg, data) {
  const levelNum = LOG_LEVELS[level] || 1;
  const threshold = typeof _logLevel !== "undefined" ? Number(_logLevel) : typeof _config !== "undefined" && _config && _config.logLevel ? _config.logLevel : 1;
  if (levelNum < threshold) return;
  const context = data !== void 0 ? { data } : {};
  if (level === "error") _logger.error(msg, context);
  else if (level === "warn") _logger.warn(msg, context);
  else if (level === "debug") _logger.debug(msg, context);
  else _logger.info(msg, context);
}
function setLogLevel(level) {
  if (typeof level === "string") {
    _config.logLevel = LOG_LEVELS[level] !== void 0 ? LOG_LEVELS[level] : 1;
  } else if (typeof level === "number") {
    _config.logLevel = level;
  }
  return _config.logLevel;
}
function _addToHistory(result) {
  _history.unshift({
    timestamp: Date.now(),
    status: result.status,
    score: result.score.percentage,
    featuresHealthy: Object.values(result.features).filter((f) => f.status === "HEALTHY").length,
    featuresTotal: Object.keys(result.features).length
  });
  if (_history.length > MAX_HISTORY) {
    _history.pop();
  }
}
function _checkHealth() {
  if (!_kernel) return;
  const result = _kernel.healthCheck();
  _metrics.checksPerformed++;
  _metrics.lastCheckTime = Date.now();
  _metrics.lastStatus = result.status;
  _addToHistory(result);
  if (result.score.percentage < _config.unhealthyThreshold) {
    _metrics.unhealthyEvents++;
    if (typeof _config.onUnhealthy === "function") {
      try {
        _config.onUnhealthy(result);
      } catch (e) {
      }
    }
  } else if (result.score.percentage < _config.degradedThreshold) {
    _metrics.degradedEvents++;
    if (typeof _config.onDegraded === "function") {
      try {
        _config.onDegraded(result);
      } catch (e) {
      }
    }
  }
  if (_config.autoRecover) {
    _attemptRecovery(result);
  }
  return result;
}
function _attemptRecovery(healthResult) {
  for (const [featureId, health] of Object.entries(healthResult.features)) {
    if (health.status === "ERROR" || health.status === "NOT_INITIALIZED") {
      const attempts = _recoveryAttempts.get(featureId) || 0;
      if (attempts < _config.maxRecoveryAttempts) {
        _metrics.recoveryAttempts++;
        _recoveryAttempts.set(featureId, attempts + 1);
        try {
          const result = _kernel.enableFeature(featureId);
          if (result.ok) {
            _metrics.recoverySuccesses++;
            _recoveryAttempts.delete(featureId);
            if (typeof _config.onRecovered === "function") {
              try {
                _config.onRecovered(featureId);
              } catch (e) {
              }
            }
            _log("info", `Recovered feature: ${featureId}`);
          }
        } catch (e) {
          _log("warn", `Recovery failed for: ${featureId}`, e.message);
        }
      }
    }
  }
}
function init(kernel, config = {}) {
  if (_running) {
    return { ok: true, alreadyRunning: true };
  }
  _kernel = kernel;
  _config = { ...DEFAULT_CONFIG, ...config };
  return { ok: true, config: { ..._config } };
}
function start() {
  if (_running) return { ok: true, alreadyRunning: true };
  if (!_kernel) return { ok: false, error: "Not initialized" };
  _running = true;
  _checkHealth();
  _intervalId = setInterval(_checkHealth, _config.intervalMs);
  _log("debug", `Started with interval: ${_config.intervalMs}ms`);
  return { ok: true, intervalMs: _config.intervalMs };
}
function stop() {
  if (!_running) return { ok: true, alreadyStopped: true };
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _running = false;
  _log("debug", "Stopped");
  return { ok: true };
}
function checkNow() {
  return _checkHealth();
}
function updateConfig(newConfig) {
  const wasRunning = _running;
  if (wasRunning) stop();
  _config = { ...DEFAULT_CONFIG, ..._config, ...newConfig };
  if (wasRunning) start();
  return { ok: true, config: { ..._config } };
}
function getHistory(limit) {
  return limit ? _history.slice(0, limit) : [..._history];
}
function getMetrics() {
  return {
    ..._metrics,
    running: _running,
    historySize: _history.length,
    config: { ..._config }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    running: _running,
    intervalMs: _config.intervalMs,
    metrics: getMetrics()
  };
}
function healthCheck() {
  return {
    status: _running ? "HEALTHY" : "NOT_RUNNING",
    moduleId: MODULE_ID,
    version: VERSION,
    running: _running,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
function destroy() {
  stop();
  _kernel = null;
  _history = [];
  _recoveryAttempts.clear();
  return { ok: true };
}
var health_monitor_default = {
  MODULE_ID,
  VERSION,
  init,
  start,
  stop,
  checkNow,
  updateConfig,
  getHistory,
  getMetrics,
  setLogLevel,
  info,
  healthCheck,
  destroy
};
export {
  MODULE_ID,
  VERSION,
  checkNow,
  health_monitor_default as default,
  destroy,
  getHistory,
  getMetrics,
  healthCheck,
  info,
  init,
  setLogLevel,
  start,
  stop,
  updateConfig
};
