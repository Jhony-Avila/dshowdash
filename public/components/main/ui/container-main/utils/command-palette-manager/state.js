import { DEFAULT_CONFIG, PALETTE_MODES } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.state";
let _instance = null;
function setInstance(inst) {
  _instance = inst;
}
let _config = { ...DEFAULT_CONFIG };
function getConfig() {
  return _config;
}
function setConfig(cfg) {
  _config = { ...DEFAULT_CONFIG, ...cfg };
}
let _isOpen = false;
let _isInitialized = false;
function setIsOpen(val) {
  _isOpen = val;
}
function setIsInitialized(val) {
  _isInitialized = val;
}
const _commands = /* @__PURE__ */ new Map();
let _recentCommands = [];
function getRecentCommands() {
  return _recentCommands;
}
function setRecentCommands(arr) {
  _recentCommands = arr;
}
let _currentMode = PALETTE_MODES.COMMANDS;
function getCurrentMode() {
  return _currentMode;
}
function setCurrentMode(mode) {
  _currentMode = mode;
}
let _selectedIndex = 0;
function getSelectedIndex() {
  return _selectedIndex;
}
function setSelectedIndex(idx) {
  _selectedIndex = idx;
}
let _filteredResults = [];
function getFilteredResults() {
  return _filteredResults;
}
function setFilteredResults(arr) {
  _filteredResults = arr;
}
let _paletteElement = null;
let _inputElement = null;
let _resultsElement = null;
function setPaletteElement(el) {
  _paletteElement = el;
}
function setInputElement(el) {
  _inputElement = el;
}
function setResultsElement(el) {
  _resultsElement = el;
}
function getPaletteElement() {
  return _paletteElement;
}
function getInputElement() {
  return _inputElement;
}
function getResultsElement() {
  return _resultsElement;
}
const _listeners = [];
let _debounceTimer = null;
function getDebounceTimer() {
  return _debounceTimer;
}
function setDebounceTimer(timer) {
  _debounceTimer = timer;
}
const _metrics = {
  opens: 0,
  commandsExecuted: 0,
  searches: 0,
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
  _commands,
  _config,
  _currentMode,
  _debounceTimer,
  _filteredResults,
  _inputElement,
  _instance,
  _isInitialized,
  _isOpen,
  _listeners,
  _metrics,
  _paletteElement,
  _recentCommands,
  _resultsElement,
  _selectedIndex,
  getConfig,
  getCurrentMode,
  getDebounceTimer,
  getFilteredResults,
  getInputElement,
  getMetrics,
  getPaletteElement,
  getRecentCommands,
  getResultsElement,
  getSelectedIndex,
  incrementMetric,
  setConfig,
  setCurrentMode,
  setDebounceTimer,
  setFilteredResults,
  setInputElement,
  setInstance,
  setIsInitialized,
  setIsOpen,
  setPaletteElement,
  setRecentCommands,
  setResultsElement,
  setSelectedIndex
};
