import { VERSION, MODULE_ID, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP, DEFAULT_CONFIG } from "./constants.js";
import {
  _instance,
  setInstance,
  getConfig,
  setConfig,
  isInitialized,
  setIsInitialized,
  getNavigationGroups,
  getActiveGroup as getActiveGroupState,
  getGlobalShortcuts,
  _listeners,
  getMetrics
} from "./state.js";
import { _log, _emit } from "./helpers/logger.js";
import { focusFirst, focusLast, focusNext, focusPrevious, focusByIndex } from "./navigation/focus.js";
import { registerGroup, unregisterGroup, setActiveGroup } from "./groups/manager.js";
import { _handleGlobalKeyDown, registerShortcut, unregisterShortcut, getShortcuts, enableShortcut, disableShortcut } from "./shortcuts/manager.js";
function createKeyboardNavigationManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  _log("info", "Keyboard Navigation Manager created");
  return {
    init,
    destroy,
    registerGroup,
    unregisterGroup,
    setActiveGroup,
    getActiveGroup: getActiveGroupState,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusByIndex,
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    enableShortcut,
    disableShortcut,
    subscribe,
    healthCheck,
    info
  };
}
function getKeyboardNavigationManager(options = {}) {
  if (!_instance) {
    setInstance(createKeyboardNavigationManager(options));
  }
  return _instance;
}
function init() {
  if (isInitialized()) return true;
  document.addEventListener("keydown", _handleGlobalKeyDown);
  setIsInitialized(true);
  _emit("initialized", {});
  _log("info", "Initialized");
  return true;
}
function destroy() {
  if (!isInitialized()) return true;
  document.removeEventListener("keydown", _handleGlobalKeyDown);
  getNavigationGroups().clear();
  getGlobalShortcuts().clear();
  setIsInitialized(false);
  _log("info", "Destroyed");
  return true;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    initialized: isInitialized(),
    hasGroups: getNavigationGroups().size > 0,
    noErrors: metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    groupCount: getNavigationGroups().size,
    shortcutCount: getGlobalShortcuts().size,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    keyCodes: Object.keys(KEY_CODES),
    navigationModes: Object.values(NAVIGATION_MODES),
    focusWrapModes: Object.values(FOCUS_WRAP),
    config: {
      mode: config.mode,
      orientation: config.orientation,
      wrapBehavior: config.wrapBehavior,
      enableTypeahead: config.enableTypeahead
    },
    isInitialized: isInitialized(),
    registeredGroups: Array.from(getNavigationGroups().keys()),
    registeredShortcuts: getShortcuts()
  };
}
export {
  createKeyboardNavigationManager,
  destroy,
  disableShortcut,
  enableShortcut,
  focusByIndex,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
  getKeyboardNavigationManager,
  getShortcuts,
  healthCheck,
  info,
  init,
  registerGroup,
  registerShortcut,
  setActiveGroup,
  subscribe,
  unregisterGroup,
  unregisterShortcut
};
