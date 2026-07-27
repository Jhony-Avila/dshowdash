const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/delta-updates";
function DeltaUpdateManager(options = {}) {
  this.idField = options.idField || "id";
  this.timestampField = options.timestampField || "updated_at";
  this.onInsert = options.onInsert || (() => {
  });
  this.onUpdate = options.onUpdate || (() => {
  });
  this.onDelete = options.onDelete || (() => {
  });
  this.onChange = options.onChange || (() => {
  });
  this._currentData = /* @__PURE__ */ new Map();
  this._lastSync = null;
}
DeltaUpdateManager.prototype.setInitialData = function(data) {
  const self = this;
  this._currentData.clear();
  data.forEach((item) => {
    const id = self._getId(item);
    self._currentData.set(id, self._clone(item));
  });
  this._lastSync = /* @__PURE__ */ new Date();
};
DeltaUpdateManager.prototype.applyDelta = function(newData) {
  const self = this;
  const changes = { inserted: [], updated: [], deleted: [], unchanged: [] };
  const newDataMap = /* @__PURE__ */ new Map();
  newData.forEach((item) => {
    const id = self._getId(item);
    newDataMap.set(id, item);
  });
  newData.forEach((item) => {
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
  this._currentData.forEach((item, id) => {
    if (!newDataMap.has(id)) {
      changes.deleted.push(item);
      self._currentData.delete(id);
    }
  });
  this._lastSync = /* @__PURE__ */ new Date();
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
DeltaUpdateManager.prototype.applyPartialUpdate = function(updates) {
  const self = this;
  const applied = [];
  updates.forEach((update) => {
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
DeltaUpdateManager.prototype._getId = function(item) {
  return String(item[this.idField] || item.Id_Requisicao || item.id);
};
DeltaUpdateManager.prototype._hasChanged = function(oldItem, newItem) {
  if (this.timestampField && oldItem[this.timestampField] && newItem[this.timestampField]) {
    return new Date(String(newItem[this.timestampField])) > new Date(String(oldItem[this.timestampField]));
  }
  return JSON.stringify(oldItem) !== JSON.stringify(newItem);
};
DeltaUpdateManager.prototype._getDiff = (oldItem, newItem) => {
  const diff = {};
  const allKeys = new Set(Object.keys(oldItem).concat(Object.keys(newItem)));
  allKeys.forEach((key) => {
    if (JSON.stringify(oldItem[key]) !== JSON.stringify(newItem[key])) {
      diff[key] = { old: oldItem[key], new: newItem[key] };
    }
  });
  return diff;
};
DeltaUpdateManager.prototype._clone = (obj) => JSON.parse(JSON.stringify(obj));
DeltaUpdateManager.prototype.getItem = function(id) {
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
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var delta_updates_default = { DeltaUpdateManager, info, healthCheck };
export {
  DeltaUpdateManager,
  MODULE_ID,
  VERSION,
  delta_updates_default as default,
  healthCheck,
  info
};
