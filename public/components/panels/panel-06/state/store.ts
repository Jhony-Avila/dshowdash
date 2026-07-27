// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-06-state-store
// PURPOSE: Panel-06 State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
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
export class StateStore {
  [key: string]: any;
  constructor(logger?: { error?: (...args: unknown[]) => void }) {
    this.logger = logger;
    this.state = { current: 'IDLE', loading: false, error: null, data: null, lastUpdate: null };
    this.listeners = new Set();
  }
  subscribe(listener: (state: unknown) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { this.listeners.forEach((fn: (state: unknown) => void) => { try { fn(this.state); } catch (e) { this.logger?.error?.('store.notify', { error: (e as Error).message }); } }); }
  setState(key: string, value: unknown) { this.state[key] = value; this.notify(); }
  setLoading(loading: boolean) { this.setState('loading', loading); }
  setError(error: string | null) { this.setState('error', error); this.setState('loading', false); }
  setData(data: unknown) { this.state = { ...this.state, data, error: null, loading: false, lastUpdate: Date.now() }; this.notify(); }
  reset() { this.state = { current: 'IDLE', loading: false, error: null, data: null, lastUpdate: null }; this.listeners.clear(); }
}

export const store = new StateStore();
export default StateStore;
export const MODULE_ID = 'panels-panel-06-state-store';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true } });
