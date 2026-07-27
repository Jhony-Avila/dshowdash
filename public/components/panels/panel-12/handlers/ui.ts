// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12.handlers.ui
// PURPOSE: Panel 12 - UI Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   ALL_COLUMNS from ../config/columns.js
//   state, resetState, PANEL_ID from ../core/lifecycle.js
//   SEARCH_DEBOUNCE_MS from ../core/constants.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   handleSort() — exported function
//   handleSearchChange() — exported function
//   handleSearchClear() — exported function
//   handleFilterChange() — exported function
//   cleanup() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import * as store from '../state/store.js';
import * as persist from '../state/persist.js';
import * as table from '../ui/table.js';
import * as tooltip from '../ui/tooltip.js';
import * as modals from '../ui/modals.js';
import * as toast from '../ui/toast.js';
import * as panelHeader from '../ui/header.js';
import * as logger from '../utils/logger.js';
import { ALL_COLUMNS } from '../config/columns.js';
import { state, resetState, PANEL_ID } from '../core/lifecycle.js';
import { SEARCH_DEBOUNCE_MS } from '../core/constants.js';

export const MODULE_ID = 'panel-12.handlers.ui';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

type UiCallbacks = { handleSort?: (c: HTMLElement, col: string, el: HTMLElement) => void; setupTooltipsWrapper: (c: HTMLElement, id: string) => void; setupDelegatedEventListeners: (c: HTMLElement) => void; [key: string]: unknown };
export function handleSort(container: HTMLElement, column: string, headerElement: HTMLElement, callbacks: UiCallbacks) {
  const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;
  const timer = logger.startTimer('sort.apply');

  // @ts-expect-error TS migration - TS2339
  const newSort = store.toggleSort(column);
  (persist as any).setSortState(newSort);
  const filtered = store.getFilteredAndSorted();

  table.render(container, filtered, ALL_COLUMNS, (c: HTMLElement, col: string, el: HTMLElement) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);

  panelHeader.updateFilterCounts(container);
  if (headerElement?.blur) headerElement.blur();
  timer.end({ column, direction: newSort.direction });

  const telemetry = _getPort('telemetry');
  if (telemetry) telemetry.track?.('painel-12:sort:applied', { column, direction: newSort.direction });
}

export function handleSearchChange(value: string, callbacks: UiCallbacks) {
  if (state.searchDebounceTimer) clearTimeout(state.searchDebounceTimer);

  state.searchDebounceTimer = setTimeout(() => {
    store.setSearchTerm(value);
    const container = document.querySelector(`#${PANEL_ID}`);
    if (!container) return;

    const filtered = store.getFilteredAndSorted();
    const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;

    table.render(container as HTMLElement, filtered, ALL_COLUMNS, (c: HTMLElement, col: string, el: HTMLElement) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);


    // @ts-expect-error TS migration - TS2339
    panelHeader.updateSearchResults(container as HTMLElement, filtered.length, store.getJobs().length, PANEL_ID);
    panelHeader.updateFilterCounts(container as HTMLElement);

    logger.debug('search.change', { term: value.substring(0, 50), termLength: value.length, results: filtered.length, total: store.getJobs().length });

    const telemetry = _getPort('telemetry');
    if (telemetry) telemetry.track?.('painel-12:search:applied', { termLength: value.length, results: filtered.length });
  }, SEARCH_DEBOUNCE_MS);
}

export function handleSearchClear(callbacks: UiCallbacks) {
  if (state.searchDebounceTimer) { clearTimeout(state.searchDebounceTimer); state.searchDebounceTimer = null; }

  store.resetSearch();
  const container = document.querySelector(`#${PANEL_ID}`);
  if (!container) return;

  const filtered = store.getFilteredAndSorted();
  const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;

  (table.render as any)(container as HTMLElement, filtered, ALL_COLUMNS, (c: HTMLElement, col: string, el: HTMLElement) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);


  // @ts-expect-error TS migration - TS2339
  panelHeader.updateSearchResults(container as HTMLElement, filtered.length, store.getJobs().length, PANEL_ID);
  panelHeader.updateFilterCounts(container as HTMLElement);

  const telemetry = _getPort('telemetry');
  if (telemetry) telemetry.track?.('painel-12:search:cleared', {});
}

export function handleFilterChange(filterType: string, filterValue: string, callbacks: UiCallbacks) {
  store.setFilters({ [filterType]: filterValue });
  const container = document.querySelector(`#${PANEL_ID}`);
  if (!container) return;

  const filtered = store.getFilteredAndSorted();
  const { setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;

  table.render(container as HTMLElement, filtered, ALL_COLUMNS, (c: HTMLElement, col: string, el: HTMLElement) => handleSort(c, col, el, callbacks), setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);

  panelHeader.updateFilterCounts(container as HTMLElement);
  logger.debug('filter.change', { filterType, filterValue, results: filtered.length });

  const telemetry = _getPort('telemetry');
  if (telemetry) telemetry.track?.('painel-12:filter:applied', { filterType, filterValue, results: filtered.length });
}

export function cleanup(container: HTMLElement | null) {

  // @ts-expect-error TS migration - TS2339
  panelHeader.cleanup();
  if (state.abortController) { state.abortController.abort(); state.abortController = null; }
  if (state.intervalId) { clearTimeout(state.intervalId); state.intervalId = null; }
  if (state.searchDebounceTimer) { clearTimeout(state.searchDebounceTimer); state.searchDebounceTimer = null; }
  tooltip.hide();
  modals.cleanup();
  if (state.retryToast) { toast.hide(state.retryToast as Record<string, unknown>); state.retryToast = null; }
  if (container) container.innerHTML = '';

  // @ts-expect-error TS migration - TS2339
  store.resetAll();
  resetState();
  logger.debug('lifecycle.unmount.complete', { cleaned: true });

  const telemetry = _getPort('telemetry');
  if (telemetry) telemetry.track?.('painel-12:lifecycle:unmounted', {});
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { uiReady: true } }; }
