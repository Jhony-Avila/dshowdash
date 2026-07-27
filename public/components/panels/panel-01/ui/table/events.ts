// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/events
// PURPOSE: P18EC-LOCAL: Local CustomEvent emissions for table component (bubbling, not global bridge)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TABLE_EVENTS — exported value
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
export const MODULE_ID = 'panel-01/ui/table/events';

export const TABLE_EVENTS = {
  ROW_CLICK: 'table:row:click',
  ROW_DBLCLICK: 'table:row:dblclick',
  ROW_CONTEXT: 'table:row:context',
  ROW_SELECT: 'table:row:select',
  ROW_HOVER: 'table:row:hover',
  SORT: 'table:sort',
  SELECT_ALL: 'table:select:all',
  DESELECT_ALL: 'table:select:none',
  CELL_CLICK: 'table:cell:click'
};

export class TableEventManager {
  [key: string]: any;
  constructor(container: HTMLElement | null, options: Record<string, unknown> = {}) {
    this.container = container;
    this.handlers = options.handlers || {};
    this._listeners = [];
    this._enabled = true;
  }

  init() {
    // @ts-expect-error strict migration — TS2345
    this._addListener('click', this._handleClick.bind(this));
    // @ts-expect-error strict migration — TS2345
    this._addListener('dblclick', this._handleDblClick.bind(this));
    // @ts-expect-error strict migration — TS2345
    this._addListener('contextmenu', this._handleContext.bind(this));
    this._addListener('change', this._handleChange.bind(this));
    // @ts-expect-error strict migration — TS2345
    this._addListener('mouseover', this._handleMouseOver.bind(this));
    // @ts-expect-error strict migration — TS2345
    this._addListener('keydown', this._handleKeydown.bind(this));
  }

  _addListener(event: string, handler: (e: Event) => void) {
    if (!this.container) return;
    this.container.addEventListener(event, handler);
    this._listeners.push({ event, handler });
  }

  _handleClick(e: MouseEvent) {
    if (!this._enabled) return;
    const target = e.target as Element;

    const th = target.closest('[data-sort]') as HTMLElement | null;
    if (th) {
      this._emit(TABLE_EVENTS.SORT, { field: th.dataset.sort });
      return;
    }

    const checkbox = target.closest('.p01-row-checkbox') as HTMLInputElement | null;
    if (checkbox) {
      this._emit(TABLE_EVENTS.ROW_SELECT, {
        id: (checkbox as HTMLElement).dataset.id,
        selected: checkbox.checked
      });
      return;
    }

    const selectAll = target.closest('.p01-select-all') as HTMLInputElement | null;
    if (selectAll) {
      this._emit(selectAll.checked ? TABLE_EVENTS.SELECT_ALL : TABLE_EVENTS.DESELECT_ALL);
      return;
    }

    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (actionBtn) {
      this._emit(TABLE_EVENTS.CELL_CLICK, {
        action: actionBtn.dataset.action,
        id: actionBtn.dataset.id
      });
      return;
    }

    const row = target.closest('.p01-row') as HTMLElement | null;
    if (row && !target.closest('button, input, a')) {
      this._emit(TABLE_EVENTS.ROW_CLICK, {
        id: row.dataset.id,
        index: row.dataset.index
      });
    }
  }

  _handleDblClick(e: MouseEvent) {
    if (!this._enabled) return;
    const row = (e.target as Element).closest('.p01-row') as HTMLElement | null;
    if (row) {
      this._emit(TABLE_EVENTS.ROW_DBLCLICK, { id: row.dataset.id });
    }
  }

  _handleContext(e: MouseEvent) {
    if (!this._enabled) return;
    const row = (e.target as Element).closest('.p01-row') as HTMLElement | null;
    if (row) {
      e.preventDefault();
      this._emit(TABLE_EVENTS.ROW_CONTEXT, {
        id: row.dataset.id,
        x: e.clientX,
        y: e.clientY
      });
    }
  }

  _handleChange(_e: Event) {
    if (!this._enabled) return;
    // Already handled in click
  }

  _handleMouseOver(e: MouseEvent) {
    if (!this._enabled) return;
    const row = (e.target as Element).closest('.p01-row') as HTMLElement | null;
    if (row) {
      this._emit(TABLE_EVENTS.ROW_HOVER, { id: row.dataset.id });
    }
  }

  _handleKeydown(e: KeyboardEvent) {
    if (!this._enabled) return;
    const target = e.target as Element;

    if (e.key === 'Enter') {
      const row = target.closest('.p01-row') as HTMLElement | null;
      if (row) {
        this._emit(TABLE_EVENTS.ROW_CLICK, { id: row.dataset.id });
      }
    }

    if (e.key === ' ') {
      const row = target.closest('.p01-row') as HTMLElement | null;
      if (row) {
        e.preventDefault();
        const checkbox = row.querySelector('.p01-row-checkbox');
        if (checkbox) (checkbox as HTMLElement).click();
      }
    }
  }

  // P18EC-LOCAL: Local event emission with bubbling (not global bridge)
  _emit(event: string, data: Record<string, unknown> = {}) {
    if (this.handlers[event]) {
      this.handlers[event](data);
    }
    this.container?.dispatchEvent(new CustomEvent(event, { detail: data, bubbles: true }));
  }

  on(event: string, handler: (...args: unknown[]) => void) {
    this.handlers[event] = handler;
    return this;
  }

  off(event: string) {
    delete this.handlers[event];
    return this;
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }

  destroy() {
    this._listeners.forEach(({ event, handler }: { event: string; handler: (e: Event) => void }) => {
      this.container?.removeEventListener(event, handler);
    });
    this._listeners = [];
    this.handlers = {};
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p18ECLocal: true }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, p18ECLocal: true }; }
export default { TABLE_EVENTS, TableEventManager };
