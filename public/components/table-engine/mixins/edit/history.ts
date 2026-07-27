// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:history
// PURPOSE: Table Engine - Undo/Redo History
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createHistory() — exported function
//   renderUndoRedoButtons() — exported function
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
export const MODULE_ID = 'table-engine:history';

class EditHistory {
  [key: string]: any;
  constructor(options: { maxSize?: number } = {}) {
    this._undoStack = [];
    this._redoStack = [];
    this._maxSize = options.maxSize || 50;
    this._listeners = new Set();
    this._groupId = null;
  }

  push(action: Record<string, unknown>) {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      groupId: this._groupId,
      ...action
    };

    this._undoStack.push(entry);
    this._redoStack = [];

    if (this._undoStack.length > this._maxSize) {
      this._undoStack.shift();
    }

    this._notify('push', entry);
    return entry;
  }

  undo() {
    if (!this.canUndo) return null;

    const entry = this._undoStack.pop();
    this._redoStack.push(entry);
    this._notify('undo', entry);
    return entry;
  }

  redo() {
    if (!this.canRedo) return null;

    const entry = this._redoStack.pop();
    this._undoStack.push(entry);
    this._notify('redo', entry);
    return entry;
  }

  undoGroup(groupId: string) {
    const entries = [];
    while (this._undoStack.length > 0 && this._undoStack[this._undoStack.length - 1].groupId === groupId) {
      entries.push(this.undo());
    }
    return entries;
  }

  startGroup() {
    this._groupId = `group-${Date.now()}`;
    return this._groupId;
  }

  endGroup() {
    this._groupId = null;
  }

  get canUndo() {
    return this._undoStack.length > 0;
  }

  get canRedo() {
    return this._redoStack.length > 0;
  }

  get undoCount() {
    return this._undoStack.length;
  }

  get redoCount() {
    return this._redoStack.length;
  }

  getUndoStack() {
    return [...this._undoStack];
  }

  getRedoStack() {
    return [...this._redoStack];
  }

  clear() {
    this._undoStack = [];
    this._redoStack = [];
    this._notify('clear', null);
  }

  subscribe(listener: (action: string, entry: Record<string, unknown> | null, state: Record<string, unknown>) => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(action: string, entry: Record<string, unknown> | null) {
    this._listeners.forEach((l: (action: string, entry: Record<string, unknown> | null, state: Record<string, unknown>) => void) => l(action, entry, {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoCount: this.undoCount,
      redoCount: this.redoCount
    }));
  }

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      undoCount: this.undoCount,
      redoCount: this.redoCount,
      canUndo: this.canUndo,
      canRedo: this.canRedo
    };
  }

  healthCheck() {
    return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
  }
}

export function createHistory(options: { maxSize?: number } = {}) {
  return new EditHistory(options);
}

export function renderUndoRedoButtons(history: EditHistory, options: { cssPrefix?: string } = {}) {
  const p = options.cssPrefix || 'tbl-';

  return `
    <div class="${p}history-buttons">
      <button class="${p}history-btn ${p}undo-btn" 
              data-action="undo" 
              ${!history.canUndo ? 'disabled' : ''}
              title="Desfazer (Ctrl+Z)">
        ↶ Desfazer ${history.undoCount > 0 ? `(${history.undoCount})` : ''}
      </button>
      <button class="${p}history-btn ${p}redo-btn" 
              data-action="redo" 
              ${!history.canRedo ? 'disabled' : ''}
              title="Refazer (Ctrl+Y)">
        ↷ Refazer ${history.redoCount > 0 ? `(${history.redoCount})` : ''}
      </button>
    </div>
  `;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { createHistory, renderUndoRedoButtons, info, healthCheck, VERSION, MODULE_ID };
