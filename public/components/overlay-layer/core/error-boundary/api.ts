// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, ERROR_TYPES, SEVERITY from ./constants.js
//   config, errors, state, errorHandlers, setConfig, getRecoveryStrategies from ./state.js
//
// PROVIDES:
//   getStats() — exported function
//   configure() — exported function
//   getConfig() — exported function
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

import { VERSION, MODULE_ID, ERROR_TYPES, SEVERITY } from './constants.js';
import { config, errors, state, errorHandlers, setConfig, getRecoveryStrategies } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getStats() {
  const byType = {};
  const bySeverity = {};
  
  for (const error of errors) {
    (byType as DynObj)[error.type] = ((byType as DynObj)[error.type] || 0) + 1;
    (bySeverity as DynObj)[error.severity] = ((bySeverity as DynObj)[error.severity] || 0) + 1;
  }
  
  return {
    total: state.totalErrors,
    current: errors.length,
    recovered: state.recoveredErrors,
    fatal: state.fatalErrors,
    recoveryRate: state.totalErrors > 0 
      ? `${((state.recoveredErrors / state.totalErrors) * 100).toFixed(1)}%`
      : '0%',
    byType,
    bySeverity,
    hasUnrecovered: errors.some(e => !e.recovered)
  };
}

export function configure(newConfig: DynObj) {
  if (!newConfig || typeof newConfig !== 'object') return false;
  setConfig({ ...config, ...newConfig });
  return true;
}

export function getConfig() {
  return { ...config };
}

export function healthCheck() {
  const stats = getStats();
  const recentErrors = errors.filter(e => (Date.now() - e.timestamp) < 60000);
  
  const checks = {
    enabled: config.enabled,
    noFatalErrors: state.fatalErrors === 0,
    lowRecentErrors: recentErrors.length < 10,
    goodRecoveryRate: stats.recoveryRate === '0%' || parseFloat(stats.recoveryRate) > 50,
    historyNotFull: errors.length < config.maxErrors * 0.9
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (state.fatalErrors > 0) status = 'UNHEALTHY';
  else if (recentErrors.length >= 10) status = 'DEGRADED';
  else if (passed < total) status = 'DEGRADED';
  
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    stats: {
      total: state.totalErrors,
      recent: recentErrors.length,
      fatal: state.fatalErrors
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const strategies = getRecoveryStrategies();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    config: getConfig(),
    stats: getStats(),
    errorTypes: ERROR_TYPES,
    severityLevels: SEVERITY,
    registeredStrategies: Object.keys(strategies),
    handlerCount: errorHandlers.length,
    timestamp: Date.now()
  };
}
