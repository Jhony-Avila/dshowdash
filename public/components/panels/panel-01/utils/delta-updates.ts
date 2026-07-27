// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/delta-updates
// PURPOSE: Panel-01 - Delta Updates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DeltaUpdateManager() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/delta-updates';

export function DeltaUpdateManager(this: any, options: Record<string, unknown> = {}) {
  this.idField = options.idField || 'id';
  this.timestampField = options.timestampField || 'updated_at';
  this.onInsert = options.onInsert || (() => {});
  this.onUpdate = options.onUpdate || (() => {});
  this.onDelete = options.onDelete || (() => {});
  this.onChange = options.onChange || (() => {});
  this._currentData = new Map();
  this._lastSync = null;
}

DeltaUpdateManager.prototype.setInitialData = function(data: Record<string, unknown>[]) {
  const self = this;
  this._currentData.clear();

  data.forEach((item: Record<string, unknown>) => {
    const id = self._getId(item);
    self._currentData.set(id, self._clone(item));
  });
  
  this._lastSync = new Date();
};

DeltaUpdateManager.prototype.applyDelta = function(newData: Record<string, unknown>[]) {
  const self = this;
  const changes: { inserted: unknown[]; updated: unknown[]; deleted: unknown[]; unchanged: unknown[] } = { inserted: [], updated: [], deleted: [], unchanged: [] };

  const newDataMap = new Map();
  newData.forEach((item: Record<string, unknown>) => {
    const id = self._getId(item);
    newDataMap.set(id, item);
  });
  
  // Check for updates and inserts
  newData.forEach((item: Record<string, unknown>) => {
    const id = self._getId(item);
    const existing = self._currentData.get(id);
    
    if (!existing) {
      changes.inserted.push(item);
      self._currentData.set(id, self._clone(item));
    } else if (self._hasChanged(existing, item)) {
      changes.updated.push({ old: existing, new: item, diff: self._getDiff(existing, item) });
      self._currentData.set(id, self._clone(item));
    } else {
      changes.unchanged.push(item);
    }
  });
  
  // Check for deletes
  this._currentData.forEach((item: Record<string, unknown>, id: string) => {
    if (!newDataMap.has(id)) {
      changes.deleted.push(item);
      self._currentData.delete(id);
    }
  });
  
  this._lastSync = new Date();
  
  // Trigger callbacks
  if (changes.inserted.length > 0) {
    this.onInsert(changes.inserted);
  }
  if (changes.updated.length > 0) {
    this.onUpdate(changes.updated);
  }
  if (changes.deleted.length > 0) {
    this.onDelete(changes.deleted);
  }
  
  const hasChanges = changes.inserted.length > 0 || changes.updated.length > 0 || changes.deleted.length > 0;
  if (hasChanges) {
    this.onChange(changes);
  }
  
  return changes;
};

DeltaUpdateManager.prototype.applyPartialUpdate = function(updates: Record<string, unknown>[]) {
  const self = this;
  const applied: unknown[] = [];

  updates.forEach((update: Record<string, unknown>) => {
    const id = self._getId(update);
    const existing = self._currentData.get(id);
    
    if (existing) {
      const merged = Object.assign({}, existing, update);
      self._currentData.set(id, merged);
      applied.push({ id, old: existing, new: merged });
    }
  });
  
  if (applied.length > 0) {
    this.onUpdate(applied);
    this.onChange({ inserted: [], updated: applied, deleted: [], unchanged: [] });
  }
  
  return applied;
};

DeltaUpdateManager.prototype._getId = function(item: Record<string, unknown>) {
  return String(item[this.idField] || item.Id_Requisicao || item.id);
};

DeltaUpdateManager.prototype._hasChanged = function(oldItem: Record<string, unknown>, newItem: Record<string, unknown>) {
  // Check timestamp first if available
  if (this.timestampField && oldItem[this.timestampField] && newItem[this.timestampField]) {
    return new Date(String(newItem[this.timestampField])) > new Date(String(oldItem[this.timestampField]));
  }
  
  // Deep comparison
  return JSON.stringify(oldItem) !== JSON.stringify(newItem);
};

DeltaUpdateManager.prototype._getDiff = (oldItem: Record<string, unknown>, newItem: Record<string, unknown>) => {
  const diff: Record<string, unknown> = {};
  const allKeys = new Set(Object.keys(oldItem).concat(Object.keys(newItem)));

  allKeys.forEach((key: string) => {
    if (JSON.stringify(oldItem[key]) !== JSON.stringify(newItem[key])) {
      diff[key] = { old: oldItem[key], new: newItem[key] };
    }
  });
  
  return diff;
};

DeltaUpdateManager.prototype._clone = (obj: unknown) => JSON.parse(JSON.stringify(obj));

DeltaUpdateManager.prototype.getItem = function(id: string | number) {
  return this._currentData.get(String(id));
};

DeltaUpdateManager.prototype.getAllData = function() {
  return Array.from(this._currentData.values());
};

DeltaUpdateManager.prototype.getStats = function() {
  return {
    count: this._currentData.size,
    lastSync: this._lastSync
  };
};

DeltaUpdateManager.prototype.clear = function() {
  this._currentData.clear();
  this._lastSync = null;
};

DeltaUpdateManager.prototype.destroy = function() {
  this.clear();
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { DeltaUpdateManager, info, healthCheck };
