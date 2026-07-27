import { createStatePorts } from "/core/runtime/ports-profiles.js";
var VERSION = "9.3.1-STORE-ENTERPRISE";
var MODULE_ID = "panel-01/state/store";
var Ports = createStatePorts({ moduleId: MODULE_ID });
var _initPorts = function() {
  Ports.init();
};
var _getPort = function(name) {
  return Ports.get(name);
};
var injectPorts = function(p) {
  return Ports.inject(p);
};
var getPorts = function() {
  return Ports.snapshot();
};
var INITIAL_STATE = {
  requisicoes: [],
  kpis: null,
  filterOptions: {},
  loading: false,
  error: null,
  filters: {},
  sort: { column: "Data_Requisicao", direction: "desc", field: "Data_Requisicao", order: "desc" },
  pagination: { page: 1, perPage: 20, limit: 20, total: 0, totalPages: 0 },
  selectedId: null,
  drawer: null
};
function _cloneState(state) {
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
function StateStore() {
  this.state = _cloneState(INITIAL_STATE);
  this.listeners = /* @__PURE__ */ new Set();
  _initPorts();
}
StateStore.prototype.getState = function() {
  return Object.assign({}, this.state);
};
StateStore.prototype.setState = function(partial) {
  this.state = Object.assign({}, this.state, partial);
  this.notify();
};
StateStore.prototype.subscribe = function(listener) {
  var self = this;
  this.listeners.add(listener);
  return function() {
    self.listeners.delete(listener);
  };
};
StateStore.prototype.notify = function() {
  var state = this.state;
  this.listeners.forEach(function(listener) {
    listener(state);
  });
};
StateStore.prototype.setRequisicoes = function(requisicoes, paginationOrTotal) {
  var pag = Object.assign({}, this.state.pagination);
  if (typeof paginationOrTotal === "number") {
    pag.total = paginationOrTotal;
    pag.totalPages = Math.ceil(paginationOrTotal / pag.perPage);
  } else if (paginationOrTotal && typeof paginationOrTotal === "object") {
    if (paginationOrTotal.total !== void 0) pag.total = paginationOrTotal.total;
    if (paginationOrTotal.page !== void 0) pag.page = paginationOrTotal.page;
    if (paginationOrTotal.limit !== void 0) {
      pag.limit = paginationOrTotal.limit;
      pag.perPage = paginationOrTotal.limit;
    }
    if (paginationOrTotal.totalPages !== void 0) pag.totalPages = paginationOrTotal.totalPages;
    else pag.totalPages = pag.perPage > 0 ? Math.ceil(pag.total / pag.perPage) : 0;
  } else {
    pag.total = requisicoes ? requisicoes.length : 0;
    pag.totalPages = pag.perPage > 0 ? Math.ceil(pag.total / pag.perPage) : 0;
  }
  this.setState({ requisicoes: requisicoes || [], loading: false, error: null, pagination: pag });
};
StateStore.prototype.setKPIs = function(kpis) {
  this.setState({ kpis: kpis || null });
};
StateStore.prototype.setFilterOptions = function(filterOptions) {
  this.setState({ filterOptions: Object.assign({}, this.state.filterOptions, filterOptions) });
};
StateStore.prototype.setLoading = function(loading) {
  this.setState({ loading });
};
StateStore.prototype.setError = function(error) {
  this.setState({ error, loading: false });
};
StateStore.prototype.setFilters = function(filters) {
  this.setState({
    filters: Object.assign({}, this.state.filters, filters),
    pagination: Object.assign({}, this.state.pagination, { page: 1 })
  });
};
StateStore.prototype.setFilter = function(key, value) {
  var filters = Object.assign({}, this.state.filters);
  if (value === void 0 || value === null || value === "") {
    delete filters[key];
  } else {
    filters[key] = value;
  }
  this.setState({
    filters,
    pagination: Object.assign({}, this.state.pagination, { page: 1 })
  });
};
StateStore.prototype.clearFilters = function() {
  this.setState({
    filters: {},
    pagination: Object.assign({}, this.state.pagination, { page: 1 })
  });
};
StateStore.prototype.setSort = function(column, direction) {
  this.setState({ sort: { column, direction, field: column, order: direction } });
};
StateStore.prototype.setPage = function(page) {
  this.setState({ pagination: Object.assign({}, this.state.pagination, { page }) });
};
StateStore.prototype.setLimit = function(limit) {
  this.setState({
    pagination: Object.assign({}, this.state.pagination, { limit, perPage: limit, page: 1 })
  });
};
StateStore.prototype.setSelectedId = function(id) {
  this.setState({ selectedId: id });
};
StateStore.prototype.openDrawer = function(data) {
  this.setState({ drawer: data || null });
};
StateStore.prototype.closeDrawer = function() {
  this.setState({ drawer: null });
};
StateStore.prototype.reset = function() {
  this.state = _cloneState(INITIAL_STATE);
  this.notify();
};
StateStore.prototype.healthCheck = function() {
  return {
    status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED",
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
var info = function() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized };
};
var healthCheck = function() {
  return { status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized };
};
var store = new StateStore();
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  store
};
