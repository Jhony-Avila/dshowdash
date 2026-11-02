// Boot Manifest - Index (Orchestrator)
// @version 1.5.0-HEALTH-CONTRACT
// @description Barrel export e orquestração do módulo boot-manifest
// @changelog v1.5.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.4.0-ACTION3: Re-exports de phase-globals-contract (Ação 3 — contrato de globais)
// @changelog v1.3.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.3.0-DYNAMIC-TIMEOUT: Sprint 7A #2 - Timeout dinâmico integrado
// @changelog v1.2.0-QUALITY - Modularizado em constants, data, queries, validation
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.5.0)
// ═══════════════════════════════════════════════════════════════
// BARREL: Re-exports from constants, manifest-data, queries, validation, phase-globals-contract
// IMPORTS (direct): getPhaseOrder, getCriticalPhases, getTotalHealthWeight,
//   isDynamicTimeoutEnabled, getAllAdjustedTimeouts from ./queries.js
//   validateManifest from ./validation.js
//   NetworkDetector from ../domain/network-detector.js
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// PROVIDES: info(), healthCheck() + all re-exports
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

// Re-exports de constants
export {
  TIMEOUTS,
  DEGRADATION_MODES,
  BOOT_HEALTH,
  getTimeout,
  getAllTimeouts
} from './constants.js';

// Re-exports de manifest-data
export { BOOT_MANIFEST } from './manifest-data.js';

// Re-exports de queries
export {
  getPhaseById,
  getPhaseOrder,
  getCriticalPhases,
  getNonCriticalPhases,
  getPhaseDependencies,
  getPhaseConfig,
  getTotalHealthWeight,
  getPhaseCount,
  getGlobalConfig,
  // Sprint 7A #2: Dynamic Timeout
  setDynamicTimeoutEnabled,
  isDynamicTimeoutEnabled,
  getAllAdjustedTimeouts
} from './queries.js';

// Re-exports de validation
export {
  validateManifest,
  validateCircularDependencies
} from './validation.js';

// v1.4.0-ACTION3: Re-exports de phase-globals-contract
export {
  PHASE_GLOBALS_CONTRACT,
  getPhaseContract,
  getGlobalCreator,
  getGlobalConsumers,
  validateGlobalsAvailable
} from './phase-globals-contract.js';

// Imports diretos para info/healthCheck
import { getPhaseOrder, getCriticalPhases, getTotalHealthWeight, isDynamicTimeoutEnabled, getAllAdjustedTimeouts } from './queries.js';
import { validateManifest } from './validation.js';
import * as NetworkDetector from '../domain/network-detector.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

export var VERSION = '1.5.0-HEALTH-CONTRACT';
export var MODULE_ID = 'boot-manifest';

export function info() {
  var validation = validateManifest();
  var networkInfo = null;
  try {
    networkInfo = NetworkDetector.getNetworkInfo();
  } catch (e: any) {
    networkInfo = { quality: 'error', error: e.message };
  }
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    manifestVersion: '1.4.0',
    phaseCount: validation.phaseCount,
    criticalPhases: validation.criticalCount,
    totalHealthWeight: getTotalHealthWeight(),
    phaseOrder: getPhaseOrder(),
    valid: validation.valid,
    errors: validation.errors,
    circularDependencyCheck: validation.circularDependencyCheck,
    // Sprint 7A #2
    dynamicTimeoutEnabled: isDynamicTimeoutEnabled(),
    networkQuality: networkInfo.quality,
    quickWinsApplied: ['QW14-CentralizedTimeouts'],
    improvements: ['#2-DynamicTimeouts', '#23-CircularDependencyValidation', 'Modularization', 'ACTION3-PhaseGlobalsContract']
  };
}

export function healthCheck() {
  var validation = validateManifest();
  var networkInfo = null;
  try {
    networkInfo = NetworkDetector.getNetworkInfo();
  } catch (e: any) {
    networkInfo = { quality: 'unknown' };
  }
  
  var status: string = HEALTH_STATUS.HEALTHY;
  if (!validation.valid) {
    status = HEALTH_STATUS.UNHEALTHY;
  }
  
  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      manifestValid: validation.valid,
      noCycles: !validation.circularDependencyCheck.hasCycle,
      networkOnline: networkInfo.online !== false
    },
    details: {
      valid: validation.valid,
      errors: validation.errors,
      hasCycle: validation.circularDependencyCheck.hasCycle,
      dynamicTimeoutEnabled: isDynamicTimeoutEnabled(),
      networkQuality: networkInfo.quality,
      networkOnline: networkInfo.online
    }
  });
}

export default {
  VERSION,
  MODULE_ID,
  TIMEOUTS: undefined, // Re-exported
  DEGRADATION_MODES: undefined, // Re-exported
  BOOT_HEALTH: undefined, // Re-exported
  BOOT_MANIFEST: undefined, // Re-exported
  getPhaseById: undefined, // Re-exported
  getPhaseOrder: undefined, // Re-exported
  getCriticalPhases: undefined, // Re-exported
  getNonCriticalPhases: undefined, // Re-exported
  getPhaseDependencies: undefined, // Re-exported
  getPhaseConfig: undefined, // Re-exported
  getTimeout: undefined, // Re-exported
  getAllTimeouts: undefined, // Re-exported
  validateManifest: undefined, // Re-exported
  validateCircularDependencies: undefined, // Re-exported
  getTotalHealthWeight: undefined, // Re-exported
  // Sprint 7A #2
  setDynamicTimeoutEnabled: undefined,
  isDynamicTimeoutEnabled: undefined,
  getAllAdjustedTimeouts: undefined,
  // v1.4.0-ACTION3: Phase Globals Contract
  PHASE_GLOBALS_CONTRACT: undefined,
  getPhaseContract: undefined,
  getGlobalCreator: undefined,
  getGlobalConsumers: undefined,
  validateGlobalsAvailable: undefined,
  info,
  healthCheck
};
