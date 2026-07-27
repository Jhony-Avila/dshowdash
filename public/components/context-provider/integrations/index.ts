// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: context-provider-integrations
// PURPOSE: Context Provider - Integrations Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setAllDebug() — exported function
//   setupAllIntegrations() — exported function
//   cleanupAllIntegrations() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   integrationState — exported value
//   metrics — exported value
//   resetMetrics — exported value
//   resetIntegrationState — exported value
//   defaultGlobalStateMapper — exported value
//   getMapper — exported value
//   setMapper — exported value
//   setupGlobalStateIntegration — exported value
//   cleanupGlobalStateIntegration — exported value
//   retryGlobalStateIntegration — exported value
//   setDebug — exported value
//   setupOrchestratorIntegration — exported value
//   cleanupOrchestratorIntegration — exported value
//   retryOrchestratorIntegration — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
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

const MODULE_ID = 'context-provider-integrations';
const VERSION = '5.1.0-ENTERPRISE';

export { integrationState, metrics, resetMetrics, resetIntegrationState } from './state.js';
export { defaultGlobalStateMapper, getMapper, setMapper } from './mapper.js';
export { setupGlobalStateIntegration, cleanupGlobalStateIntegration, retryGlobalStateIntegration, setDebug as setGlobalStateDebug } from './globalstate.js';
export { setupOrchestratorIntegration, cleanupOrchestratorIntegration, retryOrchestratorIntegration, setDebug as setOrchestratorDebug } from './orchestrator.js';

import { setupGlobalStateIntegration, cleanupGlobalStateIntegration, retryGlobalStateIntegration } from './globalstate.js';
import { setupOrchestratorIntegration, cleanupOrchestratorIntegration, retryOrchestratorIntegration } from './orchestrator.js';

export async function setAllDebug(enabled: boolean) {
  const { setDebug: setGS } = await import('./globalstate.js');
  const { setDebug: setOrch } = await import('./orchestrator.js');
  setGS(enabled);
  setOrch(enabled);
}

export function setupAllIntegrations() {
  const gsResult = setupGlobalStateIntegration();
  const orchResult = setupOrchestratorIntegration();
  return { globalState: gsResult, orchestrator: orchResult };
}

export function cleanupAllIntegrations() {
  cleanupGlobalStateIntegration();
  cleanupOrchestratorIntegration();
}

// P21: healthCheck
export function healthCheck() {
  return { status: 'HEALTHY', module: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

// Enterprise: info
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['integrationState', 'metrics', 'setupGlobalStateIntegration', 'setupOrchestratorIntegration', 'setupAllIntegrations', 'cleanupAllIntegrations'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export { MODULE_ID, VERSION };

export default {
  MODULE_ID,
  VERSION,
  setupGlobalStateIntegration,
  cleanupGlobalStateIntegration,
  retryGlobalStateIntegration,
  setupOrchestratorIntegration,
  cleanupOrchestratorIntegration,
  retryOrchestratorIntegration,
  setupAllIntegrations,
  cleanupAllIntegrations,
  healthCheck,
  info
};
