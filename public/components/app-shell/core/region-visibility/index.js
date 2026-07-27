import { VERSION, MODULE_ID, REGION_MAP } from "./constants.js";
import {
  isVisible as _isVisible,
  show as _show,
  hide as _hide,
  toggle as _toggle,
  setVisibility as _setVisibility,
  enterFullscreen as _enterFullscreen,
  exitFullscreen as _exitFullscreen,
  toggleFullscreen as _toggleFullscreen,
  isFullscreenMode as _isFullscreenMode,
  getVisibilityState as _getVisibilityState,
  resetVisibility as _resetVisibility
} from "./core.js";
import { _state, _config, getMetrics } from "./state.js";
import { injectStyles } from "./styles.js";
if (typeof document !== "undefined") {
  injectStyles();
}
function isVisible(regionName) {
  return _isVisible(regionName);
}
function show(regionName, options) {
  return _show(regionName, options);
}
function hide(regionName, options) {
  return _hide(regionName, options);
}
function toggle(regionName, options) {
  return _toggle(regionName, options);
}
function setVisibility(visibilityMap, options) {
  return _setVisibility(visibilityMap, options);
}
function enterFullscreen() {
  return _enterFullscreen();
}
function exitFullscreen() {
  return _exitFullscreen();
}
function toggleFullscreen() {
  return _toggleFullscreen();
}
function isFullscreenMode() {
  return _isFullscreenMode();
}
function getVisibilityState() {
  return _getVisibilityState();
}
function resetVisibility() {
  return _resetVisibility();
}
function configure(options) {
  if (options.animationDuration !== void 0) _config.animationDuration = options.animationDuration;
  if (options.defaultAnimate !== void 0) _config.defaultAnimate = !!options.defaultAnimate;
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
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    stylesInjected: _state.stylesInjected,
    lowErrorRate: metrics.errors < (metrics.shows + metrics.hides) * 0.1 || metrics.errors < 3
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    visibilityState: getVisibilityState(),
    isFullscreen: isFullscreenMode(),
    metrics,
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
    regions: Object.keys(REGION_MAP),
    visibilityState: getVisibilityState(),
    isFullscreen: isFullscreenMode(),
    metrics: getMetrics(),
    subscriberCount: _state.subscribers.length,
    timestamp: Date.now()
  };
}
var region_visibility_default = {
  VERSION,
  MODULE_ID,
  isVisible,
  show,
  hide,
  toggle,
  setVisibility,
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen,
  isFullscreenMode,
  getVisibilityState,
  resetVisibility,
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
  region_visibility_default as default,
  enterFullscreen,
  exitFullscreen,
  getConfig,
  getMetrics,
  getVisibilityState,
  healthCheck,
  hide,
  info,
  isFullscreenMode,
  isVisible,
  resetVisibility,
  setVisibility,
  show,
  subscribe,
  toggle,
  toggleFullscreen
};
