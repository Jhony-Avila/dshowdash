import { REGIONS, createEmptyRegionData } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.region-metrics.state";
let _regionMetrics = {};
const _subscribers = [];
let _enabled = true;
let _trackingStartedAt = null;
const _timers = {};
const _config = {
  maxSamplesPerRegion: 100,
  trackRenderTime: true,
  trackUpdates: true,
  trackVisibility: true,
  trackInteractions: true,
  trackErrors: true,
  aggregationInterval: 6e4
};
const _globalMetrics = {
  totalEvents: 0,
  totalErrors: 0,
  trackingDuration: 0
};
function initRegionMetrics() {
  for (let i = 0; i < REGIONS.length; i++) {
    _regionMetrics[REGIONS[i]] = createEmptyRegionData();
  }
  _trackingStartedAt = Date.now();
}
initRegionMetrics();
function getRegionStore() {
  return _regionMetrics;
}
function getSubscribers() {
  return _subscribers;
}
function isEnabled() {
  return _enabled;
}
function setEnabled(val) {
  _enabled = !!val;
}
function getTrackingStartedAt() {
  return _trackingStartedAt;
}
function setTrackingStartedAt(val) {
  _trackingStartedAt = val;
}
function getTimers() {
  return _timers;
}
function getConfig() {
  return _config;
}
function getGlobalMetrics() {
  return _globalMetrics;
}
function notifySubscribers(event) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](event);
    } catch (e) {
    }
  }
}
function addSample(region, type, sample) {
  if (!_regionMetrics[region]) {
    _regionMetrics[region] = createEmptyRegionData();
  }
  const metrics = _regionMetrics[region];
  const arr = metrics[`${type}s`] || metrics[type];
  if (arr) {
    arr.push(sample);
    if (arr.length > _config.maxSamplesPerRegion) {
      arr.shift();
    }
  }
  metrics.aggregated.lastActivity = Date.now();
  _globalMetrics.totalEvents++;
}
function resetAll() {
  initRegionMetrics();
  _globalMetrics.totalEvents = 0;
  _globalMetrics.totalErrors = 0;
  _globalMetrics.trackingDuration = 0;
}
function resetRegion(region) {
  if (_regionMetrics[region]) {
    _regionMetrics[region] = createEmptyRegionData();
  }
}
function configure(options) {
  if (options.maxSamplesPerRegion !== void 0) _config.maxSamplesPerRegion = options.maxSamplesPerRegion;
  if (options.trackRenderTime !== void 0) _config.trackRenderTime = !!options.trackRenderTime;
  if (options.trackUpdates !== void 0) _config.trackUpdates = !!options.trackUpdates;
  if (options.trackVisibility !== void 0) _config.trackVisibility = !!options.trackVisibility;
  if (options.trackInteractions !== void 0) _config.trackInteractions = !!options.trackInteractions;
  if (options.trackErrors !== void 0) _config.trackErrors = !!options.trackErrors;
}
function addSubscriber(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
export {
  MODULE_ID,
  VERSION,
  addSample,
  addSubscriber,
  configure,
  getConfig,
  getGlobalMetrics,
  getRegionStore,
  getSubscribers,
  getTimers,
  getTrackingStartedAt,
  initRegionMetrics,
  isEnabled,
  notifySubscribers,
  resetAll,
  resetRegion,
  setEnabled,
  setTrackingStartedAt
};
