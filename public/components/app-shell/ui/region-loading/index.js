import {
  isLoading as _isLoading,
  setLoading as _setLoading,
  startLoading as _startLoading,
  endLoading as _endLoading,
  setSkeleton as _setSkeleton,
  setMultipleLoading as _setMultipleLoading,
  endAllLoading as _endAllLoading,
  getLoadingState as _getLoadingState,
  getLoadingRegions as _getLoadingRegions,
  isAnyLoading as _isAnyLoading
} from "./core.js";
const VERSION = "1.1.0-MODULAR";
const MODULE_ID = "app-shell-region-loading";
const _state = {
  loadingState: {},
  metrics: { loadingStarts: 0, loadingEnds: 0, errors: 0 },
  subscribers: [],
  notify(event, data) {
    for (let i = 0; i < this.subscribers.length; i++) {
      try {
        this.subscribers[i](event, data);
      } catch (e) {
      }
    }
  }
};
const _config = { defaultTimeout: 3e4, showSpinner: true };
function isLoading(regionName) {
  return _isLoading(regionName, _state);
}
function setLoading(regionName, loading, options) {
  return _setLoading(regionName, loading, options, _state);
}
function startLoading(regionName, options) {
  return _startLoading(regionName, options, _state);
}
function endLoading(regionName) {
  return _endLoading(regionName, _state);
}
function setSkeleton(regionName, loading) {
  return _setSkeleton(regionName, loading, _state);
}
function setMultipleLoading(loadingMap, options) {
  return _setMultipleLoading(loadingMap, options, _state);
}
function endAllLoading() {
  return _endAllLoading(_state);
}
function getLoadingState() {
  return _getLoadingState(_state);
}
function getLoadingRegions() {
  return _getLoadingRegions(_state);
}
function isAnyLoading() {
  return _isAnyLoading(_state);
}
function configure(options) {
  if (options.defaultTimeout !== void 0) _config.defaultTimeout = options.defaultTimeout;
  if (options.showSpinner !== void 0) _config.showSpinner = options.showSpinner;
}
function getConfig() {
  return Object.assign({}, _config);
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _state.subscribers.push(callback);
  return () => {
    const idx = _state.subscribers.indexOf(callback);
    if (idx >= 0) _state.subscribers.splice(idx, 1);
  };
}
function getMetrics() {
  return Object.assign({}, _state.metrics);
}
function healthCheck() {
  const loadingRegions = getLoadingRegions();
  const checks = {
    noStuckLoading: loadingRegions.length < 5,
    lowErrorRate: _state.metrics.errors < _state.metrics.loadingStarts * 0.1
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/2`,
    checks,
    currentlyLoading: loadingRegions,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    loadingState: getLoadingState(),
    currentlyLoading: getLoadingRegions(),
    metrics: getMetrics(),
    subscriberCount: _state.subscribers.length,
    timestamp: Date.now()
  };
}
var region_loading_default = {
  VERSION,
  MODULE_ID,
  isLoading,
  setLoading,
  startLoading,
  endLoading,
  setSkeleton,
  setMultipleLoading,
  endAllLoading,
  getLoadingState,
  getLoadingRegions,
  isAnyLoading,
  configure,
  getConfig,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  configure,
  region_loading_default as default,
  endAllLoading,
  endLoading,
  getConfig,
  getLoadingRegions,
  getLoadingState,
  getMetrics,
  healthCheck,
  info,
  isAnyLoading,
  isLoading,
  setLoading,
  setMultipleLoading,
  setSkeleton,
  startLoading,
  subscribe
};
