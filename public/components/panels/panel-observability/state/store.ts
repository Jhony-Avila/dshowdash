declare const _state: { _initialized?: boolean } | null;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-observability/state/store
// PURPOSE: Panel Observability - Store
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
//   updateActions() — exported function
//   updateHealth() — exported function
//   updateMetrics() — exported function
//   addError() — exported function
//   clearErrors() — exported function
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
export const MODULE_ID = 'panel-observability/state/store';

type StoreState = {
  actions: { total: number; accepted: number; rejected: number; errors: number; perMinute: number };
  replays: { total: number; lastAt: number | null };
  snapshots: { total: number; lastAt: number | null };
  health: { status: string; modules: Record<string, unknown>; score: number };
  recentErrors: Array<{ error: unknown; timestamp: number }>;
  metrics: { cpu: number; memory: number; requests: number; latency: number };
  mounted: boolean;
  loading: boolean;
  error: unknown;
  lastUpdate: number | null;
  _initialized: boolean;
};

let _listeners: Array<(state: StoreState) => void> = [];
let _store: StoreState = {
  actions: { total: 0, accepted: 0, rejected: 0, errors: 0, perMinute: 0 },
  replays: { total: 0, lastAt: null },
  snapshots: { total: 0, lastAt: null },
  health: { status: 'unknown', modules: {}, score: 0 },
  recentErrors: [],
  metrics: { cpu: 0, memory: 0, requests: 0, latency: 0 },
  mounted: false,
  loading: false,
  error: null,
  lastUpdate: null,
  _initialized: false
};

export function getState(): StoreState { return Object.assign({}, _store); }
export function get(key: keyof StoreState): StoreState[keyof StoreState] { return key ? _store[key] : getState(); }

export function set(key: keyof StoreState | Partial<StoreState>, value?: unknown): void {
  if (typeof key === 'object') { Object.assign(_store, key); }
  else { (_store as Record<string, unknown>)[key] = value; }
  _store.lastUpdate = Date.now();
  _notify();
}

export function updateActions(actions: Partial<StoreState['actions']>): void { _store.actions = Object.assign({}, _store.actions, actions); _notify(); }
export function updateHealth(health: Partial<StoreState['health']>): void { _store.health = Object.assign({}, _store.health, health); _notify(); }
export function updateMetrics(metrics: Partial<StoreState['metrics']>): void { _store.metrics = Object.assign({}, _store.metrics, metrics); _notify(); }
export function addError(error: unknown): void { _store.recentErrors.unshift({ error, timestamp: Date.now() }); if (_store.recentErrors.length > 50) _store.recentErrors.pop(); _notify(); }
export function clearErrors(): void { _store.recentErrors = []; _notify(); }

export function reset(): void {
  _store = { actions: { total: 0, accepted: 0, rejected: 0, errors: 0, perMinute: 0 }, replays: { total: 0, lastAt: null }, snapshots: { total: 0, lastAt: null }, health: { status: 'unknown', modules: {}, score: 0 }, recentErrors: [], metrics: { cpu: 0, memory: 0, requests: 0, latency: 0 }, mounted: false, loading: false, error: null, lastUpdate: null, _initialized: false };
  _notify();
}

export function subscribe(fn: (state: StoreState) => void): () => void { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; }
function _notify(): void { _listeners.forEach(fn => { try { fn(getState()); } catch (e) {} }); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, storeHealth: _store.health.status }; }

export default { getState, get, set, updateActions, updateHealth, updateMetrics, addError, clearErrors, reset, subscribe };
