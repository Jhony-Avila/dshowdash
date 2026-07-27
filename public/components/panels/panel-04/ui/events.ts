

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04-ui-events
// PURPOSE: Panel 04 - UI Events Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setup() — exported function
//   init() — exported function
//   destroy() — exported function
//   getListenerCount() — exported function
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

export const MODULE_ID = 'panel-04-ui-events';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _container: HTMLElement | null = null;
let _handlers: Record<string, Function> = {};
let _boundListeners: Array<{ element: HTMLElement; event: string; handler: Function; options?: Record<string, unknown> }> = [];
let _debounceTimers = new Map();

function _addListener(el: HTMLElement | Document, event: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions) {
  if (!el) return;
  el.addEventListener(event, handler, options);
  _boundListeners.push({ element: el as HTMLElement, event, handler: handler as Function, options: options as Record<string, unknown> });
}

function _debounce(key: string, fn: () => void, delay = 300) {
  if (_debounceTimers.has(key)) {
    clearTimeout(_debounceTimers.get(key));
  }
  const timerId = setTimeout(() => {
    fn();
    _debounceTimers.delete(key);
  }, delay);
  _debounceTimers.set(key, timerId);
}

// ══════════════════════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════════════════════

export function setup(container: HTMLElement, handlers: Record<string, Function> = {}) {
  if (!container) return;
  
  destroy();
  
  _container = container;
  _handlers = handlers;
  
  _setupRefresh();
  _setupFilters();
  _setupSearch();
  _setupPagination();
  _setupRowActions();
  _setupBulkActions();
  _setupSorting();
  _setupExport();
  _setupKeyboard();
  _setupClickOutside();
}

export function init(container: HTMLElement, handlers: Record<string, Function>) {
  setup(container, handlers);
}

// ══════════════════════════════════════════════════════════════
// REFRESH
// ══════════════════════════════════════════════════════════════

function _setupRefresh() {
  const btn = _container!.querySelector('[data-action="refresh"]');
  if (!btn) return;
  
  _addListener(btn as HTMLElement, 'click', (e) => {
    e.preventDefault();
    btn.classList.add('p04-spinning');
    if (_handlers.refresh) {
      Promise.resolve(_handlers.refresh()).finally(() => {
        setTimeout(() => btn.classList.remove('p04-spinning'), 500);
      });
    } else {
      setTimeout(() => btn.classList.remove('p04-spinning'), 500);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// FILTERS
// ══════════════════════════════════════════════════════════════

function _setupFilters() {
  const selects = _container!.querySelectorAll('[data-filter]');
  selects.forEach(select => {
    _addListener(select as HTMLElement, 'change', () => {
      const filterName = (select as HTMLElement).dataset.filter;
      const value = (select as HTMLInputElement).value;
      if (_handlers.setFilter) _handlers.setFilter(filterName, value);
    });
  });
  
  const clearBtn = _container!.querySelector('[data-action="clear-filters"]');
  if (clearBtn) {
    _addListener(clearBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.clearFilters) _handlers.clearFilters();
    });
  }
}

// ══════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════

function _setupSearch() {
  const input = _container!.querySelector('[data-action="search"]');
  if (!input) return;
  
  _addListener(input as HTMLElement, 'input', (e) => {
    const query = (e as InputEvent & { target: HTMLInputElement }).target.value;
    _debounce('search', () => {
      if (_handlers.search) _handlers.search(query);
    }, 300);
  });

  _addListener(input as HTMLElement, 'keydown', (e) => {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Escape') {
      (ke.target as HTMLInputElement).value = '';
      if (_handlers.search) _handlers.search('');
    }
  });
}

// ══════════════════════════════════════════════════════════════
// PAGINATION
// ══════════════════════════════════════════════════════════════

function _setupPagination() {
  const prevBtn = _container!.querySelector('[data-action="prev-page"]');
  const nextBtn = _container!.querySelector('[data-action="next-page"]');
  const pageSelect = _container!.querySelector('[data-action="goto-page"]');
  const perPageSelect = _container!.querySelector('[data-action="per-page"]');
  
  if (prevBtn) {
    _addListener(prevBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.prevPage) _handlers.prevPage();
    });
  }
  
  if (nextBtn) {
    _addListener(nextBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.nextPage) _handlers.nextPage();
    });
  }
  
  if (pageSelect) {
    _addListener(pageSelect as HTMLElement, 'change', () => {
      const page = parseInt((pageSelect as HTMLInputElement).value, 10);
      if (_handlers.gotoPage && !isNaN(page)) _handlers.gotoPage(page);
    });
  }

  if (perPageSelect) {
    _addListener(perPageSelect as HTMLElement, 'change', () => {
      const perPage = parseInt((perPageSelect as HTMLInputElement).value, 10);
      if (_handlers.setPerPage && !isNaN(perPage)) _handlers.setPerPage(perPage);
    });
  }
}

// ══════════════════════════════════════════════════════════════
// ROW ACTIONS
// ══════════════════════════════════════════════════════════════

function _setupRowActions() {
  // @ts-expect-error strict migration — TS2345
  _addListener(_container, 'click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-row-action]') as HTMLElement | null;
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const action = btn.dataset.rowAction;
    const row = btn.closest('[data-row-id]') as HTMLElement | null;
    const rowId = row?.dataset.rowId;

    if (!rowId) return;

    if (action === 'view' && _handlers.viewRow) _handlers.viewRow(rowId);
    else if (action === 'edit' && _handlers.editRow) _handlers.editRow(rowId);
    else if (action === 'delete' && _handlers.deleteRow) _handlers.deleteRow(rowId);
    else if (action === 'duplicate' && _handlers.duplicateRow) _handlers.duplicateRow(rowId);
    else if (_handlers.rowAction) _handlers.rowAction(action, rowId);
  });

  // @ts-expect-error strict migration — TS2345
  _addListener(_container, 'dblclick', (e) => {
    const row = (e.target as HTMLElement).closest('[data-row-id]') as HTMLElement | null;
    if (!row) return;
    const rowId = row.dataset.rowId;
    if (_handlers.viewRow) _handlers.viewRow(rowId);
  });
}

// ══════════════════════════════════════════════════════════════
// BULK ACTIONS
// ══════════════════════════════════════════════════════════════

function _setupBulkActions() {
  const selectAllCb = _container!.querySelector('[data-action="select-all"]') as HTMLInputElement | null;
  if (selectAllCb) {
    _addListener(selectAllCb, 'change', () => {
      if (selectAllCb.checked) {
        if (_handlers.selectAll) _handlers.selectAll();
      } else {
        if (_handlers.deselectAll) _handlers.deselectAll();
      }
    });
  }

  // @ts-expect-error strict migration — TS2345
  _addListener(_container, 'change', (e) => {
    const cb = (e.target as HTMLElement).closest('[data-action="select-row"]') as HTMLInputElement | null;
    if (!cb) return;
    const row = cb.closest('[data-row-id]') as HTMLElement | null;
    const rowId = row?.dataset.rowId;
    if (rowId && _handlers.toggleRowSelection) {
      _handlers.toggleRowSelection(rowId, cb.checked);
    }
  });
  
  const bulkDeleteBtn = _container!.querySelector('[data-action="bulk-delete"]');
  if (bulkDeleteBtn) {
    _addListener(bulkDeleteBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.bulkDelete) _handlers.bulkDelete();
    });
  }
  
  const bulkExportBtn = _container!.querySelector('[data-action="bulk-export"]');
  if (bulkExportBtn) {
    _addListener(bulkExportBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.bulkExport) _handlers.bulkExport();
    });
  }
}

// ══════════════════════════════════════════════════════════════
// SORTING
// ══════════════════════════════════════════════════════════════

function _setupSorting() {
  const headers = _container!.querySelectorAll('[data-sort]');
  headers.forEach(header => {
    _addListener(header as HTMLElement, 'click', () => {
      const column = (header as HTMLElement).dataset.sort;
      if (_handlers.sort) _handlers.sort(column);
    });
  });
}

// ══════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════

function _setupExport() {
  const exportCsvBtn = _container!.querySelector('[data-action="export-csv"]');
  if (exportCsvBtn) {
    _addListener(exportCsvBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.exportCsv) _handlers.exportCsv();
    });
  }
  
  const exportJsonBtn = _container!.querySelector('[data-action="export-json"]');
  if (exportJsonBtn) {
    _addListener(exportJsonBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.exportJson) _handlers.exportJson();
    });
  }
  
  const printBtn = _container!.querySelector('[data-action="print"]');
  if (printBtn) {
    _addListener(printBtn as HTMLElement, 'click', (e) => {
      e.preventDefault();
      if (_handlers.print) _handlers.print();
    });
  }
}

// ══════════════════════════════════════════════════════════════
// KEYBOARD
// ══════════════════════════════════════════════════════════════

function _setupKeyboard() {
  // @ts-expect-error strict migration — TS2345
  _addListener(_container, 'keydown', (e) => {
    const ke = e as KeyboardEvent;
    if ((ke.target as HTMLElement).matches('input, textarea, select')) return;

    if (ke.key === 'r' && !ke.ctrlKey && !ke.metaKey) {
      ke.preventDefault();
      if (_handlers.refresh) _handlers.refresh();
    }

    if (ke.key === '/' && !ke.ctrlKey && !ke.metaKey) {
      ke.preventDefault();
      const searchInput = _container!.querySelector('[data-action="search"]');
      if (searchInput) (searchInput as HTMLElement).focus();
    }

    if (ke.key === 'Escape') {
      if (_handlers.clearSelection) _handlers.clearSelection();
    }
  });
}

// ══════════════════════════════════════════════════════════════
// CLICK OUTSIDE
// ══════════════════════════════════════════════════════════════

function _setupClickOutside() {
  _addListener(document, 'click', (e) => {
    const dropdowns = _container!.querySelectorAll('.p04-dropdown--open');
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target as Node)) {
        dropdown.classList.remove('p04-dropdown--open');
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
// DESTROY
// ══════════════════════════════════════════════════════════════

export function destroy() {
  _boundListeners.forEach(item => {
    if (item.element?.removeEventListener) {
      item.element.removeEventListener(item.event, item.handler as EventListener, item.options as EventListenerOptions);
    }
  });
  _boundListeners = [];
  
  _debounceTimers.forEach(timerId => clearTimeout(timerId));
  _debounceTimers.clear();
  
  _container = null;
  _handlers = {};
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function getListenerCount() {
  return _boundListeners.length;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    listenerCount: _boundListeners.length,
    hasContainer: _container !== null,
    handlerCount: Object.keys(_handlers).length
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      containerBound: _container !== null,
      handlersReady: Object.keys(_handlers).length > 0,
      listenersActive: _boundListeners.length > 0
    }
  };
}

// ══════════════════════════════════════════════════════════════
// UI STATE UPDATERS
// ══════════════════════════════════════════════════════════════

/** Updates period button active state in container */
export function updatePeriodUI(container: HTMLElement, period: string): void {
  if (!container) return;
  container.querySelectorAll('[data-period]').forEach(btn => {
    const el = btn as HTMLElement;
    el.classList.toggle('p04-active', el.dataset.period === period);
  });
}

/** Updates view mode toggle active state in container */
export function updateViewModeUI(container: HTMLElement, mode: string): void {
  if (!container) return;
  container.querySelectorAll('[data-view-mode]').forEach(btn => {
    const el = btn as HTMLElement;
    el.classList.toggle('p04-active', el.dataset.viewMode === mode);
  });
}

/** Updates filter UI: active severity badge + search input value */
export function updateFilterUI(container: HTMLElement, severity: string, filterText: string): void {
  if (!container) return;
  container.querySelectorAll('[data-severity-filter]').forEach(btn => {
    const el = btn as HTMLElement;
    el.classList.toggle('p04-active', el.dataset.severityFilter === severity);
  });
  const searchInput = container.querySelector('[data-filter]') as HTMLInputElement | null;
  if (searchInput && searchInput.value !== (filterText || '')) {
    searchInput.value = filterText || '';
  }
}

/** Updates sort indicator classes on column headers */
export function updateSortIndicators(container: HTMLElement, column: string, order: string): void {
  if (!container) return;
  container.querySelectorAll('[data-sort-col]').forEach(th => {
    const el = th as HTMLElement;
    el.classList.remove('p04-sort-asc', 'p04-sort-desc');
    if (el.dataset.sortCol === column) {
      el.classList.add(order === 'asc' ? 'p04-sort-asc' : 'p04-sort-desc');
    }
  });
}

/** Updates sound toggle button active state */
export function updateSoundToggle(container: HTMLElement, enabled: boolean): void {
  if (!container) return;
  const btn = container.querySelector('[data-action="toggle-sound"]') as HTMLElement | null;
  if (btn) {
    btn.classList.toggle('p04-active', enabled);
    btn.setAttribute('aria-pressed', String(enabled));
  }
}

// ══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY ALIASES
// ══════════════════════════════════════════════════════════════

/** @alias setup — backward compat export */
export const bindEvents = setup;

export default {
  MODULE_ID,
  VERSION,
  setup,
  init,
  destroy,
  getListenerCount,
  info,
  healthCheck,
  updatePeriodUI,
  updateViewModeUI,
  updateFilterUI,
  updateSortIndicators,
  updateSoundToggle
};
