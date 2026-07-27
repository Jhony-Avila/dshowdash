// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar/api/observability
// PURPOSE: healthCheck, info, getMetrics + kernel/metricsHub/circuitBreaker/healthMonitor namespaces
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Kernel from ../kernel/index.js
//   MetricsHub from ../telemetry/metrics-hub.js
//   CircuitBreaker from ../kernel/circuit-breaker.js
//   HealthMonitor from ../kernel/health-monitor.js
//   MODULE_ID, CAPABILITIES from ../core/constants.js
//
// PROVIDES:
//   createHealthCheck(ctx) — factory for healthCheck()
//   createInfo(ctx) — factory for info()
//   createGetMetrics() — factory for getMetrics()
//   kernelNamespace, metricsHubNamespace, circuitBreakerNamespace, healthMonitorNamespace
//
// RECEIVES (via ctx):
//   ctx.Ports, ctx.getInstance, ctx.getSidebarEl, ctx.getConfig,
//   ctx.moduleMetrics, ctx.getSafeMode, ctx.getFeaturesLoaded,
//   ctx.featureModules, ctx.VERSION
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.0.0: Extracted from sidebar/index.js v7.3.0 during modularization
'use strict';

import * as Kernel from '../kernel/index.js';
import * as MetricsHub from '../telemetry/metrics-hub.js';
import * as CircuitBreaker from '../kernel/circuit-breaker.js';
import * as HealthMonitor from '../kernel/health-monitor.js';
import { MODULE_ID, CAPABILITIES } from '../core/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-ENTERPRISE';

// ── HealthCheck Factory ─────────────────────────────────────
export function createHealthCheck(ctx: DynObj) {
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
      kernelReady: kernelHealth.status === 'HEALTHY',
      metricsHubReady: metricsHubHealth.status === 'HEALTHY'
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = 'HEALTHY';

    if (passed < total && passed >= Math.floor(total * 0.6)) status = 'DEGRADED';
    if (passed < Math.floor(total * 0.6)) status = 'UNHEALTHY';

    return {
      status,
      score: { passed, total, percentage: Math.round((passed / total) * 100) },
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
      ports: { initialized: ctx.Ports.isInitialized(), missing: [] as DynObj[] },
      timestamp: new Date().toISOString()
    };
  };
}

// ── Info Factory ────────────────────────────────────────────
export function createInfo(ctx: DynObj) {
  return () => ({
    moduleId: MODULE_ID,
    version: ctx.VERSION,
    architecture: 'Kernel-Orchestrated',
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

// ── GetMetrics Factory ──────────────────────────────────────
export function createGetMetrics() {
  return () => MetricsHub.aggregate().data;
}

// ── Kernel Namespace ────────────────────────────────────────
export const kernelNamespace = {
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

// ── MetricsHub Namespace ────────────────────────────────────
export const metricsHubNamespace = {
  aggregate: MetricsHub.aggregate,
  getSourceMetrics: MetricsHub.getSourceMetrics,
  getMetricsByCategory: MetricsHub.getMetricsByCategory,
  takeSnapshot: MetricsHub.takeSnapshot,
  getSnapshots: MetricsHub.getSnapshots,
  compareSnapshots: MetricsHub.compareSnapshots,
  listSources: MetricsHub.listSources
};

// ── CircuitBreaker Namespace ────────────────────────────────
export const circuitBreakerNamespace = {
  getStatus: CircuitBreaker.getStatus,
  getAllStatus: CircuitBreaker.getAllStatus,
  reset: CircuitBreaker.reset,
  getMetrics: CircuitBreaker.getMetrics,
  healthCheck: CircuitBreaker.healthCheck
};

// ── HealthMonitor Namespace ─────────────────────────────────
export const healthMonitorNamespace = {
  start: HealthMonitor.start,
  stop: HealthMonitor.stop,
  checkNow: HealthMonitor.checkNow,
  getHistory: HealthMonitor.getHistory,
  getMetrics: HealthMonitor.getMetrics,
  healthCheck: HealthMonitor.healthCheck
};
