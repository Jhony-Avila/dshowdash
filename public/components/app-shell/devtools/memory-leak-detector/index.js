const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-memory-leak-detector";
import { patchEventListeners, unpatchEventListeners, patchTimers, unpatchTimers } from "./patchers.js";
import { checkForLeaks } from "./detection.js";
const _trackedListeners = /* @__PURE__ */ new Map();
const _trackedIntervals = /* @__PURE__ */ new Map();
const _trackedTimeouts = /* @__PURE__ */ new Map();
const _trackedReferences = /* @__PURE__ */ new WeakMap();
const _leakReports = [];
let _enabled = false;
let _checkInterval = null;
const _config = {
  autoCheck: false,
  checkIntervalMs: 6e4,
  maxReports: 100,
  warnThreshold: 50,
  criticalThreshold: 100
};
const _metrics = {
  checksPerformed: 0,
  leaksDetected: 0,
  leaksResolved: 0,
  lastCheck: null
};
const _stateProxy = {
  get trackedListeners() {
    return _trackedListeners;
  },
  get trackedIntervals() {
    return _trackedIntervals;
  },
  get trackedTimeouts() {
    return _trackedTimeouts;
  },
  get leakReports() {
    return _leakReports;
  },
  get config() {
    return _config;
  },
  get metrics() {
    return _metrics;
  }
};
function enable() {
  if (_enabled) return false;
  _enabled = true;
  patchEventListeners(_trackedListeners);
  patchTimers(_trackedIntervals, _trackedTimeouts);
  if (_config.autoCheck) {
    _checkInterval = setInterval(() => {
      checkForLeaks(_stateProxy);
    }, _config.checkIntervalMs);
  }
  return true;
}
function disable() {
  if (!_enabled) return false;
  _enabled = false;
  unpatchEventListeners();
  unpatchTimers();
  if (_checkInterval) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }
  return true;
}
function isEnabled() {
  return _enabled;
}
function checkNow() {
  return checkForLeaks(_stateProxy);
}
function getTrackedListeners() {
  const result = [];
  _trackedListeners.forEach((entry) => {
    result.push({ id: entry.id, targetName: entry.targetName, type: entry.type, age: Date.now() - entry.addedAt });
  });
  return result;
}
function getTrackedIntervals() {
  const result = [];
  _trackedIntervals.forEach((entry) => {
    result.push({ id: entry.id, delay: entry.delay, age: Date.now() - entry.createdAt });
  });
  return result;
}
function getTrackedTimeouts() {
  const result = [];
  _trackedTimeouts.forEach((entry) => {
    result.push({ id: entry.id, delay: entry.delay, age: Date.now() - entry.createdAt });
  });
  return result;
}
function getLeakReports(limit) {
  if (limit) return _leakReports.slice(-limit);
  return _leakReports.slice();
}
function getLastReport() {
  return _leakReports.length > 0 ? _leakReports[_leakReports.length - 1] : null;
}
function clearReports() {
  _leakReports.length = 0;
}
function trackReference(name, ref) {
  if (!ref || typeof ref !== "object") return;
  _trackedReferences.set(ref, { name, trackedAt: Date.now() });
}
function untrackReference(ref) {
  _trackedReferences.delete(ref);
}
function configure(options) {
  if (options.autoCheck !== void 0) _config.autoCheck = !!options.autoCheck;
  if (options.checkIntervalMs !== void 0) _config.checkIntervalMs = Math.max(1e4, options.checkIntervalMs);
  if (options.maxReports !== void 0) _config.maxReports = Math.max(10, options.maxReports);
  if (options.warnThreshold !== void 0) _config.warnThreshold = options.warnThreshold;
  if (options.criticalThreshold !== void 0) _config.criticalThreshold = options.criticalThreshold;
  if (_enabled && _config.autoCheck && !_checkInterval) {
    _checkInterval = setInterval(() => {
      checkForLeaks(_stateProxy);
    }, _config.checkIntervalMs);
  } else if (_checkInterval && !_config.autoCheck) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }
}
function getConfig() {
  return {
    enabled: _enabled,
    autoCheck: _config.autoCheck,
    checkIntervalMs: _config.checkIntervalMs,
    maxReports: _config.maxReports,
    warnThreshold: _config.warnThreshold,
    criticalThreshold: _config.criticalThreshold
  };
}
function getMetrics() {
  return {
    checksPerformed: _metrics.checksPerformed,
    leaksDetected: _metrics.leaksDetected,
    leaksResolved: _metrics.leaksResolved,
    lastCheck: _metrics.lastCheck,
    trackedListeners: _trackedListeners.size,
    trackedIntervals: _trackedIntervals.size,
    trackedTimeouts: _trackedTimeouts.size,
    reportCount: _leakReports.length
  };
}
function healthCheck() {
  const currentMetrics = getMetrics();
  const checks = {
    notTooManyListeners: currentMetrics.trackedListeners < _config.criticalThreshold,
    notTooManyIntervals: currentMetrics.trackedIntervals < 50,
    recentCheck: !_config.autoCheck || !_metrics.lastCheck || Date.now() - _metrics.lastCheck < _config.checkIntervalMs * 2
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  let status = "HEALTHY";
  if (currentMetrics.trackedListeners >= _config.criticalThreshold || currentMetrics.trackedIntervals >= 50) {
    status = "UNHEALTHY";
  } else if (currentMetrics.trackedListeners >= _config.warnThreshold) {
    status = "DEGRADED";
  } else if (passed < keys.length) {
    status = "DEGRADED";
  }
  return {
    status,
    score: `${passed}/${keys.length}`,
    checks,
    metrics: currentMetrics,
    config: getConfig(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    config: getConfig(),
    metrics: getMetrics(),
    lastReport: getLastReport(),
    timestamp: Date.now()
  };
}
var memory_leak_detector_default = {
  VERSION,
  MODULE_ID,
  enable,
  disable,
  isEnabled,
  checkNow,
  getTrackedListeners,
  getTrackedIntervals,
  getTrackedTimeouts,
  getLeakReports,
  getLastReport,
  clearReports,
  trackReference,
  untrackReference,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  checkNow,
  clearReports,
  configure,
  memory_leak_detector_default as default,
  disable,
  enable,
  getConfig,
  getLastReport,
  getLeakReports,
  getMetrics,
  getTrackedIntervals,
  getTrackedListeners,
  getTrackedTimeouts,
  healthCheck,
  info,
  isEnabled,
  trackReference,
  untrackReference
};
