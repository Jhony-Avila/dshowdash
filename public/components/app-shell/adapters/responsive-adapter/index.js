import { VERSION, MODULE_ID } from "./constants.js";
import { init, destroy, enable, disable, isEnabled } from "./lifecycle.js";
import { getCurrentBreakpoint, getBreakpointInfo, getBreakpoints, getCurrentPolicy, reapplyPolicy } from "./breakpoints.js";
import { isMobile, isTablet, isDesktop } from "./device.js";
import { setUserOverride, clearUserOverride, clearAllOverrides, getUserOverrides, setAutoApply } from "./overrides.js";
import { subscribe } from "./subscription.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { initMobileMarker, applyMobileMarker, computeViewport, isMobileShellEnabled } from "./mobile-marker.js";
import { init as init2 } from "./lifecycle.js";
import { initMobileMarker as initMobileMarker2 } from "./mobile-marker.js";
if (typeof document !== "undefined") {
  const boot = () => {
    init2();
    try {
      initMobileMarker2();
    } catch {
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./constants.js";
import { destroy as destroy2, enable as enable2, disable as disable2, isEnabled as isEnabled2 } from "./lifecycle.js";
import { getCurrentBreakpoint as getCurrentBreakpoint2, getBreakpointInfo as getBreakpointInfo2, getBreakpoints as getBreakpoints2, getCurrentPolicy as getCurrentPolicy2, reapplyPolicy as reapplyPolicy2 } from "./breakpoints.js";
import { isMobile as isMobile2, isTablet as isTablet2, isDesktop as isDesktop2 } from "./device.js";
import { setUserOverride as setUserOverride2, clearUserOverride as clearUserOverride2, clearAllOverrides as clearAllOverrides2, getUserOverrides as getUserOverrides2, setAutoApply as setAutoApply2 } from "./overrides.js";
import { subscribe as subscribe2 } from "./subscription.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var responsive_adapter_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  init: init2,
  destroy: destroy2,
  enable: enable2,
  disable: disable2,
  isEnabled: isEnabled2,
  getCurrentBreakpoint: getCurrentBreakpoint2,
  getBreakpointInfo: getBreakpointInfo2,
  getBreakpoints: getBreakpoints2,
  getCurrentPolicy: getCurrentPolicy2,
  reapplyPolicy: reapplyPolicy2,
  isMobile: isMobile2,
  isTablet: isTablet2,
  isDesktop: isDesktop2,
  setUserOverride: setUserOverride2,
  clearUserOverride: clearUserOverride2,
  clearAllOverrides: clearAllOverrides2,
  getUserOverrides: getUserOverrides2,
  setAutoApply: setAutoApply2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  VERSION,
  applyMobileMarker,
  clearAllOverrides,
  clearUserOverride,
  computeViewport,
  responsive_adapter_default as default,
  destroy,
  disable,
  enable,
  getBreakpointInfo,
  getBreakpoints,
  getCurrentBreakpoint,
  getCurrentPolicy,
  getMetrics,
  getUserOverrides,
  healthCheck,
  info,
  init,
  initMobileMarker,
  isDesktop,
  isEnabled,
  isMobile,
  isMobileShellEnabled,
  isTablet,
  reapplyPolicy,
  setAutoApply,
  setUserOverride,
  subscribe
};
