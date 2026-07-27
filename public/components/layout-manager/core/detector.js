import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { layoutStore } from "../state/store.js";
import { BreakpointManager } from "./breakpoints.js";
import { trackLayoutEvent } from "../telemetry/tracker.js";
import { getViewportSize, getOrientation, debounce, calculateGridColumns } from "../utils/helpers.js";
const VERSION = "2.4.0-P17WI";
const MODULE_ID = "layout-manager.core.detector";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let resizeListener = null;
let orientationListener = null;
let _debug = false;
let _metrics = { detectCount: 0, resizeEventCount: 0, breakpointChangeCount: 0, orientationChangeCount: 0, lastDetectAt: null, lastBreakpointChangeAt: null, lastOrientationChangeAt: null };
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error(`[${MODULE_ID}]`, msg, data || "");
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(`[${MODULE_ID}]`, msg, data || "");
    return;
  }
  if (_debug && logger.debug) logger.debug(`[${MODULE_ID}]`, msg, data || "");
};
const LayoutDetector = {
  setDebug(debug) {
    _debug = debug;
  },
  detectCurrent() {
    const size = getViewportSize();
    const width = size.width;
    const height = size.height;
    const breakpoint = BreakpointManager.detect(width);
    const orientation = getOrientation();
    const gridColumns = calculateGridColumns(width);
    layoutStore.update({ width, height, breakpoint, orientation, gridColumns });
    _metrics.detectCount++;
    _metrics.lastDetectAt = Date.now();
    trackLayoutEvent("layout:detected", { width, height, breakpoint, orientation });
    _log("info", "Detected:", `${breakpoint} ${width}x${height}`);
    return { width, height, breakpoint, orientation, gridColumns };
  },
  startResizeListener(options) {
    const self = this;
    if (!options) options = {};
    if (typeof window === "undefined") return;
    if (resizeListener) this.stopResizeListener();
    const delay = options.debounceDelay || 150;
    const handler = debounce(() => {
      _metrics.resizeEventCount++;
      const oldBreakpoint = layoutStore.getBreakpoint();
      const size = getViewportSize();
      const width = size.width;
      const height = size.height;
      const newBreakpoint = BreakpointManager.detect(width);
      const orientation = getOrientation();
      const gridColumns = calculateGridColumns(width);
      layoutStore.setDimensions(width, height);
      layoutStore.set("orientation", orientation);
      layoutStore.set("gridColumns", gridColumns);
      if (newBreakpoint !== oldBreakpoint) {
        layoutStore.setBreakpoint(newBreakpoint);
        _metrics.breakpointChangeCount++;
        _metrics.lastBreakpointChangeAt = Date.now();
        trackLayoutEvent("layout:breakpoint:changed", { from: oldBreakpoint, to: newBreakpoint, width, height });
        _log("info", "Breakpoint:", `${oldBreakpoint} -> ${newBreakpoint}`);
      }
    }, delay);
    window.addEventListener("resize", handler, { passive: true });
    resizeListener = handler;
    trackLayoutEvent("layout:resize:listener:started");
    _log("info", "Resize listener started");
  },
  stopResizeListener() {
    if (!resizeListener || typeof window === "undefined") return;
    window.removeEventListener("resize", resizeListener);
    resizeListener = null;
    trackLayoutEvent("layout:resize:listener:stopped");
    _log("info", "Resize listener stopped");
  },
  startOrientationListener() {
    const self = this;
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (orientationListener) this.stopOrientationListener();
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const handler = (e) => {
      const newOrientation = e.matches ? "portrait" : "landscape";
      const oldOrientation = layoutStore.get("orientation");
      if (newOrientation !== oldOrientation) {
        layoutStore.set("orientation", newOrientation);
        _metrics.orientationChangeCount++;
        _metrics.lastOrientationChangeAt = Date.now();
        trackLayoutEvent("layout:orientation:changed", { from: oldOrientation, to: newOrientation });
        _log("info", "Orientation:", `${oldOrientation} -> ${newOrientation}`);
      }
    };
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handler);
    else if (mediaQuery.addListener) mediaQuery.addListener(handler);
    orientationListener = { mediaQuery, handler };
    trackLayoutEvent("layout:orientation:listener:started");
    _log("info", "Orientation listener started");
  },
  stopOrientationListener() {
    if (!orientationListener) return;
    const mq = orientationListener.mediaQuery;
    const h = orientationListener.handler;
    if (mq.removeEventListener) mq.removeEventListener("change", h);
    else if (mq.removeListener) mq.removeListener(h);
    orientationListener = null;
    trackLayoutEvent("layout:orientation:listener:stopped");
    _log("info", "Orientation listener stopped");
  },
  hasResizeListener() {
    return resizeListener !== null;
  },
  hasOrientationListener() {
    return orientationListener !== null;
  },
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { resizeListenerActive: resizeListener !== null, orientationListenerActive: orientationListener !== null, hasDetected: _metrics.detectCount > 0, windowAvailable: typeof window !== "undefined", loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
    let passed = 0;
    for (const k in checks) {
      if (checks[k]) passed++;
    }
    return { status: passed === Object.keys(checks).length ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${Object.keys(checks).length}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  },
  info() {
    return { version: VERSION, moduleId: MODULE_ID, debug: _debug, portsInitialized: Ports.isInitialized(), listeners: { resize: resizeListener !== null, orientation: orientationListener !== null }, metrics: Object.assign({}, _metrics), healthCheck: this.healthCheck() };
  },
  resetMetrics() {
    _metrics = { detectCount: 0, resizeEventCount: 0, breakpointChangeCount: 0, orientationChangeCount: 0, lastDetectAt: null, lastBreakpointChangeAt: null, lastOrientationChangeAt: null };
  },
  getVersion() {
    return VERSION;
  }
};
var detector_default = LayoutDetector;
export {
  LayoutDetector,
  MODULE_ID,
  VERSION,
  detector_default as default,
  getPorts,
  injectPorts
};
