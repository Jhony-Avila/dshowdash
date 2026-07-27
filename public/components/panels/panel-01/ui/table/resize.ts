// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/resize
// PURPOSE: Panel-01 - Resize de Colunas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createColumnResize() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'mousedown'
//   'mousemove'
//   'mouseup'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/resize';

export class ColumnResize {
  [key: string]: any;
  constructor(tableEl: HTMLElement, options: Record<string, unknown> = {}) {
    this.table = tableEl;
    this.onResize = options.onResize || (() => {});
    this.minWidth = options.minWidth || 50;
    this.maxWidth = options.maxWidth || 500;
    this._resizing = false;
    this._startX = 0;
    this._startWidth = 0;
    this._currentTh = null;
    this._abortController = null;
  }

  init() {
    if (!this.table) return;
    this._abortController = new AbortController();
    const signal = this._abortController.signal;
    const headers = this.table.querySelectorAll('th[data-resizable="true"]');
    headers.forEach((th: Element) => {
      const thEl = th as HTMLElement;
      const handle = document.createElement('div');
      handle.className = 'p01-resize-handle';
      handle.addEventListener('mousedown', (e) => this._onMouseDown(e as MouseEvent, thEl), { signal });
      thEl.style.position = 'relative';
      thEl.appendChild(handle);
    });
    document.addEventListener('mousemove', (e: MouseEvent) => this._onMouseMove(e), { signal });
    document.addEventListener('mouseup', () => this._onMouseUp(), { signal });
  }

  _onMouseDown(e: MouseEvent, th: HTMLElement) {
    e.preventDefault();
    this._resizing = true;
    this._currentTh = th;
    this._startX = e.pageX;
    this._startWidth = th.offsetWidth;
    th.classList.add('p01-resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  _onMouseMove(e: MouseEvent) {
    if (!this._resizing || !this._currentTh) return;
    const diff = e.pageX - this._startX;
    const newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this._startWidth + diff));
    this._currentTh.style.width = `${newWidth}px`;
    this._currentTh.style.minWidth = `${newWidth}px`;
  }

  _onMouseUp() {
    if (!this._resizing) return;
    this._resizing = false;
    if (this._currentTh) {
      this._currentTh.classList.remove('p01-resizing');
      const colId = this._currentTh.dataset.column;
      const width = this._currentTh.offsetWidth;
      this.onResize(colId, width);
    }
    this._currentTh = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  setWidth(colId: string, width: number) {
    const th = this.table.querySelector(`th[data-column="${colId}"]`);
    if (th) { th.style.width = `${width}px`; th.style.minWidth = `${width}px`; }
  }

  getWidths() {
    const widths: Record<string, number> = {};
    this.table.querySelectorAll('th[data-column]').forEach((th: Element) => {
      const thEl = th as HTMLElement;
      if (thEl.dataset.column) widths[thEl.dataset.column] = thEl.offsetWidth;
    });
    return widths;
  }

  destroy() { if (this._abortController) { this._abortController.abort(); this._abortController = null; } this._resizing = false; this._currentTh = null; }
}

export function createColumnResize(table: HTMLElement, options: Record<string, unknown> = {}) { return new ColumnResize(table, options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { ColumnResize, createColumnResize };
