// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.2.0-P1-TIMEOUT)
// ═══════════════════════════════════════════════════════════════
// MODULE: context-provider-integration-state
// PURPOSE: Context Provider - Integration State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   integrationState — exported value
//   metrics — exported value
//   resetMetrics() — exported function
//   resetIntegrationState() — exported function
//   cancelGlobalStateRetryTimeout() — exported function
//   cancelOrchestratorRetryTimeout() — exported function
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

export const MODULE_ID = 'context-provider-integration-state';
export const VERSION = '5.2.0-P1-TIMEOUT';

export const integrationState: {
  orchestratorCleanups: Array<() => void>;
  globalStateCleanups: Array<() => void>;
  strictMode: boolean;
  mapGlobalStateContext: ((state: Record<string, any>) => Record<string, unknown>) | null;
  lastValidGlobalState: Record<string, unknown> | null;
  lastGlobalStateOwner: string | null;
  lastOrchestratorOwner: string | null;
  globalStateRetryCount: number;
  orchestratorRetryCount: number;
  globalStateRetryTimeoutId: ReturnType<typeof setTimeout> | null;
  orchestratorRetryTimeoutId: ReturnType<typeof setTimeout> | null;
} = {
  // Cleanup arrays
  orchestratorCleanups: [],
  globalStateCleanups: [],

  // Config
  strictMode: false,
  mapGlobalStateContext: null,

  // State
  lastValidGlobalState: null,
  lastGlobalStateOwner: null,
  lastOrchestratorOwner: null,

  // Retry counters
  globalStateRetryCount: 0,
  orchestratorRetryCount: 0,

  // Timeout IDs para cancelamento (P1-TIMEOUT)
  globalStateRetryTimeoutId: null,
  orchestratorRetryTimeoutId: null
};

export const metrics = {
  initCount: 0,
  resetCount: 0,
  cleanupCount: 0,
  globalStateSyncs: 0,
  globalStateErrors: 0,
  globalStateFallbacks: 0,
  orchestratorEvents: 0,
  orchestratorErrors: 0,
  payloadTooLarge: 0,
  retryCancellations: 0,  // P1-TIMEOUT: conta cancelamentos de retry
  lastInitAt: null as number | null,
  lastResetAt: null as number | null
};

export function resetMetrics() {
  metrics.initCount = 0;
  metrics.resetCount = 0;
  metrics.cleanupCount = 0;
  metrics.globalStateSyncs = 0;
  metrics.globalStateErrors = 0;
  metrics.globalStateFallbacks = 0;
  metrics.orchestratorEvents = 0;
  metrics.orchestratorErrors = 0;
  metrics.payloadTooLarge = 0;
  metrics.retryCancellations = 0;
  metrics.lastInitAt = null;
  metrics.lastResetAt = null;
}

export function resetIntegrationState() {
  // Cancela timeouts pendentes antes de resetar
  if (integrationState.globalStateRetryTimeoutId !== null) {
    clearTimeout(integrationState.globalStateRetryTimeoutId);
    metrics.retryCancellations++;
  }
  if (integrationState.orchestratorRetryTimeoutId !== null) {
    clearTimeout(integrationState.orchestratorRetryTimeoutId);
    metrics.retryCancellations++;
  }

  integrationState.orchestratorCleanups = [];
  integrationState.globalStateCleanups = [];
  integrationState.strictMode = false;
  integrationState.mapGlobalStateContext = null;
  integrationState.lastValidGlobalState = null;
  integrationState.globalStateRetryCount = 0;
  integrationState.orchestratorRetryCount = 0;
  integrationState.lastGlobalStateOwner = null;
  integrationState.lastOrchestratorOwner = null;
  integrationState.globalStateRetryTimeoutId = null;
  integrationState.orchestratorRetryTimeoutId = null;
}

/**
 * Cancela timeout de retry do GlobalState se existir
 * @returns {boolean} true se cancelou, false se não havia timeout
 */
export function cancelGlobalStateRetryTimeout() {
  if (integrationState.globalStateRetryTimeoutId !== null) {
    clearTimeout(integrationState.globalStateRetryTimeoutId);
    integrationState.globalStateRetryTimeoutId = null;
    metrics.retryCancellations++;
    return true;
  }
  return false;
}

/**
 * Cancela timeout de retry do Orchestrator se existir
 * @returns {boolean} true se cancelou, false se não havia timeout
 */
export function cancelOrchestratorRetryTimeout() {
  if (integrationState.orchestratorRetryTimeoutId !== null) {
    clearTimeout(integrationState.orchestratorRetryTimeoutId);
    integrationState.orchestratorRetryTimeoutId = null;
    metrics.retryCancellations++;
    return true;
  }
  return false;
}

export default {
  MODULE_ID,
  VERSION,
  integrationState,
  metrics,
  resetMetrics,
  resetIntegrationState,
  cancelGlobalStateRetryTimeout,
  cancelOrchestratorRetryTimeout
};
