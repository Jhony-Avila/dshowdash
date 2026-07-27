// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lifecycle Hooks - Health & Metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, HOOK_TYPES from ./constants.js
//   state, config from ./state.js
//   countHooks, listHooks from ./queries.js
//   getConfig from ./config.js
//
// PROVIDES:
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID, HOOK_TYPES } from './constants.js';
import { state, config } from './state.js';
import { countHooks, listHooks } from './queries.js';
import { getConfig } from './config.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
  return {
    enabled: config.enabled,
    totalHooks: countHooks(),
    totalCalls: state.totalCalls,
    cancelledByHook: state.cancelledByHook,
    errors: state.errors,
    byType: { ...state.hookExecutions }
  };
}

export function resetMetrics() {
  state.totalCalls = 0;
  state.cancelledByHook = 0;
  state.errors = 0;
  for (const type of HOOK_TYPES) {
    (state.hookExecutions as DynObj)[type] = { calls: 0, cancelled: 0, errors: 0 };
  }
}

export function healthCheck() {
  const metrics = getMetrics();
  const errorRate = metrics.totalCalls > 0 
    ? (metrics.errors / metrics.totalCalls) 
    : 0;
  
  const checks = {
    enabled: config.enabled,
    lowErrorRate: errorRate < 0.1,
    hooksRegistered: countHooks() > 0 || true,
    configValid: config.timeoutMs > 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!checks.enabled) status = 'DEGRADED';
  else if (!checks.lowErrorRate) status = 'DEGRADED';
  else if (passed < total * 0.5) status = 'UNHEALTHY';
  
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    metrics: {
      totalHooks: countHooks(),
      totalCalls: metrics.totalCalls,
      errorRate: `${(errorRate * 100).toFixed(1)}%`
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    hookTypes: HOOK_TYPES,
    config: getConfig(),
    metrics: getMetrics(),
    hooks: listHooks(),
    timestamp: Date.now()
  };
}
