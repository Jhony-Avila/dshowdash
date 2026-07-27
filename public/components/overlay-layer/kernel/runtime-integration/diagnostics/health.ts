// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Runtime Integration - Health & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, VALID_MODES from ../constants.js
//   * as PermissionGate from ../../overlay-permission-gate.js
//   * as DegradationPolicy from ../../degradation-policy.js
//   * as OverlayManifest from ../../overlay-manifest.js
//
// PROVIDES:
//   getAggregatedHealth() — exported function
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

import { VERSION, MODULE_ID, VALID_MODES } from '../constants.js';
import {
  isInitialized,
  getCurrentMode,
  getLastModeChange,
  getRuntimeContext,
  getApplicationKernel,
  getEventBus,
  getPermissionsGuard,
  getHealthAggregator,
  getSubscriptions,
  getMetrics
} from '../state.js';
import * as PermissionGate from '../../overlay-permission-gate.js';
import * as DegradationPolicy from '../../degradation-policy.js';
import * as OverlayManifest from '../../overlay-manifest.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


// ============================================================================
// AGGREGATED HEALTH
// ============================================================================

/**
 * Retorna health agregado de todos os componentes
 * @returns {Object}
 */
export function getAggregatedHealth() {
  const manifestHealth = OverlayManifest.healthCheck();
  const gateHealth = PermissionGate.healthCheck();
  const policyHealth = DegradationPolicy.healthCheck();
  
  const components = [
    { name: 'manifest', health: manifestHealth },
    { name: 'permission-gate', health: gateHealth },
    { name: 'degradation-policy', health: policyHealth }
  ];
  
  let totalScore = 0;
  let maxScore = 0;
  let allHealthy = true;
  
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    totalScore += comp.health.score || 0;
    maxScore += comp.health.maxScore || 0;
    if (comp.health.status !== 'HEALTHY') allHealthy = false;
  }
  
  let overallStatus = allHealthy ? 'HEALTHY' : 'DEGRADED';
  if (!isInitialized()) overallStatus = 'UNHEALTHY';
  
  const metrics = getMetrics();
  metrics.healthReports = (metrics.healthReports || 0) + 1;
  
  return {
    status: overallStatus,
    score: totalScore,
    maxScore,
    scoreDisplay: `${totalScore}/${maxScore}`,
    mode: getCurrentMode(),
    integrated: isInitialized() && !!getApplicationKernel(),
    components: {
      manifest: manifestHealth.status,
      permissionGate: gateHealth.status,
      degradationPolicy: policyHealth.status
    },
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check do módulo
 * @returns {Object}
 */
export function healthCheck() {
  const currentMode = getCurrentMode();
  
  const checks = {
    initialized: isInitialized(),
    hasRuntimeContext: !!getRuntimeContext(),
    hasApplicationKernel: !!getApplicationKernel(),
    hasEventBus: !!getEventBus(),
    modeValid: VALID_MODES.indexOf(currentMode) !== -1,
    permissionGateReady: PermissionGate.isInitialized()
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  let status = 'HEALTHY';
  if (passed < keys.length * 0.5) status = 'UNHEALTHY';
  else if (passed < keys.length) status = 'DEGRADED';
  
  return {
    status,
    score: passed,
    maxScore: keys.length,
    scoreDisplay: `${passed}/${keys.length}`,
    checks,
    mode: currentMode,
    metrics: getMetrics(),
    aggregatedHealth: getAggregatedHealth(),
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

// ============================================================================
// INFO
// ============================================================================

/**
 * Informações do módulo
 * @returns {Object}
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: isInitialized(),
    mode: getCurrentMode(),
    lastModeChange: getLastModeChange(),
    integrations: {
      applicationKernel: !!getApplicationKernel(),
      permissionsGuard: !!getPermissionsGuard(),
      healthAggregator: !!getHealthAggregator(),
      eventBus: !!getEventBus()
    },
    subscriptionsCount: getSubscriptions().length,
    metrics: getMetrics(),
    subModules: {
      manifest: OverlayManifest.info(),
      permissionGate: PermissionGate.info(),
      degradationPolicy: DegradationPolicy.info()
    },
    timestamp: Date.now()
  };
}

export default {
  getAggregatedHealth,
  healthCheck,
  info
};
