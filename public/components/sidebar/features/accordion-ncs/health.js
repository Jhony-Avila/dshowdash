import NavigationModelLoader from "../../integration/navigation-model-loader.js";
import { ACCORDION_INTENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { VERSION, MODULE_ID, FEATURE_FLAG_KEY, CONTAINER_ID, UARPS_REGION, state, isPortsInitialized } from "./constants.js";
import { isEnabled } from "./feature-flags.js";
import { getLegacyHiddenCount } from "./legacy-nav.js";
function healthCheck() {
  let modelHealth = null;
  try {
    modelHealth = NavigationModelLoader.healthCheck ? NavigationModelLoader.healthCheck() : { healthy: false };
  } catch (e) {
    modelHealth = { healthy: false, error: e.message };
  }
  const checks = {
    initialized: state.initialized,
    featureFlagEnabled: isEnabled(),
    modelLoaderReady: state.modelLoaderReady || modelHealth && (modelHealth.healthy || modelHealth.status === "HEALTHY"),
    portsInitialized: isPortsInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const domInfo = {
    accordionLoaded: state.accordion !== null,
    containerExists: typeof document !== "undefined" && document.getElementById(CONTAINER_ID) !== null,
    legacyHidden: getLegacyHiddenCount() > 0,
    uarpsRegionSet: typeof document !== "undefined" && document.querySelector(`[data-uarps-region="${UARPS_REGION}"]`) !== null
  };
  let status = "HEALTHY";
  if (!state.initialized) {
    status = "NOT_INITIALIZED";
  } else if (passed < total) {
    status = "DEGRADED";
  }
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    checks,
    domInfo,
    modelLoader: modelHealth,
    moduleId: MODULE_ID,
    version: VERSION,
    triggerPattern: "trigger:navigation:item-{id}",
    region: UARPS_REGION,
    timestamp: Date.now()
  };
}
function info() {
  let modelInfo = null;
  try {
    modelInfo = NavigationModelLoader.info ? NavigationModelLoader.info() : {};
  } catch (e) {
    modelInfo = { error: e.message };
  }
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: state.initialized,
    enabled: state.enabled,
    featureFlagKey: FEATURE_FLAG_KEY,
    containerId: CONTAINER_ID,
    accordionLoaded: state.accordion !== null,
    dataSource: modelInfo && modelInfo.source || "none",
    modelVersion: modelInfo && modelInfo.version || null,
    hasModel: modelInfo && modelInfo.hasModel || false,
    isFallback: modelInfo && modelInfo.isFallback || false,
    legacyHiddenCount: getLegacyHiddenCount(),
    navigationEventName: ACCORDION_INTENTS && ACCORDION_INTENTS.SELECT_ITEM || "unknown",
    triggerPattern: "trigger:navigation:item-{id}",
    sectionTriggerPattern: "trigger:navigation:section-{id}",
    region: UARPS_REGION,
    phase: "P0 - Compatibility (3-segment compliant)",
    portsInitialized: isPortsInitialized(),
    modelLoader: modelInfo
  };
}
var health_default = { healthCheck, info };
export {
  health_default as default,
  healthCheck,
  info
};
