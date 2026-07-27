import { VERSION, MODULE_ID } from "./constants.js";
import { templateConfigs } from "./templates.js";
import { activeSkeletons, customTemplates, metrics } from "./state.js";
import { getConfig } from "./config.js";
import { listTemplates } from "./custom.js";
function getMetrics() {
  return {
    created: metrics.created,
    destroyed: metrics.destroyed,
    activeCount: activeSkeletons.size,
    builtInTemplates: Object.keys(templateConfigs).length,
    customTemplates: customTemplates.size
  };
}
function healthCheck() {
  const checks = {
    stylesInjected: typeof document === "undefined" || !!document.getElementById("skeleton-loader-styles"),
    notTooManyActive: activeSkeletons.size < 50,
    templatesAvailable: Object.keys(templateConfigs).length > 0
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    metrics: getMetrics(),
    templates: listTemplates(),
    activeSkeletons: activeSkeletons.size,
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
