import { _metrics as _metricsImport } from "./logger.js";
import { _integrationsStatus } from "./integrations.js";
import { permissionsStore as _permissionsStore } from "../state/store.js";
import { PermissionChecker as _PermissionChecker } from "./checker.js";
import { PolicyManager as _PolicyManager } from "./policies.js";
import { PermissionsLifecycle as _PermissionsLifecycle } from "./lifecycle.js";
import * as Tracker from "../telemetry/tracker.js";
import * as Helpers from "../utils/helpers.js";
import * as _Contract from "./contract.js";
const Contract = _Contract;
import * as _RoutesRegistry from "../registry/routes.js";
const RoutesRegistry = _RoutesRegistry;
import * as ModulesRegistry from "../registry/modules.js";
const _metrics = _metricsImport;
const permissionsStore = _permissionsStore;
const PermissionChecker = _PermissionChecker;
const PolicyManager = _PolicyManager;
const PermissionsLifecycle = _PermissionsLifecycle;
const VERSION = "5.1.0-P18EC";
const MODULE_ID = "permissions-guard-diagnostics";
function getEventsInfo() {
  return { moduleId: "permissions-guard-events", version: "5.1.0-P18EC" };
}
function getEventsHealthCheck() {
  return { healthy: true, status: "HEALTHY" };
}
function info() {
  const lifecycle = PermissionsLifecycle.getLifecycleInfo();
  const storeInfo = permissionsStore.info();
  const policyInfo = PolicyManager.info();
  const trackerStats = Tracker.getTrackerStats();
  const checkerInfo = PermissionChecker.info();
  const routesInfo = RoutesRegistry.info();
  const modulesInfo = ModulesRegistry.info();
  const contractInfo = Contract.info();
  const eventsInfo = getEventsInfo();
  const helpersInfo = Helpers.info();
  return { moduleId: MODULE_ID, version: VERSION, status: lifecycle.initialized ? lifecycle.degraded ? "DEGRADED" : "READY" : "NOT_INITIALIZED", initialized: lifecycle.initialized, degraded: lifecycle.degraded, degradedReason: lifecycle.degradedReason, mode: PolicyManager.getMode(), metrics: { ..._metrics }, integrations: { ..._integrationsStatus }, submodules: { store: storeInfo, checker: checkerInfo, policies: policyInfo, lifecycle, routes: routesInfo, modules: modulesInfo, contract: contractInfo, events: eventsInfo, helpers: helpersInfo, telemetry: trackerStats }, versions: { self: VERSION, store: permissionsStore.getVersion(), checker: PermissionChecker.getVersion(), policies: PolicyManager.getVersion(), lifecycle: PermissionsLifecycle.getVersion(), tracker: Tracker.getVersion(), helpers: Helpers.getVersion(), routes: RoutesRegistry.getVersion(), modules: ModulesRegistry.getVersion(), contract: Contract.getVersion(), events: "5.1.0-P18EC" }, timestamp: Date.now() };
}
function healthCheck() {
  const storeHealth = permissionsStore.healthCheck();
  const checkerHealth = PermissionChecker.healthCheck();
  const policiesHealth = PolicyManager.healthCheck();
  const lifecycleHealth = PermissionsLifecycle.healthCheck();
  const contractsHealth = Contract.healthCheck();
  const eventsHealth = getEventsHealthCheck();
  const helpersHealth = Helpers.healthCheck();
  const routesHealth = RoutesRegistry.healthCheck();
  const modulesHealth = ModulesRegistry.healthCheck();
  const trackerHealth = Tracker.healthCheck();
  const lifecycle = PermissionsLifecycle.getLifecycleInfo();
  const storeInfo = permissionsStore.info();
  const checks = { initialized: lifecycle.initialized, notDegraded: !lifecycle.degraded, noRecentErrors: !lifecycle.lastError, globalStateConnected: _integrationsStatus.globalStateConnected, orchestratorConnected: _integrationsStatus.orchestratorConnected, storeHealthy: storeHealth.healthy !== false, checkerHealthy: checkerHealth.healthy !== false, policiesHealthy: policiesHealth.healthy !== false, lifecycleHealthy: lifecycleHealth.healthy !== false, contractsHealthy: contractsHealth.healthy !== false, eventsContractsHealthy: eventsHealth.healthy !== false, helpersHealthy: helpersHealth.healthy !== false, routesHealthy: routesHealth.healthy !== false, modulesHealthy: modulesHealth.healthy !== false, trackerHealthy: trackerHealth.healthy !== false, lowDenialRate: _metrics.routeChecks + _metrics.moduleChecks === 0 || _metrics.denied / (_metrics.routeChecks + _metrics.moduleChecks) < 0.5 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const issues = [];
  if (!lifecycle.initialized) issues.push("Not initialized");
  if (lifecycle.lastError) issues.push(`Last error: ${lifecycle.lastError}`);
  if (lifecycle.degraded) issues.push(`Degraded: ${lifecycle.degradedReason}`);
  if (!_integrationsStatus.globalStateConnected) issues.push("GlobalState not connected");
  if (!_integrationsStatus.orchestratorConnected) issues.push("Orchestrator not connected");
  if (!storeHealth.healthy) issues.push("Store unhealthy");
  if (!checkerHealth.healthy) issues.push("Checker unhealthy");
  if (!policiesHealth.healthy) issues.push("Policies unhealthy");
  let status = "HEALTHY";
  if (passed < total) status = passed >= total - 3 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: `${passed}/${total}`, healthy: status === "HEALTHY" || status === "DEGRADED", checks, submoduleHealth: { store: storeHealth.status, checker: checkerHealth.status, policies: policiesHealth.status, lifecycle: lifecycleHealth.status, contracts: contractsHealth.status, events: eventsHealth.status, helpers: helpersHealth.status, routes: routesHealth.status, modules: modulesHealth.status, tracker: trackerHealth.status }, versions: { self: VERSION, store: permissionsStore.getVersion(), checker: PermissionChecker.getVersion(), policies: PolicyManager.getVersion(), lifecycle: PermissionsLifecycle.getVersion(), tracker: Tracker.getVersion(), helpers: Helpers.getVersion() }, integrations: { ..._integrationsStatus }, rolesCount: storeInfo.rolesCount, policiesCount: storeInfo.policiesCount, metrics: { ..._metrics }, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function createDebugObject() {
  return { getStore: () => permissionsStore.toJSON(), getStoreInfo: () => permissionsStore.info(), getEventLog: (limit) => Tracker.getEventLog(limit), getRecentEvents: (limit) => Tracker.getRecentEvents(limit), clearEventLog: () => Tracker.clearEventLog(), getTrackerStats: () => Tracker.getTrackerStats(), getLifecycleInfo: () => PermissionsLifecycle.getLifecycleInfo(), getMetrics: () => ({ ..._metrics }), getIntegrationsStatus: () => ({ ..._integrationsStatus }), tracker: Tracker, versions: { main: VERSION, store: permissionsStore.getVersion(), checker: PermissionChecker.getVersion(), policies: PolicyManager.getVersion(), lifecycle: PermissionsLifecycle.getVersion(), tracker: Tracker.getVersion(), helpers: Helpers.getVersion(), routes: RoutesRegistry.getVersion(), modules: ModulesRegistry.getVersion() } };
}
export {
  MODULE_ID,
  VERSION,
  createDebugObject,
  healthCheck,
  info
};
