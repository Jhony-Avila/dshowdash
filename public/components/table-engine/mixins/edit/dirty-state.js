const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:dirty-state";
class DirtyStateManager {
  constructor() {
    this._dirtyRows = /* @__PURE__ */ new Map();
    this._originalData = /* @__PURE__ */ new Map();
    this._listeners = /* @__PURE__ */ new Set();
  }
  trackOriginal(rowId, data) {
    if (!this._originalData.has(rowId)) {
      this._originalData.set(rowId, JSON.parse(JSON.stringify(data)));
    }
  }
  markDirty(rowId, column, newValue) {
    if (!this._dirtyRows.has(rowId)) {
      this._dirtyRows.set(rowId, /* @__PURE__ */ new Map());
    }
    this._dirtyRows.get(rowId).set(column, newValue);
    this._notify("dirty", { rowId, column, newValue });
  }
  markClean(rowId, column = null) {
    if (column) {
      const rowDirty = this._dirtyRows.get(rowId);
      if (rowDirty) {
        rowDirty.delete(column);
        if (rowDirty.size === 0) {
          this._dirtyRows.delete(rowId);
        }
      }
    } else {
      this._dirtyRows.delete(rowId);
    }
    this._notify("clean", { rowId, column });
  }
  isRowDirty(rowId) {
    return this._dirtyRows.has(rowId);
  }
  isCellDirty(rowId, column) {
    return this._dirtyRows.get(rowId)?.has(column) || false;
  }
  getDirtyColumns(rowId) {
    const rowDirty = this._dirtyRows.get(rowId);
    return rowDirty ? Array.from(rowDirty.keys()) : [];
  }
  getDirtyRows() {
    return Array.from(this._dirtyRows.keys());
  }
  getDirtyCount() {
    return this._dirtyRows.size;
  }
  getChanges(rowId) {
    const original = this._originalData.get(rowId);
    const dirty = this._dirtyRows.get(rowId);
    if (!original || !dirty) return null;
    const changes = {};
    dirty.forEach((newValue, column) => {
      changes[column] = {
        original: original[column],
        current: newValue
      };
    });
    return changes;
  }
  getAllChanges() {
    const allChanges = [];
    this._dirtyRows.forEach((columns, rowId) => {
      const original = this._originalData.get(rowId);
      const rowChanges = {
        rowId,
        changes: {}
      };
      columns.forEach((newValue, column) => {
        rowChanges.changes[column] = {
          original: original?.[column],
          current: newValue
        };
      });
      allChanges.push(rowChanges);
    });
    return allChanges;
  }
  revert(rowId, column = null) {
    const original = this._originalData.get(rowId);
    if (!original) return null;
    if (column) {
      this.markClean(rowId, column);
      return { [column]: original[column] };
    }
    this.markClean(rowId);
    return original;
  }
  revertAll() {
    const reverted = [];
    this._dirtyRows.forEach((_, rowId) => {
      const original = this._originalData.get(rowId);
      if (original) {
        reverted.push({ rowId, data: original });
      }
    });
    this.clear();
    return reverted;
  }
  commit() {
    this._dirtyRows.forEach((columns, rowId) => {
      const original = this._originalData.get(rowId);
      if (original) {
        columns.forEach((newValue, column) => {
          original[column] = newValue;
        });
      }
    });
    this._dirtyRows.clear();
    this._notify("commit", null);
  }
  clear() {
    this._dirtyRows.clear();
    this._originalData.clear();
    this._notify("clear", null);
  }
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
  _notify(action, data) {
    this._listeners.forEach((l) => l(action, data, {
      dirtyCount: this.getDirtyCount(),
      dirtyRows: this.getDirtyRows()
    }));
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      dirtyRowCount: this.getDirtyCount(),
      trackedRowCount: this._originalData.size
    };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
  }
}
function createDirtyStateManager() {
  return new DirtyStateManager();
}
function renderDirtyIndicator(options = {}) {
  const p = options.cssPrefix || "tbl-";
  const count = options.dirtyCount || 0;
  if (count === 0) return "";
  return `
    <div class="${p}dirty-indicator">
      <span class="${p}dirty-badge">${count}</span>
      <span class="${p}dirty-label">altera\xE7\xE3o${count > 1 ? "\xF5es" : ""} n\xE3o salva${count > 1 ? "s" : ""}</span>
      <button class="${p}dirty-save" data-action="save-all" title="Salvar todas">\u{1F4BE} Salvar</button>
      <button class="${p}dirty-revert" data-action="revert-all" title="Descartar todas">\u21A9 Descartar</button>
    </div>
  `;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var dirty_state_default = { createDirtyStateManager, renderDirtyIndicator, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createDirtyStateManager,
  dirty_state_default as default,
  healthCheck,
  info,
  renderDirtyIndicator
};
