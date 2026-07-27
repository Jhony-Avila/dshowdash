

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-16-ui-events
// PURPOSE: Panel-16 UI Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EventBusPort from ../ports/index.js
//   handleSort from ./sorting.js
//   PANEL_16_UI_EVENTS from /core/runtime/events/catalog/panels.events.js
//
// PROVIDES:
//   bindEvents() — exported function
//   bindGlobalEvents() — exported function
//   unbindGlobalEvents() — exported function
//   bindControlsEvents() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_16_UI_EVENTS.QUICK_UPDATE
// LISTENS (eventos):
//   'change'
//   'click'
//   'contextmenu'
//   'input'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup for bindEvents/bindControlsEvents/bindGlobalEvents (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { EventBusPort } from '../ports/index.js';
import { handleSort } from './sorting.js';
import { PANEL_16_UI_EVENTS } from '/core/runtime/events/catalog/panels.events.js';

let _abortController: AbortController | null = null;
let _listenerCount = 0;

export function bindEvents(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    unbindAllEvents();
    _abortController = new AbortController();
    const signal = _abortController.signal;
    _listenerCount = 0;
    container.addEventListener('click', (e: Event) => handleClick(e, state, handlers), { signal });
    container.addEventListener('input', (e: Event) => handleInput(e, state, handlers), { signal });
    container.addEventListener('change', (e: Event) => handleChange(e, state, handlers), { signal });
    _listenerCount += 3;
}

export function bindGlobalEvents(state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const signal = _abortController ? _abortController.signal : undefined;
    const boundKeyHandler = (e: Event) => handleKeyboard(e, state, handlers);
    const boundContextHandler = (e: Event) => handleContextMenu(e, state, handlers);
    const boundClickOutside = (e: Event) => handleClickOutside(e, state, handlers);
    document.addEventListener('keydown', boundKeyHandler, { signal });
    document.addEventListener('contextmenu', boundContextHandler, { signal });
    document.addEventListener('click', boundClickOutside, { signal });
    _listenerCount += 3;
    return { boundKeyHandler, boundContextHandler, boundClickOutside };
}

export function unbindGlobalEvents(boundHandlers: Record<string, EventListener>) {
    document.removeEventListener('keydown', boundHandlers.boundKeyHandler);
    document.removeEventListener('contextmenu', boundHandlers.boundContextHandler);
    document.removeEventListener('click', boundHandlers.boundClickOutside);
}

function handleClick(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const target = e.target as HTMLElement;
    const { container } = handlers;
    const onRender = handlers.onRender as () => void;
    const onFilterChange = handlers.onFilterChange as () => void;
    const onRefresh = handlers.onRefresh as () => void;
    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    const action = actionEl ? actionEl.dataset.action : null;
    const idEl = target.closest('[data-id]') as HTMLElement | null;
    const id = actionEl ? ((actionEl as HTMLElement).dataset.id || (idEl ? idEl.dataset.id : null)) : (idEl ? idEl.dataset.id : null);

    const groupHeader = target.closest('.p16-group-header') as HTMLElement | null;
    if (groupHeader) {
        const key = groupHeader.dataset.group;
        const collapsedGroups = state.collapsedGroups as Set<string>;
        collapsedGroups.has(key as string) ? collapsedGroups.delete(key as string) : collapsedGroups.add(key as string);
        onRender();
        return;
    }

    const filterStatusEl = target.closest('[data-filter-status]') as HTMLElement | null;
    const filterTipoEl = target.closest('[data-filter-tipo]') as HTMLElement | null;
    const filterUfEl = target.closest('[data-filter-uf]') as HTMLElement | null;
    const filterStatus = filterStatusEl ? filterStatusEl.dataset.filterStatus : undefined;
    const filterTipo = filterTipoEl ? filterTipoEl.dataset.filterTipo : undefined;
    const filterUf = filterUfEl ? filterUfEl.dataset.filterUf : undefined;
    const filters = state.filters as Record<string, unknown>;
    const data = state.data as Record<string, unknown>;
    const pagination = (data.pagination as Record<string, unknown>);

    if (filterStatus !== undefined) {
        filters.status = filters.status === filterStatus ? '' : filterStatus;
        (handlers.saveFilters as () => void)();
        pagination.page = 1;
        (handlers.resetInfiniteScroll as () => void)();
        onFilterChange();
        return;
    }
    if (filterTipo !== undefined) {
        filters.tipo = filters.tipo === filterTipo ? '' : filterTipo;
        (handlers.saveFilters as () => void)();
        pagination.page = 1;
        (handlers.resetInfiniteScroll as () => void)();
        onFilterChange();
        return;
    }
    if (filterUf !== undefined) {
        filters.uf = filters.uf === filterUf ? '' : filterUf;
        (handlers.saveFilters as () => void)();
        pagination.page = 1;
        (handlers.resetInfiniteScroll as () => void)();
        onFilterChange();
        return;
    }

    const sortEl = target.closest('[data-sort]') as HTMLElement | null;
    const sortCol = sortEl ? sortEl.dataset.sort : null;
    if (sortCol) {
        handleSort(state.sortColumns as Record<string, unknown>[], sortCol, (e as MouseEvent).shiftKey);
        (handlers.saveSort as () => void)();
        (handlers.sortData as () => void)();
        onRender();
        return;
    }

    const rowEl = target.closest('.p16-row[data-idx]') as HTMLElement | null;
    if (rowEl && !target.closest('button, input, a')) {
        state.focusedRowIndex = parseInt(rowEl.dataset.idx as string);
    }

    const selectedRows = state.selectedRows as Set<string>;
    const favorites = state.favorites as Set<string>;
    switch (action) {
        case 'advanced-filters': state.showAdvancedFilters = true; onRender(); break;
        case 'close-modal': state.showAdvancedFilters = false; onRender(); break;
        case 'apply-advanced': (handlers.applyAdvancedFilters as () => void)(); break;
        case 'clear-advanced': (handlers.clearAdvancedFilters as () => void)(); break;
        case 'view': case 'view-row': case 'view-top': if (id) (handlers.loadFornecedor360 as (id: string) => void)(id); break;
        case 'close-detail': state.selectedFornecedor = null; onRender(); break;
        case 'toggle-favorite': if (id) (handlers.toggleFavorite as (id: string) => void)(id); break;
        case 'toggle-expand': if (id) (handlers.toggleExpand as (id: string) => void)(id); break;
        case 'clear-search': filters.search = ''; (handlers.saveFilters as () => void)(); (handlers.resetInfiniteScroll as () => void)(); onFilterChange(); break;
        case 'clear-client-search': state.clientSearchTerm = ''; onRender(); break;
        case 'clear-all-filters': state.filters = {}; state.clientSearchTerm = ''; (handlers.saveFilters as () => void)(); pagination.page = 1; (handlers.resetInfiniteScroll as () => void)(); onFilterChange(); break;
        case 'clear-sort': state.sortColumns = [{ column: 'nome', direction: 'asc' }]; (handlers.saveSort as () => void)(); (handlers.sortData as () => void)(); onRender(); break;
        case 'remove-filter': (handlers.removeFilter as (key: string) => void)((actionEl as HTMLElement).dataset.filterKey as string); break;
        case 'select-row': if (id) { selectedRows.has(id) ? selectedRows.delete(id) : selectedRows.add(id); onRender(); } break;
        case 'bulk-clear': selectedRows.clear(); onRender(); break;
        case 'bulk-export': (handlers.exportSelected as () => void)(); break;
        case 'bulk-favorite': selectedRows.forEach((rowId: string) => favorites.add(rowId)); (handlers.saveFavorites as () => void)(); selectedRows.clear(); onRender(); break;
        case 'first-page': pagination.page = 1; onFilterChange(); break;
        case 'prev-page': if ((pagination.page as number) > 1) { (pagination.page as number); pagination.page = (pagination.page as number) - 1; onFilterChange(); } break;
        case 'next-page': if ((pagination.page as number) < Math.ceil((pagination.total as number) / (pagination.limit as number))) { pagination.page = (pagination.page as number) + 1; onFilterChange(); } break;
        case 'last-page': pagination.page = Math.ceil((pagination.total as number) / (pagination.limit as number)); onFilterChange(); break;
        case 'export': (handlers.exportCSV as () => void)(); break;
        case 'export-xlsx': (handlers.exportXLSX as () => void)(); break;
        case 'export-pdf': (handlers.exportPDF as () => void)(); break;
        case 'refresh': (handlers.resetInfiniteScroll as () => void)(); onRefresh(); break;
        case 'quick-update': if (id) EventBusPort.emit(PANEL_16_UI_EVENTS.QUICK_UPDATE, { id, source: 'panel-16:ui:events', timestamp: Date.now() }); break;
        case 'copy-doc': if (id) (handlers.copyDoc as (id: string) => void)(id); break;
    }
}

function handleInput(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const target = e.target as HTMLInputElement;
    const filters = state.filters as Record<string, unknown>;
    const data = state.data as Record<string, unknown>;
    const pagination = (data.pagination as Record<string, unknown>);
    if (target.id === 'p16-search') {
        clearTimeout(state.debounceTimer as ReturnType<typeof setTimeout>);
        state.debounceTimer = setTimeout(() => {
            filters.search = target.value;
            (handlers.saveFilters as () => void)();
            pagination.page = 1;
            (handlers.resetInfiniteScroll as () => void)();
            (handlers.onFilterChange as () => void)();
        }, 350);
    }
    if (target.id === 'p16-client-search') {
        clearTimeout(state.debounceTimer as ReturnType<typeof setTimeout>);
        state.debounceTimer = setTimeout(() => {
            state.clientSearchTerm = target.value;
            (handlers.onRender as () => void)();
        }, 150);
    }
    if (target.id === 'p16-select-all') {
        const displayData = (handlers.getDisplayData as () => Record<string, unknown>[])();
        if (target.checked) {
            displayData.forEach((f: Record<string, unknown>) => (state.selectedRows as Set<string>).add(f.id as string));
        } else {
            (state.selectedRows as Set<string>).clear();
        }
        (handlers.onRender as () => void)();
    }
}

function handleChange(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const target = e.target as HTMLInputElement;
    const id = target.id;
    const filters = state.filters as Record<string, unknown>;
    const data = state.data as Record<string, unknown>;
    const pagination = (data.pagination as Record<string, unknown>);
    if (id === 'p16-filter-status') filters.status = target.value;
    else if (id === 'p16-filter-tipo') filters.tipo = target.value;
    else if (id === 'p16-filter-uf') filters.uf = target.value;
    else return;
    (handlers.saveFilters as () => void)();
    pagination.page = 1;
    (handlers.resetInfiniteScroll as () => void)();
    (handlers.onFilterChange as () => void)();
}

function handleKeyboard(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const ke = e as KeyboardEvent;
    const onRender = handlers.onRender as () => void;
    const expandedRows = state.expandedRows as Set<string>;
    if (ke.key === 'Escape') {
        if (state.showAdvancedFilters) { state.showAdvancedFilters = false; onRender(); return; }
        if (state.contextMenu) { (handlers.hideContextMenu as () => void)(); return; }
        if (state.selectedFornecedor) { state.selectedFornecedor = null; onRender(); return; }
        if (expandedRows.size > 0) { expandedRows.clear(); onRender(); return; }
        state.focusedRowIndex = -1;
        onRender();
        return;
    }
    if (ke.key === 'r' && !ke.ctrlKey && !ke.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        (handlers.onRefresh as () => void)();
        return;
    }
    const displayData = (handlers.getDisplayData as () => Record<string, unknown>[])();
    if (displayData.length === 0) return;
    const focusedIdx = state.focusedRowIndex as number;
    if (ke.key === 'ArrowDown') { e.preventDefault(); state.focusedRowIndex = Math.min(focusedIdx + 1, displayData.length - 1); onRender(); }
    if (ke.key === 'ArrowUp') { e.preventDefault(); state.focusedRowIndex = Math.max(focusedIdx - 1, 0); onRender(); }
    if (ke.key === 'Enter' && focusedIdx >= 0 && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); (handlers.loadFornecedor360 as (id: string) => void)(displayData[focusedIdx].id as string); }
    if (ke.key === ' ' && focusedIdx >= 0 && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); (handlers.toggleExpand as (id: string) => void)(displayData[focusedIdx].id as string); }
    if ((ke.key === 'f' || ke.key === 'F') && focusedIdx >= 0 && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); (handlers.toggleFavorite as (id: string) => void)(displayData[focusedIdx].id as string); }
}

function handleContextMenu(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const target = e.target as HTMLElement;
    const me = e as MouseEvent;
    const row = target.closest('.p16-row[data-id]') as HTMLElement | null;
    if (row && (handlers.container as HTMLElement).contains(row)) {
        e.preventDefault();
        (handlers.showContextMenu as (x: number, y: number, id: string) => void)(me.clientX, me.clientY, row.dataset.id as string);
    }
}

function handleClickOutside(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const target = e.target as HTMLElement;
    if (state.contextMenu && !(state.contextMenu as HTMLElement).contains(target)) (handlers.hideContextMenu as () => void)();
    if (state.showColumnsDropdown && !target.closest('.p16-columns-toggle')) { state.showColumnsDropdown = false; (handlers.renderControls as () => void)(); }
    if (state.showViewsDropdown && !target.closest('.p16-saved-views')) { state.showViewsDropdown = false; (handlers.renderControls as () => void)(); }
}

export function bindControlsEvents(controlsElement: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    if (!controlsElement) return;
    const signal = _abortController ? _abortController.signal : undefined;
    controlsElement.addEventListener('click', (e: Event) => handleControlsClick(e, state, handlers), { signal });
    controlsElement.addEventListener('change', (e: Event) => handleControlsChange(e, state, handlers), { signal });
    _listenerCount += 2;
}

export function unbindAllEvents() {
    if (_abortController) {
        _abortController.abort();
        _abortController = null;
        _listenerCount = 0;
    }
}

function handleControlsClick(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const target = e.target as HTMLElement;
    const onRender = handlers.onRender as () => void;
    const renderControls = handlers.renderControls as () => void;
    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    const action = actionEl ? actionEl.dataset.action : null;
    const periodEl = target.closest('[data-period]') as HTMLElement | null;
    if (periodEl) {
        state.period = parseInt(periodEl.dataset.period as string);
        (handlers.onPeriodChange as () => void)();
        renderControls();
        return;
    }
    const viewEl = target.closest('[data-view]') as HTMLElement | null;
    if (viewEl && !viewEl.dataset.viewId) {
        state.viewMode = viewEl.dataset.view;
        (handlers.saveViewMode as () => void)();
        onRender();
        return;
    }
    const viewItem = target.closest('[data-view-id]') as HTMLElement | null;
    if (viewItem && !target.closest('[data-delete-view]')) { (handlers.applyView as (id: string) => void)(viewItem.dataset.viewId as string); return; }
    const deleteView = target.closest('[data-delete-view]') as HTMLElement | null;
    if (deleteView) { (handlers.deleteView as (id: string) => void)(deleteView.dataset.deleteView as string); return; }
    const colCheckbox = target.closest('[data-column]') as HTMLInputElement | null;
    if (colCheckbox && colCheckbox.tagName === 'INPUT') {
        const colId = colCheckbox.dataset.column;
        const col = (state.columns as Record<string, unknown>[]).find((c: Record<string, unknown>) => c.id === colId);
        if (col) { col.visible = colCheckbox.checked; (handlers.saveColumns as () => void)(); onRender(); }
        return;
    }
    if (action === 'pin-left' || action === 'pin-right') { (handlers.togglePin as (colId: string, side: string) => void)((actionEl as HTMLElement).dataset.col as string, action === 'pin-left' ? 'left' : 'right'); return; }
    const data = state.data as Record<string, unknown>;
    const dataList = data.list as unknown[];
    const pagination = data.pagination as Record<string, unknown>;
    switch (action) {
        case 'toggle-columns': state.showColumnsDropdown = !state.showColumnsDropdown; state.showViewsDropdown = false; renderControls(); break;
        case 'toggle-views': state.showViewsDropdown = !state.showViewsDropdown; state.showColumnsDropdown = false; renderControls(); break;
        case 'reset-columns': (handlers.resetColumns as () => void)(); break;
        case 'save-view': (handlers.saveCurrentView as () => void)(); break;
        case 'toggle-pagination': state.useInfiniteScroll = false; (handlers.resetInfiniteScroll as () => void)(); onRender(); break;
        case 'toggle-infinite': state.useInfiniteScroll = true; state.allLoadedData = dataList.slice(); state.hasMoreData = dataList.length < (pagination.total as number); onRender(); break;
    }
}

function handleControlsChange(e: Event, state: Record<string, unknown>, handlers: Record<string, unknown>) {
    const target = e.target as HTMLInputElement;
    if (target.id === 'p16-group-by') { state.groupBy = target.value; (handlers.onRender as () => void)(); }
}

export default { bindEvents, bindGlobalEvents, unbindGlobalEvents, unbindAllEvents, bindControlsEvents };

export const MODULE_ID = 'panels-panel-16-ui-events';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, hasAbortController: _abortController !== null }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: true, listenersTracked: _abortController !== null || _listenerCount === 0 }, p24Instrumented: true, timestamp: Date.now() }; }
