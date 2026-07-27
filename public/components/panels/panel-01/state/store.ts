// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.1-STORE-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/state/store
// PURPOSE: Panel 01 - State Store (enterprise-grade with full data handler support)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createStatePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   store — singleton StateStore instance
//   VERSION — module constant
//   MODULE_ID — module constant
//
// @changelog
//   9.3.1-STORE-ENTERPRISE: Added setKPIs, setFilterOptions, setFilter (singular),
//     setLimit, openDrawer, closeDrawer methods. Extended state with kpis, filterOptions,
//     drawer fields. Added sort.field/sort.order aliases for backward compatibility.
//     Pagination now includes limit and totalPages.
//   9.3.0-P2-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createStatePorts } from '/core/runtime/ports-profiles.js';

var VERSION = '9.3.1-STORE-ENTERPRISE';
var MODULE_ID = 'panel-01/state/store';

var Ports = createStatePorts({ moduleId: MODULE_ID });
var _initPorts = function() { Ports.init(); };
var _getPort = function(name: string) { return Ports.get(name); };
export var injectPorts = function(p: unknown) { return Ports.inject(p); };
export var getPorts = function() { return Ports.snapshot(); };

var INITIAL_STATE: {
  requisicoes: unknown[];
  kpis: unknown | null;
  filterOptions: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  sort: { column: string; direction: string; field: string; order: string };
  pagination: { page: number; perPage: number; limit: number; total: number; totalPages: number };
  selectedId: string | number | null;
  drawer: unknown | null;
} = {
  requisicoes: [],
  kpis: null,
  filterOptions: {},
  loading: false,
  error: null,
  filters: {},
  sort: { column: 'Data_Requisicao', direction: 'desc', field: 'Data_Requisicao', order: 'desc' },
  pagination: { page: 1, perPage: 20, limit: 20, total: 0, totalPages: 0 },
  selectedId: null,
  drawer: null
};

function _cloneState(state: typeof INITIAL_STATE) {
  return {
    requisicoes: state.requisicoes,
    kpis: state.kpis,
    filterOptions: state.filterOptions,
    loading: state.loading,
    error: state.error,
    filters: Object.assign({}, state.filters),
    sort: Object.assign({}, state.sort),
    pagination: Object.assign({}, state.pagination),
    selectedId: state.selectedId,
    drawer: state.drawer
  };
}

export function StateStore(this: any) {
  this.state = _cloneState(INITIAL_STATE);
  this.listeners = new Set();
  _initPorts();
}

StateStore.prototype.getState = function() {
  return Object.assign({}, this.state);
};

StateStore.prototype.setState = function(partial: Partial<typeof INITIAL_STATE>) {
  this.state = Object.assign({}, this.state, partial);
  this.notify();
};

StateStore.prototype.subscribe = function(listener: (state: typeof INITIAL_STATE) => void) {
  var self = this;
  this.listeners.add(listener);
  return function() { self.listeners.delete(listener); };
};

StateStore.prototype.notify = function() {
  var state = this.state;
  this.listeners.forEach(function(listener: (s: typeof INITIAL_STATE) => void) { listener(state); });
};

// ── Data setters ──

StateStore.prototype.setRequisicoes = function(requisicoes: unknown[], paginationOrTotal: number | { total?: number; page?: number; limit?: number; totalPages?: number } | null | undefined) {
  var pag = Object.assign({}, this.state.pagination);
  if (typeof paginationOrTotal === 'number') {
    pag.total = paginationOrTotal;
    pag.totalPages = Math.ceil(paginationOrTotal / pag.perPage);
  } else if (paginationOrTotal && typeof paginationOrTotal === 'object') {
    if (paginationOrTotal.total !== undefined) pag.total = paginationOrTotal.total;
    if (paginationOrTotal.page !== undefined) pag.page = paginationOrTotal.page;
    if (paginationOrTotal.limit !== undefined) { pag.limit = paginationOrTotal.limit; pag.perPage = paginationOrTotal.limit; }
    if (paginationOrTotal.totalPages !== undefined) pag.totalPages = paginationOrTotal.totalPages;
    else pag.totalPages = pag.perPage > 0 ? Math.ceil(pag.total / pag.perPage) : 0;
  } else {
    pag.total = requisicoes ? requisicoes.length : 0;
    pag.totalPages = pag.perPage > 0 ? Math.ceil(pag.total / pag.perPage) : 0;
  }
  this.setState({ requisicoes: requisicoes || [], loading: false, error: null, pagination: pag });
};

StateStore.prototype.setKPIs = function(kpis: unknown) {
  this.setState({ kpis: kpis || null });
};

StateStore.prototype.setFilterOptions = function(filterOptions: Record<string, unknown>) {
  this.setState({ filterOptions: Object.assign({}, this.state.filterOptions, filterOptions) });
};

StateStore.prototype.setLoading = function(loading: boolean) {
  this.setState({ loading: loading });
};

StateStore.prototype.setError = function(error: string | null) {
  this.setState({ error: error, loading: false });
};

StateStore.prototype.setFilters = function(filters: Record<string, unknown>) {
  this.setState({
    filters: Object.assign({}, this.state.filters, filters),
    pagination: Object.assign({}, this.state.pagination, { page: 1 })
  });
};

// Singular alias used by data handlers (sets a single filter key)
StateStore.prototype.setFilter = function(key: string, value: unknown) {
  var filters = Object.assign({}, this.state.filters);
  if (value === undefined || value === null || value === '') {
    delete filters[key];
  } else {
    filters[key] = value;
  }
  this.setState({
    filters: filters,
    pagination: Object.assign({}, this.state.pagination, { page: 1 })
  });
};

StateStore.prototype.clearFilters = function() {
  this.setState({
    filters: {},
    pagination: Object.assign({}, this.state.pagination, { page: 1 })
  });
};

StateStore.prototype.setSort = function(column: string, direction: string) {
  this.setState({ sort: { column: column, direction: direction, field: column, order: direction } });
};

StateStore.prototype.setPage = function(page: number) {
  this.setState({ pagination: Object.assign({}, this.state.pagination, { page: page }) });
};

StateStore.prototype.setLimit = function(limit: number) {
  this.setState({
    pagination: Object.assign({}, this.state.pagination, { limit: limit, perPage: limit, page: 1 })
  });
};

StateStore.prototype.setSelectedId = function(id: string | number | null) {
  this.setState({ selectedId: id });
};

// ── Drawer ──

StateStore.prototype.openDrawer = function(data: unknown) {
  this.setState({ drawer: data || null });
};

StateStore.prototype.closeDrawer = function() {
  this.setState({ drawer: null });
};

// ── Lifecycle ──

StateStore.prototype.reset = function() {
  this.state = _cloneState(INITIAL_STATE);
  this.notify();
};

StateStore.prototype.healthCheck = function() {
  return {
    status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    state: {
      reqCount: this.state.requisicoes.length,
      hasKpis: !!this.state.kpis,
      loading: this.state.loading,
      hasError: !!this.state.error,
      filterCount: Object.keys(this.state.filters).length,
      drawerOpen: !!this.state.drawer
    },
    portsInitialized: Ports.snapshot()._initialized
  };
};

StateStore.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized };
};

export var info = function() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized }; };
export var healthCheck = function() { return { status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized }; };
export var store = new (StateStore as unknown as new () => typeof StateStore.prototype)();
export { VERSION, MODULE_ID };
export default StateStore;
