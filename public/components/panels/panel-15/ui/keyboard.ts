// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15/ui/keyboard
// PURPOSE: Panel-15 Keyboard Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-15/ui/keyboard';

export class KeyboardNavigation {
  [key: string]: any; constructor(container: HTMLElement, options: Record<string, unknown> = {}) { this.container = container; this.onRowSelect = options.onRowSelect || (() => {}); this.onRowActivate = options.onRowActivate || (() => {}); this.currentIndex = -1; this._keyHandler = null; this.enabled = true; } init() { this._keyHandler = (e: KeyboardEvent) => { if (!this.enabled) return; const tbody = this.container.querySelector('.p15-tbody'); if (!tbody) return; const rows = Array.from(tbody.querySelectorAll('tr[data-job-id]')) as Element[]; if (!rows.length) return; switch (e.key) { case 'ArrowDown': e.preventDefault(); this.navigate(rows, 1); break; case 'ArrowUp': e.preventDefault(); this.navigate(rows, -1); break; case 'Enter': e.preventDefault(); if (this.currentIndex >= 0 && rows[this.currentIndex]) { this.onRowActivate(rows[this.currentIndex]); } break; case 'Escape': this.clearSelection(rows); break; case 'Home': e.preventDefault(); this.goTo(rows, 0); break; case 'End': e.preventDefault(); this.goTo(rows, rows.length - 1); break; } }; this.container.setAttribute('tabindex', '0'); this.container.addEventListener('keydown', this._keyHandler); } navigate(rows: Element[], direction: number) { const newIndex = this.currentIndex + direction; if (newIndex >= 0 && newIndex < rows.length) { this.goTo(rows, newIndex); } } goTo(rows: Element[], index: number) { rows.forEach((r: Element) => (r as HTMLElement).classList.remove('p15-row-selected')); this.currentIndex = index; const row = rows[index]; if (row) { (row as HTMLElement).classList.add('p15-row-selected'); (row as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); this.onRowSelect(row); } } clearSelection(rows: Element[]) { rows.forEach((r: Element) => (r as HTMLElement).classList.remove('p15-row-selected')); this.currentIndex = -1; } reset() { this.currentIndex = -1; } destroy() { if (this._keyHandler) { this.container.removeEventListener('keydown', this._keyHandler); } this.container.removeAttribute('tabindex'); } }

export default KeyboardNavigation;
