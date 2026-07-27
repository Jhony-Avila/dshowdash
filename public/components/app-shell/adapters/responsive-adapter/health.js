import { VERSION, MODULE_ID, BREAKPOINTS } from "./constants.js";
import { currentBreakpoint, previousBreakpoint, initialized, enabled, autoApplyPolicies, listeners, metrics } from "./state.js";
import { getViewportWidth } from "./helpers.js";
import { getBreakpointInfo, getCurrentPolicy } from "./breakpoints.js";
import { isMobile, isTablet, isDesktop } from "./device.js";
import { getUserOverrides } from "./overrides.js";
function getMetrics() {
  return Object.assign({}, metrics);
}
function healthCheck() {
  const checks = {
    initialized: initialized.value,
    enabled: enabled.value,
    hasBreakpoint: !!currentBreakpoint.value,
    noErrors: metrics.errors === 0
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    currentBreakpoint: currentBreakpoint.value,
    breakpointInfo: getBreakpointInfo(),
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    viewport: getViewportWidth(),
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: initialized.value,
    enabled: enabled.value,
    autoApplyPolicies: autoApplyPolicies.value,
    currentBreakpoint: currentBreakpoint.value,
    previousBreakpoint: previousBreakpoint.value,
    breakpointInfo: getBreakpointInfo(),
    currentPolicy: getCurrentPolicy(),
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    viewport: getViewportWidth(),
    userOverrides: getUserOverrides(),
    listenerCount: listeners.length,
    metrics: getMetrics(),
    breakpoints: BREAKPOINTS,
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
