import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { layoutStore } from "../state/store.js";
import { BreakpointManager } from "./breakpoints.js";
import { LayoutDetector } from "./detector.js";
import { trackLayoutEvent } from "../telemetry/tracker.js";
import { loadLayoutPreference } from "../utils/helpers.js";
const VERSION = "4.3.0-INIT-SAFE";
const MODULE_ID = "layout-lifecycle";
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
let initialized = false;
let _debug = false;
let _metrics = { initCount: 0, shutdownCount: 0, resetCount: 0, modeChanges: 0, fullscreenToggles: 0, bodyClassUpdates: 0, lastInitAt: null, lastShutdownAt: null };
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};
const VALID_MODES = ["default", "dashboard", "monitor", "admin", "compact", "kiosk", "fullscreen"];
const BODY_CLASSES = {
  BREAKPOINTS: ["bp-xs", "bp-sm", "bp-md", "bp-lg", "bp-xl", "bp-xxl"],
  LAYOUT: ["layout-compact", "layout-full-screen", "sidebar-collapsed", "sidebar-mobile-open"],
  MODES: ["mode-default", "mode-dashboard", "mode-monitor", "mode-admin", "mode-compact", "mode-kiosk", "mode-fullscreen"],
  STATE: ["global-loading", "scroll-locked", "preloader-active", "modal-open"]
};
const LayoutLifecycle = {
  setDebug(debug) {
    _debug = debug;
    layoutStore.setDebug?.(debug);
    BreakpointManager.setDebug?.(debug);
    LayoutDetector.setDebug?.(debug);
  },
  async init(options = {}) {
    if (initialized) {
      _log("warn", "Already initialized");
      return { ok: true, alreadyInitialized: true, version: VERSION };
    }
    trackLayoutEvent("layout:lifecycle:init:start");
    _log("info", "Initializing (P1A AAA BODY OWNER)...");
    if (options.breakpoints) BreakpointManager.configure(options.breakpoints);
    LayoutDetector.detectCurrent();
    const savedCompact = loadLayoutPreference("compact");
    if (savedCompact !== null) layoutStore.setCompact(savedCompact);
    const savedSidebar = loadLayoutPreference("sidebarCollapsed");
    if (savedSidebar !== null) layoutStore.setSidebarCollapsed(savedSidebar);
    if (options.mode) {
      const mode = VALID_MODES.includes(String(options.mode)) ? String(options.mode) : "default";
      layoutStore.set("mode", mode);
      _metrics.modeChanges++;
    }
    LayoutDetector.startResizeListener({ debounceDelay: options.resizeDebounce || 150 });
    if (options.detectOrientation !== false) {
      LayoutDetector.startOrientationListener();
    }
    this._applyBodyClasses();
    initialized = true;
    _metrics.initCount++;
    _metrics.lastInitAt = Date.now();
    trackLayoutEvent("layout:lifecycle:init:complete", {
      breakpoint: layoutStore.getBreakpoint(),
      compliance: "P1A-AAA"
    });
    _log("info", "Initialized, breakpoint:", layoutStore.getBreakpoint());
    return { ok: true, alreadyInitialized: false, version: VERSION };
  },
  shutdown() {
    trackLayoutEvent("layout:lifecycle:shutdown:start");
    _log("info", "Shutting down...");
    LayoutDetector.stopResizeListener();
    LayoutDetector.stopOrientationListener();
    initialized = false;
    _metrics.shutdownCount++;
    _metrics.lastShutdownAt = Date.now();
    trackLayoutEvent("layout:lifecycle:shutdown:complete");
    _log("info", "Shutdown complete");
    return { ok: true };
  },
  reset() {
    trackLayoutEvent("layout:lifecycle:reset");
    _log("info", "Resetting...");
    BreakpointManager.reset();
    layoutStore.setCompact(false);
    layoutStore.setSidebarCollapsed(false);
    layoutStore.setSidebarMobileOpen(false);
    layoutStore.setFullscreen(false);
    layoutStore.setGlobalLoading(false);
    layoutStore.setScrollLocked(false);
    layoutStore.setPreloaderActive(false);
    layoutStore.setModalOpen(false);
    layoutStore.set("mode", "default");
    LayoutDetector.detectCurrent();
    this._applyBodyClasses();
    _metrics.resetCount++;
    _log("info", "Reset complete");
    return { ok: true };
  },
  setMode(mode) {
    const validMode = VALID_MODES.includes(mode) ? mode : "default";
    layoutStore.set("mode", validMode);
    _metrics.modeChanges++;
    this._applyBodyClasses();
    trackLayoutEvent("layout:mode:changed", { mode: validMode });
    _log("info", "Mode set:", validMode);
    return validMode;
  },
  setFullscreen(value) {
    const changed = layoutStore.setFullscreen(!!value);
    if (changed) {
      _metrics.fullscreenToggles++;
      this._applyBodyClasses();
      trackLayoutEvent("layout:fullscreen:changed", { fullscreen: value });
      _log("info", "Fullscreen set:", value);
    }
    return layoutStore.isFullscreen();
  },
  isFullscreen() {
    return layoutStore.isFullscreen();
  },
  toggleFullscreen() {
    return this.setFullscreen(!layoutStore.isFullscreen());
  },
  setSidebarMobileOpen(value) {
    const changed = layoutStore.setSidebarMobileOpen(!!value);
    if (changed) {
      this._applyBodyClasses();
      trackLayoutEvent("layout:sidebar-mobile:changed", { mobileOpen: value });
    }
    return layoutStore.isSidebarMobileOpen();
  },
  isSidebarMobileOpen() {
    return layoutStore.isSidebarMobileOpen();
  },
  setGlobalLoading(value) {
    const changed = layoutStore.setGlobalLoading(!!value);
    if (changed) {
      this._applyBodyClasses();
      trackLayoutEvent("layout:global-loading:changed", { loading: value });
    }
    return layoutStore.isGlobalLoading();
  },
  isGlobalLoading() {
    return layoutStore.isGlobalLoading();
  },
  setScrollLocked(value) {
    const changed = layoutStore.setScrollLocked(!!value);
    if (changed) {
      this._applyBodyClasses();
      trackLayoutEvent("layout:scroll-locked:changed", { locked: value });
    }
    return layoutStore.isScrollLocked();
  },
  isScrollLocked() {
    return layoutStore.isScrollLocked();
  },
  setPreloaderActive(value) {
    const changed = layoutStore.setPreloaderActive(!!value);
    if (changed) {
      this._applyBodyClasses();
      trackLayoutEvent("layout:preloader:changed", { active: value });
    }
    return layoutStore.isPreloaderActive();
  },
  isPreloaderActive() {
    return layoutStore.isPreloaderActive();
  },
  setModalOpen(value) {
    const changed = layoutStore.setModalOpen(!!value);
    if (changed) {
      this._applyBodyClasses();
      trackLayoutEvent("layout:modal:changed", { open: value });
    }
    return layoutStore.isModalOpen();
  },
  isModalOpen() {
    return layoutStore.isModalOpen();
  },
  isInitialized() {
    return initialized;
  },
  getStatus() {
    return {
      initialized,
      breakpoint: layoutStore.getBreakpoint(),
      dimensions: layoutStore.getDimensions(),
      orientation: layoutStore.get("orientation"),
      mode: layoutStore.get("mode"),
      compact: layoutStore.isCompact(),
      sidebarCollapsed: layoutStore.isSidebarCollapsed(),
      sidebarMobileOpen: layoutStore.isSidebarMobileOpen(),
      fullscreen: layoutStore.isFullscreen(),
      globalLoading: layoutStore.isGlobalLoading(),
      scrollLocked: layoutStore.isScrollLocked(),
      preloaderActive: layoutStore.isPreloaderActive(),
      modalOpen: layoutStore.isModalOpen(),
      gridColumns: layoutStore.get("gridColumns"),
      lastChange: layoutStore.get("lastChange"),
      compliance: "P1A-AAA"
    };
  },
  healthCheck() {
    const ps = Ports.snapshot();
    const detectorHealth = LayoutDetector.healthCheck?.() || {};
    const storeHealth = layoutStore.healthCheck?.() || {};
    const bp = layoutStore.getBreakpoint();
    const logger = _getPort("logger");
    const checks = {
      initialized,
      detectorHealthy: detectorHealth.status === "HEALTHY",
      storeHealthy: storeHealth.status === "HEALTHY",
      hasBreakpoint: !!bp,
      bodyClassesApplied: typeof document !== "undefined" && document.body?.classList.contains(`bp-${bp}`),
      fullscreenConsistent: typeof document !== "undefined" && document.body?.classList.contains("layout-full-screen") === layoutStore.isFullscreen(),
      sidebarMobileConsistent: typeof document !== "undefined" && document.body?.classList.contains("sidebar-mobile-open") === layoutStore.isSidebarMobileOpen(),
      loggerAvailable: !!logger,
      portsInitialized: ps._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 5 ? "DEGRADED" : "UNHEALTHY",
      score: `${passed}/${total}`,
      checks,
      submodules: { detector: detectorHealth, store: storeHealth },
      version: VERSION,
      moduleId: MODULE_ID,
      compliance: "P1A-AAA",
      portsInitialized: ps._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      debug: _debug,
      initialized,
      validModes: VALID_MODES,
      bodyClasses: BODY_CLASSES,
      compliance: "P1A-AAA",
      status: this.getStatus(),
      metrics: { ..._metrics },
      healthCheck: this.healthCheck()
    };
  },
  resetMetrics() {
    _metrics = {
      initCount: 0,
      shutdownCount: 0,
      resetCount: 0,
      modeChanges: 0,
      fullscreenToggles: 0,
      bodyClassUpdates: 0,
      lastInitAt: null,
      lastShutdownAt: null
    };
  },
  _applyBodyClasses() {
    if (typeof document === "undefined") return;
    const body = document.body;
    const bp = layoutStore.getBreakpoint();
    const compact = layoutStore.isCompact();
    const sidebarCollapsed = layoutStore.isSidebarCollapsed();
    const sidebarMobileOpen = layoutStore.isSidebarMobileOpen();
    const fullscreen = layoutStore.isFullscreen();
    const globalLoading = layoutStore.isGlobalLoading();
    const scrollLocked = layoutStore.isScrollLocked();
    const preloaderActive = layoutStore.isPreloaderActive();
    const modalOpen = layoutStore.isModalOpen();
    const mode = layoutStore.get("mode") || "default";
    BODY_CLASSES.BREAKPOINTS.forEach((cls) => body.classList.remove(cls));
    body.classList.add(`bp-${bp}`);
    body.classList.toggle("layout-compact", compact);
    body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
    body.classList.toggle("sidebar-mobile-open", sidebarMobileOpen);
    body.classList.toggle("layout-full-screen", fullscreen);
    body.classList.toggle("global-loading", globalLoading);
    body.classList.toggle("scroll-locked", scrollLocked);
    body.classList.toggle("preloader-active", preloaderActive);
    body.classList.toggle("modal-open", modalOpen);
    if (scrollLocked || modalOpen) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }
    BODY_CLASSES.MODES.forEach((cls) => body.classList.remove(cls));
    body.classList.add(`mode-${mode}`);
    body.setAttribute("data-breakpoint", bp);
    body.setAttribute("data-layout-mode", mode);
    if (fullscreen) {
      body.setAttribute("data-fullscreen", "true");
    } else {
      body.removeAttribute("data-fullscreen");
    }
    _metrics.bodyClassUpdates++;
    _log("info", "Body classes applied (P1A AAA OWNER):", {
      bp,
      compact,
      sidebarCollapsed,
      sidebarMobileOpen,
      fullscreen,
      globalLoading,
      scrollLocked,
      preloaderActive,
      modalOpen,
      mode
    });
  },
  getVersion() {
    return VERSION;
  },
  getBodyClasses() {
    return BODY_CLASSES;
  }
};
var lifecycle_default = LayoutLifecycle;
export {
  BODY_CLASSES,
  LayoutLifecycle,
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getPorts,
  injectPorts
};
