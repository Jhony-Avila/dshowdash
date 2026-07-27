import { NavRailRegistry } from "../registry/index.js";
import { NavRailFeatureLoader } from "../core/feature-loader.js";
import { createLogger } from "../core/constants.js";
import { getPort } from "../ports.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "nav-rail.component.features";
const _log = createLogger(getPort);
async function initFeatureLoader(component) {
  try {
    NavRailFeatureLoader.init({
      container: component._root,
      eventBus: getPort("eventBus"),
      registry: NavRailRegistry,
      config: component._config
    });
    const cfg = component._config;
    if (cfg.features && Array.isArray(cfg.features)) {
      NavRailFeatureLoader.registerFeatures(cfg.features);
    }
    const featureResults = await NavRailFeatureLoader.loadEagerFeatures();
    component._featuresMounted = true;
    _log("info", "Features loaded", {
      loaded: featureResults.loaded.length,
      failed: featureResults.failed.length
    });
    return featureResults;
  } catch (error) {
    _log("warn", "Feature loader init failed (non-critical)", { error: error.message });
    component._featuresMounted = false;
    return { loaded: [], failed: [] };
  }
}
async function loadFeature(featureId) {
  return NavRailFeatureLoader.loadFeatureOnDemand(featureId);
}
function registerFeature(featureConfig) {
  return NavRailFeatureLoader.registerFeature(featureConfig);
}
function registerFeatures(features) {
  return NavRailFeatureLoader.registerFeatures(features);
}
function getLoadedFeatures() {
  return NavRailFeatureLoader.getLoadedFeatures();
}
function getFailedFeatures() {
  return NavRailFeatureLoader.getFailedFeatures();
}
function isFeatureLoaded(featureId) {
  return NavRailFeatureLoader.isFeatureLoaded(featureId);
}
export {
  MODULE_ID,
  VERSION,
  getFailedFeatures,
  getLoadedFeatures,
  initFeatureLoader,
  isFeatureLoaded,
  loadFeature,
  registerFeature,
  registerFeatures
};
