import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.state";
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
let _tabs = [];
function getTabs() {
  return _tabs;
}
function setTabs(tabs) {
  _tabs = tabs;
}
let _activeTabId = null;
function getActiveTabId() {
  return _activeTabId;
}
function setActiveTabId(id) {
  _activeTabId = id;
}
let _tabsContainer = null;
let _contentContainer = null;
function getTabsContainer() {
  return _tabsContainer;
}
function setTabsContainer(el) {
  _tabsContainer = el;
}
function getContentContainer() {
  return _contentContainer;
}
function setContentContainer(el) {
  _contentContainer = el;
}
let _isInitialized = false;
function isInitialized() {
  return _isInitialized;
}
function setIsInitialized(val) {
  _isInitialized = val;
}
const _listeners = [];
let _dragState = null;
function getDragState() {
  return _dragState;
}
function setDragState(state) {
  _dragState = state;
}
const _metrics = {
  tabsOpened: 0,
  tabsClosed: 0,
  tabsSwitched: 0,
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
  _activeTabId,
  _config,
  _contentContainer,
  _dragState,
  _instance,
  _isInitialized,
  _listeners,
  _metrics,
  _tabs,
  _tabsContainer,
  getActiveTabId,
  getConfig,
  getContentContainer,
  getDragState,
  getMetrics,
  getTabs,
  getTabsContainer,
  incrementMetric,
  isInitialized,
  setActiveTabId,
  setConfig,
  setContentContainer,
  setDragState,
  setInstance,
  setIsInitialized,
  setTabs,
  setTabsContainer
};
