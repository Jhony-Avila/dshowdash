const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-main.core.constants";
const UARPS_REGION = "region:app:container-main";
const STATES = {
  INITIALIZING: "initializing",
  READY: "ready",
  LOADING: "loading",
  ERROR: "error",
  COLLAPSED: "collapsed",
  FULLSCREEN: "fullscreen",
  MINIMIZED: "minimized",
  DESTROYED: "destroyed"
};
const CONTAINER_MAIN_EVENTS = {
  // State events
  STATE_CHANGED: "container-main.state.changed",
  STATE_RESTORE: "container-main.state.restore",
  // Lifecycle events
  READY: "container-main.ready",
  MOUNTED: "container-main.mounted",
  UNMOUNTED: "container-main.unmounted",
  DESTROYED: "container-main.destroyed",
  // Error events
  ERROR: "container-main.error",
  RECOVER: "container-main.recover",
  // Navigation
  NAVIGATION_SYNC: "main.navigation.sync",
  PANEL_CHANGE: "container-main.panel.change",
  // UI events
  COLLAPSE: "container-main.collapse",
  EXPAND: "container-main.expand",
  FULLSCREEN_ENTER: "container-main.fullscreen.enter",
  FULLSCREEN_EXIT: "container-main.fullscreen.exit",
  RESIZE: "container-main.resize",
  // Content events
  CONTENT_LOADED: "container-main.content.loaded",
  CONTENT_ERROR: "container-main.content.error",
  // Theme/Layout events
  THEME_CHANGE: "container-main.theme.change",
  LAYOUT_CHANGE: "container-main.layout.change",
  BREAKPOINT_CHANGE: "container-main.breakpoint.change"
};
const MODULES = [
  "config.js",
  "init-components.js",
  "api-builder.js",
  "template.js"
];
const CORE_MODULES = [
  "constants.js",
  "container-core.js",
  "event-bridge.js",
  "health.js",
  "label-resolver.js",
  "state.js",
  "uarps.js"
];
const FEATURES = [
  "header",
  "controls",
  "context-menu",
  "keyboard",
  "drag",
  "resize",
  "tabs",
  "breadcrumb",
  "split-view",
  "notification-badge",
  "state-persistence",
  "toolbar",
  "search-box",
  "progress-bar",
  "toast",
  "snap-dock",
  "multi-window",
  "zoom-controls",
  "accessibility",
  "usage-metrics",
  "performance-monitor",
  "error-boundary",
  "debug-panel",
  "plugin-system",
  "event-hooks",
  "config-presets",
  "status-indicator",
  "skeleton"
];
const UTILS = [
  "logger",
  "events",
  "icons",
  "debounce",
  "telemetry",
  "async-helpers",
  "config-cache",
  "weak-refs",
  "idle-scheduler",
  "visibility-observer",
  "dom-batch",
  "mutation-batch",
  "lazy-loader",
  "virtual-scroller",
  "worker-pool",
  "indexed-db",
  "state-compression",
  "object-pool",
  "reactive-proxy",
  "service-worker-helper",
  "custom-elements",
  "error-handler",
  "theme-manager",
  "layout-manager",
  "animation-manager",
  "shortcuts-manager"
];
const FEATURE_FLAGS = {
  STRICT_DI: true,
  UARPS_ENABLED: true,
  TELEMETRY_ENABLED: true,
  LAZY_LOADING: true,
  VIRTUAL_SCROLL: false,
  WEB_WORKERS: false,
  SERVICE_WORKER: false,
  INDEXED_DB: false
};
const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 100,
  STICKY: 200,
  FIXED: 300,
  MODAL_BACKDROP: 400,
  MODAL: 500,
  POPOVER: 600,
  TOOLTIP: 700,
  TOAST: 800,
  FULLSCREEN: 900,
  DEBUG: 9999
};
const DURATIONS = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SLOWER: 750
};
const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
};
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    featureCount: FEATURES.length,
    utilCount: UTILS.length,
    coreModuleCount: CORE_MODULES.length
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    featureCount: FEATURES.length
  };
}
var constants_default = {
  VERSION,
  MODULE_ID,
  UARPS_REGION,
  STATES,
  CONTAINER_MAIN_EVENTS,
  MODULES,
  CORE_MODULES,
  FEATURES,
  UTILS,
  FEATURE_FLAGS,
  Z_INDEX,
  DURATIONS,
  BREAKPOINTS,
  info,
  healthCheck
};
export {
  BREAKPOINTS,
  CONTAINER_MAIN_EVENTS,
  CORE_MODULES,
  DURATIONS,
  FEATURES,
  FEATURE_FLAGS,
  MODULES,
  MODULE_ID,
  STATES,
  UARPS_REGION,
  UTILS,
  VERSION,
  Z_INDEX,
  constants_default as default,
  healthCheck,
  info
};
