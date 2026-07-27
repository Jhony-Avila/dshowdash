import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "container-main:config";
const UARPS_REGION = "region:app:container-main";
const MODE = Object.freeze({
  LEGACY: "legacy",
  HYBRID: "hybrid",
  STRICT: "strict"
});
const ENV = Object.freeze({
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production"
});
function _detectEnv() {
  if (typeof window === "undefined") return ENV.PRODUCTION;
  const hostname = window.location?.hostname || "";
  if (hostname === "localhost" || hostname === "127.0.0.1") return ENV.DEVELOPMENT;
  if (hostname.includes("staging") || hostname.includes("test")) return ENV.STAGING;
  return ENV.PRODUCTION;
}
const FEATURES = Object.freeze({
  PERFORMANCE_MONITOR: "performanceMonitor",
  FALLBACK_SYSTEM: "fallbackSystem",
  GLOBAL_STATE: "globalState",
  LAZY_LOADING: "lazyLoading",
  IMAGE_VIRTUALIZATION: "imageVirtualization",
  METRICS_PERSISTENCE: "metricsPersistence",
  DEPRECATION_WARNINGS: "deprecationWarnings",
  ERROR_BOUNDARY: "errorBoundary",
  DEBUG_MODE: "debugMode",
  HOT_RELOAD: "hotReload"
});
const TIMEOUTS = Object.freeze({
  SHORT: 5e3,
  MEDIUM: 15e3,
  LONG: 3e4,
  VERY_LONG: 6e4,
  FETCH: 1e4,
  API: 2e4,
  BOOT: 3e4,
  COMPONENT_INIT: 1e4,
  PANEL_LOAD: 15e3,
  ANIMATION: 300,
  DEBOUNCE: 150,
  THROTTLE: 100
});
const LIMITS = Object.freeze({
  MAX_PANELS: 50,
  MAX_SLOTS: 20,
  MAX_LISTENERS: 100,
  MAX_RETRY: 3,
  MAX_CACHE_SIZE: 100,
  MAX_HISTORY: 50,
  MAX_LOG_ENTRIES: 500,
  MAX_ERROR_LOG: 200,
  MAX_CONCURRENT_LOADS: 5,
  MEMORY_WARNING_MB: 500,
  MEMORY_CRITICAL_MB: 1e3,
  FPS_WARNING: 30,
  FPS_CRITICAL: 20
});
const INTERVALS = Object.freeze({
  HEALTH_CHECK: 6e4,
  METRICS_FLUSH: 3e4,
  MEMORY_CHECK: 5e3,
  CLEANUP: 3e5,
  CACHE_CLEANUP: 6e5,
  HEARTBEAT: 1e4
});
const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
  NONE: 99
});
const DEFAULT_OPTIONS = Object.freeze({
  // Identity
  id: null,
  title: "Container",
  icon: null,
  className: "",
  // Mode
  mode: MODE.STRICT,
  env: null,
  // auto-detect
  // Features
  showControls: true,
  collapsible: true,
  closable: false,
  fullscreenable: true,
  contextMenuEnabled: true,
  keyboardEnabled: true,
  draggable: false,
  resizable: false,
  tabsEnabled: false,
  breadcrumbEnabled: false,
  splitViewEnabled: false,
  notificationBadgeEnabled: false,
  statePersistenceEnabled: true,
  toolbarEnabled: false,
  toolbarItems: [],
  toolbarPosition: "top",
  searchEnabled: false,
  searchPlaceholder: "Buscar...",
  progressEnabled: true,
  toastEnabled: true,
  toastPosition: "bottom-right",
  snapEnabled: false,
  multiWindowEnabled: false,
  zoomEnabled: false,
  zoomMin: 50,
  zoomMax: 200,
  accessibilityEnabled: true,
  accessibilityFocusTrap: false,
  accessibilityAnnounce: true,
  // Phase 1 & 2 features
  loggingEnabled: true,
  logLevel: LOG_LEVELS.INFO,
  errorBoundaryEnabled: true,
  captureGlobalErrors: true,
  globalStateEnabled: true,
  performanceMonitorEnabled: true,
  fallbackSystemEnabled: true,
  // Performance
  metricsEnabled: true,
  performanceEnabled: true,
  performanceShowOverlay: false,
  performanceInterval: 15e3,
  // Memory
  memoryWarningThreshold: 0.7,
  memoryCriticalThreshold: 0.9,
  // Loading
  lazyLoadingEnabled: true,
  maxConcurrentLoads: 3,
  imageVirtualizationEnabled: true,
  // Cleanup
  cleanupStrategy: "balanced",
  deprecationWarningsEnabled: true,
  // Debug
  debugEnabled: false,
  debugStartExpanded: false,
  // Plugins
  pluginSystemEnabled: false,
  plugins: [],
  // Events
  eventHooksEnabled: true,
  preset: null,
  // Callbacks
  onClose: null,
  onCollapse: null,
  onExpand: null,
  onFullscreen: null,
  onResize: null,
  onDrag: null,
  onReady: null,
  onError: null,
  onStateChange: null,
  onPerformanceWarning: null,
  onPerformanceCritical: null
});
let _runtimeConfig = {
  env: _detectEnv(),
  features: {},
  overrides: {}
};
function _initFeatures(env) {
  return {
    [FEATURES.PERFORMANCE_MONITOR]: env !== ENV.PRODUCTION,
    [FEATURES.FALLBACK_SYSTEM]: true,
    [FEATURES.GLOBAL_STATE]: true,
    [FEATURES.LAZY_LOADING]: true,
    [FEATURES.IMAGE_VIRTUALIZATION]: true,
    [FEATURES.METRICS_PERSISTENCE]: true,
    [FEATURES.DEPRECATION_WARNINGS]: env !== ENV.PRODUCTION,
    [FEATURES.ERROR_BOUNDARY]: true,
    [FEATURES.DEBUG_MODE]: env === ENV.DEVELOPMENT,
    [FEATURES.HOT_RELOAD]: env === ENV.DEVELOPMENT
  };
}
_runtimeConfig.features = _initFeatures(_runtimeConfig.env);
function validateMode(mode) {
  return Object.values(MODE).includes(mode) ? mode : MODE.STRICT;
}
function getModeRisks(mode, hasEventBus) {
  const risks = [];
  if (mode === MODE.LEGACY) risks.push("Legacy mode allows window.EventBus fallback - not recommended");
  if (mode === MODE.HYBRID) risks.push("Hybrid mode uses compat layer - migrate to strict when possible");
  if (mode === MODE.STRICT && !hasEventBus) risks.push("Strict mode requires EventBus injection");
  return risks;
}
function mergeOptions(userOptions = {}, presets = {}) {
  let options = { ...DEFAULT_OPTIONS, ...userOptions };
  if (options.preset && presets[options.preset]) {
    options = { ...options, ...presets[options.preset].config, ...userOptions };
  }
  options.mode = validateMode(options.mode);
  options.env = options.env || _runtimeConfig.env;
  return options;
}
function generateContainerId(providedId) {
  return providedId || `dsd-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function getConfig(key = null) {
  if (key === null) return { ..._runtimeConfig };
  return _runtimeConfig[key];
}
function setConfig(key, value) {
  if (typeof key === "object") {
    Object.assign(_runtimeConfig, key);
  } else {
    _runtimeConfig[key] = value;
  }
}
function getEnv() {
  return _runtimeConfig.env;
}
function setEnv(env) {
  if (Object.values(ENV).includes(env)) {
    _runtimeConfig.env = env;
    _runtimeConfig.features = _initFeatures(env);
  }
}
function isFeatureEnabled(feature) {
  return _runtimeConfig.features[feature] === true;
}
function enableFeature(feature) {
  _runtimeConfig.features[feature] = true;
}
function disableFeature(feature) {
  _runtimeConfig.features[feature] = false;
}
function getFeatures() {
  return { ..._runtimeConfig.features };
}
function setOverride(key, value) {
  _runtimeConfig.overrides[key] = value;
}
function getOverride(key, defaultValue = void 0) {
  return _runtimeConfig.overrides.hasOwnProperty(key) ? _runtimeConfig.overrides[key] : defaultValue;
}
function clearOverrides() {
  _runtimeConfig.overrides = {};
}
const PRESETS = Object.freeze({
  minimal: {
    name: "Minimal",
    config: {
      showControls: false,
      toolbarEnabled: false,
      searchEnabled: false,
      debugEnabled: false,
      performanceMonitorEnabled: false
    }
  },
  dashboard: {
    name: "Dashboard",
    config: {
      splitViewEnabled: true,
      tabsEnabled: true,
      breadcrumbEnabled: true,
      metricsEnabled: true,
      performanceEnabled: true
    }
  },
  fullFeature: {
    name: "Full Feature",
    config: {
      showControls: true,
      toolbarEnabled: true,
      searchEnabled: true,
      tabsEnabled: true,
      breadcrumbEnabled: true,
      splitViewEnabled: true,
      metricsEnabled: true,
      performanceEnabled: true,
      debugEnabled: true
    }
  },
  production: {
    name: "Production",
    config: {
      debugEnabled: false,
      performanceShowOverlay: false,
      deprecationWarningsEnabled: false,
      logLevel: LOG_LEVELS.WARN
    }
  }
});
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    env: _runtimeConfig.env,
    mode: DEFAULT_OPTIONS.mode,
    availableModes: Object.values(MODE),
    availableEnvs: Object.values(ENV),
    features: Object.keys(FEATURES),
    presets: Object.keys(PRESETS),
    optionsCount: Object.keys(DEFAULT_OPTIONS).length,
    uarpsRegion: UARPS_REGION
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    strictMode: isStrict(),
    env: _runtimeConfig.env,
    featuresEnabled: Object.entries(_runtimeConfig.features).filter(([_, v]) => v).length,
    overridesCount: Object.keys(_runtimeConfig.overrides).length
  };
}
var config_default = {
  VERSION,
  MODULE_ID,
  UARPS_REGION,
  MODE,
  ENV,
  FEATURES,
  TIMEOUTS,
  LIMITS,
  INTERVALS,
  LOG_LEVELS,
  DEFAULT_OPTIONS,
  PRESETS,
  validateMode,
  getModeRisks,
  mergeOptions,
  generateContainerId,
  getConfig,
  setConfig,
  getEnv,
  setEnv,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  getFeatures,
  setOverride,
  getOverride,
  clearOverrides,
  info,
  healthCheck
};
export {
  DEFAULT_OPTIONS,
  ENV,
  FEATURES,
  INTERVALS,
  LIMITS,
  LOG_LEVELS,
  MODE,
  MODULE_ID,
  PRESETS,
  TIMEOUTS,
  UARPS_REGION,
  VERSION,
  clearOverrides,
  config_default as default,
  disableFeature,
  enableFeature,
  generateContainerId,
  getConfig,
  getEnv,
  getFeatures,
  getModeRisks,
  getOverride,
  healthCheck,
  info,
  isFeatureEnabled,
  mergeOptions,
  setConfig,
  setEnv,
  setOverride,
  validateMode
};
