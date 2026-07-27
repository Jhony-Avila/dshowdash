// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:index:handlers
// PURPOSE: Panel-05 Index - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//   _refs, toggleFavorito, toggleSelection, selectAll, clearSelection, setCurrent...
//   updateFavorito, updateSelection from ../renderer/table.js
//   refresh as manualRefresh from ../scheduler/refresh.js
//
// PROVIDES:
//   handleClick() — exported function
//   handleChange() — exported function
//   handleInput() — exported function
//   setView() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { store } from '../state/store.js';
import { _refs, toggleFavorito, toggleSelection, selectAll, clearSelection, setCurrentView } from './state.js';
import { updateFavorito, updateSelection } from '../renderer/table.js';
import { refresh as manualRefresh } from '../scheduler/refresh.js';

export function handleClick(e: MouseEvent | Event, loadClientes: () => void, loadCliente360: (id: string) => void, loadAllData: () => void) {
  const target = (e.target as Element).closest('[data-action]') as HTMLElement | null;
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  switch (action) {
    case 'refresh': manualRefresh(); break;
    case 'view': if (id) loadCliente360(id); break;
    case 'back': store.clearCliente360(); break;
    case 'sort': const field = target.dataset.sort; if (field) { store.setSort(field); loadClientes(); } break;
    // @ts-expect-error strict migration — TS2345
    case 'page': const page = parseInt(target.dataset.page); if (page && !isNaN(page)) { store.setPage(page); loadClientes(); } break;
    // @ts-expect-error strict migration — TS2345
    case 'toggle-fav': if (id) toggleFavorito(id, updateFavorito); break;
    case 'retry': store.clearError(); loadAllData(); break;
    case 'view-change': const view = target.dataset.view; if (view) setView(view); break;
  }
}

export function handleChange(e: Event, loadClientes: () => void) {
  const target = e.target as HTMLInputElement;
  if (target.dataset.filter) { const filters: Record<string, unknown> = {}; filters[target.dataset.filter] = target.value; store.setFilters(filters); loadClientes(); }
  if (target.classList.contains('p05-checkbox-all')) { const clientes = (store.get('clientes') || []) as Array<Record<string, unknown>>; if (target.checked) selectAll(clientes.map((c: Record<string, unknown>) => (c.Id_Organizacao || c.id) as string), updateSelection); else clearSelection(updateSelection); }
  if (target.classList.contains('p05-row-checkbox')) { const tr = target.closest('tr'); if (tr?.dataset.id) toggleSelection(tr.dataset.id, updateSelection); }
}

export function handleInput(e: Event, loadClientes: () => void) {
  const target = e.target as HTMLInputElement;
  if (target.dataset.action === 'search' || target.classList.contains('p05-search-input')) {
    clearTimeout((handleInput as unknown as Record<string, unknown>)._timer as ReturnType<typeof setTimeout>);
    (handleInput as unknown as Record<string, unknown>)._timer = setTimeout(() => { store.setFilters({ search: target.value }); loadClientes(); }, 300);
  }
}

export function setView(view: string) {
  setCurrentView(view);
  (_refs as Record<string, unknown>)?.panel && ((_refs as Record<string, unknown>).panel as Element)?.querySelectorAll('[data-action="view-change"]').forEach(btn => { (btn as HTMLElement).classList.toggle('p05-active', (btn as HTMLElement).dataset.view === view); });
  if (_refs?.chartsArea) (_refs.chartsArea as HTMLElement).style.display = view === 'charts' ? 'block' : 'none';
  if (_refs?.tableContainer) ((_refs.tableContainer as HTMLElement).parentElement as HTMLElement).style.display = view === 'list' ? 'block' : 'none';
  if (_refs?.pagination) (_refs.pagination as HTMLElement).style.display = view === 'list' ? 'flex' : 'none';
}

export default { handleClick, handleChange, handleInput, setView };

export const MODULE_ID = 'panel-05:index:handlers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { handlersReady: true } }; }
