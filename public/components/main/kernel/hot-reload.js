import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "main-kernel-hot-reload";
const VERSION = "1.4.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
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
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return console;
}
function _log(level, ...args) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](...args);
}
let _kernel = null;
let _enabled = false;
const _reloadHistory = [];
const MAX_HISTORY = 50;
const _metrics = {
  reloadsAttempted: 0,
  reloadsSucceeded: 0,
  reloadsFailed: 0,
  averageReloadTimeMs: 0
};
function init(kernel) {
  if (!kernel) return { ok: false, error: "Kernel required" };
  _kernel = kernel;
  _enabled = true;
  if (typeof window !== "undefined") {
    window.hotReload = {
      reload: reloadFeature,
      reloadAll: reloadAllFeatures,
      status: getStatus,
      history: getHistory
    };
  }
  return { ok: true, version: VERSION };
}
function destroy() {
  _kernel = null;
  _enabled = false;
  if (typeof window !== "undefined") {
    delete window.hotReload;
  }
  return { ok: true };
}
async function reloadFeature(featureId, options) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: "Hot reload not initialized" };
  }
  const opts = options || {};
  const startTime = performance.now();
  _metrics.reloadsAttempted++;
  const historyEntry = {
    featureId,
    timestamp: Date.now(),
    status: "pending",
    duration: 0,
    error: null
  };
  try {
    const featureStatus = _kernel.getFeature ? _kernel.getFeature(featureId) : null;
    const wasEnabled = featureStatus && featureStatus.data && featureStatus.data.status === "enabled";
    _log("info", "[HotReload] Reloading feature:", featureId, wasEnabled ? "(was enabled)" : "(was disabled)");
    if (wasEnabled) {
      const disableResult = _kernel.disableFeature(featureId, "hot-reload");
      if (!disableResult.ok) {
        _log("warn", "[HotReload] Warning: Could not disable feature cleanly");
      }
    }
    let featurePath = opts.path;
    if (!featurePath) {
      featurePath = `../features/${featureId}/index.js`;
    }
    const cacheBuster = `?t=${Date.now()}`;
    const fullPath = featurePath + cacheBuster;
    const featureModule = await import(fullPath);
    const registerResult = _kernel.registerFeature({
      id: featureId,
      version: featureModule.VERSION || featureModule.default && featureModule.default.VERSION || "1.0.0-HOT",
      init: featureModule.init || featureModule.default && featureModule.default.init,
      cleanup: featureModule.destroy || featureModule.cleanup || featureModule.default && featureModule.default.destroy,
      healthCheck: featureModule.healthCheck || featureModule.default && featureModule.default.healthCheck,
      info: featureModule.info || featureModule.default && featureModule.default.info,
      getMetrics: featureModule.getMetrics || featureModule.default && featureModule.default.getMetrics
    });
    if (!registerResult.ok) {
      throw new Error(`Failed to re-register: ${JSON.stringify(registerResult.errors)}`);
    }
    if (wasEnabled || opts.enable) {
      const enableResult = _kernel.enableFeature(featureId, opts.context || {});
      if (!enableResult.ok) {
        throw new Error(`Failed to re-enable: ${JSON.stringify(enableResult.errors)}`);
      }
    }
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsSucceeded++;
    _updateAverageTime(duration);
    historyEntry.status = "success";
    historyEntry.duration = duration;
    _addToHistory(historyEntry);
    _log("info", "[HotReload] \u2705 Feature reloaded:", featureId, `(${duration}ms)`);
    return { ok: true, featureId, duration, wasEnabled };
  } catch (e) {
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsFailed++;
    historyEntry.status = "failed";
    historyEntry.duration = duration;
    historyEntry.error = e.message;
    _addToHistory(historyEntry);
    _log("error", "[HotReload] Failed to reload:", featureId, e.message);
    return { ok: false, featureId, error: e.message, duration };
  }
}
async function reloadAllFeatures(options) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: "Hot reload not initialized" };
  }
  const listResult = _kernel.listFeatures();
  if (!listResult.ok || !listResult.data || !listResult.data.features) {
    return { ok: false, error: "Could not list features" };
  }
  const features = listResult.data.features;
  const results = [];
  for (let i = 0; i < features.length; i++) {
    const result = await reloadFeature(features[i].id, options);
    results.push(result);
  }
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  return {
    ok: failed === 0,
    total: features.length,
    succeeded,
    failed,
    results
  };
}
function _addToHistory(entry) {
  _reloadHistory.unshift(entry);
  if (_reloadHistory.length > MAX_HISTORY) {
    _reloadHistory.pop();
  }
}
function _updateAverageTime(newTime) {
  const total = _metrics.reloadsSucceeded;
  if (total === 1) {
    _metrics.averageReloadTimeMs = newTime;
  } else {
    _metrics.averageReloadTimeMs = Math.round(
      (_metrics.averageReloadTimeMs * (total - 1) + newTime) / total
    );
  }
}
function getStatus() {
  return {
    enabled: _enabled,
    kernelConnected: !!_kernel,
    metrics: Object.assign({}, _metrics)
  };
}
function getHistory(limit) {
  return limit ? _reloadHistory.slice(0, limit) : _reloadHistory.slice();
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    historySize: _reloadHistory.length,
    successRate: _metrics.reloadsAttempted > 0 ? `${Math.round(_metrics.reloadsSucceeded / _metrics.reloadsAttempted * 100)}%` : "N/A"
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    metrics: getMetrics()
  };
}
function healthCheck() {
  const checks = {
    enabled: _enabled,
    kernelConnected: !!_kernel,
    lowFailureRate: _metrics.reloadsFailed < _metrics.reloadsAttempted * 0.3
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: _enabled ? "HEALTHY" : "NOT_INITIALIZED",
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    strictMode: isStrict(),
    portsInitialized: _portsInitialized,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var hot_reload_default = {
  MODULE_ID,
  VERSION,
  init,
  destroy,
  reloadFeature,
  reloadAllFeatures,
  getStatus,
  getHistory,
  getMetrics,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  hot_reload_default as default,
  destroy,
  getHistory,
  getMetrics,
  getPorts,
  getStatus,
  healthCheck,
  info,
  init,
  injectPorts,
  reloadAllFeatures,
  reloadFeature
};
