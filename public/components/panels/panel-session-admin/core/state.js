import { DEFAULT_HIDDEN_COLS, AUTO_REFRESH_SECONDS } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-session-admin-core-state";
const localState = {
  container: null,
  initialized: false,
  config: {},
  autoRefreshInterval: null,
  autoRefreshEnabled: false,
  countdown: AUTO_REFRESH_SECONDS,
  isFullscreen: false,
  selectedIds: /* @__PURE__ */ new Set(),
  expandedIds: /* @__PURE__ */ new Set(),
  hiddenCols: new Set(DEFAULT_HIDDEN_COLS),
  showInlineFilters: false,
  inlineFilters: {},
  detailsSession: null
};
function resetLocalState() {
  localState.container = null;
  localState.initialized = false;
  localState.config = {};
  localState.autoRefreshInterval = null;
  localState.autoRefreshEnabled = false;
  localState.countdown = AUTO_REFRESH_SECONDS;
  localState.isFullscreen = false;
  localState.selectedIds.clear();
  localState.expandedIds.clear();
  localState.hiddenCols = new Set(DEFAULT_HIDDEN_COLS);
  localState.showInlineFilters = false;
  localState.inlineFilters = {};
  localState.detailsSession = null;
}
function getContainer() {
  return localState.container;
}
function setContainer(c) {
  localState.container = c;
}
function getConfig() {
  return localState.config;
}
function setConfig(c) {
  localState.config = c;
}
function isInitialized() {
  return localState.initialized;
}
function setInitialized(v) {
  localState.initialized = v;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: localState.initialized, p25Compliant: true };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true }, p25Compliant: true };
}
var state_default = { localState, resetLocalState, getContainer, setContainer, getConfig, setConfig, isInitialized, setInitialized, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  state_default as default,
  getConfig,
  getContainer,
  healthCheck,
  info,
  isInitialized,
  localState,
  resetLocalState,
  setConfig,
  setContainer,
  setInitialized
};
