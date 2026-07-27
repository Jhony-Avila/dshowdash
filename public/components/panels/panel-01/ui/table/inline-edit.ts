// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/inline-edit
// PURPOSE: Panel-01 - Inline Editing
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
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/inline-edit';

export class InlineEditor {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.editableFields = options.editableFields || ['descricao', 'observacao'];
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this._activeCell = null;
    this._originalValue = null;
  }

  canEdit(field: string) { return (this.editableFields as string[]).includes(field); }

  startEdit(cell: HTMLElement) {
    if (this._activeCell) this.cancel();
    const field = cell.dataset.field;
    // @ts-expect-error strict migration — TS2345
    if (!this.canEdit(field)) return false;
    this._activeCell = cell;
    this._originalValue = cell.textContent.trim();
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'p01-inline-input';
    input.value = this._originalValue;
    input.addEventListener('keydown', (e) => this._onKeyDown(e));
    input.addEventListener('blur', () => this.save());
    cell.innerHTML = '';
    cell.appendChild(input);
    cell.classList.add('p01-editing');
    input.focus();
    input.select();
    return true;
  }

  _onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); this.save(); }
    else if (e.key === 'Escape') { e.preventDefault(); this.cancel(); }
    else if (e.key === 'Tab') { this.save(); }
  }

  save() {
    if (!this._activeCell) return;
    const input = this._activeCell.querySelector('input');
    const newValue = input ? input.value.trim() : this._originalValue;
    const field = this._activeCell.dataset.field;
    const rowId = this._activeCell.closest('tr')?.dataset.id;
    this._activeCell.classList.remove('p01-editing');
    this._activeCell.textContent = newValue;
    if (newValue !== this._originalValue) {
      this._activeCell.classList.add('p01-edited');
      this.onSave({ rowId, field, oldValue: this._originalValue, newValue });
    }
    this._activeCell = null;
    this._originalValue = null;
  }

  cancel() {
    if (!this._activeCell) return;
    this._activeCell.classList.remove('p01-editing');
    this._activeCell.textContent = this._originalValue;
    this.onCancel();
    this._activeCell = null;
    this._originalValue = null;
  }

  isEditing() { return this._activeCell !== null; }
  getActiveCell() { return this._activeCell; }
}

export function createInlineEditor(options: Record<string, unknown> = {}) { return new InlineEditor(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { InlineEditor, createInlineEditor };
