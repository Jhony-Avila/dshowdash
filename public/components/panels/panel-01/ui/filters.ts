// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/filters
// PURPOSE: Panel-01 Filters Component
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
//   'change'
//   'click'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/filters';

export class FiltersManager {
  [key: string]: any;
  constructor(container: HTMLElement, options: Record<string, unknown> = {}) {
    this.container = container;
    this.onFilterChange = options.onFilterChange || (() => {});
    this.onClear = options.onClear || (() => {});
    this._debounceTimer = null;
  }

  init() {
    if (!this.container) return;
    
    this.container.querySelectorAll('[data-filter]').forEach((el: Element) => {
      const filter = (el as HTMLInputElement).dataset.filter;
      const inputEl = el as HTMLInputElement;
      if (inputEl.tagName === 'INPUT' && inputEl.type === 'text') {
        inputEl.addEventListener('input', () => this._debounce(() => this.onFilterChange(filter, inputEl.value)));
      } else {
        inputEl.addEventListener('change', () => this.onFilterChange(filter, inputEl.value));
      }
    });

    this.container.querySelector('[data-action="clear-filters"]')?.addEventListener('click', () => {
      this.clear();
      this.onClear();
    });
  }

  _debounce(fn: () => void, delay = 400) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(fn, delay);
  }

  setValues(filters: Record<string, unknown>) {
    if (!this.container || !filters) return;
    Object.entries(filters).forEach(([key, value]) => {
      const el = this.container.querySelector(`[data-filter="${key}"]`) as HTMLInputElement | null;
      if (el) el.value = (value as string) || '';
    });
  }

  clear() {
    if (!this.container) return;
    this.container.querySelectorAll('[data-filter]').forEach((el: Element) => {
      (el as HTMLInputElement).value = '';
    });
  }

  getValues() {
    const values: Record<string, unknown> = {};
    this.container?.querySelectorAll('[data-filter]').forEach((el: Element) => {
      const inputEl = el as HTMLInputElement;
      if (inputEl.value) values[inputEl.dataset.filter as string] = inputEl.value;
    });
    return values;
  }

  hasActiveFilters() {
    return Object.keys(this.getValues()).length > 0;
  }

  destroy() {
    clearTimeout(this._debounceTimer);
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default FiltersManager;
