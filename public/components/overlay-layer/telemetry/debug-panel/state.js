import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.telemetry.debug-panel.state";
const state = {
  config: Object.assign({}, DEFAULT_CONFIG),
  panelElement: null,
  refreshIntervalId: null,
  eventLog: [],
  isVisible: false,
  overlayLayer: null
};
function getConfig() {
  return state.config;
}
function setConfig(newConfig) {
  state.config = Object.assign({}, state.config, newConfig);
}
function resetConfig() {
  state.config = Object.assign({}, DEFAULT_CONFIG);
}
function getPanelElement() {
  return state.panelElement;
}
function setPanelElement(el) {
  state.panelElement = el;
}
function getRefreshIntervalId() {
  return state.refreshIntervalId;
}
function setRefreshIntervalId(id) {
  state.refreshIntervalId = id;
}
function clearRefreshInterval() {
  if (state.refreshIntervalId) {
    clearInterval(state.refreshIntervalId);
    state.refreshIntervalId = null;
  }
}
function isVisible() {
  return state.isVisible;
}
function setVisible(val) {
  state.isVisible = !!val;
}
function getEventLog() {
  return state.eventLog;
}
function addEvent(event) {
  state.eventLog.push(event);
  const maxEvents = state.config.maxEvents;
  while (state.eventLog.length > maxEvents) {
    state.eventLog.shift();
  }
}
function clearEventLog() {
  state.eventLog = [];
}
function getOverlayLayer() {
  return state.overlayLayer;
}
function setOverlayLayer(ref) {
  state.overlayLayer = ref;
}
function resetState() {
  clearRefreshInterval();
  state.panelElement = null;
  state.eventLog = [];
  state.isVisible = false;
}
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  addEvent,
  clearEventLog,
  clearRefreshInterval,
  state_default as default,
  getConfig,
  getEventLog,
  getOverlayLayer,
  getPanelElement,
  getRefreshIntervalId,
  isVisible,
  resetConfig,
  resetState,
  setConfig,
  setOverlayLayer,
  setPanelElement,
  setRefreshIntervalId,
  setVisible
};
