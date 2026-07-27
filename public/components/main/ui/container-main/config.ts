

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.2.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:config
// PURPOSE: Container-Main - Configuration Centralizada
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   UARPS_REGION — exported value
//   MODE — exported value
//   ENV — exported value
//   FEATURES — exported value
//   TIMEOUTS — exported value
//   LIMITS — exported value
//   INTERVALS — exported value
//   LOG_LEVELS — exported value
//   DEFAULT_OPTIONS — exported value
//   validateMode() — exported function
//   getModeRisks() — exported function
//   mergeOptions() — exported function
//   generateContainerId() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getEnv() — exported function
//   setEnv() — exported function
//   isFeatureEnabled() — exported function
//   ... and 9 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location (environment detection only)
// ═══════════════════════════════════════════════════════════════
// @version 9.2.0-STRICT-MODE
// @changelog v9.2.0-STRICT-MODE - Migração NR-FULL strict mode com isStrict() em healthCheck
// @changelog v9.1.1-CONTRACT-FIX - Fixed contract: no window.EventBus usage
'use strict';

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'container-main:config';

// Region UARPS
export const UARPS_REGION = 'region:app:container-main';

// === OPERATION MODES ===
export const MODE = Object.freeze({
  LEGACY: 'legacy',
  HYBRID: 'hybrid',
  STRICT: 'strict'
});

// === ENVIRONMENT ===
export const ENV = Object.freeze({
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
});

// Detecta ambiente
function _detectEnv() {
  if (typeof window === 'undefined') return ENV.PRODUCTION;
  const hostname = window.location?.hostname || '';
  if (hostname === 'localhost' || hostname === '127.0.0.1') return ENV.DEVELOPMENT;
  if (hostname.includes('staging') || hostname.includes('test')) return ENV.STAGING;
  return ENV.PRODUCTION;
}

// === FEATURE FLAGS ===
export const FEATURES = Object.freeze({
  PERFORMANCE_MONITOR: 'performanceMonitor',
  FALLBACK_SYSTEM: 'fallbackSystem',
  GLOBAL_STATE: 'globalState',
  LAZY_LOADING: 'lazyLoading',
  IMAGE_VIRTUALIZATION: 'imageVirtualization',
  METRICS_PERSISTENCE: 'metricsPersistence',
  DEPRECATION_WARNINGS: 'deprecationWarnings',
  ERROR_BOUNDARY: 'errorBoundary',
  DEBUG_MODE: 'debugMode',
  HOT_RELOAD: 'hotReload'
});

// === TIMEOUTS (ms) ===
export const TIMEOUTS = Object.freeze({
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
  VERY_LONG: 60000,
  FETCH: 10000,
  API: 20000,
  BOOT: 30000,
  COMPONENT_INIT: 10000,
  PANEL_LOAD: 15000,
  ANIMATION: 300,
  DEBOUNCE: 150,
  THROTTLE: 100
});

// === LIMITS ===
// v9.1.0: Memory thresholds aligned with resources/performance-monitor.js v1.1.0
// Modern enterprise SPAs routinely use 200-400MB; 100MB warning was causing constant false alarms
export const LIMITS = Object.freeze({
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
  MEMORY_CRITICAL_MB: 1000,
  FPS_WARNING: 30,
  FPS_CRITICAL: 20
});

// === INTERVALS (ms) ===
export const INTERVALS = Object.freeze({
  HEALTH_CHECK: 60000,
  METRICS_FLUSH: 30000,
  MEMORY_CHECK: 5000,
  CLEANUP: 300000,
  CACHE_CLEANUP: 600000,
  HEARTBEAT: 10000
});

// === LOG LEVELS ===
export const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
  NONE: 99
});

// === DEFAULT OPTIONS ===
export const DEFAULT_OPTIONS = Object.freeze({
  // Identity
  id: null,
  title: 'Container',
  icon: null,
  className: '',
  
  // Mode
  mode: MODE.STRICT,
  env: null, // auto-detect
  
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
  toolbarPosition: 'top',
  searchEnabled: false,
  searchPlaceholder: 'Buscar...',
  progressEnabled: true,
  toastEnabled: true,
  toastPosition: 'bottom-right',
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
  performanceInterval: 15000,
  
  // Memory
  memoryWarningThreshold: 0.7,
  memoryCriticalThreshold: 0.9,
  
  // Loading
  lazyLoadingEnabled: true,
  maxConcurrentLoads: 3,
  imageVirtualizationEnabled: true,
  
  // Cleanup
  cleanupStrategy: 'balanced',
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

// === RUNTIME CONFIG ===
let _runtimeConfig: { env: string; features: Record<string, boolean>; overrides: Record<string, unknown> } = {
  env: _detectEnv(),
  features: {},
  overrides: {}
};

// Inicializa features baseado no ambiente
function _initFeatures(env: string) {
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

// === API PÚBLICA ===

// Valida modo
export function validateMode(mode: string): string {
  return (Object.values(MODE) as string[]).includes(mode) ? mode : MODE.STRICT;
}

// Obtém riscos do modo
export function getModeRisks(mode: string, hasEventBus: unknown) {
  const risks = [];
  if (mode === MODE.LEGACY) risks.push('Legacy mode allows window.EventBus fallback - not recommended');
  if (mode === MODE.HYBRID) risks.push('Hybrid mode uses compat layer - migrate to strict when possible');
  if (mode === MODE.STRICT && !hasEventBus) risks.push('Strict mode requires EventBus injection');
  return risks;
}

// Merge options com defaults
export function mergeOptions(userOptions: Record<string, unknown> = {}, presets: Record<string, Record<string, unknown>> = {}) {
  let options: Record<string, unknown> = { ...DEFAULT_OPTIONS, ...userOptions };

  if (options.preset && presets[options.preset as string]) {
    options = { ...options, ...(presets[options.preset as string] as Record<string, unknown>).config as Record<string, unknown>, ...userOptions };
  }

  options.mode = validateMode(options.mode as string);
  options.env = options.env || _runtimeConfig.env;

  return options;
}

// Gera ID único
export function generateContainerId(providedId: unknown) {
  return providedId || `dsd-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// === RUNTIME CONFIG API ===

// Obtém config runtime
export function getConfig(key: string | null = null) {
  if (key === null) return { ..._runtimeConfig };
  return (_runtimeConfig as Record<string, unknown>)[key];
}

// Define config runtime
export function setConfig(key: string, value: unknown) {
  if (typeof key === 'object') {
    Object.assign(_runtimeConfig, key);
  } else {
    (_runtimeConfig as Record<string, unknown>)[key] = value;
  }
}

// Obtém ambiente
export function getEnv() {
  return _runtimeConfig.env;
}

// Define ambiente
export function setEnv(env: string) {
  if ((Object.values(ENV) as string[]).includes(env)) {
    _runtimeConfig.env = env;
    _runtimeConfig.features = _initFeatures(env);
  }
}

// === FEATURE FLAGS API ===

// Verifica se feature está habilitada
export function isFeatureEnabled(feature: string) {
  return _runtimeConfig.features[feature] === true;
}

// Habilita feature
export function enableFeature(feature: string) {
  _runtimeConfig.features[feature] = true;
}

// Desabilita feature
export function disableFeature(feature: string) {
  _runtimeConfig.features[feature] = false;
}

// Obtém todas as features
export function getFeatures() {
  return { ..._runtimeConfig.features };
}

// === OVERRIDE API ===

// Define override de config
export function setOverride(key: string, value: unknown) {
  (_runtimeConfig.overrides as Record<string, unknown>)[key] = value;
}

// Obtém override
export function getOverride(key: string, defaultValue: unknown = undefined) {
  return _runtimeConfig.overrides.hasOwnProperty(key) ? (_runtimeConfig.overrides as Record<string, unknown>)[key] : defaultValue;
}

// Limpa overrides
export function clearOverrides() {
  _runtimeConfig.overrides = {};
}

// === PRESETS ===
export const PRESETS = Object.freeze({
  minimal: {
    name: 'Minimal',
    config: {
      showControls: false,
      toolbarEnabled: false,
      searchEnabled: false,
      debugEnabled: false,
      performanceMonitorEnabled: false
    }
  },
  dashboard: {
    name: 'Dashboard',
    config: {
      splitViewEnabled: true,
      tabsEnabled: true,
      breadcrumbEnabled: true,
      metricsEnabled: true,
      performanceEnabled: true
    }
  },
  fullFeature: {
    name: 'Full Feature',
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
    name: 'Production',
    config: {
      debugEnabled: false,
      performanceShowOverlay: false,
      deprecationWarningsEnabled: false,
      logLevel: LOG_LEVELS.WARN
    }
  }
});

// === INFO & HEALTH ===
export function info() {
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

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    strictMode: isStrict(),
    env: _runtimeConfig.env,
    featuresEnabled: Object.entries(_runtimeConfig.features).filter(([_, v]) => v).length,
    overridesCount: Object.keys(_runtimeConfig.overrides).length
  };
}

export default {
  VERSION, MODULE_ID, UARPS_REGION,
  MODE, ENV, FEATURES, TIMEOUTS, LIMITS, INTERVALS, LOG_LEVELS,
  DEFAULT_OPTIONS, PRESETS,
  validateMode, getModeRisks, mergeOptions, generateContainerId,
  getConfig, setConfig, getEnv, setEnv,
  isFeatureEnabled, enableFeature, disableFeature, getFeatures,
  setOverride, getOverride, clearOverrides,
  info, healthCheck
};
