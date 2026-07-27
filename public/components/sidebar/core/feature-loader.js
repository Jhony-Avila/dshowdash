const MODULE_ID = "sidebar.core.feature-loader";
import * as Kernel from "../kernel/index.js";
import { getFeaturesSortedByPriority } from "../features/feature-manifest.js";
import * as MetricsHub from "../telemetry/metrics-hub.js";
import * as CircuitBreaker from "../kernel/circuit-breaker.js";
import { getConfig } from "./config-loader.js";
import { SIDEBAR_FEATURES } from "../features/_barrel.js";
const VERSION = "1.0.1-ENTERPRISE";
function resolveFeaturePath(manifestPath) {
  if (manifestPath.startsWith("./")) {
    return "../" + manifestPath.slice(2);
  }
  if (manifestPath.startsWith("/")) {
    return manifestPath;
  }
  return "../" + manifestPath;
}
async function loadFeatureModule(featureDef, ctx) {
  if (ctx.featureModules.has(featureDef.id)) return ctx.featureModules.get(featureDef.id);
  try {
    const module = SIDEBAR_FEATURES[featureDef.id];
    if (!module) {
      ctx.moduleMetrics.featureErrors++;
      ctx.log("warn", `Feature not found in barrel: ${featureDef.id}`);
      return null;
    }
    ctx.featureModules.set(featureDef.id, module);
    return module;
  } catch (error) {
    ctx.moduleMetrics.featureErrors++;
    ctx.moduleMetrics.lastError = { featureId: featureDef.id, message: error.message, timestamp: Date.now() };
    ctx.log("warn", `Failed to load feature: ${featureDef.id}`, error.message);
    return null;
  }
}
function getFeatureTier(featureId) {
  try {
    const config = getConfig();
    const tiers = config && config.featureTiers || {};
    if (tiers.CORE && tiers.CORE.indexOf(featureId) > -1) return "CORE";
    if (tiers.POST_READY && tiers.POST_READY.indexOf(featureId) > -1) return "POST_READY";
    if (tiers.OPT_IN && tiers.OPT_IN.indexOf(featureId) > -1) return "OPT_IN";
    return "CORE";
  } catch (e) {
    return "CORE";
  }
}
function shouldLoadFeature(featureDef, ctx) {
  if (featureDef.enabled === false) return false;
  if (!ctx.safeMode) return true;
  const tier = getFeatureTier(featureDef.id);
  return tier === "CORE";
}
function shouldAutoEnable(featureDef, ctx) {
  if (featureDef.enabled === false) return false;
  if (featureDef.priority > ctx.config.autoEnableMaxPriority) return false;
  return true;
}
async function registerFeatures(ctx) {
  if (ctx.featuresLoaded) return;
  const sortedFeatures = getFeaturesSortedByPriority();
  if (ctx.config.enableCircuitBreaker) {
    for (let i = 0; i < sortedFeatures.length; i++) {
      CircuitBreaker.configure(sortedFeatures[i].id, {
        failureThreshold: ctx.config.circuitBreakerFailureThreshold,
        timeout: ctx.config.circuitBreakerTimeout
      });
    }
  }
  for (let j = 0; j < sortedFeatures.length; j++) {
    const featureDef = sortedFeatures[j];
    if (!shouldLoadFeature(featureDef, ctx)) {
      ctx.log("debug", `Feature skipped (disabled): ${featureDef.id}`);
      ctx.moduleMetrics.featuresSkipped++;
      continue;
    }
    if (ctx.config.enableCircuitBreaker) {
      const cbCheck = CircuitBreaker.canExecute(featureDef.id);
      if (!cbCheck.allowed) {
        ctx.log("warn", `Feature blocked by circuit breaker: ${featureDef.id}`, cbCheck.reason);
        ctx.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
    }
    try {
      const module = await loadFeatureModule(featureDef, ctx);
      if (!module) {
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordFailure(featureDef.id, "Load failed");
        }
        continue;
      }
      const result = Kernel.registerFeature({
        id: featureDef.id,
        version: module.VERSION || module.default && module.default.VERSION || "0.0.0",
        category: featureDef.category,
        priority: featureDef.priority,
        dependencies: featureDef.dependencies || [],
        capabilities: { requiresEl: featureDef.requiresEl },
        init: module.init || module.default && module.default.init,
        cleanup: module.cleanup || module.destroy || module.default && (module.default.cleanup || module.default.destroy),
        getMetrics: module.getMetrics || module.default && module.default.getMetrics,
        healthCheck: module.healthCheck || module.default && module.default.healthCheck,
        info: module.info || module.default && module.default.info
      });
      if (result.ok) {
        ctx.moduleMetrics.featuresRegistered++;
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordSuccess(featureDef.id);
        }
        if (module.getMetrics || module.default && module.default.getMetrics) {
          MetricsHub.registerSource(featureDef.id, {
            category: featureDef.category,
            version: module.VERSION || module.default && module.default.VERSION || "0.0.0",
            getMetrics: module.getMetrics || module.default && module.default.getMetrics,
            healthCheck: module.healthCheck || module.default && module.default.healthCheck
          });
        }
      } else {
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordFailure(featureDef.id, "Registration failed");
        }
      }
    } catch (error) {
      ctx.moduleMetrics.featureErrors++;
      if (ctx.config.enableCircuitBreaker) {
        CircuitBreaker.recordFailure(featureDef.id, error.message);
      }
      ctx.log("warn", `Failed to register feature: ${featureDef.id}`, error.message);
    }
  }
  ctx.setFeaturesLoaded(true);
}
async function enableFeatures(eventBus, sidebarEl, ctx) {
  const sortedFeatures = getFeaturesSortedByPriority();
  for (let i = 0; i < sortedFeatures.length; i++) {
    const featureDef = sortedFeatures[i];
    if (!shouldLoadFeature(featureDef, ctx)) continue;
    if (!shouldAutoEnable(featureDef, ctx)) continue;
    if (ctx.config.enableCircuitBreaker) {
      const cbCheck = CircuitBreaker.canExecute(featureDef.id);
      if (!cbCheck.allowed) {
        ctx.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
    }
    try {
      if (featureDef.requiresEl && !sidebarEl) continue;
      const opts = {
        eventBus,
        sidebarEl: featureDef.requiresEl ? sidebarEl : void 0
      };
      const result = Kernel.enableFeature(featureDef.id, opts);
      if (result.ok && !(result.data && result.data.alreadyEnabled)) {
        ctx.moduleMetrics.featuresEnabled++;
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordSuccess(featureDef.id);
        }
        ctx.log("debug", `Feature enabled: ${featureDef.id} (priority=${featureDef.priority})`);
      } else if (!result.ok) {
        ctx.moduleMetrics.featureErrors++;
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordFailure(featureDef.id, "Enable failed");
        }
      }
    } catch (error) {
      ctx.moduleMetrics.featureErrors++;
      if (ctx.config.enableCircuitBreaker) {
        CircuitBreaker.recordFailure(featureDef.id, error.message);
      }
      ctx.log("warn", `Failed to enable feature: ${featureDef.id}`, error.message);
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  enableFeatures,
  loadFeatureModule,
  registerFeatures
};
