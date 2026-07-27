// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16-state-store
// PURPOSE: Panel-16 State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
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

export const MODULE_ID = 'panel-16-state-store';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export class StateStore {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this._state = { data: null, loading: false, error: null };
    this._subscribers = [];
    this._debug = options.debug || false;
  }

  getState() { return { ...this._state }; }
  getData() { return this._state.data; }
  isLoading() { return this._state.loading; }
  getError() { return this._state.error; }

  setData(data: unknown) { this._state.data = data; this._state.error = null; this._notify(); }
  setLoading(loading: boolean) { this._state.loading = loading; this._notify(); }
  setError(error: string | null) { this._state.error = error; this._state.loading = false; this._notify(); }
  reset() { this._state = { data: null, loading: false, error: null }; this._notify(); }

  subscribe(callback: (state: Record<string, unknown>) => void) {
    if (typeof callback !== 'function') return () => {};
    this._subscribers.push(callback);
    return () => { const idx = this._subscribers.indexOf(callback); if (idx > -1) this._subscribers.splice(idx, 1); };
  }

  _notify() { const state = this.getState(); this._subscribers.forEach((cb: (s: Record<string, unknown>) => void) => { try { cb(state); } catch (e) {} }); }

  info() { return { moduleId: MODULE_ID, version: VERSION, hasData: !!this._state.data, isLoading: this._state.loading, hasError: !!this._state.error, subscriberCount: this._subscribers.length }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true } }; }
}

export default { StateStore, MODULE_ID, VERSION };
