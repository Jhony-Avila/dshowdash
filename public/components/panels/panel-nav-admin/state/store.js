import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PHASES, STATE_SHAPE } from "../core/contracts.js";
const VERSION = "10.0.0-GROUP-FILTER";
const MODULE_ID = "panel-nav-admin.state.store";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _debug() {
  const cfg = _getPort("config");
  return cfg?.app?.debug === true;
}
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
}
const initialState = Object.assign({}, STATE_SHAPE, { status: PHASES.IDLE, activeTab: "items", countdown: null, diagnosticData: null, diagnosticLoading: false, kpis: null, pagination: { page: 1, perPage: 9999, total: 0, totalPages: 0 }, sort: { field: "order", order: "asc" }, favoritos: [], selectedIds: /* @__PURE__ */ new Set() });
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const v of a) {
      if (!b.has(v)) return false;
    }
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const arrA = a;
  const arrB = b;
  if (Array.isArray(a)) {
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
      if (!deepEqual(arrA[i], arrB[i])) return false;
    }
    return true;
  }
  const objA = a;
  const objB = b;
  const keysA = Object.keys(objA), keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(objA[key], objB[key])) return false;
  }
  return true;
}
function Store() {
  this._state = Object.assign({}, initialState, { selectedIds: /* @__PURE__ */ new Set() });
  this._sliceListeners = /* @__PURE__ */ new Map();
  this._globalListeners = /* @__PURE__ */ new Set();
  this._initialized = false;
}
Store.prototype.init = function(partialState = {}) {
  if (this._initialized) return { success: true, alreadyInitialized: true };
  _initPorts();
  this._state = Object.assign({}, initialState, { selectedIds: /* @__PURE__ */ new Set() }, partialState || {});
  this._initialized = true;
  return { success: true };
};
Store.prototype.subscribe = function(sliceOrCallback, callback) {
  if (typeof sliceOrCallback === "function") {
    this._globalListeners.add(sliceOrCallback);
    return () => this._globalListeners.delete(sliceOrCallback);
  }
  const slice = sliceOrCallback;
  if (!this._sliceListeners.has(slice)) this._sliceListeners.set(slice, /* @__PURE__ */ new Set());
  this._sliceListeners.get(slice).add(callback);
  return () => {
    const s = this._sliceListeners.get(slice);
    if (s) s.delete(callback);
  };
};
Store.prototype._emit = function(slice, value) {
  const listeners = this._sliceListeners.get(slice);
  if (listeners?.size > 0) {
    listeners.forEach((cb) => {
      try {
        cb(value);
      } catch (e) {
        _log("error", "Listener error:", slice, e.message);
      }
    });
  }
  if (this._globalListeners.size > 0) {
    const snapshot = this.getState();
    this._globalListeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        _log("error", "Global listener error:", e.message);
      }
    });
  }
};
Store.prototype._set = function(slice, value) {
  var isEqual = deepEqual(this._state[slice], value);
  if (isEqual) return false;
  this._state[slice] = value;
  this._emit(slice, value);
  return true;
};
Store.prototype.getState = function() {
  return Object.assign({}, this._state, { selectedIds: new Set(this._state.selectedIds) });
};
Store.prototype.get = function(slice) {
  return this._state[slice];
};
Store.prototype.setItems = function(items) {
  if (!this._set("items", items || [])) {
    return;
  }
  this._set("phase", PHASES.READY);
  this._set("loading", false);
  this._set("error", null);
  this._set("lastLoadAt", Date.now());
};
Store.prototype.setSections = function(sections) {
  this._set("sections", sections || {});
};
Store.prototype.setIcons = function(icons) {
  this._set("icons", icons || []);
};
Store.prototype.setKPIs = function(kpis) {
  this._set("kpis", kpis);
};
Store.prototype.setActiveTab = function(tab) {
  this._set("activeTab", tab);
};
Store.prototype.setCountdown = function(seconds) {
  this._set("countdown", seconds);
};
Store.prototype.setFilters = function(filters) {
  const newFilters = Object.assign({}, this._state.filters, filters);
  if (!this._set("filters", newFilters)) return;
  this._set("pagination", Object.assign({}, this._state.pagination, { page: 1 }));
};
Store.prototype.setFilter = function(key, value) {
  this.setFilters({ [key]: value });
};
Store.prototype.clearFilters = function() {
  this._set("filters", { section: "sidebar", search: "", group: "" });
  this._set("pagination", Object.assign({}, this._state.pagination, { page: 1 }));
};
Store.prototype.setSort = function(field) {
  const sort = this._state.sort;
  const order = sort.field === field && sort.order === "asc" ? "desc" : "asc";
  this._set("sort", { field, order });
};
Store.prototype.setPage = function(page) {
  if (this._state.pagination.page === page) return;
  this._set("pagination", Object.assign({}, this._state.pagination, { page }));
};
Store.prototype.setPagination = function(pagination) {
  this._set("pagination", Object.assign({}, this._state.pagination, pagination));
};
Store.prototype.setSelectedItem = function(item) {
  this._set("selectedItem", item);
};
Store.prototype.setSelectedSection = function(section) {
  this._set("selectedSection", section);
};
Store.prototype.toggleSelection = function(id) {
  const newSet = new Set(this._state.selectedIds);
  if (newSet.has(id)) newSet.delete(id);
  else newSet.add(id);
  this._set("selectedIds", newSet);
};
Store.prototype.selectAll = function(ids) {
  this._set("selectedIds", new Set(ids));
};
Store.prototype.clearSelection = function() {
  this._set("selectedIds", /* @__PURE__ */ new Set());
};
Store.prototype.setFavoritos = function(favoritos) {
  this._set("favoritos", favoritos || []);
};
Store.prototype.toggleFavorito = function(id) {
  const favs = this._state.favoritos.slice();
  const idx = favs.indexOf(id);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(id);
  this._set("favoritos", favs);
  try {
    localStorage.setItem("pna-favoritos", JSON.stringify(favs));
  } catch (e) {
  }
};
Store.prototype.loadFavoritos = function() {
  try {
    const saved = localStorage.getItem("pna-favoritos");
    if (saved) this._set("favoritos", JSON.parse(saved));
  } catch (e) {
  }
};
Store.prototype.setDiagnosticData = function(data) {
  this._set("diagnosticData", data);
  this._set("diagnosticLoading", false);
};
Store.prototype.setDiagnosticLoading = function(loading) {
  this._set("diagnosticLoading", loading);
};
Store.prototype.clearDiagnostic = function() {
  this._set("diagnosticData", null);
  this._set("diagnosticLoading", false);
};
Store.prototype.setLoading = function(loading) {
  this._set("loading", loading);
  if (loading) this._set("phase", PHASES.LOADING);
};
Store.prototype.setError = function(error) {
  this._set("error", error);
  this._set("phase", PHASES.ERROR);
  this._set("loading", false);
};
Store.prototype.clearError = function() {
  this._set("error", null);
};
Store.prototype.setPhase = function(phase) {
  this._set("phase", phase);
};
Store.prototype.markLoading = function() {
  this._set("phase", PHASES.LOADING);
  this._set("loading", true);
};
Store.prototype.markReady = function() {
  this._set("phase", PHASES.READY);
  this._set("loading", false);
  this._set("lastLoadAt", Date.now());
};
Store.prototype.markSaving = function() {
  this._set("phase", PHASES.SAVING);
};
Store.prototype.markSaved = function() {
  this._set("phase", PHASES.READY);
  this._set("lastSaveAt", Date.now());
};
Store.prototype.getFilteredItems = function() {
  const items = this._state.items, filters = this._state.filters;
  let filtered = (items || []).slice();
  if (filters.section && filters.section !== "all") {
    const sectionFilter = String(filters.section).toLowerCase();
    filtered = filtered.filter((item) => String(item.section || "").toLowerCase() === sectionFilter);
  }
  if (filters.group && filters.group !== "") {
    const groupFilter = String(filters.group);
    filtered = filtered.filter((item) => String(item.parentKey || item.parent_key || "") === groupFilter);
  }
  if (filters.search?.trim().length >= 2) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((item) => item.label?.toLowerCase().includes(q) || item.id?.toLowerCase().includes(q) || item.href?.toLowerCase().includes(q) || item.displayTitle?.toLowerCase().includes(q));
  }
  return filtered;
};
Store.prototype.getItemsGroupedBySection = function() {
  const items = this._state.items, sections = this._state.sections;
  const groups = {};
  const sectionOrder = Object.keys(sections || {}).sort((a, b) => (sections[a]?.order || 99) - (sections[b]?.order || 99));
  for (const sec of sectionOrder) {
    groups[sec] = [];
  }
  for (const item of items || []) {
    const section = item.section || "main";
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }
  return groups;
};
Store.prototype.reset = function() {
  Object.keys(initialState).forEach((key) => {
    if (key === "selectedIds") this._set(key, /* @__PURE__ */ new Set());
    else this._set(key, initialState[key]);
  });
};
Store.prototype.destroy = function() {
  this._sliceListeners.clear();
  this._globalListeners.clear();
  this.reset();
  this._initialized = false;
};
Store.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, phase: this._state.phase, itemCount: this._state.items?.length || 0, sectionCount: Object.keys(this._state.sections || {}).length, sliceListeners: this._sliceListeners.size, globalListeners: this._globalListeners.size, portsInitialized: Ports.isInitialized() };
};
Store.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const checks = { initialized: this._initialized, hasValidState: !!this._state && typeof this._state === "object", hasItems: Array.isArray(this._state.items), hasSections: !!this._state.sections && typeof this._state.sections === "object", loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, phase: this._state.phase, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
};
const store = new Store();
const init = (s = {}) => store.init(s);
const getState = () => store.getState();
const get = (k) => store.get(k);
const setState = (p) => {
  for (const k in p) {
    if (Object.hasOwn(p, k)) store._set(k, p[k]);
  }
};
const set = (k, v) => store._set(k, v);
const setPhase = (p) => store.setPhase(p);
const setItems = (i) => store.setItems(i);
const setSections = (s) => store.setSections(s);
const setIcons = (i) => store.setIcons(i);
const setSelectedItem = (i) => store.setSelectedItem(i);
const setSelectedSection = (s) => store.setSelectedSection(s);
const setError = (e) => store.setError(e);
const clearError = () => store.clearError();
const setFilter = (k, v) => store.setFilter(k, v);
const clearFilters = () => store.clearFilters();
const markLoading = () => store.markLoading();
const markReady = () => store.markReady();
const markSaving = () => store.markSaving();
const markSaved = () => store.markSaved();
const getFilteredItems = () => store.getFilteredItems();
const getItemsGroupedBySection = () => store.getItemsGroupedBySection();
const subscribe = (a, b) => store.subscribe(a, b);
const reset = () => store.reset();
const destroy = () => store.destroy();
const healthCheck = () => store.healthCheck();
const info = () => store.info();
const state = store;
var store_default = store;
export {
  MODULE_ID,
  VERSION,
  clearError,
  clearFilters,
  store_default as default,
  destroy,
  get,
  getFilteredItems,
  getItemsGroupedBySection,
  getPorts,
  getState,
  healthCheck,
  info,
  init,
  injectPorts,
  markLoading,
  markReady,
  markSaved,
  markSaving,
  reset,
  set,
  setError,
  setFilter,
  setIcons,
  setItems,
  setPhase,
  setSections,
  setSelectedItem,
  setSelectedSection,
  setState,
  state,
  store,
  subscribe
};
