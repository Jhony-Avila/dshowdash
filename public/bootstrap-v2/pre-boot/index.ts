// Pre-Boot Module Index
// @version 1.4.0-HEALTH-CONTRACT
// @description NPM-ready exports do módulo Pre-Boot (Stage -1)
// @changelog v1.3.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.3.0-NPM-READY: #27 Estrutura NPM com package.json e README
// @changelog v1.2.0-PERSISTENCE: #15 Cache de módulos idempotentes
// @changelog v1.1.0-QUICKWINS: QW#03 Browser Check integrado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.1)
// ═══════════════════════════════════════════════════════════════
// BARREL: Re-exports from pre-boot-contract, pre-boot-orchestrator,
//   browser-check
// WINDOW ACCESS: None (pure re-export)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

// ============================================================================
// CONTRACT EXPORTS
// ============================================================================

export {
  PRE_BOOT_STATES,
  PRE_BOOT_EVENTS,
  PRE_BOOT_RESULT_CONTRACT,
  validatePreBootResult,
  createPreBootResult
} from './pre-boot-contract.js';

// ============================================================================
// ORCHESTRATOR EXPORTS
// ============================================================================

export {
  createPreBootOrchestrator,
  getInstance,
  resetInstance,
  PRE_BOOT_STATES as ORCHESTRATOR_STATES,
  PRE_BOOT_EVENTS as ORCHESTRATOR_EVENTS
} from './pre-boot-orchestrator.js';

// ============================================================================
// BROWSER CHECK EXPORTS
// ============================================================================

export {
  BROWSER_REQUIREMENTS,
  REQUIRED_FEATURES,
  detectBrowser,
  checkBrowserVersion,
  checkRequiredFeatures,
  runFullCheck as runBrowserCheck,
  // #15: Cache functions
  clearCache as clearBrowserCache,
  isCached as isBrowserCached,
  getCacheStats as getBrowserCacheStats
} from './browser-check.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const VERSION = '1.4.0-HEALTH-CONTRACT';
export const MODULE_ID = '@dshowdash/pre-boot';

export function info() {
  return {
    name: MODULE_ID,
    version: VERSION,
    description: 'Pre-Boot module for DshowDash Bootstrap-V2',
    npmReady: true,
    exports: [
      'PRE_BOOT_STATES',
      'PRE_BOOT_EVENTS',
      'validatePreBootResult',
      'createPreBootResult',
      'createPreBootOrchestrator',
      'getInstance',
      'resetInstance',
      'detectBrowser',
      'checkBrowserVersion',
      'checkRequiredFeatures',
      'runBrowserCheck',
      'clearBrowserCache',
      'isBrowserCached',
      'getBrowserCacheStats'
    ]
  };
}

export function healthCheck() {
  return createHealthResult({
    status: HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    details: { npmReady: true }
  });
}

// ============================================================================
// DEFAULT EXPORT (for CommonJS compatibility)
// ============================================================================

export default {
  VERSION,
  MODULE_ID,
  info,
  healthCheck
};
