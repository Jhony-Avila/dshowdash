// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:handlers:events
// PURPOSE: Panel-05 - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   store from ../state/store.js
//   toastManager from ../ui/toast.js
//   emitLifecycle from ../utils/lifecycle.js
//   loadClientes, loadCliente360, loadAllData from ./data.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   handleClick() — exported function
//   handleChange() — exported function
//   handleInput() — exported function
//   handleKeyboard() — exported function
//   toggleChartsView() — exported function
//   clearSearchTimeout() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { store } from '../state/store.js';
import { toastManager } from '../ui/toast.js';
import * as Telemetry from '../telemetry/tracker.js';
import { emitLifecycle } from '../utils/lifecycle.js';
import { loadClientes, loadCliente360, loadAllData } from './data.js';
import * as Favoritos from '../managers/favoritos.js';
import * as ModalController from '../managers/modal-controller.js';
import * as ExportController from '../managers/export-controller.js';
import * as Cliente360View from '../managers/cliente360-view.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:handlers:events';

let _searchTimeout: ReturnType<typeof setTimeout> | null = null;

export function handleClick(e: MouseEvent | Event, ctx: Record<string, unknown>) {
  const target = (e.target as Element).closest('[data-action]') as HTMLElement | null;
  if (!target) return;
  const action = target.dataset.action;
  Telemetry.trackAction(action as string, { target: target.tagName });

  if (action === 'refresh') { loadClientes(); toastManager.info('Atualizando...'); }
  else if (action === 'back') { Cliente360View.hide(ctx.refs, ctx.moduleId, ctx.version); if (store.clearCliente360) store.clearCliente360(); }
  else if (action === 'view-change') { const view = target.dataset.view; Cliente360View.setCurrentView(view as string); emitLifecycle(ctx.moduleId as string, ctx.version as string, PANEL_EVENTS.VIEW_CHANGED, { view }); }
  else if (action === 'toggle-charts') { toggleChartsView(ctx.refs as Record<string, unknown>); }
  else if (action === 'cliente360' || action === 'view') { const id = target.dataset.id; if (id) loadCliente360(id); }
  else if (action === 'sort') { const field = target.dataset.sort; if (field) { store.setSort(field); loadClientes(); } }
  else if (action === 'page') { const page = parseInt(target.dataset.page as string); if (page) { store.setPage(page); loadClientes(); } }
  else if (action === 'favorito' || action === 'toggle-fav') { Favoritos.toggle(target.dataset.id, ctx.moduleId as string, ctx.version as string); }
  else if (action === 'export' || action === 'export-csv') { ExportController.exportData('csv'); }
  else if (action === 'export-excel') { ExportController.exportData('excel'); }
  else if (action === 'export-pdf') { ExportController.exportData('pdf'); }
  else if (action === 'show-keyboard-help') { ModalController.show('keyboard-help'); }
  else if (action === 'show-settings') { ModalController.show('settings'); }
  else if (action === 'show-date-picker') { ModalController.show('date-picker'); }
  else if (action === 'close-modal') { ModalController.close(); }
  else if (action === 'retry') { loadAllData(ctx.moduleId as string, ctx.version as string); }
}

export function handleChange(e: Event, ctx: Record<string, unknown>) {
  const target = e.target as HTMLInputElement;
  if (!target.dataset.filter) return;
  const filter = target.dataset.filter;
  const value = target.value;
  Telemetry.trackAction('filter-change', { filter, value });
  const filters: Record<string, unknown> = {};
  filters[filter as string] = value;
  store.setFilters(filters);
  loadClientes();
  emitLifecycle(ctx.moduleId as string, ctx.version as string, PANEL_EVENTS.FILTER_CHANGED, { filter, value });
}

export function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.dataset.action !== 'search') return;
  // @ts-expect-error strict migration — TS2769
  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(() => {
    store.setFilters({ search: target.value });
    loadClientes();
  }, 300);
}

export function handleKeyboard(e: KeyboardEvent, ctx: Record<string, unknown>) {
  const activeEl = document.activeElement;
  const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
  
  if (e.key === 'Escape') {
    if (ModalController.isOpen()) { ModalController.close(); return; }
    if (Cliente360View.getCurrentView() === 'detail') { Cliente360View.hide(ctx.refs, ctx.moduleId, ctx.version); if (store.clearCliente360) store.clearCliente360(); return; }
  }

  if (isInput) return;

  if (e.key === 'r' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); loadClientes(); }
  else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) { toggleChartsView(ctx.refs as Record<string, unknown>); }
  else if (e.key === '?') { ModalController.show('keyboard-help'); }
  else if (e.key === 's' && !e.ctrlKey && !e.metaKey) { ModalController.show('settings'); }
  else if (e.key === 'e' && !e.ctrlKey && !e.metaKey) { ExportController.exportData('csv'); }
}

export function toggleChartsView(refs: Record<string, unknown>) {
  if (!refs || !refs.chartsArea) return;
  const chartsArea = refs.chartsArea as HTMLElement;
  const isVisible = chartsArea.style.display !== 'none';
  chartsArea.style.display = isVisible ? 'none' : '';
  if (!isVisible) {
    const charts = store.get('charts');
    if (charts && refs.renderCharts) (refs.renderCharts as (data: unknown) => void)(charts);
  }
}

// @ts-expect-error strict migration — TS2769
export function clearSearchTimeout() { clearTimeout(_searchTimeout); }

export function healthCheck() {
  const checks = { storeAvailable: !!store, toastAvailable: !!toastManager, telemetryAvailable: !!Telemetry, panelEventsAvailable: !!PANEL_EVENTS };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { handleClick, handleChange, handleInput, handleKeyboard, toggleChartsView, clearSearchTimeout, healthCheck, info, VERSION, MODULE_ID };
