// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-guard-diagnostics
// PURPOSE: Permissions Guard - Diagnostics v5.1.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION as LOGGER_VERSION, _metrics from ./logger.js
//   _integrationsStatus from ./integrations.js
//   permissionsStore from ../state/store.js
//   PermissionChecker from ./checker.js
//   PolicyManager from ./policies.js
//   PermissionsLifecycle from ./lifecycle.js
//   * as Tracker from ../telemetry/tracker.js
//   * as Helpers from ../utils/helpers.js
//   * as Contract from ./contract.js
//   * as RoutesRegistry from ../registry/routes.js
//   * as ModulesRegistry from ../registry/modules.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   createDebugObject() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION as LOGGER_VERSION, _metrics as _metricsImport } from './logger.js';
import { _integrationsStatus } from './integrations.js';
import { permissionsStore as _permissionsStore } from '../state/store.js';

// @ts-expect-error TS migration - TS2614
import { PermissionChecker as _PermissionChecker } from './checker.js';
import { PolicyManager as _PolicyManager } from './policies.js';

// @ts-expect-error TS migration - TS2614
import { PermissionsLifecycle as _PermissionsLifecycle } from './lifecycle.js';
import * as Tracker from '../telemetry/tracker.js';
import * as Helpers from '../utils/helpers.js';
import * as _Contract from './contract.js';
const Contract = _Contract as any;
import * as _RoutesRegistry from '../registry/routes.js';
const RoutesRegistry = _RoutesRegistry as any;
import * as ModulesRegistry from '../registry/modules.js';

const _metrics = _metricsImport as any;
const permissionsStore = _permissionsStore as any;
const PermissionChecker = _PermissionChecker as any;
const PolicyManager = _PolicyManager as any;
const PermissionsLifecycle = _PermissionsLifecycle as any;

export const VERSION = '5.1.0-P18EC';
export const MODULE_ID = 'permissions-guard-diagnostics';

function getEventsInfo() { return { moduleId: 'permissions-guard-events', version: '5.1.0-P18EC' }; }
function getEventsHealthCheck() { return { healthy: true, status: 'HEALTHY' }; }

export function info() {
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

  return { moduleId: MODULE_ID, version: VERSION, status: lifecycle.initialized ? (lifecycle.degraded ? 'DEGRADED' : 'READY') : 'NOT_INITIALIZED', initialized: lifecycle.initialized, degraded: lifecycle.degraded, degradedReason: lifecycle.degradedReason, mode: PolicyManager.getMode(), metrics: { ..._metrics }, integrations: { ..._integrationsStatus }, submodules: { store: storeInfo, checker: checkerInfo, policies: policyInfo, lifecycle, routes: routesInfo, modules: modulesInfo, contract: contractInfo, events: eventsInfo, helpers: helpersInfo, telemetry: trackerStats }, versions: { self: VERSION, store: permissionsStore.getVersion(), checker: PermissionChecker.getVersion(), policies: PolicyManager.getVersion(), lifecycle: PermissionsLifecycle.getVersion(), tracker: Tracker.getVersion(), helpers: Helpers.getVersion(), routes: RoutesRegistry.getVersion(), modules: ModulesRegistry.getVersion(), contract: Contract.getVersion(), events: '5.1.0-P18EC' }, timestamp: Date.now() };
}

export function healthCheck() {
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

  const checks = { initialized: lifecycle.initialized, notDegraded: !lifecycle.degraded, noRecentErrors: !lifecycle.lastError, globalStateConnected: _integrationsStatus.globalStateConnected, orchestratorConnected: _integrationsStatus.orchestratorConnected, storeHealthy: storeHealth.healthy !== false, checkerHealthy: checkerHealth.healthy !== false, policiesHealthy: policiesHealth.healthy !== false, lifecycleHealthy: lifecycleHealth.healthy !== false, contractsHealthy: contractsHealth.healthy !== false, eventsContractsHealthy: eventsHealth.healthy !== false, helpersHealthy: helpersHealth.healthy !== false, routesHealthy: routesHealth.healthy !== false, modulesHealthy: modulesHealth.healthy !== false, trackerHealthy: (trackerHealth as any).healthy !== false, lowDenialRate: _metrics.routeChecks + _metrics.moduleChecks === 0 || (_metrics.denied / (_metrics.routeChecks + _metrics.moduleChecks)) < 0.5 };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  const issues = [];
  if (!lifecycle.initialized) issues.push('Not initialized');
  if (lifecycle.lastError) issues.push(`Last error: ${lifecycle.lastError}`);
  if (lifecycle.degraded) issues.push(`Degraded: ${lifecycle.degradedReason}`);
  if (!_integrationsStatus.globalStateConnected) issues.push('GlobalState not connected');
  if (!_integrationsStatus.orchestratorConnected) issues.push('Orchestrator not connected');
  if (!storeHealth.healthy) issues.push('Store unhealthy');
  if (!checkerHealth.healthy) issues.push('Checker unhealthy');
  if (!policiesHealth.healthy) issues.push('Policies unhealthy');

  let status = 'HEALTHY';
  if (passed < total) status = passed >= total - 3 ? 'DEGRADED' : 'UNHEALTHY';

  return { status, score: `${passed}/${total}`, healthy: status === 'HEALTHY' || status === 'DEGRADED', checks, submoduleHealth: { store: storeHealth.status, checker: checkerHealth.status, policies: policiesHealth.status, lifecycle: lifecycleHealth.status, contracts: contractsHealth.status, events: eventsHealth.status, helpers: helpersHealth.status, routes: routesHealth.status, modules: modulesHealth.status, tracker: trackerHealth.status }, versions: { self: VERSION, store: permissionsStore.getVersion(), checker: PermissionChecker.getVersion(), policies: PolicyManager.getVersion(), lifecycle: PermissionsLifecycle.getVersion(), tracker: Tracker.getVersion(), helpers: Helpers.getVersion() }, integrations: { ..._integrationsStatus }, rolesCount: storeInfo.rolesCount, policiesCount: storeInfo.policiesCount, metrics: { ..._metrics }, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function createDebugObject() {
  return { getStore: () => permissionsStore.toJSON(), getStoreInfo: () => permissionsStore.info(), getEventLog: (limit: number) => Tracker.getEventLog(limit), getRecentEvents: (limit: number) => Tracker.getRecentEvents(limit), clearEventLog: () => Tracker.clearEventLog(), getTrackerStats: () => Tracker.getTrackerStats(), getLifecycleInfo: () => PermissionsLifecycle.getLifecycleInfo(), getMetrics: () => ({ ..._metrics }), getIntegrationsStatus: () => ({ ..._integrationsStatus }), tracker: Tracker, versions: { main: VERSION, store: permissionsStore.getVersion(), checker: PermissionChecker.getVersion(), policies: PolicyManager.getVersion(), lifecycle: PermissionsLifecycle.getVersion(), tracker: Tracker.getVersion(), helpers: Helpers.getVersion(), routes: RoutesRegistry.getVersion(), modules: ModulesRegistry.getVersion() } };
}
