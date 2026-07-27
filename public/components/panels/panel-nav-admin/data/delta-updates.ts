// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.delta-updates
// PURPOSE: Delta Updates — Atualizações incrementais (diff-based) de itens de nav
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   DeltaUpdateManager — exported class
//   createDeltaManager() — factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/delta-updates.js for nav-admin items
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.3
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE2';
export const MODULE_ID = 'panel-nav-admin.data.delta-updates';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[DeltaUpdates]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Deep equality comparison.
 * @private
 */
function _deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bArr = b as unknown[];
    if (a.length !== bArr.length) return false;
    for (let i = 0; i < a.length; i++) { if (!_deepEqual(a[i], bArr[i])) return false; }
    return true;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keysA = Object.keys(ao);
  const keysB = Object.keys(bo);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !_deepEqual(ao[key], bo[key])) return false;
  }
  return true;
}

/**
 * Compute diff between old and new objects (changed fields only).
 * @private
 */
function _computeDiff(oldObj: Record<string, unknown>, newObj: Record<string, unknown>) {
  const diff: Record<string, unknown> = {};
  const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));
  for (const key of allKeys) {
    if (!_deepEqual(oldObj[key], newObj[key])) {
      diff[key] = { old: oldObj[key], new: newObj[key] };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * DeltaUpdateManager — Rastreia inserções, atualizações e remoções de itens.
 */
export class DeltaUpdateManager {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {string} [options.idField='id'] — Campo identificador
   * @param {Function} [options.onInsert] — Callback para novos itens
   * @param {Function} [options.onUpdate] — Callback para itens atualizados
   * @param {Function} [options.onDelete] — Callback para itens removidos
   * @param {Function} [options.onChange] — Callback genérico (recebe delta summary)
   */
  constructor(options: Record<string, unknown> = {}) {
    this.idField = options.idField || 'id';
    this.onInsert = options.onInsert || null;
    this.onUpdate = options.onUpdate || null;
    this.onDelete = options.onDelete || null;
    this.onChange = options.onChange || null;

    this._data = new Map();
    this._stats = { inserts: 0, updates: 0, deletes: 0, unchanged: 0, lastDeltaAt: null };
  }

  /**
   * Set the initial dataset (baseline for future diffs).
   * @param {Array<Object>} items
   */
  setInitialData(items: Record<string, unknown>[]) {
    this._data.clear();
    for (const item of (items || [])) {
      const id = item[this.idField];
      if (id != null) this._data.set(String(id), { ...item });
    }
    _log('debug', 'Initial data set:', this._data.size, 'items');
  }

  /**
   * Apply a delta — compare new data against stored baseline.
   * @param {Array<Object>} newItems — Fresh data from API
   * @returns {{ inserted: Object[], updated: Object[], deleted: Object[], unchanged: number }}
   */
  applyDelta(newItems: Record<string, unknown>[]) {
    const inserted = [];
    const updated = [];
    const deleted = [];
    let unchanged = 0;

    const newMap = new Map();
    for (const item of (newItems || [])) {
      const id = String(item[this.idField]);
      newMap.set(id, item);

      const existing = this._data.get(id);
      if (!existing) {
        inserted.push(item);
        this._stats.inserts++;
      } else {
        const diff = _computeDiff(existing, item);
        if (diff) {
          updated.push({ item, diff, oldItem: existing });
          this._stats.updates++;
        } else {
          unchanged++;
        }
      }
    }

    for (const [id, item] of this._data) {
      if (!newMap.has(id)) {
        deleted.push(item);
        this._stats.deletes++;
      }
    }

    this._stats.unchanged += unchanged;
    this._stats.lastDeltaAt = Date.now();

    // Update stored data
    this._data.clear();
    for (const item of (newItems || [])) {
      const id = String(item[this.idField]);
      this._data.set(id, { ...item });
    }

    // Fire callbacks
    if (inserted.length > 0 && this.onInsert) this.onInsert(inserted);
    if (updated.length > 0 && this.onUpdate) this.onUpdate(updated);
    if (deleted.length > 0 && this.onDelete) this.onDelete(deleted);
    if ((inserted.length > 0 || updated.length > 0 || deleted.length > 0) && this.onChange) {
      this.onChange({ inserted, updated, deleted, unchanged });
    }

    _log('debug', 'Delta applied:', inserted.length, 'new,', updated.length, 'updated,', deleted.length, 'deleted,', unchanged, 'unchanged');
    return { inserted, updated, deleted, unchanged };
  }

  /**
   * Apply a partial update to a single item (for optimistic UI).
   * @param {string} id — Item ID
   * @param {Object} changes — Fields to merge
   * @returns {Object|null} Updated item or null if not found
   */
  applyPartialUpdate(id: string, changes: Record<string, unknown>) {
    const key = String(id);
    const existing = this._data.get(key);
    if (!existing) return null;

    const updated = { ...existing, ...changes };
    this._data.set(key, updated);
    return updated;
  }

  /**
   * Get a stored item by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getItem(id: string) {
    return this._data.get(String(id)) || null;
  }

  /**
   * Get all stored data as an array.
   * @returns {Array<Object>}
   */
  getAllData() {
    return Array.from(this._data.values());
  }

  /** @returns {number} Count of stored items */
  size() { return this._data.size; }

  /** @returns {Object} Cumulative stats */
  getStats() { return { ...this._stats, currentSize: this._data.size }; }

  /** Clear all data and reset stats. */
  clear() {
    this._data.clear();
    this._stats = { inserts: 0, updates: 0, deletes: 0, unchanged: 0, lastDeltaAt: null };
  }
}

/**
 * Factory to create a DeltaUpdateManager instance.
 * @param {Object} [options]
 * @returns {DeltaUpdateManager}
 */
export function createDeltaManager(options: Record<string, unknown> = {}) {
  return new DeltaUpdateManager(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { DeltaUpdateManager, createDeltaManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
