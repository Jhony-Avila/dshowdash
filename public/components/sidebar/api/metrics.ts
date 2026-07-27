// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-api-metrics
// PURPOSE: Sidebar API - Metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   increment() — exported function
//   set() — exported function
//   get() — exported function
//   getAll() — exported function
//   reset() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.0.0';
export const MODULE_ID = 'sidebar-api-metrics';

const _metrics = {
  toggleAttempts: 0,
  toggleSuccess: 0,
  toggleBlocked: 0,
  syncFailures: 0,
  fallbackUsed: 0,
  atomicTransitions: 0,
  lastToggleAt: null as DynObj
};

export function increment(key: string) {
  if (key in _metrics && typeof (_metrics as DynObj)[key] === 'number') {
    (_metrics as DynObj)[key]++;
  }
}

export function set(key: string, value: string) {
  if (key in _metrics) {
    (_metrics as DynObj)[key] = value;
  }
}

export function get(key: string) {
  return (_metrics as DynObj)[key];
}

export function getAll() {
  return { ..._metrics };
}

export function reset() {
  _metrics.toggleAttempts = 0;
  _metrics.toggleSuccess = 0;
  _metrics.toggleBlocked = 0;
  _metrics.syncFailures = 0;
  _metrics.fallbackUsed = 0;
  _metrics.atomicTransitions = 0;
  _metrics.lastToggleAt = null;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getAll()
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      atomicTransitions: _metrics.atomicTransitions,
      syncFailures: _metrics.syncFailures
    },
    metrics: getAll()
  };
}

export default { increment, set, get, getAll, reset, info, healthCheck, VERSION, MODULE_ID };
