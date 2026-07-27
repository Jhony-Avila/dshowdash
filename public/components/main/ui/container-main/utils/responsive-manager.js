import { createLogger } from "./logger.js";
const VERSION = "2.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:responsive-manager";
const logger = createLogger(MODULE_ID);
const LAYOUTS = Object.freeze({
  FULL: "full",
  SPLIT: "split",
  COMPACT: "compact",
  MINIMAL: "minimal",
  DASHBOARD: "dashboard"
});
const BREAKPOINTS = Object.freeze({
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
});
const BREAKPOINT_ORDER = ["xs", "sm", "md", "lg", "xl", "xxl"];
let _state = {
  currentLayout: LAYOUTS.FULL,
  currentBreakpoint: "lg",
  containerWidth: 0,
  initialized: false
};
let _resizeObserver = null;
let _layoutListeners = /* @__PURE__ */ new Set();
let _breakpointListeners = /* @__PURE__ */ new Map();
let _eventBus = null;
function _emit(event, data) {
  if (_eventBus?.emit) {
    _eventBus.emit(event, { source: MODULE_ID, timestamp: Date.now(), ...data });
  }
}
function _getBreakpoint(width) {
  if (width >= BREAKPOINTS.xxl) return "xxl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}
function _applyLayout(layout, container) {
  if (!container) return false;
  Object.values(LAYOUTS).forEach((l) => {
    container.classList.remove(`dsd-layout--${l}`);
  });
  container.classList.add(`dsd-layout--${layout}`);
  container.setAttribute("data-layout", layout);
  const oldLayout = _state.currentLayout;
  _state.currentLayout = layout;
  if (oldLayout !== layout) {
    _layoutListeners.forEach((fn) => {
      try {
        fn(layout, oldLayout);
      } catch (e) {
        logger.error("Listener error", { error: e.message });
      }
    });
    _emit("responsive:layout-change", { layout, previous: oldLayout });
  }
  return true;
}
function _handleResize(entries) {
  const entry = entries[0];
  if (!entry) return;
  const width = entry.contentRect.width;
  _state.containerWidth = width;
  const newBreakpoint = _getBreakpoint(width);
  if (newBreakpoint !== _state.currentBreakpoint) {
    const oldBreakpoint = _state.currentBreakpoint;
    _state.currentBreakpoint = newBreakpoint;
    _breakpointListeners.forEach((callbacks, bp) => {
      if (bp === newBreakpoint || bp === "*") {
        callbacks.forEach((fn) => {
          try {
            fn(newBreakpoint, oldBreakpoint, width);
          } catch (e) {
            logger.error("Breakpoint listener error", { error: e.message });
          }
        });
      }
    });
    _emit("responsive:breakpoint-change", { breakpoint: newBreakpoint, previous: oldBreakpoint, width });
  }
}
function injectEventBus(eventBus) {
  _eventBus = eventBus;
}
function init(container, options = {}) {
  if (_state.initialized) {
    return { ok: true, cached: true };
  }
  if (!container) {
    return { ok: false, error: "Container required" };
  }
  const { eventBus, initialLayout = LAYOUTS.FULL } = options;
  if (eventBus) _eventBus = eventBus;
  _resizeObserver = new ResizeObserver(_handleResize);
  _resizeObserver.observe(container);
  _state.containerWidth = container.offsetWidth;
  _state.currentBreakpoint = _getBreakpoint(_state.containerWidth);
  _state.initialized = true;
  _applyLayout(initialLayout, container);
  _emit("responsive:initialized", { breakpoint: _state.currentBreakpoint, layout: _state.currentLayout });
  return { ok: true, breakpoint: _state.currentBreakpoint, layout: _state.currentLayout };
}
function setLayout(layout, container) {
  if (!Object.values(LAYOUTS).includes(layout)) {
    return false;
  }
  return _applyLayout(layout, container);
}
function getLayout() {
  return _state.currentLayout;
}
function getBreakpoint() {
  return _state.currentBreakpoint;
}
function getContainerWidth() {
  return _state.containerWidth;
}
function isBreakpoint(bp) {
  return _state.currentBreakpoint === bp;
}
function isBreakpointUp(bp) {
  return BREAKPOINT_ORDER.indexOf(_state.currentBreakpoint) >= BREAKPOINT_ORDER.indexOf(bp);
}
function isBreakpointDown(bp) {
  return BREAKPOINT_ORDER.indexOf(_state.currentBreakpoint) <= BREAKPOINT_ORDER.indexOf(bp);
}
function isBreakpointBetween(bpMin, bpMax) {
  const current = BREAKPOINT_ORDER.indexOf(_state.currentBreakpoint);
  return current >= BREAKPOINT_ORDER.indexOf(bpMin) && current <= BREAKPOINT_OR(DER.indexOf)(bpMax);
}
function isMobile() {
  return isBreakpointDown("sm");
}
function isTablet() {
  return isBreakpointBetween("md", "lg");
}
function isDesktop() {
  return isBreakpointUp("xl");
}
function onLayoutChange(callback) {
  _layoutListeners.add(callback);
  return () => _layoutListeners.delete(callback);
}
function onBreakpointChange(breakpoint, callback) {
  if (!_breakpointListeners.has(breakpoint)) {
    _breakpointListeners.set(breakpoint, /* @__PURE__ */ new Set());
  }
  _breakpointListeners.get(breakpoint).add(callback);
  return () => _breakpointListeners.get(breakpoint)?.delete(callback);
}
function onAnyBreakpointChange(callback) {
  return onBreakpointChange("*", callback);
}
function getResponsiveValue(values) {
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const bp = BREAKPOINT_ORDER[i];
    if (values[bp] !== void 0 && isBreakpointUp(bp)) {
      return values[bp];
    }
  }
  return values.xs ?? values.default ?? null;
}
function setCSSVariable(name, value, element = document.documentElement) {
  element.style.setProperty(`--dsd-${name}`, value);
}
function getCSSVariable(name, element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(`--dsd-${name}`).trim();
}
function reset() {
  _state.currentLayout = LAYOUTS.FULL;
  _layoutListeners.clear();
  _breakpointListeners.clear();
  _emit("responsive:reset", {});
}
function destroy() {
  if (_resizeObserver) {
    _resizeObserver.disconnect();
    _resizeObserver = null;
  }
  _layoutListeners.clear();
  _breakpointListeners.clear();
  _state.initialized = false;
  _emit("responsive:destroyed", {});
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    currentLayout: _state.currentLayout,
    currentBreakpoint: _state.currentBreakpoint,
    containerWidth: _state.containerWidth,
    initialized: _state.initialized,
    layouts: Object.keys(LAYOUTS),
    breakpoints: Object.keys(BREAKPOINTS)
  };
}
function healthCheck() {
  return {
    status: _state.initialized ? "HEALTHY" : "NOT_INITIALIZED",
    version: VERSION,
    moduleId: MODULE_ID,
    currentLayout: _state.currentLayout,
    currentBreakpoint: _state.currentBreakpoint,
    observerActive: !!_resizeObserver,
    listenerCount: _layoutListeners.size + Array.from(_breakpointListeners.values()).reduce((sum, s) => sum + s.size, 0)
  };
}
var responsive_manager_default = {
  VERSION,
  MODULE_ID,
  LAYOUTS,
  BREAKPOINTS,
  init,
  destroy,
  reset,
  injectEventBus,
  setLayout,
  getLayout,
  getBreakpoint,
  getContainerWidth,
  isBreakpoint,
  isBreakpointUp,
  isBreakpointDown,
  isBreakpointBetween,
  isMobile,
  isTablet,
  isDesktop,
  onLayoutChange,
  onBreakpointChange,
  onAnyBreakpointChange,
  getResponsiveValue,
  setCSSVariable,
  getCSSVariable,
  info,
  healthCheck
};
export {
  BREAKPOINTS,
  LAYOUTS,
  MODULE_ID,
  VERSION,
  responsive_manager_default as default,
  destroy,
  getBreakpoint,
  getCSSVariable,
  getContainerWidth,
  getLayout,
  getResponsiveValue,
  healthCheck,
  info,
  init,
  injectEventBus,
  isBreakpoint,
  isBreakpointBetween,
  isBreakpointDown,
  isBreakpointUp,
  isDesktop,
  isMobile,
  isTablet,
  onAnyBreakpointChange,
  onBreakpointChange,
  onLayoutChange,
  reset,
  setCSSVariable,
  setLayout
};
