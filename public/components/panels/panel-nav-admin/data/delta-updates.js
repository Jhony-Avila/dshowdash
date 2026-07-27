import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE2";
const MODULE_ID = "panel-nav-admin.data.delta-updates";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[DeltaUpdates]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
function _deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bArr = b;
    if (a.length !== bArr.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!_deepEqual(a[i], bArr[i])) return false;
    }
    return true;
  }
  const ao = a;
  const bo = b;
  const keysA = Object.keys(ao);
  const keysB = Object.keys(bo);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !_deepEqual(ao[key], bo[key])) return false;
  }
  return true;
}
function _computeDiff(oldObj, newObj) {
  const diff = {};
  const allKeys = Array.from(/* @__PURE__ */ new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));
  for (const key of allKeys) {
    if (!_deepEqual(oldObj[key], newObj[key])) {
      diff[key] = { old: oldObj[key], new: newObj[key] };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}
class DeltaUpdateManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.idField='id'] — Campo identificador
   * @param {Function} [options.onInsert] — Callback para novos itens
   * @param {Function} [options.onUpdate] — Callback para itens atualizados
   * @param {Function} [options.onDelete] — Callback para itens removidos
   * @param {Function} [options.onChange] — Callback genérico (recebe delta summary)
   */
  constructor(options = {}) {
    this.idField = options.idField || "id";
    this.onInsert = options.onInsert || null;
    this.onUpdate = options.onUpdate || null;
    this.onDelete = options.onDelete || null;
    this.onChange = options.onChange || null;
    this._data = /* @__PURE__ */ new Map();
    this._stats = { inserts: 0, updates: 0, deletes: 0, unchanged: 0, lastDeltaAt: null };
  }
  /**
   * Set the initial dataset (baseline for future diffs).
   * @param {Array<Object>} items
   */
  setInitialData(items) {
    this._data.clear();
    for (const item of items || []) {
      const id = item[this.idField];
      if (id != null) this._data.set(String(id), { ...item });
    }
    _log("debug", "Initial data set:", this._data.size, "items");
  }
  /**
   * Apply a delta — compare new data against stored baseline.
   * @param {Array<Object>} newItems — Fresh data from API
   * @returns {{ inserted: Object[], updated: Object[], deleted: Object[], unchanged: number }}
   */
  applyDelta(newItems) {
    const inserted = [];
    const updated = [];
    const deleted = [];
    let unchanged = 0;
    const newMap = /* @__PURE__ */ new Map();
    for (const item of newItems || []) {
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
    this._data.clear();
    for (const item of newItems || []) {
      const id = String(item[this.idField]);
      this._data.set(id, { ...item });
    }
    if (inserted.length > 0 && this.onInsert) this.onInsert(inserted);
    if (updated.length > 0 && this.onUpdate) this.onUpdate(updated);
    if (deleted.length > 0 && this.onDelete) this.onDelete(deleted);
    if ((inserted.length > 0 || updated.length > 0 || deleted.length > 0) && this.onChange) {
      this.onChange({ inserted, updated, deleted, unchanged });
    }
    _log("debug", "Delta applied:", inserted.length, "new,", updated.length, "updated,", deleted.length, "deleted,", unchanged, "unchanged");
    return { inserted, updated, deleted, unchanged };
  }
  /**
   * Apply a partial update to a single item (for optimistic UI).
   * @param {string} id — Item ID
   * @param {Object} changes — Fields to merge
   * @returns {Object|null} Updated item or null if not found
   */
  applyPartialUpdate(id, changes) {
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
  getItem(id) {
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
  size() {
    return this._data.size;
  }
  /** @returns {Object} Cumulative stats */
  getStats() {
    return { ...this._stats, currentSize: this._data.size };
  }
  /** Clear all data and reset stats. */
  clear() {
    this._data.clear();
    this._stats = { inserts: 0, updates: 0, deletes: 0, unchanged: 0, lastDeltaAt: null };
  }
}
function createDeltaManager(options = {}) {
  return new DeltaUpdateManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var delta_updates_default = { DeltaUpdateManager, createDeltaManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  DeltaUpdateManager,
  MODULE_ID,
  VERSION,
  createDeltaManager,
  delta_updates_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
