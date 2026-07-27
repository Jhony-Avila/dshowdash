import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.keyboard-navigation-manager.state";
let _instance = null;
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
let _isInitialized = false;
function isInitialized() {
  return _isInitialized;
}
function setIsInitialized(val) {
  _isInitialized = val;
}
const _navigationGroups = /* @__PURE__ */ new Map();
function getNavigationGroups() {
  return _navigationGroups;
}
let _activeGroup = null;
function getActiveGroup() {
  return _activeGroup;
}
function setActiveGroup(g) {
  _activeGroup = g;
}
let _typeaheadBuffer = "";
function getTypeaheadBuffer() {
  return _typeaheadBuffer;
}
function setTypeaheadBuffer(b) {
  _typeaheadBuffer = b;
}
function appendTypeaheadBuffer(char) {
  _typeaheadBuffer += char;
}
let _typeaheadTimer = null;
function getTypeaheadTimer() {
  return _typeaheadTimer;
}
function setTypeaheadTimer(t) {
  _typeaheadTimer = t;
}
const _listeners = [];
const _globalShortcuts = /* @__PURE__ */ new Map();
function getGlobalShortcuts() {
  return _globalShortcuts;
}
const _metrics = {
  keyPresses: 0,
  navigationEvents: 0,
  typeaheadMatches: 0,
  shortcutsTriggered: 0,
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
  _activeGroup,
  _config,
  _globalShortcuts,
  _instance,
  _isInitialized,
  _listeners,
  _metrics,
  _navigationGroups,
  _typeaheadBuffer,
  _typeaheadTimer,
  appendTypeaheadBuffer,
  getActiveGroup,
  getConfig,
  getGlobalShortcuts,
  getMetrics,
  getNavigationGroups,
  getTypeaheadBuffer,
  getTypeaheadTimer,
  incrementMetric,
  isInitialized,
  setActiveGroup,
  setConfig,
  setInstance,
  setIsInitialized,
  setTypeaheadBuffer,
  setTypeaheadTimer
};
