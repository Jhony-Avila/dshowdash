const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:resource-manager:constants";
const MEMORY_LIMITS = Object.freeze({
  WARNING: 100 * 1024 * 1024,
  CRITICAL: 200 * 1024 * 1024,
  MAX: 300 * 1024 * 1024
});
const DEFAULT_PANEL_LIMITS = Object.freeze({
  maxMemory: 50 * 1024 * 1024,
  maxResources: 20,
  maxMediaResources: 3,
  maxNetworkResources: 5,
  maxTimers: 10,
  throttleOnWarning: true
});
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    memoryLimits: Object.keys(MEMORY_LIMITS),
    panelLimitKeys: Object.keys(DEFAULT_PANEL_LIMITS)
  };
}
var constants_default = {
  VERSION,
  MODULE_ID,
  MEMORY_LIMITS,
  DEFAULT_PANEL_LIMITS,
  info
};
export {
  DEFAULT_PANEL_LIMITS,
  MEMORY_LIMITS,
  MODULE_ID,
  VERSION,
  constants_default as default,
  info
};
