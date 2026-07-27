declare const _state: Record<string, unknown>;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-chart-store
// PURPOSE: ChartStore - Anti-Flicker
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

export class ChartStore {
  [key: string]: any;
  constructor() {
    this._state = { loading: false, error: null, data: null, dataHash: null };
    this._listeners = new Set();
    this._pending = false;
  }

  _hash(data: unknown) {
    if (!data) return null;
    try { return JSON.stringify(data); } catch { return null; }
  }

  subscribe(fn: (state: Record<string, unknown>) => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _notify() {
    if (this._pending) return;
    this._pending = true;
    queueMicrotask(() => {
      this._pending = false;
      this._listeners.forEach((fn: (state: Record<string, unknown>) => void) => { try { fn(this._state); } catch {} });
    });
  }

  getState() { return this._state; }
  hasData() { return this._state.data !== null; }
  hasError() { return this._state.error !== null; }
  getError() { return this._state.error; }

  setLoading(loading: boolean) {
    if (this._state.data && loading) return; // Anti-flicker
    this._state.loading = loading;
    this._notify();
  }

  setError(error: string | null) {
    this._state = { ...this._state, error, loading: false };
    this._notify();
  }

  setData(data: unknown) {
    const hash = this._hash(data);
    if (hash === this._state.dataHash) return; // Anti-flicker
    this._state = { loading: false, error: null, data, dataHash: hash };
    this._notify();
  }

  reset() {
    this._state = { loading: false, error: null, data: null, dataHash: null };
    this._listeners.clear();
  }
}

export default ChartStore;

export const MODULE_ID = 'panels-ui-chart-store';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true } }; }
