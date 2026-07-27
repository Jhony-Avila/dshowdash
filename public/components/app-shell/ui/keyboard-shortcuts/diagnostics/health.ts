/**
 * @file Keyboard Shortcuts - Health & Diagnostics
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/keyboard-shortcuts/diagnostics/health
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../constants.js (VERSION, MODULE_ID)
 * @requires ../state.js (getShortcuts, getGroups, getActiveScope, isEnabled, getConfig, getMetrics, getSubscribers)
 * @requires ../core/registration.js (getGroupList)
 * 
 * @provides getMetrics, healthCheck, info
 * 
 * @description
 * Health check and diagnostics for keyboard shortcuts module.
 * Provides metrics, health status, and module information.
 * 
 * @example
 * import { healthCheck, info, getMetrics } from './health.js';
 * const health = healthCheck();
 * console.log(health.status, health.score);
 * ============================================================================
 */
'use strict';

import { VERSION, MODULE_ID } from '../constants.js';
import { 
  getShortcuts, 
  getGroups, 
  getActiveScope, 
  isEnabled, 
  getConfig, 
  getMetrics as getStateMetrics,
  getSubscribers
} from '../state.js';
import { getGroupList } from '../core/registration.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


// ============================================================================
// METRICS
// ============================================================================

/**
 * Retorna métricas de uso
 * @returns {Object}
 */
export function getMetrics() {
  const metrics = getStateMetrics();
  return {
    triggered: metrics.triggered,
    blocked: metrics.blocked,
    registered: metrics.registered,
    activeShortcuts: getShortcuts().size,
    groups: getGroups().size
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Executa verificação de saúde do módulo
 * @returns {Object}
 */
export function healthCheck() {
  const shortcuts = getShortcuts();
  
  const checks = {
    enabled: isEnabled(),
    hasShortcuts: shortcuts.size > 0,
    noExcessiveShortcuts: shortcuts.size < 100,
    scopeValid: !!getActiveScope()
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  return {
    status: passed >= 3 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${keys.length}`,
    checks,
    activeScope: getActiveScope(),
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

// ============================================================================
// INFO
// ============================================================================

/**
 * Retorna informações completas do módulo
 * @returns {Object}
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: isEnabled(),
    activeScope: getActiveScope(),
    config: Object.assign({}, getConfig()),
    metrics: getMetrics(),
    groups: getGroupList(),
    shortcutCount: getShortcuts().size,
    subscriberCount: getSubscribers().length,
    timestamp: Date.now()
  };
}

export default {
  getMetrics,
  healthCheck,
  info
};
