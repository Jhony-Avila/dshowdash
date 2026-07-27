import { BREAKPOINTS } from "./constants.js";
import { listeners, metrics } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.helpers";
function notifyListeners(event, data) {
  for (let i = 0; i < listeners.length; i++) {
    try {
      listeners[i]({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      metrics.errors++;
    }
  }
}
function getViewportWidth() {
  if (typeof window === "undefined") return 1200;
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}
function detectBreakpoint(width) {
  if (width === void 0) width = getViewportWidth();
  const keys = Object.keys(BREAKPOINTS);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const bp = BREAKPOINTS[key];
    if (width >= bp.min && width <= bp.max) {
      return key;
    }
  }
  return "lg";
}
export {
  MODULE_ID,
  VERSION,
  detectBreakpoint,
  getViewportWidth,
  notifyListeners
};
