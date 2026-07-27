const MODULE_ID = "context-provider-integration-state";
const VERSION = "5.2.0-P1-TIMEOUT";
const integrationState = {
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
const metrics = {
  initCount: 0,
  resetCount: 0,
  cleanupCount: 0,
  globalStateSyncs: 0,
  globalStateErrors: 0,
  globalStateFallbacks: 0,
  orchestratorEvents: 0,
  orchestratorErrors: 0,
  payloadTooLarge: 0,
  retryCancellations: 0,
  // P1-TIMEOUT: conta cancelamentos de retry
  lastInitAt: null,
  lastResetAt: null
};
function resetMetrics() {
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
function resetIntegrationState() {
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
function cancelGlobalStateRetryTimeout() {
  if (integrationState.globalStateRetryTimeoutId !== null) {
    clearTimeout(integrationState.globalStateRetryTimeoutId);
    integrationState.globalStateRetryTimeoutId = null;
    metrics.retryCancellations++;
    return true;
  }
  return false;
}
function cancelOrchestratorRetryTimeout() {
  if (integrationState.orchestratorRetryTimeoutId !== null) {
    clearTimeout(integrationState.orchestratorRetryTimeoutId);
    integrationState.orchestratorRetryTimeoutId = null;
    metrics.retryCancellations++;
    return true;
  }
  return false;
}
var state_default = {
  MODULE_ID,
  VERSION,
  integrationState,
  metrics,
  resetMetrics,
  resetIntegrationState,
  cancelGlobalStateRetryTimeout,
  cancelOrchestratorRetryTimeout
};
export {
  MODULE_ID,
  VERSION,
  cancelGlobalStateRetryTimeout,
  cancelOrchestratorRetryTimeout,
  state_default as default,
  integrationState,
  metrics,
  resetIntegrationState,
  resetMetrics
};
