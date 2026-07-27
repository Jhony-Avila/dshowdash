// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Focus Manager - Health & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, FOCUSABLE_SELECTORS from ../constants.js
//   getConfig, getStateSnapshot, getMetricsData, isTrapped, getTrapElement from ../state.js
//
// PROVIDES:
//   healthCheck() — exported function
//   getMetrics() — exported function
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

import { VERSION, MODULE_ID, FOCUSABLE_SELECTORS } from '../constants.js';
import { getConfig, getStateSnapshot, getMetricsData, isTrapped, getTrapElement } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check do módulo
 * @returns {Object}
 */
export function healthCheck() {
  const config = getConfig();
  const trapped = isTrapped();
  const trapElement = getTrapElement();
  
  const checks = {
    enabled: config.enabled,
    documentAvailable: typeof document !== 'undefined',
    noStuckTrap: !trapped || !!trapElement
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  const total = keys.length;
  
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    state: getStateSnapshot(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

// ============================================================================
// METRICS
// ============================================================================

/**
 * Retorna métricas
 * @returns {Object}
 */
export function getMetrics() {
  return getMetricsData();
}

// ============================================================================
// INFO
// ============================================================================

/**
 * Info do módulo
 * @returns {Object}
 */
export function info() {
  const config = getConfig();
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    config: Object.assign({}, config),
    state: getStateSnapshot(),
    metrics: getMetricsData(),
    focusableSelectors: FOCUSABLE_SELECTORS,
    timestamp: Date.now()
  };
}

export default {
  healthCheck,
  getMetrics,
  info
};
