// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE5)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.state.saved-views
// PURPOSE: Saved Views — Salvar/restaurar configurações de view (filtros, layout, sort)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   SavedViews — Factory function
//   STORAGE_KEY — localStorage key
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/table/saved-views.js for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE5: Initial creation — FASE 5 E.2
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE5';
export const MODULE_ID = 'panel-nav-admin.state.saved-views';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[SavedViews]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/** @type {string} */
export const STORAGE_KEY = 'pna_saved_views';

/** @type {number} */
const MAX_VIEWS = 10;

/** @type {number} */
const MAX_NAME_LENGTH = 50;

/**
 * Factory: creates a saved views manager for nav-admin.
 * Persists named view configurations (filters, sort, density, columns, view mode).
 *
 * @param {Object} [options]
 * @param {Function} [options.onApply] — Callback(viewConfig) when a view is applied
 * @returns {Object} SavedViews instance
 */
type SavedView = { id: string; name: string; config: Record<string, unknown>; createdAt: string; updatedAt: string };
export function SavedViews(options: Record<string, unknown> = {}) {
  const onApply = options.onApply as ((config: Record<string, unknown>) => void) | undefined;

  let _views: SavedView[] = [];
  _loadFromStorage();

  /**
   * Load views from localStorage.
   * @private
   */
  function _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _views = raw ? JSON.parse(raw) : [];
    } catch (e: any) {
      _log('error', 'Failed to load saved views:', e.message);
      _views = [];
    }
  }

  /**
   * Save views to localStorage.
   * @private
   */
  function _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_views));
    } catch (e: any) {
      _log('error', 'Failed to save views:', e.message);
    }
  }

  /**
   * Create a new saved view.
   * @param {string} name — View name (max 50 chars)
   * @param {Object} config — View configuration snapshot
   * @param {Object} [config.filters] — Active filters
   * @param {Object} [config.sort] — Sort config {field, direction}
   * @param {string} [config.density] — Density setting
   * @param {string} [config.viewMode] — View mode (table, card, split)
   * @param {Array} [config.columns] — Visible columns config
   * @returns {Object} Created view
   * @throws {Error} If max views reached or invalid name
   */
  function create(name: string, config: Record<string, unknown>) {
    if (!name || typeof name !== 'string') throw new Error('View name is required');
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
      throw new Error(`Name must be 1-${MAX_NAME_LENGTH} characters`);
    }
    if (_views.length >= MAX_VIEWS) {
      throw new Error(`Maximum of ${MAX_VIEWS} views reached`);
    }

    const view = {
      id: 'view_' + Date.now(),
      name: trimmed,
      config: { ...config },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    _views.unshift(view);
    _saveToStorage();
    _log('info', 'View created:', trimmed);
    return view;
  }

  /**
   * Update an existing view.
   * @param {string} id — View ID
   * @param {Object} updates — {name?, config?}
   * @returns {Object|null} Updated view
   */
  function update(id: string, updates: Record<string, unknown>) {
    const view = _views.find(v => v.id === id);
    if (!view) return null;

    if (updates.name !== undefined) {
      const trimmed = String(updates.name).trim();
      if (trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH) {
        view.name = trimmed;
      }
    }
    if (updates.config !== undefined) {
      view.config = { ...(updates.config as Record<string, unknown>) };
    }
    view.updatedAt = new Date().toISOString();

    _saveToStorage();
    _log('info', 'View updated:', view.name);
    return view;
  }

  /**
   * Delete a saved view.
   * @param {string} id
   * @returns {boolean}
   */
  function remove(id: string) {
    const idx = _views.findIndex(v => v.id === id);
    if (idx === -1) return false;
    const removed = _views.splice(idx, 1)[0];
    _saveToStorage();
    _log('info', 'View deleted:', removed.name);
    return true;
  }

  /**
   * Apply a saved view.
   * @param {string} id
   * @returns {Object|null} Applied config
   */
  function apply(id: string) {
    const view = _views.find(v => v.id === id);
    if (!view) return null;
    if (typeof onApply === 'function') {
      onApply(view.config);
    }
    _log('info', 'View applied:', view.name);
    return view.config;
  }

  /**
   * Duplicate a saved view.
   * @param {string} id
   * @returns {Object|null} New duplicated view
   */
  function duplicate(id: string) {
    const view = _views.find(v => v.id === id);
    if (!view) return null;
    const newName = (view.name + ' (cópia)').substring(0, MAX_NAME_LENGTH);
    return create(newName, { ...view.config });
  }

  /**
   * Get all saved views.
   * @returns {Array}
   */
  function getAll() {
    return [..._views];
  }

  /**
   * Get a view by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  function getById(id: string) {
    return _views.find(v => v.id === id) || null;
  }

  /**
   * Export a view as JSON string.
   * @param {string} id
   * @returns {string|null}
   */
  function exportView(id: string) {
    const view = _views.find(v => v.id === id);
    return view ? JSON.stringify(view, null, 2) : null;
  }

  /**
   * Import a view from JSON string.
   * @param {string} jsonStr
   * @returns {Object|null} Imported view
   */
  function importView(jsonStr: string) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.name || !data.config) throw new Error('Invalid view format');
      return create(data.name, data.config);
    } catch (e: any) {
      _log('error', 'Import failed:', e.message);
      return null;
    }
  }

  /**
   * Clear all saved views.
   */
  function clear() {
    _views = [];
    _saveToStorage();
    _log('info', 'All views cleared');
  }

  /** @returns {number} Number of saved views */
  function count() { return _views.length; }

  return {
    create, update, remove, apply, duplicate,
    getAll, getById, exportView, importView,
    clear, count
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, maxViews: MAX_VIEWS, storageKey: STORAGE_KEY };
}

export function healthCheck() {
  let viewCount = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    viewCount = raw ? JSON.parse(raw).length : 0;
  } catch { /* noop */ }
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, viewCount };
}

export default { SavedViews, STORAGE_KEY, injectPorts, info, healthCheck, VERSION, MODULE_ID };
