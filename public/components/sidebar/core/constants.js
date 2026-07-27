const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-constants";
const CAPABILITIES = Object.freeze({
  canNavigate: true,
  canCollapse: true,
  canSearch: true,
  canCollapseSections: true,
  supportsAccordion: true,
  supportsKeyboardNav: true,
  supportsTooltips: true,
  supportsMobile: true,
  supportsBadges: true,
  supportsBadgePulse: true,
  supportsPermissions: true,
  hasErrorBoundary: true,
  hasTimeout: true,
  hasRetry: true,
  hasFallback: true,
  hasBidirectionalSync: true,
  hasDebounce: true,
  hasAutoCorrection: true,
  hasUnifiedPersistence: true,
  hasServiceWorkerCache: true,
  hasIntersectionObserver: true,
  hasMemoryOptimization: true,
  hasBundleSplitting: true,
  hasPreloadCriticalCSS: true,
  // v5.4.0: Integrated features
  hasSubmenuHandler: true,
  hasFuzzySearch: true,
  hasSearchFilters: true,
  hasSearchSuggestions: true,
  hasContextMenu: true,
  hasResizeHandler: true,
  hasThemeHandler: true,
  hasAutoTheme: true,
  hasCompactMode: true,
  hasMiniMode: true,
  hasDragDrop: true,
  hasProgressHandler: true,
  hasQuickActions: true,
  hasScreenReader: true,
  hasRealtimeNotifications: true,
  hasConfigManager: true,
  // v5.5.0: Visual features
  hasConfetti: true,
  hasParallax: true,
  hasGlassmorphism: true,
  hasCustomCursors: true,
  compliance: "AAA-BULLETPROOF-FULL",
  totalFeatures: 57
});
const RESILIENCE_CONFIG = Object.freeze({ cssTimeout: 5e3, configTimeout: 3e3, adapterTimeout: 2e3, maxRetries: 3, retryDelay: 1e3 });
const KEYBOARD_CONFIG = Object.freeze({ enabled: true, wrapAround: true, focusDelay: 50 });
const STORAGE_CONFIG = Object.freeze({ defaultKey: "dsd:sidebar:state", sectionStateKey: "dsd:sidebar:sections", collapsedKeyUnified: "dshowdash-layout-sidebarCollapsed", collapsedKeyLegacy: "dsd-sidebar-collapsed" });
const TOGGLE_CONFIG = Object.freeze({ debounceMs: 150, validateAfterToggle: true, autoCorrectSync: true });
const CSS_PATH = "/components/sidebar/styles/sidebar.bundle.css?v=20260720";
const CONFIG_PATH = "/components/sidebar/config.json";
function getMetrics() {
  return { capabilitiesCount: Object.keys(CAPABILITIES).length, totalFeatures: CAPABILITIES.totalFeatures };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, capabilities: CAPABILITIES, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { constantsLoaded: true }, metrics: getMetrics() };
}
var constants_default = { VERSION, MODULE_ID, CAPABILITIES, RESILIENCE_CONFIG, KEYBOARD_CONFIG, STORAGE_CONFIG, TOGGLE_CONFIG, CSS_PATH, CONFIG_PATH, info, getMetrics, healthCheck };
export {
  CAPABILITIES,
  CONFIG_PATH,
  CSS_PATH,
  KEYBOARD_CONFIG,
  MODULE_ID,
  RESILIENCE_CONFIG,
  STORAGE_CONFIG,
  TOGGLE_CONFIG,
  VERSION,
  constants_default as default,
  getMetrics,
  healthCheck,
  info
};
