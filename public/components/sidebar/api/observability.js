import * as Kernel from "../kernel/index.js";
import * as MetricsHub from "../telemetry/metrics-hub.js";
import * as CircuitBreaker from "../kernel/circuit-breaker.js";
import * as HealthMonitor from "../kernel/health-monitor.js";
import { MODULE_ID } from "../core/constants.js";
const VERSION = "1.0.0-ENTERPRISE";
function createHealthCheck(ctx) {
  return () => {
    const hasInstance = !!ctx.getInstance();
    const hasSidebarEl = !!ctx.getSidebarEl();
    const portsReady = ctx.Ports.isInitialized();
    const kernelHealth = Kernel.healthCheck();
    const metricsHubHealth = MetricsHub.healthCheck();
    const circuitBreakerHealth = ctx.getConfig().enableCircuitBreaker ? CircuitBreaker.healthCheck() : null;
    const healthMonitorHealth = ctx.getConfig().enableHealthMonitor ? HealthMonitor.healthCheck() : null;
    const checks = {
      hasInstance,
      hasSidebarElement: hasSidebarEl,
      portsInitialized: portsReady,
      kernelReady: kernelHealth.status === "HEALTHY",
      metricsHubReady: metricsHubHealth.status === "HEALTHY"
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = "HEALTHY";
    if (passed < total && passed >= Math.floor(total * 0.6)) status = "DEGRADED";
    if (passed < Math.floor(total * 0.6)) status = "UNHEALTHY";
    return {
      status,
      score: { passed, total, percentage: Math.round(passed / total * 100) },
      checks,
      issues: kernelHealth.issues || [],
      moduleId: MODULE_ID,
      version: ctx.VERSION,
      safeMode: ctx.getSafeMode(),
      kernel: kernelHealth,
      metricsHub: metricsHubHealth,
      circuitBreaker: circuitBreakerHealth,
      healthMonitor: healthMonitorHealth,
      moduleMetrics: Object.assign({}, ctx.moduleMetrics),
      ports: { initialized: ctx.Ports.isInitialized(), missing: [] },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  };
}
function createInfo(ctx) {
  return () => ({
    moduleId: MODULE_ID,
    version: ctx.VERSION,
    architecture: "Kernel-Orchestrated",
    safeMode: ctx.getSafeMode(),
    portsInitialized: ctx.Ports.isInitialized(),
    initialized: !!ctx.getInstance(),
    config: Object.assign({}, ctx.getConfig()),
    kernel: Kernel.info().data,
    metricsHub: MetricsHub.info().data,
    circuitBreakerEnabled: ctx.getConfig().enableCircuitBreaker,
    healthMonitorEnabled: ctx.getConfig().enableHealthMonitor,
    moduleMetrics: Object.assign({}, ctx.moduleMetrics),
    featuresLoaded: ctx.getFeaturesLoaded(),
    featureModulesCount: ctx.featureModules.size,
    timestamp: Date.now()
  });
}
function createGetMetrics() {
  return () => MetricsHub.aggregate().data;
}
const kernelNamespace = {
  listFeatures: Kernel.listFeatures,
  getFeatureStatus: Kernel.getFeatureStatus,
  getFeature: Kernel.getFeature,
  enableFeature: Kernel.enableFeature,
  disableFeature: Kernel.disableFeature,
  canDisable: Kernel.canDisable,
  getDependents: Kernel.getDependents,
  getFeaturesByStatus: Kernel.getFeaturesByStatus,
  getFeatureMetrics: Kernel.getFeatureMetrics,
  metrics: Kernel.metrics,
  healthCheck: Kernel.healthCheck,
  exportDiagnostics: Kernel.exportDiagnostics
};
const metricsHubNamespace = {
  aggregate: MetricsHub.aggregate,
  getSourceMetrics: MetricsHub.getSourceMetrics,
  getMetricsByCategory: MetricsHub.getMetricsByCategory,
  takeSnapshot: MetricsHub.takeSnapshot,
  getSnapshots: MetricsHub.getSnapshots,
  compareSnapshots: MetricsHub.compareSnapshots,
  listSources: MetricsHub.listSources
};
const circuitBreakerNamespace = {
  getStatus: CircuitBreaker.getStatus,
  getAllStatus: CircuitBreaker.getAllStatus,
  reset: CircuitBreaker.reset,
  getMetrics: CircuitBreaker.getMetrics,
  healthCheck: CircuitBreaker.healthCheck
};
const healthMonitorNamespace = {
  start: HealthMonitor.start,
  stop: HealthMonitor.stop,
  checkNow: HealthMonitor.checkNow,
  getHistory: HealthMonitor.getHistory,
  getMetrics: HealthMonitor.getMetrics,
  healthCheck: HealthMonitor.healthCheck
};
export {
  VERSION,
  circuitBreakerNamespace,
  createGetMetrics,
  createHealthCheck,
  createInfo,
  healthMonitorNamespace,
  kernelNamespace,
  metricsHubNamespace
};
