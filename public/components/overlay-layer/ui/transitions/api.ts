// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer Transitions - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, BUILTIN_TRANSITIONS from ./constants.js
//   _transitions, getConfig, updateConfig, getTotalApplied, getActiveTransitions from ./state.js
//   prefersReducedMotion from ./helpers/motion.js
//   list from ./registry/query.js
//
// PROVIDES:
//   configure() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getConfig — exported value
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

import { VERSION, MODULE_ID, BUILTIN_TRANSITIONS } from './constants.js';
import { _transitions, getConfig, updateConfig, getTotalApplied, getActiveTransitions } from './state.js';
import { prefersReducedMotion } from './helpers/motion.js';
import { list } from './registry/query.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  updateConfig(config);
  return true;
}

export { getConfig };


export function getMetrics() {
  const config = getConfig();
  return {
    enabled: config.enabled,
    defaultTransition: config.defaultTransition,
    totalTransitions: Object.keys(_transitions).length,
    builtinCount: list().filter(t => t.builtin).length,
    customCount: list().filter(t => t.custom).length,
    totalApplied: getTotalApplied(),
    activeTransitions: getActiveTransitions().size,
    reducedMotion: prefersReducedMotion()
  };
}

export function healthCheck() {
  const config = getConfig();
  const metrics = getMetrics();
  
  const checks = {
    enabled: config.enabled,
    hasBuiltins: metrics.builtinCount > 0,
    defaultExists: !!(_transitions as DynObj)[config.defaultTransition],
    noStuckTransitions: metrics.activeTransitions < 10
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    metrics: {
      total: metrics.totalTransitions,
      active: metrics.activeTransitions,
      reducedMotion: metrics.reducedMotion
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
    enabled: getConfig().enabled,
    config: getConfig(),
    metrics: getMetrics(),
    transitions: list(),
    builtinNames: Object.keys(BUILTIN_TRANSITIONS),
    timestamp: Date.now()
  };
}
