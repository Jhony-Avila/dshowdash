import { BREAKPOINTS, LAYOUT_POLICIES } from "./constants.js";
import { currentBreakpoint, previousBreakpoint, metrics } from "./state.js";
import { notifyListeners, getViewportWidth } from "./helpers.js";
import { applyLayoutPolicy } from "./policies.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.breakpoints";
function handleBreakpointChange(newBreakpoint, options) {
  if (newBreakpoint === currentBreakpoint.value) return false;
  previousBreakpoint.value = currentBreakpoint.value;
  currentBreakpoint.value = newBreakpoint;
  metrics.breakpointChanges++;
  metrics.lastChangeAt = Date.now();
  applyLayoutPolicy(newBreakpoint, options);
  notifyListeners("breakpoint-change", {
    previous: previousBreakpoint.value,
    current: currentBreakpoint.value,
    breakpoint: BREAKPOINTS[currentBreakpoint.value],
    viewport: getViewportWidth()
  });
  return true;
}
function getCurrentBreakpoint() {
  return currentBreakpoint.value;
}
function getBreakpointInfo() {
  return currentBreakpoint.value ? Object.assign({}, BREAKPOINTS[currentBreakpoint.value], { key: currentBreakpoint.value }) : null;
}
function getBreakpoints() {
  return Object.assign({}, BREAKPOINTS);
}
function getCurrentPolicy() {
  return currentBreakpoint.value ? Object.assign({}, LAYOUT_POLICIES[currentBreakpoint.value]) : null;
}
function reapplyPolicy(options) {
  if (currentBreakpoint.value) {
    applyLayoutPolicy(currentBreakpoint.value, Object.assign({ force: true }, options || {}));
  }
}
export {
  MODULE_ID,
  VERSION,
  getBreakpointInfo,
  getBreakpoints,
  getCurrentBreakpoint,
  getCurrentPolicy,
  handleBreakpointChange,
  reapplyPolicy
};
