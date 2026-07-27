// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE1)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.config.feature-flags
// PURPOSE: Feature Flags — Configuração dinâmica para ativar/desativar features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FLAGS — exported value (mutable config object)
//   getFlag() — exported function (dot-notation access)
//   setFlag() — exported function (dot-notation setter)
//   isEnabled() — exported function (shorthand boolean check)
//   getAllFlags() — exported function (snapshot)
//   resetFlags() — exported function (restore defaults)
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
//
// @origin Adapted from panel-01/core/config.js features section for nav-admin domain
// @changelog
//   10.1.0-MIGRATION-PHASE1: Initial creation — FASE 1 A.3
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.1.0-MIGRATION-PHASE1';
export const MODULE_ID = 'panel-nav-admin.config.feature-flags';

/**
 * Default feature flags for panel-nav-admin.
 * Each flag controls whether a feature is active.
 * Flags set to false are planned but not yet implemented or intentionally disabled.
 * @type {Object}
 */
const DEFAULT_FLAGS = Object.freeze({
  // ─── Arquitetura (A) ───
  errorBoundary: true,
  stateMachine: true,
  featureRegistry: true,
  lazyLoading: true,

  // ─── UI Components (B) ───
  virtualScroll: false,
  skeletonLoading: true,
  toastNotifications: true,
  contextMenu: false,
  drawer: false,
  toolbar: false,
  badges: false,
  highlighting: false,
  cardView: false,
  splitView: false,
  dateRangeFilter: false,
  multiSelectFilter: false,
  quickFilters: false,
  filterPresets: false,
  pagination: false,
  hoverMenu: false,

  // ─── Data Handling (C) ───
  circuitBreaker: false,
  smartCache: false,
  deltaUpdates: false,
  debouncedRequest: true,
  fuzzySearch: false,
  bulkOperations: false,
  searchHistory: false,
  duplicateItem: true,
  memoization: false,
  exportCSV: false,
  exportPDF: false,
  exportXLSX: false,
  importCSV: false,
  importXLSX: false,

  // ─── Events (D) ───
  customEventEmitter: true,
  eventMetrics: false,
  eventBindings: false,

  // ─── State & Navigation (E) ───
  urlStateSync: false,
  savedViews: false,
  statePersistence: false,

  // ─── Security (F) ───
  htmlEscape: true,

  // ─── Services (G) ───
  websocket: false,
  pushNotifications: false,
  soundNotifications: false,

  // ─── Performance (H) ───
  performanceMonitor: false,
  prefetch: false,
  webWorker: false,
  indexedDBCache: false,

  // ─── Telemetry (I) ───
  percentileMetrics: false,

  // ─── Collaboration (J) ───
  activityLog: false,
  mentions: false,

  // ─── Existing features (always on) ───
  diagnosticMode: true,
  unifiedSSOT: true,
  uarpsTriggers: true,
  permissionLevels: true,
  iconPicker: true,
  sectionsCRUD: true,
  dragDrop: true,
  inlineEdit: true,
  keyboardShortcuts: true,
  autoRefresh: true
});

/**
 * Mutable runtime flags (starts as copy of DEFAULT_FLAGS).
 * @type {Object}
 */
export const FLAGS: Record<string, boolean> = { ...DEFAULT_FLAGS };

/**
 * Get a flag value by dot-notation path.
 * @param {string} path — Flag name (e.g. 'virtualScroll' or 'performance.prefetch')
 * @returns {*} Flag value or undefined
 */
export function getFlag(path: string) {
  if (!path) return undefined;
  if (path.indexOf('.') === -1) return FLAGS[path];
  return path.split('.').reduce((obj: Record<string, unknown> | undefined, key: string) => (obj != null ? (obj as Record<string, unknown>)[key] as Record<string, unknown> : undefined), FLAGS as Record<string, unknown>);
}

/**
 * Set a flag value by dot-notation path.
 * @param {string} path — Flag name
 * @param {*} value — New value
 */
export function setFlag(path: string, value: boolean) {
  if (!path) return;
  if (path.indexOf('.') === -1) {
    FLAGS[path] = value;
    return;
  }
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((obj: Record<string, unknown>, key: string) => {
    if (obj[key] == null) obj[key] = {};
    return obj[key] as Record<string, unknown>;
  }, FLAGS as Record<string, unknown>);
  (target as Record<string, unknown>)[last] = value;
}

/**
 * Shorthand to check if a feature is enabled (truthy).
 * @param {string} flagName — Flag key
 * @returns {boolean}
 */
export function isEnabled(flagName: string) {
  return !!FLAGS[flagName];
}

/**
 * Get a frozen snapshot of all current flags.
 * @returns {Object}
 */
export function getAllFlags() {
  return { ...FLAGS };
}

/**
 * Reset all flags to their default values.
 */
export function resetFlags() {
  for (const key of Object.keys(FLAGS)) {
    delete FLAGS[key];
  }
  Object.assign(FLAGS, DEFAULT_FLAGS);
}

/**
 * Get count of enabled vs total flags.
 * @returns {{ enabled: number, total: number }}
 */
export function getFlagStats() {
  const keys = Object.keys(FLAGS);
  const enabled = keys.filter(k => !!FLAGS[k]).length;
  return { enabled, total: keys.length };
}

/** @returns {Object} Module info */
export function info() {
  const stats = getFlagStats();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    flagsEnabled: stats.enabled,
    flagsTotal: stats.total
  };
}

/** @returns {Object} Health check result */
export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: { flagsLoaded: Object.keys(FLAGS).length > 0 }
  };
}

export default { FLAGS, getFlag, setFlag, isEnabled, getAllFlags, resetFlags, getFlagStats, info, healthCheck, VERSION, MODULE_ID };
