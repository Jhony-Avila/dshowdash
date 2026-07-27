import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.state";
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
function updateConfig(updates) {
  _config = { ..._config, ...updates };
}
let _container = null;
function getContainer() {
  return _container;
}
function setContainer(c) {
  _container = c;
}
let _primaryPanel = null;
function getPrimaryPanel() {
  return _primaryPanel;
}
function setPrimaryPanel(p) {
  _primaryPanel = p;
}
let _secondaryPanel = null;
function getSecondaryPanel() {
  return _secondaryPanel;
}
function setSecondaryPanel(p) {
  _secondaryPanel = p;
}
let _gutter = null;
function getGutter() {
  return _gutter;
}
function setGutter(g) {
  _gutter = g;
}
let _isActive = false;
function isActive() {
  return _isActive;
}
function setIsActive(val) {
  _isActive = val;
}
let _isResizing = false;
function isResizing() {
  return _isResizing;
}
function setIsResizing(val) {
  _isResizing = val;
}
let _collapsedPanel = null;
function getCollapsedPanel() {
  return _collapsedPanel;
}
function setCollapsedPanel(p) {
  _collapsedPanel = p;
}
let _currentRatio = 0.5;
function getCurrentRatio() {
  return _currentRatio;
}
function setCurrentRatio(r) {
  _currentRatio = r;
}
const _listeners = [];
const _metrics = {
  activations: 0,
  resizes: 0,
  collapses: 0,
  errors: 0
};
function incrementMetric(key) {
  if (_metrics.hasOwnProperty(key)) _metrics[key]++;
}
function getMetrics() {
  return { ..._metrics };
}
function resetDOMRefs() {
  _primaryPanel = null;
  _secondaryPanel = null;
  _gutter = null;
}
export {
  MODULE_ID,
  VERSION,
  _collapsedPanel,
  _config,
  _container,
  _currentRatio,
  _gutter,
  _instance,
  _isActive,
  _isResizing,
  _listeners,
  _metrics,
  _primaryPanel,
  _secondaryPanel,
  getCollapsedPanel,
  getConfig,
  getContainer,
  getCurrentRatio,
  getGutter,
  getMetrics,
  getPrimaryPanel,
  getSecondaryPanel,
  incrementMetric,
  isActive,
  isResizing,
  resetDOMRefs,
  setCollapsedPanel,
  setConfig,
  setContainer,
  setCurrentRatio,
  setGutter,
  setInstance,
  setIsActive,
  setIsResizing,
  setPrimaryPanel,
  setSecondaryPanel,
  updateConfig
};
