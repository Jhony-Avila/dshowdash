import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.0.0-ES6";
const MODULE_ID = "sidebar-feature-flags";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const STORAGE_KEY = "dsd-sidebar-feature-flags";
let _metrics = { enables: 0, disables: 0, toggles: 0, resets: 0 };
const DEFAULT_FLAGS = {
  parallax: { enabled: true, label: "Parallax Scroll", category: "visual" },
  customCursors: { enabled: false, label: "Custom Cursors", category: "visual" },
  compactMode: { enabled: true, label: "Compact Mode", category: "layout" },
  miniMode: { enabled: true, label: "Mini Mode", category: "layout" },
  dragDrop: { enabled: false, label: "Drag & Drop Reorder", category: "interaction" },
  fuzzySearch: { enabled: true, label: "Fuzzy Search", category: "search" },
  commandPalette: { enabled: true, label: "Command Palette (Ctrl+K)", category: "productivity" },
  favorites: { enabled: true, label: "Favorites", category: "organization" },
  timeTracking: { enabled: false, label: "Time Tracking", category: "analytics" },
  autoTheme: { enabled: true, label: "Auto Theme Detection", category: "theme" },
  debugPanel: { enabled: true, label: "Debug Panel", category: "debug" }
};
let _flags = {};
function loadFlags() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedFlags = saved ? JSON.parse(saved) : {};
    _flags = {};
    Object.entries(DEFAULT_FLAGS).forEach(([key, config]) => {
      _flags[key] = { ...config, enabled: savedFlags[key]?.enabled ?? config.enabled };
    });
  } catch {
    _flags = { ...DEFAULT_FLAGS };
  }
}
function saveFlags() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_flags));
  } catch {
  }
}
function init(eventBus) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  loadFlags();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FLAGS_INITIALIZED);
}
function isEnabled(featureKey) {
  return _flags[featureKey]?.enabled ?? false;
}
function enable(featureKey) {
  if (!_flags[featureKey]) return false;
  _flags[featureKey].enabled = true;
  _metrics.enables++;
  saveFlags();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURE_ENABLED, { feature: featureKey });
  return true;
}
function disable(featureKey) {
  if (!_flags[featureKey]) return false;
  _flags[featureKey].enabled = false;
  _metrics.disables++;
  saveFlags();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURE_DISABLED, { feature: featureKey });
  return true;
}
function toggle(featureKey) {
  if (!_flags[featureKey]) return null;
  _metrics.toggles++;
  const newState = !_flags[featureKey].enabled;
  _flags[featureKey].enabled = newState;
  saveFlags();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURE_TOGGLED, { feature: featureKey, enabled: newState });
  return newState;
}
function getAll() {
  return { ..._flags };
}
function getByCategory(category) {
  return Object.entries(_flags).filter(([_, config]) => config.category === category).map(([key, config]) => ({ key, ...config }));
}
function getCategories() {
  const categories = new Set(Object.values(_flags).map((f) => f.category));
  return [...categories];
}
function reset() {
  _flags = { ...DEFAULT_FLAGS };
  _metrics.resets++;
  saveFlags();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURES_RESET);
}
function bulkUpdate(updates) {
  Object.entries(updates).forEach(([key, enabled]) => {
    if (_flags[key]) _flags[key].enabled = enabled;
  });
  saveFlags();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FEATURES_BULK_UPDATED, { updates });
}
function destroy() {
  _flags = {};
}
function getMetrics() {
  const enabled = Object.values(_flags).filter((f) => f.enabled).length;
  return { ..._metrics, totalFeatures: Object.keys(_flags).length, enabledFeatures: enabled };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), totalFeatures: Object.keys(_flags).length, enabledFeatures: Object.values(_flags).filter((f) => f.enabled).length, categories: getCategories(), metrics: getMetrics() };
}
function healthCheck() {
  const enabled = Object.values(_flags).filter((f) => f.enabled).length;
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { totalFeatures: Object.keys(_flags).length, enabledFeatures: enabled }, metrics: getMetrics() };
}
var feature_flags_default = { init, isEnabled, enable, disable, toggle, getAll, getByCategory, getCategories, reset, bulkUpdate, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID, DEFAULT_FLAGS };
export {
  MODULE_ID,
  VERSION,
  bulkUpdate,
  feature_flags_default as default,
  destroy,
  disable,
  enable,
  getAll,
  getByCategory,
  getCategories,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  reset,
  toggle
};
