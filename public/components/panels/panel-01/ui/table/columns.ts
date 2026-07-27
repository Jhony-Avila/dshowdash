// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/columns
// PURPOSE: Panel-01 Columns Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   COLUMNS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { COLUMNS } from './constants.js';
import * as Storage from '../../utils/storage.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/columns';

export class ColumnsManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.columns = options.columns || [...COLUMNS];
    this.onColumnsChange = options.onColumnsChange || (() => {});
    this._dropdown = null;
    this._visible = false;
    this._abortController = null;
  }

  init() {
    const saved = Storage.getColumns();
    if (saved) {
      const savedMap = saved as Record<string, boolean>;
      this.columns = this.columns.map((col: Record<string, unknown>) => ({
        ...col,
        visible: savedMap[col.id as string] !== undefined ? savedMap[col.id as string] : col.visible
      }));
    }
  }

  toggle(columnId: string) {
    const col = this.columns.find((c: Record<string, unknown>) => c.id === columnId);
    if (col && col.id !== 'select' && col.id !== 'actions') {
      col.visible = !col.visible;
      this._save();
      this.onColumnsChange(this.columns);
    }
  }

  setVisible(columnId: string, visible: boolean) {
    const col = this.columns.find((c: Record<string, unknown>) => c.id === columnId);
    if (col) {
      col.visible = visible;
      this._save();
      this.onColumnsChange(this.columns);
    }
  }

  getVisible() {
    return this.columns.filter((c: Record<string, unknown>) => c.visible);
  }

  getAll() {
    return this.columns;
  }

  reset() {
    this.columns = this.columns.map((col: Record<string, unknown>) => ({
      ...col,
      visible: (COLUMNS as Record<string, unknown>[]).find((c: Record<string, unknown>) => c.id === col.id)?.visible ?? true
    }));
    this._save();
    this.onColumnsChange(this.columns);
  }

  _save() {
    const state: Record<string, boolean> = {};
    this.columns.forEach((c: Record<string, unknown>) => { state[c.id as string] = c.visible as boolean; });
    Storage.setColumns(state as unknown as unknown[]);
  }

  renderDropdown(container: HTMLElement) {
    if (!container) return;

    const toggleable = this.columns.filter((c: Record<string, unknown>) => c.id !== 'select' && c.id !== 'actions');
    
    container.innerHTML = `
      <div class="p01-columns-dropdown">
        <button class="p01-control-btn" data-action="toggle-columns" title="Colunas">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <div class="p01-columns-menu">
          <div class="p01-columns-menu-header">Colunas visíveis</div>
          ${(toggleable as Record<string, unknown>[]).map((col: Record<string, unknown>) => `
            <label class="p01-columns-item">
              <input type="checkbox" ${col.visible ? 'checked' : ''} data-column="${col.id}">
              <span>${col.label}</span>
            </label>
          `).join('')}
          <div class="p01-columns-menu-footer">
            <button class="p01-btn p01-btn--sm p01-btn--ghost" data-action="reset-columns">Restaurar</button>
          </div>
        </div>
      </div>
    `;
    
    this._dropdown = container.querySelector('.p01-columns-menu');
    if (this._abortController) this._abortController.abort();
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    container.querySelector('[data-action="toggle-columns"]')?.addEventListener('click', () => {
      this._toggleDropdown();
    }, { signal });

    container.querySelectorAll('[data-column]').forEach((cb: Element) => {
      cb.addEventListener('change', () => this.toggle((cb as HTMLElement).dataset.column!), { signal });
    });

    container.querySelector('[data-action="reset-columns"]')?.addEventListener('click', () => {
      this.reset();
      this._updateCheckboxes(container);
    }, { signal });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) this._hideDropdown();
    }, { signal });
  }

  _toggleDropdown() {
    this._visible = !this._visible;
    this._dropdown?.classList.toggle('open', this._visible);
  }

  _hideDropdown() {
    this._visible = false;
    this._dropdown?.classList.remove('open');
  }

  _updateCheckboxes(container: HTMLElement) {
    this.columns.forEach((col: Record<string, unknown>) => {
      const cb = container.querySelector(`[data-column="${col.id}"]`) as HTMLInputElement | null;
      if (cb) cb.checked = col.visible as boolean;
    });
  }

  destroy() {
    if (this._abortController) { this._abortController.abort(); this._abortController = null; }
    this._dropdown = null;
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default ColumnsManager;
