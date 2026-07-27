import { currentBreakpoint } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.device";
function isMobile() {
  return currentBreakpoint.value === "xs" || currentBreakpoint.value === "sm";
}
function isTablet() {
  return currentBreakpoint.value === "md";
}
function isDesktop() {
  return currentBreakpoint.value === "lg" || currentBreakpoint.value === "xl" || currentBreakpoint.value === "xxl";
}
export {
  MODULE_ID,
  VERSION,
  isDesktop,
  isMobile,
  isTablet
};
