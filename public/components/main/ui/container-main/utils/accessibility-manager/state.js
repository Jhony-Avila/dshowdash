import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.state";
let _instance = null;
function setInstance(inst) {
  _instance = inst;
}
function getInstance() {
  return _instance;
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
let _isInitialized = false;
function isInitialized() {
  return _isInitialized;
}
function setIsInitialized(val) {
  _isInitialized = val;
}
let _liveRegion = null;
function getLiveRegion() {
  return _liveRegion;
}
function setLiveRegion(el) {
  _liveRegion = el;
}
let _skipLinksContainer = null;
function getSkipLinksContainer() {
  return _skipLinksContainer;
}
function setSkipLinksContainer(el) {
  _skipLinksContainer = el;
}
const _listeners = [];
const _mediaQueries = {};
function getMediaQueries() {
  return _mediaQueries;
}
let _userPreferences = {};
function getUserPreferences() {
  return _userPreferences;
}
function setUserPreferences(prefs) {
  _userPreferences = prefs;
}
function updateUserPreferences(updates) {
  _userPreferences = { ..._userPreferences, ...updates };
}
const _metrics = {
  announcements: 0,
  focusChanges: 0,
  preferencesChanged: 0,
  errors: 0
};
function incrementMetric(key) {
  if (Object.prototype.hasOwnProperty.call(_metrics, key)) _metrics[key]++;
}
function getMetrics() {
  return { ..._metrics };
}
export {
  MODULE_ID,
  VERSION,
  _config,
  _instance,
  _isInitialized,
  _listeners,
  _liveRegion,
  _mediaQueries,
  _metrics,
  _skipLinksContainer,
  _userPreferences,
  getConfig,
  getInstance,
  getLiveRegion,
  getMediaQueries,
  getMetrics,
  getSkipLinksContainer,
  getUserPreferences,
  incrementMetric,
  isInitialized,
  setConfig,
  setInstance,
  setIsInitialized,
  setLiveRegion,
  setSkipLinksContainer,
  setUserPreferences,
  updateConfig,
  updateUserPreferences
};
