// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08.state.store
// PURPOSE: Panel-08 Store Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   subscribe() — exported function
//   dispatch() — exported function
//   getState() — exported function
//   getAlerts() — exported function
//   getMeta() — exported function
//   hasData() — exported function
//   isRefreshInProgress() — exported function
//   reset() — exported function
//   getVersion() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'panel-08.state.store';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => { const L = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null; if (L?.[level]) (L[level] as (...a: unknown[]) => void)(`[${MODULE_ID}]`, ...args); };

const initialState: { mounted: boolean; loading: boolean; refreshInProgress: boolean; error: string | null; alerts: unknown[]; meta: Record<string, unknown>; lastUpdate: number | null; dataHash: string | null; acknowledgedIds: Set<unknown> } = { mounted: false, loading: false, refreshInProgress: false, error: null, alerts: [], meta: {}, lastUpdate: null, dataHash: null, acknowledgedIds: new Set() };

let state = { ...initialState, acknowledgedIds: new Set() };
const listeners = new Set();
let pendingNotify = false;

const hashData = (data: unknown) => { if (!data) return null; try { return JSON.stringify(data); } catch (e) { return null; } };

export function subscribe(listener: (state: typeof initialState) => void) { listeners.add(listener); return () => listeners.delete(listener); }

function notify() {
  if (pendingNotify) return;
  pendingNotify = true;

  // @ts-expect-error TS migration - TS2349
  queueMicrotask(() => { pendingNotify = false; listeners.forEach(fn => { try { fn(state); } catch (e) { _log('error', 'notify error', e); } }); });
}

export function dispatch(action: { type: string; payload?: unknown }) {
  if (action.type === 'SET_LOADING') { if (state.alerts.length > 0 && action.payload) return; state = { ...state, loading: action.payload as boolean }; }
  else if (action.type === 'SET_REFRESH_IN_PROGRESS') { state = { ...state, refreshInProgress: action.payload as boolean }; }
  else if (action.type === 'SET_ALERTS') { const newHash = hashData(action.payload); if (newHash === state.dataHash) { state = { ...state, loading: false }; } else { state = { ...state, alerts: (action.payload as unknown[] | null) || [], dataHash: newHash, loading: false, error: null }; } }
  else if (action.type === 'SET_META') { state = { ...state, meta: (action.payload as Record<string, unknown> | null) || {} }; }
  else if (action.type === 'SET_ERROR') { state = { ...state, error: action.payload as string | null, loading: false }; }
  else if (action.type === 'SET_LAST_REFRESH') { state = { ...state, lastUpdate: action.payload as number }; }
  else if (action.type === 'ACKNOWLEDGE_ALERT') { const newAck = new Set(state.acknowledgedIds); newAck.add(action.payload); state = { ...state, acknowledgedIds: newAck }; }
  else { return; }
  notify();
}

export function getState() { return state; }
export function getAlerts() { return state.alerts; }
export function getMeta() { return state.meta; }
export function hasData() { return state.alerts.length > 0; }
export function isRefreshInProgress() { return state.refreshInProgress; }
export function reset() { state = { ...initialState, acknowledgedIds: new Set() }; listeners.clear(); pendingNotify = false; }
export function getVersion() { return VERSION; }

export function healthCheck() {
  const checks = { stateInitialized: !!state, listenersAvailable: !!listeners, notifyMechanismReady: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, alertsCount: state.alerts.length, listenersCount: listeners.size, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, alertsCount: state.alerts.length, listenersCount: listeners.size, hasData: hasData(), p25Compliant: true }; }

export default { VERSION, MODULE_ID, subscribe, dispatch, getState, getAlerts, getMeta, hasData, isRefreshInProgress, reset, getVersion, healthCheck, info, injectPorts, getPorts };

export class StateStore {
  [key: string]: unknown;
  constructor(logger: Record<string, (...args: unknown[]) => void>) {
    this.logger = logger;
    this.state = { current: 'IDLE', loading: false, error: null, data: null, lastUpdate: null };
    this.listeners = new Set<(s: Record<string, unknown>) => void>();
  }

  subscribe(listener: (s: Record<string, unknown>) => void) { (this.listeners as Set<(s: Record<string, unknown>) => void>).add(listener); return () => (this.listeners as Set<(s: Record<string, unknown>) => void>).delete(listener); }
  notify() { (this.listeners as Set<(s: Record<string, unknown>) => void>).forEach(fn => { try { fn(this.state as Record<string, unknown>); } catch (e) { (this.logger as Record<string, (...a: unknown[]) => void>).error('store.notify', { error: (e as Error).message }); } }); }
  setState(key: string, value: unknown) { (this.state as Record<string, unknown>)[key] = value; this.notify(); }
  setLoading(loading: boolean) { this.setState('loading', loading); }
  setError(error: string | null) { this.setState('error', error); this.setState('loading', false); }
  setData(data: unknown) { this.state = { ...(this.state as Record<string, unknown>), data, error: null, loading: false, lastUpdate: Date.now() }; this.notify(); }
  reset() { this.state = { current: 'IDLE', loading: false, error: null, data: null, lastUpdate: null }; (this.listeners as Set<unknown>).clear(); }
}
