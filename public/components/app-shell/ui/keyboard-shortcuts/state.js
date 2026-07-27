import { SHORTCUT_SCOPES, DEFAULT_CONFIG } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-shortcuts.state";
const state = {
  shortcuts: /* @__PURE__ */ new Map(),
  groups: /* @__PURE__ */ new Map(),
  activeScope: SHORTCUT_SCOPES.GLOBAL,
  scopeStack: [],
  enabled: true,
  subscribers: [],
  pressedKeys: /* @__PURE__ */ new Set(),
  lastCombo: null,
  helpPanelOpen: false,
  config: {
    preventDefault: DEFAULT_CONFIG.preventDefault,
    stopPropagation: DEFAULT_CONFIG.stopPropagation,
    allowInInputs: DEFAULT_CONFIG.allowInInputs,
    debounceMs: DEFAULT_CONFIG.debounceMs,
    showHelp: DEFAULT_CONFIG.showHelp,
    helpKey: DEFAULT_CONFIG.helpKey
  },
  metrics: {
    triggered: 0,
    blocked: 0,
    registered: 0
  }
};
function getShortcuts() {
  return state.shortcuts;
}
function getGroups() {
  return state.groups;
}
function getActiveScope() {
  return state.activeScope;
}
function setActiveScope(scope) {
  state.activeScope = scope;
}
function getScopeStack() {
  return state.scopeStack;
}
function isEnabled() {
  return state.enabled;
}
function setEnabled(value) {
  state.enabled = !!value;
}
function getSubscribers() {
  return state.subscribers;
}
function getLastCombo() {
  return state.lastCombo;
}
function setLastCombo(combo) {
  state.lastCombo = combo;
}
function isHelpPanelOpen() {
  return state.helpPanelOpen;
}
function setHelpPanelOpen(value) {
  state.helpPanelOpen = !!value;
}
function getConfig() {
  return state.config;
}
function updateConfig(options) {
  if (options.preventDefault !== void 0) state.config.preventDefault = !!options.preventDefault;
  if (options.stopPropagation !== void 0) state.config.stopPropagation = !!options.stopPropagation;
  if (options.allowInInputs !== void 0) state.config.allowInInputs = !!options.allowInInputs;
  if (options.debounceMs !== void 0) state.config.debounceMs = Math.max(0, options.debounceMs);
  if (options.showHelp !== void 0) state.config.showHelp = !!options.showHelp;
  if (options.helpKey !== void 0) state.config.helpKey = options.helpKey;
}
function getMetrics() {
  return state.metrics;
}
function incrementMetric(name) {
  if (state.metrics[name] !== void 0) {
    state.metrics[name]++;
  }
}
function resetState() {
  state.shortcuts.clear();
  state.groups.clear();
  state.scopeStack.length = 0;
  state.subscribers.length = 0;
  state.activeScope = SHORTCUT_SCOPES.GLOBAL;
  state.enabled = true;
  state.lastCombo = null;
  state.helpPanelOpen = false;
}
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  state_default as default,
  getActiveScope,
  getConfig,
  getGroups,
  getLastCombo,
  getMetrics,
  getScopeStack,
  getShortcuts,
  getSubscribers,
  incrementMetric,
  isEnabled,
  isHelpPanelOpen,
  resetState,
  setActiveScope,
  setEnabled,
  setHelpPanelOpen,
  setLastCombo,
  updateConfig
};
