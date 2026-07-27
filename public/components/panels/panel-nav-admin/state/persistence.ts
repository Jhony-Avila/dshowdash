// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE5)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.state.persistence
// PURPOSE: State Persistence — Persistência de preferências em localStorage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   StatePersistence — Factory function
//   STORAGE_PREFIX — localStorage key prefix
//   PERSISTED_KEYS — Keys that are persisted
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/storage.js + panel-01/state/persistence.js
// @changelog
//   10.2.0-MIGRATION-PHASE5: Initial creation — FASE 5 E.3
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE5';
export const MODULE_ID = 'panel-nav-admin.state.persistence';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[StatePersistence]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/** @type {string} Namespace prefix for localStorage keys */
export const STORAGE_PREFIX = 'pna_';

/** @type {Array<string>} Keys that are auto-persisted */
export const PERSISTED_KEYS = [
  'filters',
  'sort',
  'density',
  'activeTab',
  'lastSearch',
  'pageSize',
  'viewMode',
  'splitSize',
  'expandedSections',
  'columnWidths'
];

/**
 * Factory: creates a state persistence manager using localStorage.
 * Namespaced with STORAGE_PREFIX to avoid key collisions.
 *
 * @param {Object} [options]
 * @param {string} [options.prefix] — Override default prefix
 * @returns {Object} StatePersistence instance
 */
export function StatePersistence(options: Record<string, unknown> = {}) {
  const _prefix = String(options.prefix || STORAGE_PREFIX);

  /**
   * Get a namespaced key.
   * @private
   * @param {string} key
   * @returns {string}
   */
  function _key(key: string) {
    return _prefix + key;
  }

  /**
   * Get a value from localStorage.
   * @param {string} key
   * @param {*} [defaultValue=null]
   * @returns {*} Parsed value or defaultValue
   */
  function get(key: string, defaultValue: unknown = null) {
    try {
      const raw = localStorage.getItem(_key(key));
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e: any) {
      _log('error', 'Failed to get', key, e.message);
      return defaultValue;
    }
  }

  /**
   * Set a value in localStorage.
   * @param {string} key
   * @param {*} value — Will be JSON-serialized
   */
  function set(key: string, value: unknown) {
    try {
      localStorage.setItem(_key(key), JSON.stringify(value));
    } catch (e: any) {
      _log('error', 'Failed to set', key, e.message);
    }
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  function remove(key: string) {
    try {
      localStorage.removeItem(_key(key));
    } catch (e: any) {
      _log('error', 'Failed to remove', key, e.message);
    }
  }

  /**
   * Clear all panel-nav-admin keys from localStorage.
   */
  function clear() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(_prefix)) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      _log('info', 'Cleared', keys.length, 'keys');
    } catch (e: any) {
      _log('error', 'Failed to clear:', e.message);
    }
  }

  // ─── Specific Getters/Setters for nav-admin ───

  /** @returns {Object} Saved filters or empty object */
  function getFilters() { return get('filters', {}); }
  /** @param {Object} filters */
  function setFilters(filters: unknown) { set('filters', filters); }

  /** @returns {Object} Saved sort config */
  function getSort() { return get('sort', { field: 'order', direction: 'asc' }); }
  /** @param {Object} sort — {field, direction} */
  function setSort(sort: unknown) { set('sort', sort); }

  /** @returns {string} Density: compact | normal | comfortable */
  function getDensity() { return get('density', 'normal'); }
  /** @param {string} density */
  function setDensity(density: string) { set('density', density); }

  /** @returns {string} Active tab: items | sections | diagnostic */
  function getActiveTab() { return get('activeTab', 'items'); }
  /** @param {string} tab */
  function setActiveTab(tab: string) { set('activeTab', tab); }

  /** @returns {string} Last search query */
  function getLastSearch() { return get('lastSearch', ''); }
  /** @param {string} query */
  function setLastSearch(query: string) { set('lastSearch', query); }

  /** @returns {number} Items per page */
  function getPageSize() { return get('pageSize', 50); }
  /** @param {number} size */
  function setPageSize(size: number) { set('pageSize', size); }

  /** @returns {string} View mode: table | card | split */
  function getViewMode() { return get('viewMode', 'table'); }
  /** @param {string} mode */
  function setViewMode(mode: string) { set('viewMode', mode); }

  /** @returns {number} Split view size (percent) */
  function getSplitSize() { return get('splitSize', 50); }
  /** @param {number} percent */
  function setSplitSize(percent: number) { set('splitSize', percent); }

  /** @returns {Array<string>} Expanded section keys */
  function getExpandedSections() { return get('expandedSections', []); }
  /** @param {Array<string>} sections */
  function setExpandedSections(sections: string[]) { set('expandedSections', sections); }

  /** @returns {Object} Column widths map */
  function getColumnWidths() { return get('columnWidths', {}); }
  /** @param {Object} widths */
  function setColumnWidths(widths: unknown) { set('columnWidths', widths); }

  /**
   * Save full state snapshot.
   * @param {Object} state — Keys matching PERSISTED_KEYS
   */
  function saveState(state: Record<string, unknown>) {
    for (const key of PERSISTED_KEYS) {
      if (state[key] !== undefined) {
        set(key, state[key]);
      }
    }
    _log('debug', 'State saved');
  }

  /**
   * Restore full state snapshot.
   * @returns {Object} Restored state
   */
  function restoreState() {
    const state: Record<string, unknown> = {};
    for (const key of PERSISTED_KEYS) {
      const val = get(key);
      if (val !== null) state[key] = val;
    }
    _log('debug', 'State restored');
    return state;
  }

  return {
    get, set, remove, clear,
    getFilters, setFilters,
    getSort, setSort,
    getDensity, setDensity,
    getActiveTab, setActiveTab,
    getLastSearch, setLastSearch,
    getPageSize, setPageSize,
    getViewMode, setViewMode,
    getSplitSize, setSplitSize,
    getExpandedSections, setExpandedSections,
    getColumnWidths, setColumnWidths,
    saveState, restoreState
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, prefix: STORAGE_PREFIX, persistedKeys: PERSISTED_KEYS };
}

export function healthCheck() {
  let storageAvailable = false;
  try {
    localStorage.setItem('_pna_test', '1');
    localStorage.removeItem('_pna_test');
    storageAvailable = true;
  } catch { /* noop */ }
  return { status: storageAvailable ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, storageAvailable };
}

export default { StatePersistence, STORAGE_PREFIX, PERSISTED_KEYS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
