import { VERSION, MODULE_ID } from "./constants.js";
import { handlers, elementHandlers, subscribers, touchState, config, setEnabled, isEnabled, getMetrics } from "./state.js";
import { handleTouchStart, handleTouchMove, handleTouchEnd } from "./handlers/index.js";
function enable() {
  setEnabled(true);
}
function disable() {
  setEnabled(false);
}
function configure(options) {
  if (options.swipeThreshold !== void 0) config.swipeThreshold = options.swipeThreshold;
  if (options.swipeVelocity !== void 0) config.swipeVelocity = options.swipeVelocity;
  if (options.tapThreshold !== void 0) config.tapThreshold = options.tapThreshold;
  if (options.doubleTapDelay !== void 0) config.doubleTapDelay = options.doubleTapDelay;
  if (options.longPressDelay !== void 0) config.longPressDelay = options.longPressDelay;
  if (options.pinchThreshold !== void 0) config.pinchThreshold = options.pinchThreshold;
  if (options.rotateThreshold !== void 0) config.rotateThreshold = options.rotateThreshold;
  if (options.preventDefaultSwipe !== void 0) config.preventDefaultSwipe = !!options.preventDefaultSwipe;
}
function getConfig() {
  return Object.assign({}, config);
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}
function healthCheck() {
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const checks = {
    enabled: isEnabled(),
    touchSupported: isTouchDevice,
    hasHandlers: handlers.size > 0 || elementHandlers.size > 0,
    configValid: config.swipeThreshold > 0
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed >= 3 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    isTouchDevice,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: isEnabled(),
    isTouchDevice,
    config: getConfig(),
    metrics: getMetrics(),
    registeredGestures: Array.from(handlers.keys()),
    subscriberCount: subscribers.length,
    timestamp: Date.now()
  };
}
function destroy() {
  if (typeof document !== "undefined") {
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  }
  handlers.clear();
  elementHandlers.clear();
  subscribers.length = 0;
  if (touchState.longPressTimer) {
    clearTimeout(touchState.longPressTimer);
  }
}
export {
  configure,
  destroy,
  disable,
  enable,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  isEnabled,
  subscribe
};
