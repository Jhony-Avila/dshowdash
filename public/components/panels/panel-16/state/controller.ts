// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P24-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:state-controller
// PURPOSE: StateController - Panel-16 Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EventBusPort from ../ports/index.js
//   StoragePort from ../ports/storage.port.js
//   PANEL_16_STATE_EVENTS from /core/runtime/events/catalog/state.events.js
//
// PROVIDES:
//   StateController — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_16_STATE_EVENTS.BATCH_MUTATION
//   PANEL_16_STATE_EVENTS.HYDRATED
//   PANEL_16_STATE_EVENTS.MUTATION
//   PANEL_16_STATE_EVENTS.RESET
//   PANEL_16_STATE_EVENTS.RESTORED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { EventBusPort } from '../ports/index.js';
import { StoragePort } from '../ports/storage.port.js';
import { PANEL_16_STATE_EVENTS } from '/core/runtime/events/catalog/state.events.js';

const MODULE_ID = 'panel-16:state-controller';
const VERSION = '9.3.0-P2-ENTERPRISE';

const DEFAULT_STATE = Object.freeze({
  filters: {},
  sortColumns: [{ column: 'nome', direction: 'asc' }],
  viewMode: 'normal',
  columns: [],
  savedViews: [],
  favorites: new Set(),
  pinnedLeft: new Set(['checkbox', 'nome']),
  pinnedRight: new Set(['action']),
  selectedRows: new Set(),
  expandedRows: new Set(),
  collapsedGroups: new Set(),
  focusedRowIndex: -1,
  selectedFornecedor: null,
  showColumnsDropdown: false,
  showViewsDropdown: false,
  showAdvancedFilters: false,
  isLoading: false,
  isExporting: false,
  data: { kpis: null, compare: null, list: [], pagination: { total: 0, page: 1, limit: 30 } },
  useInfiniteScroll: false,
  allLoadedData: [],
  hasMoreData: true,
  isLoadingMore: false,
  clientSearchTerm: '',
  lastUpdate: null,
  period: 90,
  activeView: 'default',
  groupBy: ''
});

const STORAGE_KEYS = {
  FILTERS: 'p16_filters',
  VIEW: 'p16_view_mode',
  COLUMNS: 'p16_columns',
  VIEWS: 'p16_saved_views',
  FAVORITES: 'p16_favorites',
  SORT: 'p16_sort',
  PINNED_LEFT: 'p16_pinned_cols_left',
  PINNED_RIGHT: 'p16_pinned_cols_right'
};

const PERSISTENCE_MAP: Record<string, { key: string; type: string; serialize?: (v: unknown) => unknown; deserialize?: (v: unknown) => unknown }> = {
  filters: { key: STORAGE_KEYS.FILTERS, type: 'session' },
  viewMode: { key: STORAGE_KEYS.VIEW, type: 'session' },
  columns: { key: STORAGE_KEYS.COLUMNS, type: 'local' },
  savedViews: { key: STORAGE_KEYS.VIEWS, type: 'local' },
  favorites: { key: STORAGE_KEYS.FAVORITES, type: 'local', serialize(v: unknown) { return Array.from(v as Set<unknown>); }, deserialize(v: unknown) { return new Set((v as unknown[]) || []); } },
  sortColumns: { key: STORAGE_KEYS.SORT, type: 'local' },
  pinnedLeft: { key: STORAGE_KEYS.PINNED_LEFT, type: 'local', serialize(v: unknown) { return Array.from(v as Set<unknown>); }, deserialize(v: unknown) { return new Set((v as unknown[]) || ['checkbox', 'nome']); } },
  pinnedRight: { key: STORAGE_KEYS.PINNED_RIGHT, type: 'local', serialize(v: unknown) { return Array.from(v as Set<unknown>); }, deserialize(v: unknown) { return new Set((v as unknown[]) || ['action']); } }
};

function StateControllerClass(this: any) {
  this._state = this._createInitialState();
  this._subscribers = new Set();
  this._history = [];
  this._maxHistory = 50;
  this._metrics = { mutations: 0, snapshots: 0, restores: 0, subscriptions: 0 };
}

StateControllerClass.prototype._createInitialState = () => Object.assign({}, DEFAULT_STATE);

StateControllerClass.prototype.hydrate = function(defaultColumns: unknown[], defaultViews: unknown[]) {
  defaultColumns = defaultColumns || [];
  defaultViews = defaultViews || [];
  const self = this;
  Object.entries(PERSISTENCE_MAP).forEach(entry => {
    const prop = entry[0];
    const config = entry[1];
    try {
      const storage = config.type === 'local' ? StoragePort.local : StoragePort.session;
      const value = storage.get(config.key);
      if (value !== null) {

        self._state[prop] = config.deserialize ? config.deserialize(value) : value;
      } else if (prop === 'columns' && defaultColumns.length) {
        self._state.columns = defaultColumns;
      } else if (prop === 'savedViews' && defaultViews.length) {
        self._state.savedViews = defaultViews;
      }
    } catch (e) {}
  });
  EventBusPort.emit(PANEL_16_STATE_EVENTS.HYDRATED, { source: MODULE_ID, timestamp: Date.now() });
  return this;
};

StateControllerClass.prototype._persist = function(prop: string) {
  const config = PERSISTENCE_MAP[prop];
  if (!config) return;
  try {
    const storage = config.type === 'local' ? StoragePort.local : StoragePort.session;
    const value = config.serialize ? config.serialize(this._state[prop]) : this._state[prop];
    storage.set(config.key, value);
  } catch (e) {}
};

StateControllerClass.prototype.get = function(prop: string) {
  if (prop) return this._state[prop];
  return Object.assign({}, this._state);
};

StateControllerClass.prototype.set = function(prop: string, value: unknown, options: Record<string, unknown>) {
  options = options || {};
  const prevValue = this._state[prop];
  if (prevValue === value) return this;
  if (options.trackHistory !== false) {
    this._history.push({ prop, value: prevValue, timestamp: Date.now() });
    if (this._history.length > this._maxHistory) this._history = this._history.slice(-this._maxHistory);
  }
  this._state[prop] = value;
  this._metrics.mutations++;
  if (PERSISTENCE_MAP[prop] && options.persist !== false) this._persist(prop);
  if (options.silent !== true) {
    EventBusPort.emit(PANEL_16_STATE_EVENTS.MUTATION, { prop, prevValue: this._serializeForTelemetry(prevValue), newValue: this._serializeForTelemetry(value), source: MODULE_ID, timestamp: Date.now() });
  }
  this._notify(prop, value, prevValue);
  return this;
};

StateControllerClass.prototype.batch = function(updates: Record<string, unknown>, options: Record<string, unknown>) {
  options = options || {};
  const self = this;
  const changes: Array<{ prop: string; prevValue: unknown; newValue: unknown }> = [];
  Object.entries(updates).forEach(entry => {
    const prop = entry[0];
    const value = entry[1];
    const prevValue = self._state[prop];
    if (prevValue !== value) {
      self._state[prop] = value;
      changes.push({ prop, prevValue, newValue: value });
      if (PERSISTENCE_MAP[prop] && options.persist !== false) self._persist(prop);
    }
  });
  if (changes.length > 0) {
    this._metrics.mutations += changes.length;
    if (options.silent !== true) {
      EventBusPort.emit(PANEL_16_STATE_EVENTS.BATCH_MUTATION, { changes: changes.map(c => ({
        prop: c.prop,
        prevValue: self._serializeForTelemetry(c.prevValue),
        newValue: self._serializeForTelemetry(c.newValue)
      })), source: MODULE_ID, timestamp: Date.now() });
    }
    this._notifyBatch(changes);
  }
  return this;
};

StateControllerClass.prototype.subscribe = function(callback: (data: unknown) => void, filter: string | string[] | null) {
  filter = filter || null;
  const subscription = { callback, filter };
  this._subscribers.add(subscription);
  this._metrics.subscriptions++;
  const self = this;
  return () => { self._subscribers.delete(subscription); };
};

StateControllerClass.prototype._notify = function(this: any, prop: string, value: unknown, prevValue: unknown) {
  this._subscribers.forEach(function(sub: { callback: (data: unknown) => void; filter: string | string[] | null }) {
    if (!sub.filter || sub.filter === prop || (Array.isArray(sub.filter) && sub.filter.includes(prop))) {
      // @ts-expect-error strict migration — TS2683
      try { sub.callback({ prop, value, prevValue, state: this._state }); } catch (e) {}
    }
  }, this);
};

StateControllerClass.prototype._notifyBatch = function(this: any, changes: Array<{ prop: string }>) {
  this._subscribers.forEach(function(sub: { callback: (data: unknown) => void; filter: string | string[] | null }) {
    const relevantChanges = sub.filter ? changes.filter((c: { prop: string }) => c.prop === sub.filter || (Array.isArray(sub.filter) && (sub.filter as string[]).includes(c.prop))) : changes;
    if (relevantChanges.length > 0) {
      // @ts-expect-error strict migration — TS2683
      try { sub.callback({ changes: relevantChanges, state: this._state }); } catch (e) {}
    }
  }, this);
};

StateControllerClass.prototype.snapshot = function() {
  this._metrics.snapshots++;
  const snap: Record<string, unknown> = {};
  const self = this;
  Object.entries(this._state).forEach(entry => {
    const key = entry[0];
    const value = entry[1];
    if (value instanceof Set) snap[key] = Array.from(value);
    else if (Array.isArray(value)) snap[key] = value.slice();
    else if (typeof value === 'object' && value !== null) snap[key] = JSON.parse(JSON.stringify(value));
    else snap[key] = value;
  });
  return snap;
};

StateControllerClass.prototype.restore = function(snapshot: Record<string, unknown>, options: Record<string, unknown>) {
  options = options || {};
  if (!snapshot) return this;
  this._metrics.restores++;
  const self = this;
  Object.entries(snapshot).forEach(entry => {
    const key = entry[0];
    const value = entry[1];
    if (DEFAULT_STATE.hasOwnProperty(key)) {

      if ((DEFAULT_STATE as Record<string, unknown>)[key] instanceof Set) self._state[key] = new Set(value as Iterable<unknown>);
      else self._state[key] = value;
      if (PERSISTENCE_MAP[key] && options.persist !== false) self._persist(key);
    }
  });
  EventBusPort.emit(PANEL_16_STATE_EVENTS.RESTORED, { source: MODULE_ID, timestamp: Date.now() });
  this._notifyBatch(Object.keys(snapshot).map(k => ({
    prop: k
  })));
  return this;
};

StateControllerClass.prototype.reset = function(options: Record<string, unknown>) {
  options = options || {};
  this._state = this._createInitialState();
  if (options.clearStorage !== false) {
    Object.values(PERSISTENCE_MAP).forEach(config => {
      const storage = config.type === 'local' ? StoragePort.local : StoragePort.session;
      storage.remove(config.key);
    });
  }
  EventBusPort.emit(PANEL_16_STATE_EVENTS.RESET, { source: MODULE_ID, timestamp: Date.now() });
  this._notifyBatch([{ prop: '*' }]);
  return this;
};

StateControllerClass.prototype._serializeForTelemetry = (value: unknown) => {
  if (value instanceof Set) return `Set(${value.size})`;
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object' && value !== null) return '{...}';
  return value;
};

StateControllerClass.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
StateControllerClass.prototype.getHistory = function() { return this._history.slice(); };

StateControllerClass.prototype.healthCheck = function() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { stateInitialized: !!this._state, subscribersActive: this._subscribers.size, historySize: this._history.length }, metrics: this.getMetrics(), p24Instrumented: true, timestamp: Date.now() };
};

StateControllerClass.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, stateKeys: Object.keys(this._state), persistedKeys: Object.keys(PERSISTENCE_MAP), subscribers: this._subscribers.size, metrics: this.getMetrics() };
};

export const StateController: Record<string, unknown> = new (StateControllerClass as unknown as new () => Record<string, unknown>)();
export default StateController;
export { MODULE_ID, VERSION };
