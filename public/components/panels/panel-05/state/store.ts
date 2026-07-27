// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05.state.store
// PURPOSE: Panel-05 Store - AAA Anti-Flicker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   STATES from ../core/constants.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   store — exported value
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
import { STATES } from '../core/constants.js';

export const MODULE_ID = 'panel-05.state.store';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debug = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { logger.error?.(prefix, ...args); return; } if (level === 'warn') { logger.warn?.(prefix, ...args); return; } if (_debug()) logger.debug?.(prefix, ...args); };

const initialState: Record<string, unknown> = { status: STATES.IDLE, kpis: null, clientes: [], clienteAtivo: null, cliente360: null, charts: null, topClientes: null, vendedores: null, insights: null, comparativo: null, funil: null, metrics: null, churn: null, ranking: null, heatmap: null, searchResults: null, pagination: { page: 1, perPage: 25, total: 0, totalPages: 0 }, filters: { search: '', status: '', uf: '', porte: '', risco: '' }, sort: { field: 'Nome_Empresa', order: 'asc' }, loading: false, error: null };

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) { if (a.length !== (b as unknown[]).length) return false; return a.every((v, i) => deepEqual(v, (b as unknown[])[i])); }
  const keysA = Object.keys(a as object), keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => keysB.includes(key) && deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
};

export class Store {
  [key: string]: any;
  constructor() {
    this._state = { ...initialState };
    this._sliceListeners = {};
  }

  subscribe(slice: string, callback: (value: unknown) => void) { if (!this._sliceListeners[slice]) this._sliceListeners[slice] = []; this._sliceListeners[slice].push(callback); return () => { const arr = this._sliceListeners[slice]; if (arr) { const idx = arr.indexOf(callback); if (idx > -1) arr.splice(idx, 1); } }; }
  _emit(slice: string, value: unknown) { const listeners = this._sliceListeners[slice]; if (!listeners?.length) return; listeners.forEach((l: (value: unknown) => void) => { try { l(value); } catch (e) { _log('error', 'Listener error:', slice, e); } }); }
  _set(slice: string, value: unknown) { if (deepEqual(this._state[slice], value)) return false; this._state[slice] = value; this._emit(slice, value); return true; }
  getState() { return this._state; }
  get(slice: string) { return this._state[slice]; }

  setKPIs(data: unknown) { if (!this._set('kpis', data)) return; this._set('status', STATES.READY); this._set('loading', false); this._set('error', null); }
  setClientes(data: unknown) { const d = data as Record<string, unknown>; const items = d?.items || data || []; const pagination = d?.pagination || this._state.pagination; if (!this._set('clientes', items)) { this._set('pagination', { ...this._state.pagination, ...pagination }); return; } this._set('pagination', { ...this._state.pagination, ...pagination }); this._set('status', STATES.READY); this._set('loading', false); this._set('error', null); }
  setCliente360(data: unknown) { if (!this._set('cliente360', data)) return; const d = data as Record<string, unknown>; const c = d?.cliente as Record<string, unknown>; this._set('clienteAtivo', c?.Id_Organizacao || null); this._set('status', STATES.DETAIL); this._set('loading', false); }
  clearCliente360() { this._set('cliente360', null); this._set('clienteAtivo', null); this._set('status', STATES.READY); }
  setCharts(data: unknown) { this._set('charts', data); this._set('loading', false); }
  setTopClientes(data: unknown) { this._set('topClientes', data); }
  setVendedores(data: unknown) { this._set('vendedores', data); }
  setInsights(data: unknown) { this._set('insights', data); }
  setComparativo(data: unknown) { this._set('comparativo', data); }
  setFunil(data: unknown) { this._set('funil', data); }
  setMetrics(data: unknown) { this._set('metrics', data); }
  setChurn(data: unknown) { this._set('churn', data); }
  setRanking(data: unknown) { this._set('ranking', data); }
  setHeatmap(data: unknown) { this._set('heatmap', data); }
  setSearchResults(data: unknown) { this._set('searchResults', data); }
  clearSearchResults() { this._set('searchResults', null); }
  setFilters(filters: Record<string, unknown>) { const newFilters = { ...this._state.filters, ...filters }; if (!this._set('filters', newFilters)) return; this._set('pagination', { ...this._state.pagination, page: 1 }); }
  clearFilters() { this._set('filters', { ...(initialState.filters as object) }); this._set('pagination', { ...this._state.pagination, page: 1 }); }
  setSort(field: string) { const { sort } = this._state; const order = sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'; if (!this._set('sort', { field, order })) return; this._set('pagination', { ...this._state.pagination, page: 1 }); }
  setPage(page: number) { if (this._state.pagination.page === page) return; this._set('pagination', { ...this._state.pagination, page }); }
  setLoading(loading: boolean) { this._set('loading', loading); if (loading) this._set('status', STATES.LOADING); }
  setError(error: string | null) { this._set('error', error); this._set('status', STATES.ERROR); this._set('loading', false); }
  clearError() { this._set('error', null); }
  getFiltersForAPI() { const { filters, sort, pagination } = this._state; const params: Record<string, unknown> = { page: pagination.page, per_page: pagination.perPage, sort: sort.field, order: sort.order }; Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; }); return params; }
  reset() { Object.keys(initialState).forEach(k => this._set(k, (initialState as Record<string, unknown>)[k])); }

  info() { const slices = Object.keys(this._sliceListeners); const listeners = slices.map(k => ({ slice: k, count: this._sliceListeners[k].length })); return { moduleId: MODULE_ID, version: VERSION, status: this._state.status, slices: slices.length, listeners }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
}

export const store = new Store();
export default store;
