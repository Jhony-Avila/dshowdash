// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-port
// PURPOSE: StatePort - Contrato de Estado Global
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createStatePort() — exported function
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

export const VERSION = '2.0.0-AAA-P4';
export const MODULE_ID = 'state-port';

export function createStatePort(deps: Record<string, unknown> = {}) {
  const { get, set, subscribe, createSlice, select, getState } = deps;
  let _metrics = { gets: 0, sets: 0, subscribes: 0, errors: 0 };
  
  return {
    get(key: string) {
      _metrics.gets++;
      if (typeof get === 'function') return get(key); 
      _metrics.errors++;
      throw new Error('StatePort.get not implemented'); 
    },
    set(key: string, value: unknown) {
      _metrics.sets++;
      if (typeof set === 'function') return set(key, value); 
      _metrics.errors++;
      throw new Error('StatePort.set not implemented'); 
    },
    subscribe(key: string, handler: (value: unknown) => void) {
      _metrics.subscribes++;
      if (typeof subscribe === 'function') return subscribe(key, handler); 
      _metrics.errors++;
      throw new Error('StatePort.subscribe not implemented'); 
    },
    getState() { if (typeof getState === 'function') return getState(); return {}; },
    createSlice(name: string, initialState: unknown, reducers: Record<string, unknown>) { if (typeof createSlice === 'function') return createSlice(name, initialState, reducers); return null; },
    select(selectorFn: (state: unknown) => unknown) { if (typeof select === 'function') return select(selectorFn); return null; },
    info() { return { version: VERSION, moduleId: MODULE_ID }; },
    getMetrics() { return { ..._metrics }; },
    healthCheck() {
      const hasGet = typeof get === 'function';
      const hasSet = typeof set === 'function';
      const hasSubscribe = typeof subscribe === 'function';
      let status = 'HEALTHY';
      if (!hasGet || !hasSet) status = 'DEGRADED';
      if (_metrics.errors > 5) status = 'DEGRADED';
      return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasGet, hasSet, hasSubscribe }, metrics: _metrics };
    }
  };
}

export default { createStatePort, VERSION, MODULE_ID };
