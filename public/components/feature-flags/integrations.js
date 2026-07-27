import { getPort } from "./ports.js";
import { featureFlagsStore } from "./state/store.js";
import FlagRegistry from "./core/registry.js";
import { trackFlagEvent } from "./telemetry/tracker.js";
import { FEATURE_FLAGS_EVENTS } from "/core/runtime/events/catalog/feature-flags.events.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
const VERSION = "1.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.integrations";
let orchestratorCleanups = [];
let globalStateCleanups = [];
let _presetHandler = null;
function getOrchestratorCleanups() {
  return orchestratorCleanups;
}
function getGlobalStateCleanups() {
  return globalStateCleanups;
}
function setupGlobalStateIntegration(fetchFlagsFromServer) {
  const globalState = getPort("globalState");
  if (!globalState) return;
  const unsubscribeFlags = globalState.subscribe((featureFlags) => {
    if (featureFlags && typeof featureFlags === "object") {
      for (const [name, value] of Object.entries(featureFlags)) {
        if (value) FlagRegistry.enable(name);
        else FlagRegistry.disable(name);
      }
      trackFlagEvent("flags.global-state.synced", {
        count: Object.keys(featureFlags).length
      });
    }
  }, "flags.featureFlags");
  globalStateCleanups.push(unsubscribeFlags);
  const unsubscribeSession = globalState.subscribe((session) => {
    if (session?.isAuthenticated) {
      fetchFlagsFromServer();
    }
  }, "session");
  globalStateCleanups.push(unsubscribeSession);
  trackFlagEvent("flags.global-state.connected");
}
function cleanupGlobalStateIntegration() {
  globalStateCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  globalStateCleanups = [];
}
function setupOrchestratorIntegration() {
  const eventBus = getPort("eventBus");
  if (!eventBus) return;
  _presetHandler = (data) => {
    if (data?.flags) {
      for (const [name, value] of Object.entries(data.flags)) {
        if (value) FlagRegistry.enable(name);
        else FlagRegistry.disable(name);
      }
      trackFlagEvent("flags.orchestrator.preset-applied", { flags: data.flags });
    }
  };
  eventBus.on(ORCHESTRATOR_EVENTS.PRESET_APPLIED, _presetHandler);
  orchestratorCleanups.push(() => {
    const eb = getPort("eventBus");
    if (eb?.off && _presetHandler) {
      eb.off(ORCHESTRATOR_EVENTS.PRESET_APPLIED, _presetHandler);
    }
  });
  const unsubscribe = featureFlagsStore.subscribe((ref) => {
    const { action, flag } = ref;
    const eb = getPort("eventBus");
    if (action === "flag-changed" && eb?.emit) {
      eb.emit(FEATURE_FLAGS_EVENTS.FLAG_CHANGED, {
        flag,
        timestamp: Date.now()
      });
    }
  });
  orchestratorCleanups.push(unsubscribe);
  trackFlagEvent("flags.orchestrator.connected");
}
function cleanupOrchestratorIntegration() {
  orchestratorCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  orchestratorCleanups = [];
  _presetHandler = null;
}
function healthCheck() {
  const checks = {
    orchestratorConnected: orchestratorCleanups.length > 0,
    globalStateConnected: globalStateCleanups.length > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    orchestratorConnected: orchestratorCleanups.length > 0,
    globalStateConnected: globalStateCleanups.length > 0,
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var integrations_default = {
  setupGlobalStateIntegration,
  cleanupGlobalStateIntegration,
  setupOrchestratorIntegration,
  cleanupOrchestratorIntegration,
  getOrchestratorCleanups,
  getGlobalStateCleanups,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  cleanupGlobalStateIntegration,
  cleanupOrchestratorIntegration,
  integrations_default as default,
  getGlobalStateCleanups,
  getOrchestratorCleanups,
  healthCheck,
  info,
  setupGlobalStateIntegration,
  setupOrchestratorIntegration
};
