import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.state";
let _instance = null;
function getInstance() {
  return _instance;
}
function setInstance(inst) {
  _instance = inst;
}
let _config = { ...DEFAULT_CONFIG };
function getConfig() {
  return _config;
}
function setConfig(cfg) {
  _config = cfg;
}
function updateConfig(updates) {
  _config = { ..._config, ...updates };
}
let _bookmarks = [];
function getBookmarks() {
  return _bookmarks;
}
function setBookmarks(b) {
  _bookmarks = b;
}
let _recentPanels = [];
function getRecentPanels() {
  return _recentPanels;
}
function setRecentPanels(r) {
  _recentPanels = r;
}
let _panelFrequency = {};
function getPanelFrequency() {
  return _panelFrequency;
}
function setPanelFrequency(f) {
  _panelFrequency = f;
}
const _listeners = [];
let _hotkeyHandler = null;
function getHotkeyHandler() {
  return _hotkeyHandler;
}
function setHotkeyHandler(h) {
  _hotkeyHandler = h;
}
const _metrics = {
  bookmarksAdded: 0,
  bookmarksRemoved: 0,
  bookmarksAccessed: 0,
  errors: 0
};
function incrementMetric(key) {
  if (_metrics.hasOwnProperty(key)) _metrics[key]++;
}
function getMetrics() {
  return { ..._metrics };
}
export {
  MODULE_ID,
  VERSION,
  _bookmarks,
  _config,
  _hotkeyHandler,
  _instance,
  _listeners,
  _metrics,
  _panelFrequency,
  _recentPanels,
  getBookmarks,
  getConfig,
  getHotkeyHandler,
  getInstance,
  getMetrics,
  getPanelFrequency,
  getRecentPanels,
  incrementMetric,
  setBookmarks,
  setConfig,
  setHotkeyHandler,
  setInstance,
  setPanelFrequency,
  setRecentPanels,
  updateConfig
};
