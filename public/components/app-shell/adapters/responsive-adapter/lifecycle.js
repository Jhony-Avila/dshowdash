const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.lifecycle";
import { BREAKPOINTS } from "./constants.js";
import { currentBreakpoint, initialized, enabled, autoApplyPolicies, resizeTimeout, mediaQueries, metrics } from "./state.js";
import { notifyListeners, detectBreakpoint } from "./helpers.js";
import { applyLayoutPolicy } from "./policies.js";
import { handleBreakpointChange } from "./breakpoints.js";
function handleResize() {
  if (!enabled.value) return;
  metrics.resizeEvents++;
  const newBreakpoint = detectBreakpoint();
  handleBreakpointChange(newBreakpoint);
}
function debouncedResize() {
  if (resizeTimeout.value) clearTimeout(resizeTimeout.value);
  resizeTimeout.value = setTimeout(handleResize, 100);
}
function init(options) {
  if (initialized.value) return true;
  if (typeof window === "undefined") return false;
  options = options || {};
  autoApplyPolicies.value = options.autoApply !== false;
  currentBreakpoint.value = detectBreakpoint();
  applyLayoutPolicy(currentBreakpoint.value, { animate: false });
  window.addEventListener("resize", debouncedResize, { passive: true });
  const bpKeys = Object.keys(BREAKPOINTS);
  for (let i = 0; i < bpKeys.length; i++) {
    const key = bpKeys[i];
    const bp = BREAKPOINTS[key];
    let query = `(min-width: ${bp.min}px)`;
    if (bp.max !== Infinity) {
      query += ` and (max-width: ${bp.max}px)`;
    }
    const mq = window.matchMedia(query);
    mediaQueries[key] = mq;
    if (mq.addEventListener) {
      mq.addEventListener("change", handleResize);
    } else if (mq.addListener) {
      mq.addListener(handleResize);
    }
  }
  initialized.value = true;
  notifyListeners("initialized", { breakpoint: currentBreakpoint.value });
  return true;
}
function destroy() {
  if (!initialized.value) return true;
  if (typeof window === "undefined") return true;
  window.removeEventListener("resize", debouncedResize);
  const keys = Object.keys(mediaQueries);
  for (let i = 0; i < keys.length; i++) {
    const mq = mediaQueries[keys[i]];
    if (mq.removeEventListener) {
      mq.removeEventListener("change", handleResize);
    } else if (mq.removeListener) {
      mq.removeListener(handleResize);
    }
  }
  for (const k in mediaQueries) {
    if (mediaQueries.hasOwnProperty(k)) {
      delete mediaQueries[k];
    }
  }
  if (resizeTimeout.value) {
    clearTimeout(resizeTimeout.value);
    resizeTimeout.value = null;
  }
  initialized.value = false;
  notifyListeners("destroyed", null);
  return true;
}
function enable() {
  enabled.value = true;
  handleResize();
  notifyListeners("enabled", null);
}
function disable() {
  enabled.value = false;
  notifyListeners("disabled", null);
}
function isEnabled() {
  return enabled.value;
}
export {
  MODULE_ID,
  VERSION,
  destroy,
  disable,
  enable,
  init,
  isEnabled
};
