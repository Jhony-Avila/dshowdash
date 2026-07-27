import { DEFAULT_CONFIG, STORAGE_KEY } from "./constants.js";
import { createLogger } from "../logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "main.ui.container-main.utils.zoom-manager.state";
const logger = createLogger("container-main:zoom-manager:state");
const state = {
  instance: null,
  config: Object.assign({}, DEFAULT_CONFIG),
  container: null,
  content: null,
  currentZoom: 1,
  isInitialized: false,
  isPinching: false,
  initialPinchDistance: 0,
  initialPinchZoom: 1,
  zoomIndicator: null,
  indicatorTimeout: null,
  listeners: [],
  metrics: {
    zoomChanges: 0,
    pinchZooms: 0,
    scrollZooms: 0,
    errors: 0
  }
};
function getInstance() {
  return state.instance;
}
function setInstance(inst) {
  state.instance = inst;
}
function getConfig() {
  return state.config;
}
function setConfig(newConfig) {
  state.config = Object.assign({}, DEFAULT_CONFIG, newConfig);
}
function getContainer() {
  return state.container;
}
function setContainer(el) {
  state.container = el;
}
function getContent() {
  return state.content;
}
function setContent(el) {
  state.content = el;
}
function getCurrentZoom() {
  return state.currentZoom;
}
function setCurrentZoom(zoom) {
  state.currentZoom = zoom;
}
function isInitialized() {
  return state.isInitialized;
}
function setInitialized(val) {
  state.isInitialized = !!val;
}
function isPinching() {
  return state.isPinching;
}
function setPinching(val) {
  state.isPinching = !!val;
}
function getInitialPinchDistance() {
  return state.initialPinchDistance;
}
function setInitialPinchDistance(val) {
  state.initialPinchDistance = val;
}
function getInitialPinchZoom() {
  return state.initialPinchZoom;
}
function setInitialPinchZoom(val) {
  state.initialPinchZoom = val;
}
function getZoomIndicator() {
  return state.zoomIndicator;
}
function setZoomIndicator(el) {
  state.zoomIndicator = el;
}
function getIndicatorTimeout() {
  return state.indicatorTimeout;
}
function setIndicatorTimeout(timeout) {
  state.indicatorTimeout = timeout;
}
function getListeners() {
  return state.listeners;
}
function getMetrics() {
  return state.metrics;
}
function incrementMetric(name) {
  if (state.metrics[name] !== void 0) {
    state.metrics[name]++;
  }
}
function saveZoom() {
  if (!state.config.persistZoom) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ zoom: state.currentZoom }));
  } catch (e) {
    logger.warn("Failed to save zoom", { error: e.message });
  }
}
function loadZoom() {
  if (!state.config.persistZoom) return state.config.defaultZoom;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.zoom || state.config.defaultZoom;
    }
  } catch (e) {
    logger.warn("Failed to load zoom", { error: e.message });
  }
  return state.config.defaultZoom;
}
function resetState() {
  state.container = null;
  state.content = null;
  state.isInitialized = false;
  state.isPinching = false;
  state.initialPinchDistance = 0;
  state.initialPinchZoom = 1;
  state.zoomIndicator = null;
  state.indicatorTimeout = null;
  state.listeners.length = 0;
}
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  state_default as default,
  getConfig,
  getContainer,
  getContent,
  getCurrentZoom,
  getIndicatorTimeout,
  getInitialPinchDistance,
  getInitialPinchZoom,
  getInstance,
  getListeners,
  getMetrics,
  getZoomIndicator,
  incrementMetric,
  isInitialized,
  isPinching,
  loadZoom,
  resetState,
  saveZoom,
  setConfig,
  setContainer,
  setContent,
  setCurrentZoom,
  setIndicatorTimeout,
  setInitialPinchDistance,
  setInitialPinchZoom,
  setInitialized,
  setInstance,
  setPinching,
  setZoomIndicator
};
