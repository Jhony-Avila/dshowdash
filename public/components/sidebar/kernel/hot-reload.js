const MODULE_ID = "sidebar-kernel-hot-reload";
const VERSION = "1.1.0-ES6";
let _kernel = null;
let _enabled = false;
let _reloadHistory = [];
const MAX_HISTORY = 50;
let _metrics = {
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
    window.sidebarHotReload = {
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
  if (typeof window !== "undefined") delete window.sidebarHotReload;
  return { ok: true };
}
async function reloadFeature(featureId, options) {
  if (!_enabled || !_kernel) return { ok: false, error: "Hot reload not initialized" };
  const opts = options || {};
  const startTime = performance.now();
  _metrics.reloadsAttempted++;
  const historyEntry = { featureId, timestamp: Date.now(), status: "pending", duration: 0, error: null };
  try {
    const featureStatus = _kernel.getFeatureStatus ? _kernel.getFeatureStatus(featureId) : null;
    const wasEnabled = featureStatus && featureStatus.ok && featureStatus.data && featureStatus.data.status === "enabled";
    if (wasEnabled) {
      _kernel.disableFeature(featureId, "hot-reload");
    }
    const featurePath = opts.path || `./features/${featureId}.js`;
    const cacheBuster = `?t=${Date.now()}`;
    const featureModule = await import(featurePath + cacheBuster);
    _kernel.registerFeature({
      id: featureId,
      version: featureModule.VERSION || featureModule.default && featureModule.default.VERSION || "1.0.0-HOT",
      init: featureModule.init || featureModule.default && featureModule.default.init,
      cleanup: featureModule.destroy || featureModule.cleanup || featureModule.default && featureModule.default.destroy,
      healthCheck: featureModule.healthCheck || featureModule.default && featureModule.default.healthCheck
    });
    if (wasEnabled || opts.enable) {
      _kernel.enableFeature(featureId, opts.context || {});
    }
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsSucceeded++;
    historyEntry.status = "success";
    historyEntry.duration = duration;
    _addToHistory(historyEntry);
    return { ok: true, featureId, duration };
  } catch (e) {
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsFailed++;
    historyEntry.status = "failed";
    historyEntry.duration = duration;
    historyEntry.error = e.message;
    _addToHistory(historyEntry);
    return { ok: false, featureId, error: e.message, duration };
  }
}
async function reloadAllFeatures(options) {
  if (!_enabled || !_kernel) return { ok: false, error: "Hot reload not initialized" };
  const listResult = _kernel.listFeatures();
  if (!listResult.ok) return { ok: false, error: "Could not list features" };
  const features = listResult.data.features;
  const results = [];
  for (let i = 0; i < features.length; i++) {
    const result = await reloadFeature(features[i].id, options);
    results.push(result);
  }
  const succeeded = results.filter((r) => r.ok).length;
  return { ok: succeeded === results.length, total: features.length, succeeded, failed: results.length - succeeded, results };
}
function _addToHistory(entry) {
  _reloadHistory.unshift(entry);
  if (_reloadHistory.length > MAX_HISTORY) _reloadHistory.pop();
}
function getStatus() {
  return { enabled: _enabled, kernelConnected: !!_kernel, metrics: Object.assign({}, _metrics) };
}
function getHistory(limit) {
  return limit ? _reloadHistory.slice(0, limit) : _reloadHistory.slice();
}
function getMetrics() {
  return Object.assign({}, _metrics, { historySize: _reloadHistory.length });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, metrics: getMetrics() };
}
function healthCheck() {
  return {
    status: _enabled ? "HEALTHY" : "NOT_INITIALIZED",
    moduleId: MODULE_ID,
    version: VERSION,
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
  getStatus,
  healthCheck,
  info,
  init,
  reloadAllFeatures,
  reloadFeature
};
