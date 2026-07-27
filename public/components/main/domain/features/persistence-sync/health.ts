// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID, VERSION, STATE_VERSION from ./constants.js
//   enabled, pendingChanges, metrics from ./state.js
//   getStorage from ./storage.js
//
// PROVIDES:
//   getMetrics() — exported function
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
/**
 * Persistence Sync - Health & Metrics
 * @module persistence-sync/health
 */
'use strict';

import { MODULE_ID, VERSION, STATE_VERSION } from './constants.js';
import { enabled, pendingChanges, metrics } from './state.js';
import { getStorage } from './storage.js';

export function getMetrics() {
  return Object.assign({}, metrics, { pendingChanges: pendingChanges.size });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stateVersion: STATE_VERSION,
    enabled: enabled.value,
    storageAvailable: !!getStorage(),
    pendingChanges: pendingChanges.size,
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const storage = getStorage();
  
  const checks = {
    enabled: enabled.value,
    storageAvailable: !!storage,
    lowValidationErrors: metrics.validationErrors < 10
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!enabled.value) status = 'NOT_INITIALIZED';
  else if (!storage) status = 'DEGRADED';
  else if (metrics.validationErrors >= 10) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    stateVersion: STATE_VERSION,
    checks,
    metrics,
    timestamp: Date.now()
  };
}
