declare const _state: { _initialized?: boolean } | null;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-dashboard/state/store
// PURPOSE: Panel Dashboard - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   get() — exported function
//   set() — exported function
//   setProps() — exported function
//   setScope() — exported function
//   setWidgets() — exported function
//   addWidget() — exported function
//   removeWidget() — exported function
//   reset() — exported function
//   subscribe() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-dashboard/state/store';

type Widget = Record<string, unknown> & { id?: string };
type StoreState = {
  mounted: boolean;
  loading: boolean;
  error: unknown;
  props: Record<string, unknown>;
  scope: Record<string, unknown>;
  widgets: Widget[];
  layout: string;
  lastUpdate: number | null;
  _initialized: boolean;
};
type Listener = (state: StoreState) => void;

let _listeners: Listener[] = [];
let _store: StoreState = {
  mounted: false,
  loading: false,
  error: null,
  props: {},
  scope: {},
  widgets: [],
  layout: 'grid',
  lastUpdate: null,
  _initialized: false
};

export function getState() { return Object.assign({}, _store); }
export function get(key: keyof StoreState) { return key ? _store[key] : getState(); }

export function set(key: keyof StoreState | Partial<StoreState>, value?: unknown) {
  if (typeof key === 'object') { Object.assign(_store, key); }
  else { (_store as Record<string, unknown>)[key] = value; }
  _store.lastUpdate = Date.now();
  _notify();
}

export function setProps(props: Record<string, unknown>) { _store.props = props || {}; _notify(); }
export function setScope(scope: Record<string, unknown>) { _store.scope = scope || {}; _notify(); }
export function setWidgets(widgets: Widget[]) { _store.widgets = widgets || []; _notify(); }
export function addWidget(widget: Widget) { _store.widgets.push(widget); _notify(); }
export function removeWidget(id: string) { _store.widgets = _store.widgets.filter(w => w.id !== id); _notify(); }

export function reset() {
  _store = { mounted: false, loading: false, error: null, props: {}, scope: {}, widgets: [], layout: 'grid', lastUpdate: null, _initialized: false };
  _notify();
}

export function subscribe(fn: Listener) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; }
function _notify() { _listeners.forEach(fn => { try { fn(getState()); } catch (e) {} }); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, widgetCount: _store.widgets.length }; }

export default { getState, get, set, setProps, setScope, setWidgets, addWidget, removeWidget, reset, subscribe };
