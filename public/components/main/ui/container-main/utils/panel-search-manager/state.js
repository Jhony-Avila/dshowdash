import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-search-manager.state";
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
let _isOpen = false;
function isOpen() {
  return _isOpen;
}
function setIsOpen(val) {
  _isOpen = val;
}
let _isInitialized = false;
function isInitialized() {
  return _isInitialized;
}
function setIsInitialized(val) {
  _isInitialized = val;
}
let _searchContainer = null;
function getSearchContainer() {
  return _searchContainer;
}
function setSearchContainer(el) {
  _searchContainer = el;
}
let _currentQuery = "";
function getCurrentQuery() {
  return _currentQuery;
}
function setCurrentQuery(q) {
  _currentQuery = q;
}
let _matches = [];
function getMatches() {
  return _matches;
}
function setMatches(m) {
  _matches = m;
}
let _currentMatchIndex = -1;
function getCurrentMatchIndex() {
  return _currentMatchIndex;
}
function setCurrentMatchIndex(idx) {
  _currentMatchIndex = idx;
}
let _highlightedElements = [];
function getHighlightedElements() {
  return _highlightedElements;
}
function setHighlightedElements(els) {
  _highlightedElements = els;
}
const _originalContents = /* @__PURE__ */ new Map();
function getOriginalContents() {
  return _originalContents;
}
const _listeners = [];
const _metrics = {
  searches: 0,
  matchesFound: 0,
  navigations: 0,
  errors: 0
};
function incrementMetric(key, amount = 1) {
  if (_metrics.hasOwnProperty(key)) _metrics[key] += amount;
}
function getMetrics() {
  return { ..._metrics };
}
export {
  MODULE_ID,
  VERSION,
  _config,
  _currentMatchIndex,
  _currentQuery,
  _highlightedElements,
  _instance,
  _isInitialized,
  _isOpen,
  _listeners,
  _matches,
  _metrics,
  _originalContents,
  _searchContainer,
  getConfig,
  getCurrentMatchIndex,
  getCurrentQuery,
  getHighlightedElements,
  getInstance,
  getMatches,
  getMetrics,
  getOriginalContents,
  getSearchContainer,
  incrementMetric,
  isInitialized,
  isOpen,
  setConfig,
  setCurrentMatchIndex,
  setCurrentQuery,
  setHighlightedElements,
  setInstance,
  setIsInitialized,
  setIsOpen,
  setMatches,
  setSearchContainer
};
