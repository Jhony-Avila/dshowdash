import { HOOK_TYPES, DEFAULT_CONFIG } from "./constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lifecycle-hooks.state";
let config = { ...DEFAULT_CONFIG };
const hooks = {};
const state = {
  totalCalls: 0,
  cancelledByHook: 0,
  errors: 0,
  hookExecutions: {}
};
let logger = null;
function setLogger(l) {
  logger = l;
}
function initHooks() {
  for (const type of HOOK_TYPES) {
    if (!hooks[type]) {
      hooks[type] = [];
    }
    if (!state.hookExecutions[type]) {
      state.hookExecutions[type] = { calls: 0, cancelled: 0, errors: 0 };
    }
  }
}
function updateConfig(newConfig) {
  config = { ...config, ...newConfig };
  if (config.timeoutMs < 100) config.timeoutMs = 100;
}
function logError(message, error) {
  if (config.logErrors && logger?.error) {
    logger.error(`[${MODULE_ID}]`, message, error?.message || error);
  }
}
function isValidHookType(type) {
  return HOOK_TYPES.includes(type);
}
initHooks();
export {
  MODULE_ID,
  VERSION,
  config,
  hooks,
  initHooks,
  isValidHookType,
  logError,
  logger,
  setLogger,
  state,
  updateConfig
};
