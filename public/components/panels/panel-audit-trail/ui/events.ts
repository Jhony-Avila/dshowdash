

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P22-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-events
// PURPOSE: Panel Audit Trail - Events Enterprise AAA Ultimate+
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   destroy() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════

'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-audit-trail-events';

let _container: HTMLElement | null = null;
let _handlers: Record<string, ((...args: unknown[]) => void) | undefined> = {};
let _abortController: AbortController | null = null;
let _searchTimeout: ReturnType<typeof setTimeout> | null = null;

export function init(container: Element | null, handlers: Record<string, unknown> = {}) {
  if (!container) return { ok: false, error: 'Container required' };
  
  // Idempotent: destroy previous if exists
  if (_abortController) destroy();
  
  _container = container as HTMLElement;
  _handlers = handlers as Record<string, ((...args: unknown[]) => void) | undefined>;
  _abortController = new AbortController();
  
  _attachListeners();
  _setupKeyboardShortcuts();
  _setupClickOutside();
  
  return { ok: true };
}

export function destroy() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
  if (_searchTimeout) clearTimeout(_searchTimeout);
  _container = null;
  _handlers = {};
}

function _attachListeners() {
  const signal = _abortController!.signal;
  
  _container!.addEventListener('click', _handleClick, { signal });
  _container!.addEventListener('change', _handleChange, { signal });
  _container!.addEventListener('input', _handleInput, { signal });
}

function _setupClickOutside() {
  const signal = _abortController!.signal;
  
  document.addEventListener('click', (e) => {
    const columnsMenu = _container?.querySelector('[data-columns-menu]');
    const columnsBtn = _container?.querySelector('[data-action="toggle-columns"]');
    if (columnsMenu?.classList.contains('open') && !columnsMenu.contains(e.target as Node) && !columnsBtn?.contains(e.target as Node)) {
      columnsMenu.classList.remove('open');
      columnsBtn?.classList.remove('active');
    }
    
    const exportMenu = _container?.querySelector('[data-export-menu]');
    const exportBtn = _container?.querySelector('[data-action="toggle-export-menu"]');
    if (exportMenu?.classList.contains('open') && !exportMenu.contains(e.target as Node) && !exportBtn?.contains(e.target as Node)) {
      exportMenu.classList.remove('open');
      exportBtn?.classList.remove('active');
    }
  }, { signal });
}

function _setupKeyboardShortcuts() {
  const signal = _abortController!.signal;
  
  document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement?.tagName;
    // @ts-expect-error strict migration — TS2345
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);
    
    if (isInputFocused) {
      if (e.key === '/') {
        const searchInput = _container?.querySelector('[data-filter="search"]');
        if (searchInput && document.activeElement !== searchInput) {
          e.preventDefault();
          (searchInput as HTMLElement).focus();
        }
      }
      if (e.key === 'Escape') (document.activeElement as any)?.blur();
      return;
    }
    
    switch (e.key.toLowerCase()) {
      case '/':
        e.preventDefault();
        (_container?.querySelector('[data-filter="search"]') as HTMLElement | undefined)?.focus();
        break;
      case 'r':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); _handlers.onRefresh?.(); }
        break;
      case 'a':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); _handlers.onToggleAutoRefresh?.(); }
        break;
      case 'p':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); _handlers.onPrint?.(); }
        break;
      case 'f':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); _handlers.onFullscreen?.(); }
        break;
      case 'e':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); _toggleExportMenu(); }
        break;
      case 'g':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); _focusGroupSelect(); }
        break;
      case 'i':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); _handlers.onToggleInlineFilters?.(); }
        break;
      case 'escape':
        if (_container?.classList.contains('fullscreen')) _handlers.onFullscreen?.();
        _handlers.onClearSelection?.();
        _closeAllMenus();
        break;
      case '1': _handlers.onDensityChange?.('compact'); break;
      case '2': _handlers.onDensityChange?.('normal'); break;
      case '3': _handlers.onDensityChange?.('comfortable'); break;
      case 'arrowleft':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); _handlers.onPrevPage?.(); }
        break;
      case 'arrowright':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); _handlers.onNextPage?.(); }
        break;
    }
  }, { signal });
}

function _toggleExportMenu() {
  const menu = _container?.querySelector('[data-export-menu]');
  const btn = _container?.querySelector('[data-action="toggle-export-menu"]');
  if (menu) {
    const isOpen = menu.classList.toggle('open');
    btn?.classList.toggle('active', isOpen);
  }
}

function _focusGroupSelect() {
  (_container?.querySelector('[data-action="group-by"]') as HTMLElement | undefined)?.focus();
}

function _closeAllMenus() {
  _container?.querySelector('[data-columns-menu]')?.classList.remove('open');
  _container?.querySelector('[data-export-menu]')?.classList.remove('open');
  _container?.querySelectorAll('.active[data-action]')?.forEach(btn => btn.classList.remove('active'));
}

function _handleClick(e: MouseEvent) {
  const target = e.target as Element | null;
  if (!target) return;
  
  const tabBtn = target.closest('[data-tab]') as HTMLElement | null;
  if (tabBtn) { e.preventDefault(); _handlers.onTabChange?.(tabBtn.dataset.tab); return; }

  const presetBtn = target.closest('[data-preset]') as HTMLElement | null;
  if (presetBtn) { e.preventDefault(); _handlers.onTimePreset?.(presetBtn.dataset.preset); return; }

  const densityBtn = target.closest('[data-density]') as HTMLElement | null;
  if (densityBtn) { e.preventDefault(); _handlers.onDensityChange?.(densityBtn.dataset.density); return; }

  const sortHeader = target.closest('th.sortable') as HTMLElement | null;
  if (sortHeader) { e.preventDefault(); _handlers.onSort?.(sortHeader.dataset.sortKey); return; }

  const healthItem = target.closest('[data-health]') as HTMLElement | null;
  if (healthItem) { e.preventDefault(); _handlers.onHealthFilter?.(healthItem.dataset.health); return; }

  const columnToggle = target.closest('[data-toggle-column]') as HTMLElement | null;
  if (columnToggle) {
    e.preventDefault();
    e.stopPropagation();
    columnToggle.classList.toggle('checked');
    _handlers.onColumnToggle?.(columnToggle.dataset.toggleColumn, columnToggle.classList.contains('checked'));
    return;
  }

  const expandTrigger = target.closest('[data-action="toggle-expand"]') as HTMLElement | null;
  if (expandTrigger) {
    e.preventDefault();
    e.stopPropagation();
    _handlers.onToggleExpand?.(expandTrigger.dataset.logId);
    return;
  }

  const groupHeader = target.closest('.pat-group-header') as HTMLElement | null;
  if (groupHeader) {
    e.preventDefault();
    _handlers.onToggleGroup?.(groupHeader.dataset.group);
    return;
  }

  const actionBtn = target.closest('[data-action]') as HTMLElement | null;
  if (actionBtn) {
    const action = actionBtn.dataset.action;
    const logId = actionBtn.dataset.logId;
    
    switch (action) {
      case 'refresh': _handlers.onRefresh?.(); break;
      case 'print': _handlers.onPrint?.(); break;
      case 'fullscreen': _handlers.onFullscreen?.(); break;
      case 'toggle-auto-refresh': _handlers.onToggleAutoRefresh?.(); break;
      case 'apply-filters': _handlers.onApplyFilters?.(); break;
      case 'clear-filters': _handlers.onClearFilters?.(); break;
      case 'prev': _handlers.onPrevPage?.(); break;
      case 'next': _handlers.onNextPage?.(); break;
      case 'show-details': _handlers.onShowDetails?.(logId); break;
      case 'toggle-columns': _toggleColumnsMenu(actionBtn); break;
      case 'toggle-inline-filters':
        _handlers.onToggleInlineFilters?.();
        actionBtn.classList.toggle('active');
        break;
      case 'toggle-export-menu': _toggleExportMenu(); break;
      case 'export-csv': _handlers.onExportCSV?.(); _closeAllMenus(); break;
      case 'export-json': _handlers.onExportJSON?.(); _closeAllMenus(); break;
      case 'export-clipboard': _handlers.onExportClipboard?.(); _closeAllMenus(); break;
      case 'bulk-export': _handlers.onBulkExport?.(); break;
      case 'bulk-copy': _handlers.onBulkCopy?.(); break;
      case 'bulk-clear': _handlers.onClearSelection?.(); break;
      case 'copy-log': _handlers.onCopyLog?.(logId); break;
    }
    return;
  }
  
  const row = target.closest('[data-log-id]') as HTMLElement | null;
  if (row && !target.closest('button') && !target.closest('input[type="checkbox"]') && !target.closest('.pat-expand-trigger')) {
    if (e.ctrlKey || e.metaKey) {
      _handlers.onRowToggleSelect?.(row.dataset.logId);
    } else {
      _handlers.onRowClick?.(row.dataset.logId);
    }
    return;
  }
}

function _toggleColumnsMenu(btn: Element) {
  const menu = _container?.querySelector('[data-columns-menu]');
  if (menu) {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
  }
}

function _handleChange(e: Event) {
  const target = e.target as HTMLElement & { dataset: DOMStringMap; value: string; checked: boolean } | null;
  if (!target) return;

  if (target.matches('[data-filter]')) {
    _handlers.onFilterChange?.(target.dataset.filter, target.value);
    return;
  }

  if (target.matches('[data-action="group-by"]')) {
    _handlers.onGroupBy?.(target.value);
    return;
  }

  if (target.matches('[data-action="select-all"]')) {
    _handlers.onSelectAll?.(target.checked);
    return;
  }

  if (target.matches('[data-row-select]')) {
    _handlers.onRowSelect?.(target.dataset.rowSelect, target.checked);
    return;
  }

  if (target.matches('select[data-inline-filter]')) {
    _handlers.onInlineFilter?.(target.dataset.inlineFilter, target.value);
    return;
  }
}

function _handleInput(e: Event) {
  const target = e.target as HTMLElement & { dataset: DOMStringMap; value: string } | null;
  if (!target) return;

  if (target.matches('[data-filter="search"]')) {
    if (_searchTimeout) clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
      _handlers.onFilterChange?.('search', target.value);
    }, 300);
    return;
  }

  if (target.matches('input[data-inline-filter]')) {
    if (_searchTimeout) clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
      _handlers.onInlineFilter?.(target.dataset.inlineFilter, target.value);
    }, 300);
    return;
  }
}

export function getVersion() { return VERSION; }

export function healthCheck() {
  return { status: _abortController ? 'HEALTHY' : 'UNHEALTHY', moduleId: MODULE_ID, version: VERSION, p22Compliant: true, abortControllerActive: !!_abortController, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, p22Compliant: true, hasContainer: !!_container, abortControllerActive: !!_abortController, timestamp: Date.now() };
}

export default { VERSION, MODULE_ID, init, destroy, getVersion, healthCheck, info };
