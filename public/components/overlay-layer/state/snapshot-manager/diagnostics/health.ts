// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Health & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SNAPSHOT_FORMAT_VERSION from ../constants.js
//   listSnapshots from ../queries/snapshot-queries.js
//
// PROVIDES:
//   configure() — exported function
//   getConfiguration() — exported function
//   getMetrics() — exported function
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

import { VERSION, MODULE_ID, SNAPSHOT_FORMAT_VERSION } from '../constants.js';
import {
  getStore,
  getOpenOverlay,
  getCloseOverlay,
  getConfig as getStateConfig,
  setConfig,
  getSnapshots,
  getSnapshotsCount,
  getMaxSnapshots,
  getLastSnapshot,
  getSnapshotsCreated,
  getRestoresPerformed
} from '../state.js';
import { listSnapshots } from '../queries/snapshot-queries.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Atualiza configuração
 * @param {Object} config
 * @returns {boolean}
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  setConfig(config);
  return true;
}

/**
 * Retorna configuração atual
 * @returns {Object}
 */
export function getConfiguration() {
  return getStateConfig();
}

// Named export compatível com index.js
export { getConfiguration as getConfig };


// ============================================================================
// METRICS
// ============================================================================

/**
 * Retorna métricas
 * @returns {Object}
 */
export function getMetrics() {
  const lastSnapshot = getLastSnapshot();
  return {
    snapshotsStored: getSnapshotsCount(),
    maxSnapshots: getMaxSnapshots(),
    snapshotsCreated: getSnapshotsCreated(),
    restoresPerformed: getRestoresPerformed(),
    lastSnapshotAt: lastSnapshot ? lastSnapshot.timestamp : null
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check
 * @returns {Object}
 */
export function healthCheck() {
  const checks = {
    storeInjected: !!getStore(),
    openFunctionInjected: !!getOpenOverlay(),
    closeFunctionInjected: !!getCloseOverlay(),
    snapshotsWithinLimit: getSnapshotsCount() <= getMaxSnapshots()
  };

  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  const total = keys.length;

  let status = 'HEALTHY';
  if (!checks.storeInjected) status = 'UNHEALTHY';
  else if (passed < total) status = 'DEGRADED';

  return {
    status,
    score: `${passed}/${total}`,
    checks,
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
 * Info do módulo
 * @returns {Object}
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    formatVersion: SNAPSHOT_FORMAT_VERSION,
    config: getStateConfig(),
    metrics: getMetrics(),
    snapshots: listSnapshots(),
    timestamp: Date.now()
  };
}

export default {
  configure,
  getConfig: getConfiguration,
  getMetrics,
  healthCheck,
  info
};
