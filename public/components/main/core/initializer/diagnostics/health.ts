// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.6.0-PATH-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: Initializer - Health & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, PANEL_HOME_PATH from ../constants.js
//   getMetrics as _getMetrics, getInitializationsCount, getErrorsCount, isPanelHo...
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
'use strict';

import { VERSION, MODULE_ID, PANEL_HOME_PATH } from '../constants.js';
import {
  getMetrics as _getMetrics,
  getInitializationsCount,
  getErrorsCount,
  isPanelHomeMounted
} from '../state.js';

// ============================================================================
// METRICS
// ============================================================================

export function getMetrics() {
  return _getMetrics();
}

// ============================================================================
// INFO
// ============================================================================

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics(),
    panelHomePath: PANEL_HOME_PATH,
    p18Compliant: true,
    p0Compliant: true,
    p1HexCompliant: true,
    uxEnhanced: true,
    safeMountEnabled: true,
    panelHomeEnabled: true,
    panelHomeMounted: isPanelHomeMounted()
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export function healthCheck() {
  const inits = getInitializationsCount();
  const errors = getErrorsCount();
  const metrics = getMetrics();
  
  const errorRate = inits > 0 ? (errors / inits) * 100 : 0;
  
  let status = 'HEALTHY';
  if (errorRate > 10) status = 'DEGRADED';
  if (errorRate > 30) status = 'UNHEALTHY';
  
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      totalInits: inits,
      avgInitTime: `${metrics.avgInitTime}ms`,
      errorRate: `${Math.round(errorRate)}%`,
      panelHomeLoads: metrics.panelHomeLoads,
      panelHomeErrors: metrics.panelHomeErrors
    },
    metrics,
    panelHomePath: PANEL_HOME_PATH,
    p18Compliant: true,
    p0Compliant: true,
    p1HexCompliant: true,
    uxEnhanced: true,
    safeMountEnabled: true,
    panelHomeEnabled: true,
    panelHomeMounted: isPanelHomeMounted()
  };
}

export default {
  getMetrics,
  info,
  healthCheck
};
