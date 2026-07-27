// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/sticky
// PURPOSE: Panel-01 - Sticky Columns
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createStickyColumns() — exported function
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
export const MODULE_ID = 'panel-01/ui/table/sticky';

export class StickyColumns {
  [key: string]: any;
  constructor(tableEl: HTMLElement, options: Record<string, unknown> = {}) {
    this.table = tableEl;
    this.leftColumns = options.leftColumns || ['select', 'id'];
    this.rightColumns = options.rightColumns || ['actions'];
    this._applied = false;
  }

  apply() {
    if (!this.table || this._applied) return;
    let leftOffset = 0;
    (this.leftColumns as string[]).forEach((colId: string) => {
      const cells = this.table.querySelectorAll(`[data-column="${colId}"]`);
      cells.forEach((cell: Element) => {
        const cellEl = cell as HTMLElement;
        cellEl.classList.add('p01-sticky', 'p01-sticky--left');
        cellEl.style.left = `${leftOffset}px`;
        cellEl.style.zIndex = '2';
      });
      if (cells.length > 0) leftOffset += (cells[0] as HTMLElement).offsetWidth;
    });
    let rightOffset = 0;
    [...(this.rightColumns as string[])].reverse().forEach((colId: string) => {
      const cells = this.table.querySelectorAll(`[data-column="${colId}"]`);
      cells.forEach((cell: Element) => {
        const cellEl = cell as HTMLElement;
        cellEl.classList.add('p01-sticky', 'p01-sticky--right');
        cellEl.style.right = `${rightOffset}px`;
        cellEl.style.zIndex = '2';
      });
      if (cells.length > 0) rightOffset += (cells[0] as HTMLElement).offsetWidth;
    });
    this._applied = true;
  }

  remove() {
    if (!this.table) return;
    const stickyCells = this.table.querySelectorAll('.p01-sticky');
    stickyCells.forEach((cell: Element) => {
      const cellEl = cell as HTMLElement;
      cellEl.classList.remove('p01-sticky', 'p01-sticky--left', 'p01-sticky--right');
      cellEl.style.left = '';
      cellEl.style.right = '';
      cellEl.style.zIndex = '';
    });
    this._applied = false;
  }

  refresh() { this.remove(); this.apply(); }
  isApplied() { return this._applied; }
  setLeftColumns(cols: string[]) { this.leftColumns = cols; if (this._applied) this.refresh(); }
  setRightColumns(cols: string[]) { this.rightColumns = cols; if (this._applied) this.refresh(); }
}

export function createStickyColumns(table: HTMLElement, options: Record<string, unknown> = {}) { return new StickyColumns(table, options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { StickyColumns, createStickyColumns };
