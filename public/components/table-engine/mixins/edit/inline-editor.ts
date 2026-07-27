// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:inline-editor
// PURPOSE: Table Engine - Inline Editor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createInlineEditor() — exported function
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
export const MODULE_ID = 'table-engine:inline-editor';

class InlineEditor {
  [key: string]: any;
  constructor(options: { cssPrefix?: string; onSave?: ((change: Record<string, unknown>) => void) | null; onCancel?: ((change: Record<string, unknown>) => void) | null; validators?: Record<string, unknown> } = {}) {
    this._container = null;
    this._currentCell = null;
    this._currentRow = null;
    this._currentColumn = null;
    this._originalValue = null;
    this._isEditing = false;
    this._cssPrefix = options.cssPrefix || 'tbl-';
    this._onSave = options.onSave || null;
    this._onCancel = options.onCancel || null;
    this._validators = options.validators || {};
    this._abortController = null;
  }

  init(container: HTMLElement) {
    this._container = container;
    this._bindEvents();
    return this;
  }

  _bindEvents() {
    if (!this._container) return;

    this._container.addEventListener('dblclick', (e: Event) => this._handleDoubleClick(e));
    this._container.addEventListener('keydown', (e: KeyboardEvent) => this._handleKeydown(e));
  }

  _handleDoubleClick(e: Event) {
    const cell = (e.target as HTMLElement).closest(`.${this._cssPrefix}td`);
    if (!cell || cell.classList.contains(`${this._cssPrefix}td-checkbox`)) return;

    const row = cell.closest(`.${this._cssPrefix}tr`) as HTMLElement | null;
    if (!row) return;

    const colId = (cell as HTMLElement).dataset.col;
    const rowId = row.dataset.rowId;

    if (colId && rowId) {
      this.startEdit(cell as HTMLElement, rowId, colId);
    }
  }

  _handleKeydown(e: KeyboardEvent) {
    if (!this._isEditing) {
      if (e.key === 'Enter' || e.key === 'F2') {
        const focusedRow = this._container.querySelector(`.${this._cssPrefix}tr:focus`);
        if (focusedRow) {
          const firstEditableCell = focusedRow.querySelector(`.${this._cssPrefix}td[data-col]`);
          if (firstEditableCell) {
            this.startEdit(firstEditableCell, focusedRow.dataset.rowId, firstEditableCell.dataset.col);
            e.preventDefault();
          }
        }
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
        this.save();
        e.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        e.preventDefault();
        break;
      case 'Tab':
        this.save();
        this._moveToNextCell(e.shiftKey);
        e.preventDefault();
        break;
    }
  }

  startEdit(cell: HTMLElement, rowId: string | undefined, colId: string | undefined) {
    if (this._isEditing) {
      this.save();
    }

    this._currentCell = cell;
    this._currentRow = rowId;
    this._currentColumn = colId;
    this._originalValue = cell.textContent.trim();
    this._isEditing = true;

    const p = this._cssPrefix;
    const inputHtml = this._createInputForType(colId, this._originalValue);

    cell.innerHTML = inputHtml;
    cell.classList.add(`${p}editing`);

    const input = cell.querySelector('input, select, textarea') as HTMLInputElement | null;
    if (input) {
      input.focus();
      if (input.select) input.select();
    }
  }

  _createInputForType(colId: string | undefined, value: string) {
    const p = this._cssPrefix;
    return `<input type="text" class="${p}edit-input" value="${this._escapeHtml(value)}" />`;
  }

  _escapeHtml(str: string) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  save() {
    if (!this._isEditing || !this._currentCell) return false;

    const input = this._currentCell.querySelector('input, select, textarea');
    const newValue = input ? input.value : this._originalValue;
    const p = this._cssPrefix;

    const validation = this._validate(this._currentColumn, newValue);
    if (!validation.valid) {
      // @ts-expect-error strict migration — TS2345
      this._showError(validation.message);
      return false;
    }

    this._currentCell.classList.remove(`${p}editing`);
    this._currentCell.innerHTML = this._escapeHtml(newValue);

    if (newValue !== this._originalValue) {
      this._currentCell.classList.add(`${p}dirty`);

      if (this._onSave) {
        this._onSave({
          rowId: this._currentRow,
          column: this._currentColumn,
          oldValue: this._originalValue,
          newValue
        });
      }
    }

    this._clearState();
    return true;
  }

  cancel() {
    if (!this._isEditing || !this._currentCell) return;

    const p = this._cssPrefix;
    this._currentCell.classList.remove(`${p}editing`);
    this._currentCell.innerHTML = this._escapeHtml(this._originalValue);

    if (this._onCancel) {
      this._onCancel({
        rowId: this._currentRow,
        column: this._currentColumn,
        value: this._originalValue
      });
    }

    this._clearState();
  }

  _validate(column: string, value: string) {
    const validator = this._validators[column];
    if (!validator) return { valid: true };

    if (typeof validator === 'function') {
      const result = validator(value);
      if (typeof result === 'string') return { valid: false, message: result };
      if (result === false) return { valid: false, message: 'Valor inválido' };
      return { valid: true };
    }

    return { valid: true };
  }

  _showError(message: string) {
    const p = this._cssPrefix;
    let errorEl = this._currentCell.querySelector(`.${p}edit-error`);

    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = `${p}edit-error`;
      this._currentCell.appendChild(errorEl);
    }

    errorEl.textContent = message;
    setTimeout(() => errorEl?.remove(), 3000);
  }

  _moveToNextCell(reverse = false) {
    const cells: HTMLElement[] = Array.from(this._container.querySelectorAll(`.${this._cssPrefix}td[data-col]`));
    const currentIndex = cells.indexOf(this._currentCell);

    if (currentIndex === -1) return;

    const nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;
    const nextCell = cells[nextIndex];

    if (nextCell) {
      const row = nextCell.closest(`.${this._cssPrefix}tr`) as HTMLElement | null;
      this.startEdit(nextCell, row?.dataset.rowId, nextCell.dataset.col);
    }
  }

  _clearState() {
    this._currentCell = null;
    this._currentRow = null;
    this._currentColumn = null;
    this._originalValue = null;
    this._isEditing = false;
  }

  get isEditing() {
    return this._isEditing;
  }

  destroy() {
    this._clearState();
    this._container = null;
  }

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      isEditing: this._isEditing,
      currentCell: this._currentColumn
    };
  }

  healthCheck() {
    return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
  }
}

export function createInlineEditor(options: { cssPrefix?: string; onSave?: ((change: Record<string, unknown>) => void) | null; onCancel?: ((change: Record<string, unknown>) => void) | null; validators?: Record<string, unknown> } = {}) {
  return new InlineEditor(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { createInlineEditor, info, healthCheck, VERSION, MODULE_ID };
