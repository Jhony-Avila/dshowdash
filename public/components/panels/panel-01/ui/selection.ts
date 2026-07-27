// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/selection
// PURPOSE: Panel-01 Selection Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
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
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/selection';

export class SelectionManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.selected = new Set();
    this.onSelectionChange = options.onSelectionChange || (() => {});
  }

  toggle(id: string | number) {
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this._notify();
  }

  select(id: string | number) { this.selected.add(id); this._notify(); }
  deselect(id: string | number) { this.selected.delete(id); this._notify(); }

  selectAll(ids: (string | number)[]) {
    ids.forEach((id: string | number) => this.selected.add(id));
    this._notify();
  }

  deselectAll() {
    this.selected.clear();
    this._notify();
  }

  isSelected(id: string | number) { return this.selected.has(id); }
  getSelected() { return Array.from(this.selected); }
  count() { return this.selected.size; }

  _notify() {
    this.onSelectionChange({
      selected: this.getSelected(),
      count: this.count()
    });
  }

  destroy() { this.selected.clear(); }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default SelectionManager;
