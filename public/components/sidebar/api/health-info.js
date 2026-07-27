import { VERSION, MODULE_ID, CAPABILITIES } from "../core/constants.js";
import { isCSSLoaded } from "../core/utils.js";
import { getConfig } from "../core/config-loader.js";
import { getDegradedComponents, getLastError, getStatus } from "../core/error-emitter.js";
let _metrics = { healthChecks: 0, infoRequests: 0 };
function createHealthCheck(dependencies) {
  const { engine, renderer, registry, adapters, initialized } = dependencies;
  return function healthCheck2() {
    _metrics.healthChecks++;
    const engineHealth = engine?.healthCheck?.() || { status: "UNHEALTHY" };
    const rendererHealth = renderer?.healthCheck?.() || { status: "UNHEALTHY" };
    const registryHealth = registry?.healthCheck?.() || { status: "UNHEALTHY" };
    const degradedComponents = getDegradedComponents();
    const status = getStatus();
    const checks = {
      initialized,
      cssLoaded: isCSSLoaded(),
      engineHealthy: engineHealth.status === "HEALTHY",
      rendererHealthy: rendererHealth.status === "HEALTHY",
      registryHealthy: registryHealth.status === "HEALTHY",
      noDegradedComponents: degradedComponents.length === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let finalStatus = "HEALTHY";
    if (!initialized) finalStatus = "UNHEALTHY";
    else if (status === "error") finalStatus = "UNHEALTHY";
    else if (passed < total) finalStatus = "DEGRADED";
    return {
      status: finalStatus,
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      degradedComponents,
      lastError: getLastError(),
      engine: engineHealth,
      renderer: rendererHealth,
      registry: registryHealth,
      adapters: { router: adapters?.router?.healthCheck?.() || { status: "UNKNOWN" }, permissions: adapters?.permissions?.healthCheck?.() || { status: "UNKNOWN" }, ui: adapters?.ui?.healthCheck?.() || { status: "UNKNOWN" } },
      capabilities: CAPABILITIES,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  };
}
function createInfo(dependencies) {
  const { engine, initialized, keyboardNavEnabled, getExpandedSections, healthCheck: healthCheck2 } = dependencies;
  return function info2() {
    _metrics.infoRequests++;
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      initialized,
      status: getStatus(),
      cssLoaded: isCSSLoaded(),
      degradedComponents: getDegradedComponents(),
      expandedSections: getExpandedSections?.() ?? [],
      keyboardNavEnabled,
      state: engine?.getState?.() || null,
      config: getConfig(),
      capabilities: CAPABILITIES,
      healthCheck: healthCheck2()
    };
  };
}
function createGetState(engine) {
  return function getState() {
    return engine?.getState() || null;
  };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { factoryReady: true }, metrics: getMetrics() };
}
var health_info_default = { createHealthCheck, createInfo, createGetState, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createGetState,
  createHealthCheck,
  createInfo,
  health_info_default as default,
  getMetrics,
  healthCheck,
  info
};
