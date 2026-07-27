const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-analytics-exporter";
import {
  registerAdapter as _registerAdapter,
  unregisterAdapter as _unregisterAdapter,
  enableAdapter as _enableAdapter,
  disableAdapter as _disableAdapter,
  getAdapters as _getAdapters,
  useBuiltInAdapter as _useBuiltInAdapter
} from "./adapters.js";
import {
  track as _track,
  trackPerformance as _trackPerformance,
  trackError as _trackError,
  trackHealthCheck as _trackHealthCheck,
  flush as _flush,
  flushAll as _flushAll
} from "./tracking.js";
const _adapters = /* @__PURE__ */ new Map();
const _queue = [];
let _enabled = false;
let _batchInterval = null;
const _config = {
  batchSize: 10,
  batchIntervalMs: 5e3,
  maxQueueSize: 1e3,
  retryAttempts: 3,
  retryDelayMs: 1e3
};
const _metrics = {
  eventsQueued: 0,
  eventsSent: 0,
  eventsFailed: 0,
  batchesSent: 0
};
const _stateProxy = {
  get enabled() {
    return _enabled;
  },
  get queue() {
    return _queue;
  },
  get adapters() {
    return _adapters;
  },
  get config() {
    return _config;
  },
  get metrics() {
    return _metrics;
  }
};
function registerAdapter(name, adapter) {
  return _registerAdapter(name, adapter, _adapters);
}
function unregisterAdapter(name) {
  return _unregisterAdapter(name, _adapters);
}
function enableAdapter(name) {
  return _enableAdapter(name, _adapters);
}
function disableAdapter(name) {
  return _disableAdapter(name, _adapters);
}
function getAdapters() {
  return _getAdapters(_adapters);
}
function useBuiltInAdapter(name, options) {
  return _useBuiltInAdapter(name, options, _adapters);
}
function track(eventName, data) {
  return _track(eventName, data, _stateProxy);
}
function trackPerformance(name, duration, metadata) {
  return _trackPerformance(name, duration, metadata, _stateProxy);
}
function trackError(error, context) {
  return _trackError(error, context, _stateProxy);
}
function trackHealthCheck(result) {
  return _trackHealthCheck(result, _stateProxy);
}
function flush() {
  return _flush(_stateProxy);
}
function flushAll() {
  return _flushAll(_stateProxy);
}
function enable() {
  if (_enabled) return false;
  _enabled = true;
  if (_config.batchIntervalMs > 0) {
    _batchInterval = setInterval(flush, _config.batchIntervalMs);
  }
  return true;
}
function disable() {
  if (!_enabled) return false;
  _enabled = false;
  if (_batchInterval) {
    clearInterval(_batchInterval);
    _batchInterval = null;
  }
  return true;
}
function isEnabled() {
  return _enabled;
}
function getQueueSize() {
  return _queue.length;
}
function clearQueue() {
  const count = _queue.length;
  _queue.length = 0;
  return count;
}
function configure(options) {
  if (options.batchSize !== void 0) _config.batchSize = Math.max(1, options.batchSize);
  if (options.batchIntervalMs !== void 0) _config.batchIntervalMs = Math.max(0, options.batchIntervalMs);
  if (options.maxQueueSize !== void 0) _config.maxQueueSize = Math.max(100, options.maxQueueSize);
  if (options.retryAttempts !== void 0) _config.retryAttempts = Math.max(0, options.retryAttempts);
  if (options.retryDelayMs !== void 0) _config.retryDelayMs = Math.max(100, options.retryDelayMs);
  if (_enabled && _batchInterval) {
    clearInterval(_batchInterval);
    if (_config.batchIntervalMs > 0) {
      _batchInterval = setInterval(flush, _config.batchIntervalMs);
    } else {
      _batchInterval = null;
    }
  }
}
function getConfig() {
  return {
    enabled: _enabled,
    batchSize: _config.batchSize,
    batchIntervalMs: _config.batchIntervalMs,
    maxQueueSize: _config.maxQueueSize,
    retryAttempts: _config.retryAttempts,
    retryDelayMs: _config.retryDelayMs
  };
}
function getMetrics() {
  return {
    eventsQueued: _metrics.eventsQueued,
    eventsSent: _metrics.eventsSent,
    eventsFailed: _metrics.eventsFailed,
    batchesSent: _metrics.batchesSent,
    currentQueueSize: _queue.length,
    adaptersCount: _adapters.size
  };
}
function healthCheck() {
  const currentMetrics = getMetrics();
  let hasEnabledAdapter = false;
  _adapters.forEach((entry) => {
    if (entry.enabled) hasEnabledAdapter = true;
  });
  const checks = {
    enabled: _enabled,
    hasAdapters: hasEnabledAdapter,
    queueNotFull: _queue.length < _config.maxQueueSize * 0.9,
    lowFailRate: _metrics.eventsQueued === 0 || _metrics.eventsFailed / _metrics.eventsQueued < 0.1
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${keys.length}`,
    checks,
    metrics: currentMetrics,
    adapters: getAdapters(),
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
    adapters: getAdapters(),
    queueSize: _queue.length,
    timestamp: Date.now()
  };
}
var analytics_exporter_default = {
  VERSION,
  MODULE_ID,
  registerAdapter,
  unregisterAdapter,
  enableAdapter,
  disableAdapter,
  getAdapters,
  useBuiltInAdapter,
  track,
  trackPerformance,
  trackError,
  trackHealthCheck,
  flush,
  flushAll,
  enable,
  disable,
  isEnabled,
  getQueueSize,
  clearQueue,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  clearQueue,
  configure,
  analytics_exporter_default as default,
  disable,
  disableAdapter,
  enable,
  enableAdapter,
  flush,
  flushAll,
  getAdapters,
  getConfig,
  getMetrics,
  getQueueSize,
  healthCheck,
  info,
  isEnabled,
  registerAdapter,
  track,
  trackError,
  trackHealthCheck,
  trackPerformance,
  unregisterAdapter,
  useBuiltInAdapter
};
