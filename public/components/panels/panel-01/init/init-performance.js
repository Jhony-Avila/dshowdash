import { CONFIG } from "../core/config.js";
import { initFeature, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-performance";
async function initPerformance(ctx, result) {
  const features = CONFIG.features || {};
  const toastModule = await loadFeature("toast", FeatureModules.toast);
  const cbModule = await loadFeature("circuitBreaker", FeatureModules.circuitBreaker);
  if (cbModule) {
    const CircuitBreaker = cbModule.CircuitBreaker;
    result.circuitBreaker = initFeature("circuitBreaker.init", () => new CircuitBreaker({ failureThreshold: 5, resetTimeout: 3e4 }), { fallback: null });
  }
  if (features.deltaUpdates !== false) {
    const deltaModule = await loadFeature("deltaUpdates", FeatureModules.deltaUpdates);
    if (deltaModule && deltaModule.DeltaUpdateManager) {
      const DeltaUpdateManager = deltaModule.DeltaUpdateManager;
      result.deltaUpdates = initFeature("deltaUpdates.init", () => new DeltaUpdateManager({
        onInsert(items) {
          if (toastModule && toastModule.info && items.length > 0) {
            toastModule.info(`${items.length} novos registros`);
          }
        },
        onUpdate(items) {
        },
        onDelete(ids) {
        }
      }), { fallback: null });
    }
  }
  if (features.smartCache !== false) {
    const cacheModule = await loadFeature("smartCache", FeatureModules.smartCache);
    if (cacheModule && cacheModule.SmartCache) {
      const SmartCache = cacheModule.SmartCache;
      result.smartCache = initFeature("smartCache.init", () => new SmartCache({
        maxSize: 100,
        ttl: 5 * 60 * 1e3,
        persist: true
      }), { fallback: null });
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_performance_default = { initPerformance, info };
export {
  MODULE_ID,
  VERSION,
  init_performance_default as default,
  info,
  initPerformance
};
