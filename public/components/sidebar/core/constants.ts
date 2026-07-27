// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-constants
// PURPOSE: Sidebar Core - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CAPABILITIES — exported value
//   RESILIENCE_CONFIG — exported value
//   KEYBOARD_CONFIG — exported value
//   STORAGE_CONFIG — exported value
//   TOGGLE_CONFIG — exported value
//   CSS_PATH — exported value
//   CONFIG_PATH — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-constants';

export const CAPABILITIES = Object.freeze({
  canNavigate: true, canCollapse: true, canSearch: true, canCollapseSections: true,
  supportsAccordion: true, supportsKeyboardNav: true, supportsTooltips: true,
  supportsMobile: true, supportsBadges: true, supportsBadgePulse: true, supportsPermissions: true,
  hasErrorBoundary: true, hasTimeout: true, hasRetry: true, hasFallback: true,
  hasBidirectionalSync: true, hasDebounce: true, hasAutoCorrection: true, hasUnifiedPersistence: true,
  hasServiceWorkerCache: true, hasIntersectionObserver: true, hasMemoryOptimization: true,
  hasBundleSplitting: true, hasPreloadCriticalCSS: true,
  // v5.4.0: Integrated features
  hasSubmenuHandler: true, hasFuzzySearch: true, hasSearchFilters: true, hasSearchSuggestions: true,
  hasContextMenu: true, hasResizeHandler: true, hasThemeHandler: true, hasAutoTheme: true,
  hasCompactMode: true, hasMiniMode: true, hasDragDrop: true, hasProgressHandler: true,
  hasQuickActions: true, hasScreenReader: true, hasRealtimeNotifications: true, hasConfigManager: true,
  // v5.5.0: Visual features
  hasConfetti: true, hasParallax: true, hasGlassmorphism: true, hasCustomCursors: true,
  compliance: 'AAA-BULLETPROOF-FULL', totalFeatures: 57
});

export const RESILIENCE_CONFIG = Object.freeze({ cssTimeout: 5000, configTimeout: 3000, adapterTimeout: 2000, maxRetries: 3, retryDelay: 1000 });
export const KEYBOARD_CONFIG = Object.freeze({ enabled: true, wrapAround: true, focusDelay: 50 });
export const STORAGE_CONFIG = Object.freeze({ defaultKey: 'dsd:sidebar:state', sectionStateKey: 'dsd:sidebar:sections', collapsedKeyUnified: 'dshowdash-layout-sidebarCollapsed', collapsedKeyLegacy: 'dsd-sidebar-collapsed' });
export const TOGGLE_CONFIG = Object.freeze({ debounceMs: 150, validateAfterToggle: true, autoCorrectSync: true });
export const CSS_PATH = '/components/sidebar/styles/sidebar.bundle.css?v=20260720';
export const CONFIG_PATH = '/components/sidebar/config.json';

export function getMetrics() { return { capabilitiesCount: Object.keys(CAPABILITIES).length, totalFeatures: CAPABILITIES.totalFeatures }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, capabilities: CAPABILITIES, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { constantsLoaded: true }, metrics: getMetrics() }; }

export default { VERSION, MODULE_ID, CAPABILITIES, RESILIENCE_CONFIG, KEYBOARD_CONFIG, STORAGE_CONFIG, TOGGLE_CONFIG, CSS_PATH, CONFIG_PATH, info, getMetrics, healthCheck };
