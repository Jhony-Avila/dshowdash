// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:dirty-state
// PURPOSE: Table Engine - Dirty State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createDirtyStateManager() — exported function
//   renderDirtyIndicator() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:dirty-state';

class DirtyStateManager {
  [key: string]: any;
  constructor() {
    this._dirtyRows = new Map();
    this._originalData = new Map();
    this._listeners = new Set();
  }

  trackOriginal(rowId: string, data: Record<string, unknown>) {
    if (!this._originalData.has(rowId)) {
      this._originalData.set(rowId, JSON.parse(JSON.stringify(data)));
    }
  }

  markDirty(rowId: string, column: string, newValue: unknown) {
    if (!this._dirtyRows.has(rowId)) {
      this._dirtyRows.set(rowId, new Map());
    }

    this._dirtyRows.get(rowId).set(column, newValue);
    this._notify('dirty', { rowId, column, newValue });
  }

  markClean(rowId: string, column: string | null = null) {
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

    this._notify('clean', { rowId, column });
  }

  isRowDirty(rowId: string) {
    return this._dirtyRows.has(rowId);
  }

  isCellDirty(rowId: string, column: string) {
    return this._dirtyRows.get(rowId)?.has(column) || false;
  }

  getDirtyColumns(rowId: string) {
    const rowDirty = this._dirtyRows.get(rowId);
    return rowDirty ? Array.from(rowDirty.keys()) : [];
  }

  getDirtyRows() {
    return Array.from(this._dirtyRows.keys());
  }

  getDirtyCount() {
    return this._dirtyRows.size;
  }

  getChanges(rowId: string) {
    const original = this._originalData.get(rowId);
    const dirty = this._dirtyRows.get(rowId);

    if (!original || !dirty) return null;

    const changes: Record<string, { original: unknown; current: unknown }> = {};
    dirty.forEach((newValue: unknown, column: string) => {
      changes[column] = {
        original: original[column],
        current: newValue
      };
    });

    return changes;
  }

  getAllChanges() {
    const allChanges: Array<{ rowId: string; changes: Record<string, { original: unknown; current: unknown }> }> = [];

    this._dirtyRows.forEach((columns: Map<string, unknown>, rowId: string) => {
      const original = this._originalData.get(rowId);
      const rowChanges: { rowId: string; changes: Record<string, { original: unknown; current: unknown }> } = {
        rowId,
        changes: {}
      };

      columns.forEach((newValue: unknown, column: string) => {
        rowChanges.changes[column] = {
          original: original?.[column],
          current: newValue
        };
      });

      allChanges.push(rowChanges);
    });

    return allChanges;
  }

  revert(rowId: string, column: string | null = null) {
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
    const reverted: Array<{ rowId: string; data: Record<string, unknown> }> = [];
    this._dirtyRows.forEach((_: unknown, rowId: string) => {
      const original = this._originalData.get(rowId);
      if (original) {
        reverted.push({ rowId, data: original });
      }
    });

    this.clear();
    return reverted;
  }

  commit() {
    this._dirtyRows.forEach((columns: Map<string, unknown>, rowId: string) => {
      const original = this._originalData.get(rowId);
      if (original) {
        columns.forEach((newValue: unknown, column: string) => {
          original[column] = newValue;
        });
      }
    });

    this._dirtyRows.clear();
    this._notify('commit', null);
  }

  clear() {
    this._dirtyRows.clear();
    this._originalData.clear();
    this._notify('clear', null);
  }

  subscribe(listener: (action: string, data: Record<string, unknown> | null, state: Record<string, unknown>) => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(action: string, data: Record<string, unknown> | null) {
    this._listeners.forEach((l: (action: string, data: Record<string, unknown> | null, state: Record<string, unknown>) => void) => l(action, data, {
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
    return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
  }
}

export function createDirtyStateManager() {
  return new DirtyStateManager();
}

export function renderDirtyIndicator(options: { cssPrefix?: string; dirtyCount?: number } = {}) {
  const p = options.cssPrefix || 'tbl-';
  const count = options.dirtyCount || 0;

  if (count === 0) return '';

  return `
    <div class="${p}dirty-indicator">
      <span class="${p}dirty-badge">${count}</span>
      <span class="${p}dirty-label">alteração${count > 1 ? 'ões' : ''} não salva${count > 1 ? 's' : ''}</span>
      <button class="${p}dirty-save" data-action="save-all" title="Salvar todas">💾 Salvar</button>
      <button class="${p}dirty-revert" data-action="revert-all" title="Descartar todas">↩ Descartar</button>
    </div>
  `;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { createDirtyStateManager, renderDirtyIndicator, info, healthCheck, VERSION, MODULE_ID };
