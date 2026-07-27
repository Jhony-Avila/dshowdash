// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.5.0-MIGRATION-PHASE9)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.collaboration.activity-log
// PURPOSE: Activity Log — Histórico de alterações nos itens de navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../config/feature-flags.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   ActivityLog — Factory function
//   ACTION_TYPES — Known action types
//   info(), healthCheck()
//
// @origin Adapted from panel-01 activity log for nav-admin domain
// @changelog
//   10.5.0-MIGRATION-PHASE9: Initial creation — FASE 9 J.1
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../config/feature-flags.js';

export const VERSION = '10.5.0-MIGRATION-PHASE9';
export const MODULE_ID = 'panel-nav-admin.collaboration.activity-log';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[ActivityLog]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Known action types for the activity log.
 * @type {Object}
 */
export const ACTION_TYPES = Object.freeze({
  ITEM_CREATED: 'item_created',
  ITEM_UPDATED: 'item_updated',
  ITEM_DELETED: 'item_deleted',
  ITEM_REORDERED: 'item_reordered',
  ITEM_DUPLICATED: 'item_duplicated',
  ITEM_TOGGLED: 'item_toggled',
  SECTION_CREATED: 'section_created',
  SECTION_UPDATED: 'section_updated',
  SECTION_DELETED: 'section_deleted',
  BULK_UPDATE: 'bulk_update',
  BULK_DELETE: 'bulk_delete',
  IMPORT: 'import',
  EXPORT: 'export',
  SETTINGS_CHANGED: 'settings_changed',
  VIEW_CHANGED: 'view_changed'
});

/**
 * Factory: creates an ActivityLog tracker.
 * Records and queries the history of nav-admin operations.
 *
 * @param {Object} [options]
 * @param {number} [options.maxEntries=500] — Maximum log entries
 * @param {boolean} [options.persistToStorage=true] — Persist to localStorage
 * @param {string} [options.storageKey='pna_activity_log'] — localStorage key
 * @returns {Object} ActivityLog instance
 */
export function ActivityLog(options: Record<string, unknown> = {}) {
  const {
    maxEntries = 500,
    persistToStorage = true,
    storageKey = 'pna_activity_log'
  } = options;

  /** @private */
  let _entries: Record<string, unknown>[] = [];
  let _listeners: ((entry: Record<string, unknown>) => void)[] = [];

  // Restore from storage on init
  if (persistToStorage) {
    try {
      const stored = localStorage.getItem(String(storageKey));
      if (stored) _entries = JSON.parse(stored);
    } catch { /* ignore */ }
  }

  /**
   * Get current user info from auth port.
   * @private
   * @returns {Object}
   */
  function _getActor() {
    const auth = Ports.get('auth');
    if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
      return { id: null, name: 'anonymous' };
    }
    const user = auth.getUser ? auth.getUser() : null;
    return {
      id: user?.id || null,
      name: user?.name || user?.username || 'admin'
    };
  }

  /**
   * Log an activity entry.
   *
   * @param {string} action — One of ACTION_TYPES values
   * @param {Object} [details]
   * @param {string} [details.itemId] — Related item ID
   * @param {string} [details.itemLabel] — Related item label
   * @param {string} [details.sectionKey] — Related section key
   * @param {Object} [details.before] — State before change
   * @param {Object} [details.after] — State after change
   * @param {string} [details.description] — Human-readable description
   */
  function log(action: string, details: Record<string, unknown> = {}) {
    if (!isEnabled('activityLog')) return;

    const entry = {
      id: _generateId(),
      action,
      actor: _getActor(),
      timestamp: Date.now(),
      ...details
    };

    _entries.push(entry);

    // Trim
    if (_entries.length > Number(maxEntries)) {
      _entries.splice(0, _entries.length - Number(maxEntries));
    }

    // Persist
    if (persistToStorage) {
      try {
        localStorage.setItem(String(storageKey), JSON.stringify(_entries));
      } catch { /* quota exceeded, ignore */ }
    }

    // Notify listeners
    for (const listener of _listeners) {
      try { listener(entry); } catch { /* ignore */ }
    }

    _log('debug', `Activity: ${action}`, details.itemLabel || details.itemId || '');
  }

  /**
   * Get all log entries.
   * @returns {Array<Object>}
   */
  function getAll() {
    return [..._entries];
  }

  /**
   * Get recent entries.
   *
   * @param {number} [limit=20]
   * @returns {Array<Object>}
   */
  function getRecent(limit = 20) {
    return _entries.slice(-limit).reverse();
  }

  /**
   * Query entries by filter.
   *
   * @param {Object} filter
   * @param {string} [filter.action] — Filter by action type
   * @param {string} [filter.itemId] — Filter by item ID
   * @param {string} [filter.actorId] — Filter by actor ID
   * @param {number} [filter.since] — Filter entries after timestamp
   * @param {number} [filter.until] — Filter entries before timestamp
   * @returns {Array<Object>}
   */
  function query(filter: Record<string, unknown> = {}) {
    let result = _entries;

    if (filter.action) {
      result = result.filter(e => e.action === filter.action);
    }
    if (filter.itemId) {
      result = result.filter(e => e.itemId === filter.itemId);
    }
    if (filter.actorId) {
      result = result.filter(e => (e.actor as Record<string, unknown>)?.id === filter.actorId);
    }
    if (filter.since) {
      // @ts-expect-error strict migration — TS18046
      result = result.filter(e => e.timestamp >= filter.since);
    }
    if (filter.until) {
      // @ts-expect-error strict migration — TS18046
      result = result.filter(e => e.timestamp <= filter.until);
    }

    return result;
  }

  /**
   * Get activity summary (counts by action type).
   * @returns {Object<string, number>}
   */
  function getSummary() {
    const counts: Record<string, number> = {};
    for (const entry of _entries) {
      const action = String(entry.action);
      counts[action] = (counts[action] || 0) + 1;
    }
    return counts;
  }

  /**
   * Subscribe to new activity entries.
   *
   * @param {Function} listener
   * @returns {Function} Unsubscribe
   */
  function subscribe(listener: (entry: Record<string, unknown>) => void) {
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clear all log entries.
   */
  function clear() {
    _entries = [];
    if (persistToStorage) {
      try { localStorage.removeItem(String(storageKey)); } catch { /* ignore */ }
    }
    _log('info', 'Activity log cleared');
  }

  /** @private */
  function _generateId() {
    return `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  return {
    log, getAll, getRecent, query,
    getSummary, subscribe, clear,
    ACTION_TYPES
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, actionTypes: Object.keys(ACTION_TYPES).length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { ActivityLog, ACTION_TYPES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
