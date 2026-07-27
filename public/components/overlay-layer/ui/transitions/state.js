import { DEFAULT_CONFIG, BUILTIN_TRANSITIONS } from "./constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.transitions.state";
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
const _transitions = {};
const _state = {
  totalApplied: 0,
  activeTransitions: /* @__PURE__ */ new Map()
};
function incrementTotalApplied() {
  _state.totalApplied++;
}
function getTotalApplied() {
  return _state.totalApplied;
}
function getActiveTransitions() {
  return _state.activeTransitions;
}
function initBuiltinTransitions() {
  for (const [name, transition] of Object.entries(BUILTIN_TRANSITIONS)) {
    _transitions[name] = { ...transition, _builtin: true };
  }
}
initBuiltinTransitions();
export {
  MODULE_ID,
  VERSION,
  _config,
  _state,
  _transitions,
  getActiveTransitions,
  getConfig,
  getTotalApplied,
  incrementTotalApplied,
  initBuiltinTransitions,
  setConfig,
  updateConfig
};
