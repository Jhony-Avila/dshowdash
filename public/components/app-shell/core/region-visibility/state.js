import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-visibility.state";
const _state = {
  visibility: {},
  isFullscreen: false,
  stylesInjected: false,
  subscribers: []
};
const _config = {
  animationDuration: DEFAULT_CONFIG.animationDuration,
  defaultAnimate: DEFAULT_CONFIG.defaultAnimate
};
const _metrics = {
  shows: 0,
  hides: 0,
  toggles: 0,
  errors: 0
};
function getMetrics() {
  return Object.assign({}, _metrics);
}
function incrementMetric(name) {
  if (_metrics[name] !== void 0) {
    _metrics[name]++;
  }
}
function notifySubscribers(event, data) {
  for (let i = 0; i < _state.subscribers.length; i++) {
    try {
      _state.subscribers[i](event, data);
    } catch (e) {
    }
  }
}
function getDuration() {
  return _config.animationDuration;
}
export {
  MODULE_ID,
  VERSION,
  _config,
  _state,
  getDuration,
  getMetrics,
  incrementMetric,
  notifySubscribers
};
