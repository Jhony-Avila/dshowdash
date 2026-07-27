const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.state";
let _initialized = false;
function isInitialized() {
  return _initialized;
}
function setInitialized(val) {
  _initialized = val;
}
let _enabled = true;
function isEnabled() {
  return _enabled;
}
function setEnabled(val) {
  _enabled = val;
}
let _currentRegionIndex = -1;
function getCurrentRegionIndex() {
  return _currentRegionIndex;
}
function setCurrentRegionIndex(idx) {
  _currentRegionIndex = idx;
}
let _tabTrapRegion = null;
function getTabTrapRegion() {
  return _tabTrapRegion;
}
function setTabTrapRegion(region) {
  _tabTrapRegion = region;
}
let _previousFocus = null;
function getPreviousFocus() {
  return _previousFocus;
}
function setPreviousFocus(el) {
  _previousFocus = el;
}
const _listeners = [];
const _metrics = {
  f6Navigations: 0,
  escapeActions: 0,
  tabTraps: 0,
  errors: 0
};
function incrementMetric(key) {
  if (_metrics.hasOwnProperty(key)) _metrics[key]++;
}
function getMetrics() {
  return {
    f6Navigations: _metrics.f6Navigations,
    escapeActions: _metrics.escapeActions,
    tabTraps: _metrics.tabTraps,
    errors: _metrics.errors
  };
}
function notifyListeners(event, data) {
  for (let i = 0; i < _listeners.length; i++) {
    try {
      _listeners[i]({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      _metrics.errors++;
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  _currentRegionIndex,
  _enabled,
  _initialized,
  _listeners,
  _metrics,
  _previousFocus,
  _tabTrapRegion,
  getCurrentRegionIndex,
  getMetrics,
  getPreviousFocus,
  getTabTrapRegion,
  incrementMetric,
  isEnabled,
  isInitialized,
  notifyListeners,
  setCurrentRegionIndex,
  setEnabled,
  setInitialized,
  setPreviousFocus,
  setTabTrapRegion
};
