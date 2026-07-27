import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { VERSION, MODULE_ID, isDebug, _metrics, _integrationsStatus, updateIntegrationsStatus } from "./logger.js";
import * as HealthAggregator from "./health-aggregator.js";
import * as ContractAudit from "./contract-audit.js";
import * as ManifestAudit from "./manifest-audit.js";
const DIAGNOSTICS_VERSION = "3.1.0-ES6";
const Ports = createUiPorts({ moduleId: "header-core-diagnostics" });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function healthCheck(headerInstance) {
  updateIntegrationsStatus();
  _initPorts();
  const coreChecks = {
    mounted: headerInstance.isMounted,
    notDestroyed: !headerInstance.isDestroyed,
    hasLogger: !!headerInstance.logger,
    hasTelemetry: !!headerInstance.telemetry,
    hasStore: !!headerInstance.store,
    hasLifecycle: !!headerInstance.lifecycle,
    hasEventBus: !!headerInstance.eventBus,
    hasFetchClient: !!headerInstance.fetchClient,
    componentsLoaded: !!headerInstance.componentsLoader,
    routerReady: !!headerInstance.routerIntegration,
    lowErrorRate: _metrics.mountCount === 0 || _metrics.errorCount / _metrics.mountCount < 0.3,
    portsInitialized: Ports.isInitialized()
  };
  const corePassed = Object.values(coreChecks).filter(Boolean).length;
  const coreTotal = Object.keys(coreChecks).length;
  let subcomponentsHealth = null;
  const subcomponentsSummary = { total: 0, healthy: 0, degraded: 0, failed: 0, noHealthCheck: 0 };
  if (headerInstance.componentsLoader) {
    subcomponentsHealth = headerInstance.componentsLoader.getSubcomponentsHealth?.() || {};
    for (const name in subcomponentsHealth) {
      if (!subcomponentsHealth.hasOwnProperty(name)) continue;
      const health = subcomponentsHealth[name];
      subcomponentsSummary.total++;
      const status = health.status?.toUpperCase?.() || health.status || "UNKNOWN";
      if (status === "HEALTHY" || status === "MOUNTED") subcomponentsSummary.healthy++;
      else if (status === "DEGRADED") subcomponentsSummary.degraded++;
      else if (status === "FAILED" || status === "TIMEOUT" || status === "ERROR") subcomponentsSummary.failed++;
      else if (status === "NO_HEALTHCHECK") subcomponentsSummary.noHealthCheck++;
    }
  }
  const subHealthRate = subcomponentsSummary.total > 0 ? (subcomponentsSummary.healthy + subcomponentsSummary.degraded * 0.5) / subcomponentsSummary.total : 1;
  const overallScore = corePassed / coreTotal * 0.6 + subHealthRate * 0.4;
  let finalStatus = "HEALTHY";
  if (overallScore < 0.9) finalStatus = "DEGRADED";
  if (overallScore < 0.6 || !coreChecks.mounted) finalStatus = "UNHEALTHY";
  let aggregatedHealth = null;
  try {
    aggregatedHealth = HealthAggregator.aggregateHeader(headerInstance);
  } catch (e) {
  }
  return {
    status: finalStatus,
    overallScore: Math.round(overallScore * 100),
    core: {
      status: corePassed === coreTotal ? "HEALTHY" : corePassed >= coreTotal - 2 ? "DEGRADED" : "UNHEALTHY",
      score: corePassed,
      maxScore: coreTotal,
      scoreDisplay: `${corePassed}/${coreTotal}`,
      checks: coreChecks,
      issues: Object.entries(coreChecks).filter((e) => !e[1]).map((e) => e[0])
    },
    subcomponents: {
      summary: subcomponentsSummary,
      healthRate: Math.round(subHealthRate * 100),
      details: subcomponentsHealth
    },
    aggregated: aggregatedHealth ? {
      status: aggregatedHealth.overallStatus,
      score: aggregatedHealth.overallScore,
      summary: aggregatedHealth.summary
    } : null,
    integrations: Object.assign({}, _integrationsStatus),
    version: VERSION,
    diagnosticsVersion: DIAGNOSTICS_VERSION,
    moduleId: MODULE_ID,
    instanceId: headerInstance.instanceId,
    portsInitialized: Ports.isInitialized(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info(headerInstance) {
  updateIntegrationsStatus();
  _initPorts();
  const loaderInfo = headerInstance.componentsLoader?.info?.() || null;
  const pollingInfo = headerInstance.polling?.info?.() || null;
  let contractAuditInfo = null;
  if (headerInstance.componentsLoader && headerInstance.componentsLoader.components) {
    ContractAudit.auditComponents(headerInstance.componentsLoader.components);
    contractAuditInfo = ContractAudit.info();
  }
  return {
    version: VERSION,
    diagnosticsVersion: DIAGNOSTICS_VERSION,
    moduleId: MODULE_ID,
    debug: isDebug(),
    instanceId: headerInstance.instanceId,
    mounted: headerInstance.isMounted,
    destroyed: headerInstance.isDestroyed,
    reducedMode: headerInstance.reducedMode,
    features: headerInstance.features,
    metrics: Object.assign({}, _metrics),
    integrations: Object.assign({}, _integrationsStatus),
    componentsLoader: loaderInfo,
    polling: pollingInfo,
    contractAudit: contractAuditInfo,
    healthCheck: healthCheck(headerInstance),
    // @ts-expect-error TS migration - TS2339
    eventsInfo: headerInstance.events?.info?.() || null,
    portsInitialized: Ports.isInitialized()
  };
}
function createDebugAPI(getInstanceFn) {
  return {
    getVersion() {
      return VERSION;
    },
    getDiagnosticsVersion() {
      return DIAGNOSTICS_VERSION;
    },
    info() {
      return getInstanceFn()?.info() || { version: VERSION, mounted: false };
    },
    healthCheck() {
      return getInstanceFn()?.healthCheck() || { status: "UNHEALTHY", core: { checks: { mounted: false } } };
    },
    getMetrics() {
      return Object.assign({}, _metrics);
    },
    getIntegrationsStatus() {
      updateIntegrationsStatus();
      return Object.assign({}, _integrationsStatus);
    },
    getSubcomponentsHealth() {
      return getInstanceFn()?.componentsLoader?.getSubcomponentsHealth?.() || {};
    },
    getComponentStatus(name) {
      return getInstanceFn()?.componentsLoader?.getComponentStatus?.(name) || null;
    },
    retryComponent(name) {
      return getInstanceFn()?.componentsLoader?.retryComponent?.(name);
    },
    aggregateHealth() {
      const instance = getInstanceFn();
      return instance ? HealthAggregator.aggregateHeader(instance) : null;
    },
    getHealthSummary() {
      return HealthAggregator.getQuickSummary();
    },
    getProblematicComponents() {
      return HealthAggregator.getProblematicComponents();
    },
    auditContracts() {
      const instance = getInstanceFn();
      if (instance && instance.componentsLoader && instance.componentsLoader.components) {
        return ContractAudit.auditComponents(instance.componentsLoader.components);
      }
      return {};
    },
    getContractAuditInfo() {
      return ContractAudit.info();
    },
    getInvalidContracts() {
      return ContractAudit.getInvalidComponents();
    },
    getGovernanceScore() {
      return ContractAudit.getGovernanceScore();
    },
    auditManifest() {
      const instance = getInstanceFn();
      return ManifestAudit.runAudit(instance?.componentsLoader);
    },
    getManifestAuditInfo() {
      return ManifestAudit.info();
    },
    getPollingMetrics() {
      return getInstanceFn()?.polling?.getMetrics?.() || null;
    },
    getPollingHealth() {
      return getInstanceFn()?.polling?.healthCheck?.() || null;
    },
    forceHealthPoll() {
      return getInstanceFn()?.polling?.forceHealthPoll?.();
    },
    forceAlertsPoll() {
      return getInstanceFn()?.polling?.forceAlertsPoll?.();
    },
    getInstance() {
      return getInstanceFn();
    },
    setDebug(v) {
      const instance = getInstanceFn();
      if (instance) instance.setDebug(v);
    },
    getPorts,
    injectPorts,
    getFullReport() {
      const instance = getInstanceFn();
      if (!instance) return { error: "No instance available" };
      return {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: VERSION,
        diagnosticsVersion: DIAGNOSTICS_VERSION,
        health: instance.healthCheck(),
        info: instance.info(),
        aggregatedHealth: HealthAggregator.aggregateHeader(instance),
        contractAudit: ContractAudit.info(),
        manifestAudit: ManifestAudit.info(),
        pollingMetrics: instance.polling?.getMetrics?.() || null,
        subcomponentsHealth: instance.componentsLoader?.getSubcomponentsHealth?.() || {},
        problematicComponents: HealthAggregator.getProblematicComponents(),
        governanceScore: ContractAudit.getGovernanceScore()
      };
    }
  };
}
var diagnostics_default = { healthCheck, info, createDebugAPI, injectPorts, getPorts, DIAGNOSTICS_VERSION };
export {
  DIAGNOSTICS_VERSION,
  VERSION as HEADER_VERSION,
  createDebugAPI,
  diagnostics_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
