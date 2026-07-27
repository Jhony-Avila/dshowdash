import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.focus-manager.state";
const state = {
  config: Object.assign({}, DEFAULT_CONFIG),
  trapped: false,
  trapElement: null,
  trapHandler: null,
  savedFocus: null,
  focusHistory: [],
  totalTraps: 0,
  totalRestores: 0
};
function getConfig() {
  return state.config;
}
function setConfig(newConfig) {
  state.config = Object.assign({}, state.config, newConfig);
}
function isTrapped() {
  return state.trapped;
}
function setTrapped(val) {
  state.trapped = !!val;
}
function getTrapElement() {
  return state.trapElement;
}
function setTrapElement(el) {
  state.trapElement = el;
}
function getTrapHandler() {
  return state.trapHandler;
}
function setTrapHandler(handler) {
  state.trapHandler = handler;
}
function incrementTotalTraps() {
  state.totalTraps++;
}
function getTotalTraps() {
  return state.totalTraps;
}
function getSavedFocus() {
  return state.savedFocus;
}
function setSavedFocus(el) {
  state.savedFocus = el;
}
function incrementTotalRestores() {
  state.totalRestores++;
}
function getTotalRestores() {
  return state.totalRestores;
}
function getFocusHistory() {
  return state.focusHistory;
}
function addToFocusHistory(entry) {
  state.focusHistory.push(entry);
  const limit = state.config.historyLimit;
  while (state.focusHistory.length > limit) {
    state.focusHistory.shift();
  }
}
function clearFocusHistory() {
  state.focusHistory = [];
}
function getMetricsData() {
  return {
    enabled: state.config.enabled,
    trapped: state.trapped,
    totalTraps: state.totalTraps,
    totalRestores: state.totalRestores,
    historyLength: state.focusHistory.length
  };
}
function getStateSnapshot() {
  return {
    trapped: state.trapped,
    trapElement: state.trapElement ? state.trapElement.tagName : null,
    hasSavedFocus: !!state.savedFocus,
    savedFocusElement: state.savedFocus ? state.savedFocus.tagName : null,
    historyLength: state.focusHistory.length
  };
}
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  addToFocusHistory,
  clearFocusHistory,
  state_default as default,
  getConfig,
  getFocusHistory,
  getMetricsData,
  getSavedFocus,
  getStateSnapshot,
  getTotalRestores,
  getTotalTraps,
  getTrapElement,
  getTrapHandler,
  incrementTotalRestores,
  incrementTotalTraps,
  isTrapped,
  setConfig,
  setSavedFocus,
  setTrapElement,
  setTrapHandler,
  setTrapped
};
