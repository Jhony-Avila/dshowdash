const MODULE_ID = "context-provider-integrations";
const VERSION = "5.1.0-ENTERPRISE";
import { integrationState, metrics, resetMetrics, resetIntegrationState } from "./state.js";
import { defaultGlobalStateMapper, getMapper, setMapper } from "./mapper.js";
import { setupGlobalStateIntegration, cleanupGlobalStateIntegration, retryGlobalStateIntegration, setDebug } from "./globalstate.js";
import { setupOrchestratorIntegration, cleanupOrchestratorIntegration, retryOrchestratorIntegration, setDebug as setDebug2 } from "./orchestrator.js";
import { setupGlobalStateIntegration as setupGlobalStateIntegration2, cleanupGlobalStateIntegration as cleanupGlobalStateIntegration2, retryGlobalStateIntegration as retryGlobalStateIntegration2 } from "./globalstate.js";
import { setupOrchestratorIntegration as setupOrchestratorIntegration2, cleanupOrchestratorIntegration as cleanupOrchestratorIntegration2, retryOrchestratorIntegration as retryOrchestratorIntegration2 } from "./orchestrator.js";
async function setAllDebug(enabled) {
  const { setDebug: setGS } = await import("./globalstate.js");
  const { setDebug: setOrch } = await import("./orchestrator.js");
  setGS(enabled);
  setOrch(enabled);
}
function setupAllIntegrations() {
  const gsResult = setupGlobalStateIntegration2();
  const orchResult = setupOrchestratorIntegration2();
  return { globalState: gsResult, orchestrator: orchResult };
}
function cleanupAllIntegrations() {
  cleanupGlobalStateIntegration2();
  cleanupOrchestratorIntegration2();
}
function healthCheck() {
  return { status: "HEALTHY", module: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["integrationState", "metrics", "setupGlobalStateIntegration", "setupOrchestratorIntegration", "setupAllIntegrations", "cleanupAllIntegrations"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var integrations_default = {
  MODULE_ID,
  VERSION,
  setupGlobalStateIntegration: setupGlobalStateIntegration2,
  cleanupGlobalStateIntegration: cleanupGlobalStateIntegration2,
  retryGlobalStateIntegration: retryGlobalStateIntegration2,
  setupOrchestratorIntegration: setupOrchestratorIntegration2,
  cleanupOrchestratorIntegration: cleanupOrchestratorIntegration2,
  retryOrchestratorIntegration: retryOrchestratorIntegration2,
  setupAllIntegrations,
  cleanupAllIntegrations,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  cleanupAllIntegrations,
  cleanupGlobalStateIntegration,
  cleanupOrchestratorIntegration,
  integrations_default as default,
  defaultGlobalStateMapper,
  getMapper,
  healthCheck,
  info,
  integrationState,
  metrics,
  resetIntegrationState,
  resetMetrics,
  retryGlobalStateIntegration,
  retryOrchestratorIntegration,
  setAllDebug,
  setDebug as setGlobalStateDebug,
  setMapper,
  setDebug2 as setOrchestratorDebug,
  setupAllIntegrations,
  setupGlobalStateIntegration,
  setupOrchestratorIntegration
};
