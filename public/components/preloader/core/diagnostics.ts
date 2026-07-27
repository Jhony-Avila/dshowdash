// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Preloader Diagnostics - Enterprise Autocontained
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   PRELOADER_EVENTS, COMPONENT_EVENTS from /core/runtime/events/index.js
//   VERSION, MODULE_ID from ./logger.js
//   PreloaderTelemetry from ../telemetry/tracker.js
//   getProgressSource from ./container-resolver.js
//
// PROVIDES:
//   DIAGNOSTICS_VERSION — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getStatus() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { PRELOADER_EVENTS } from '/core/runtime/events/catalog/preloader.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { VERSION, MODULE_ID } from './logger.js';
import { PreloaderTelemetry } from '../telemetry/tracker.js';
import { getProgressSource } from './container-resolver.js';

declare const getStateVersion: () => string;
declare const getBootManagerVersion: () => string;
declare const getCleanupVersion: () => string;
declare const getTelemetryVersion: () => string;

export const DIAGNOSTICS_VERSION = '1.4.0-BOOTSTRAP-INTEGRATED';
const DIAG_MODULE_ID = 'preloader-diagnostics';
const CONTRACTS_VERSION = '1.3.0-P18EC';

// contractsHealthCheck - inline (was from deleted events-contracts.js)
function contractsHealthCheck() {
  const checks = { preloaderEvents: !!PRELOADER_EVENTS, componentEvents: !!COMPONENT_EVENTS };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: CONTRACTS_VERSION };
}

// getContractsVersion - inline
function getContractsVersion() { return CONTRACTS_VERSION; }

const Ports = createCorePorts({ moduleId: DIAG_MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function healthCheck(preloaderInstance: Record<string, any>) {
  _initPorts();
  const stateHealth = preloaderInstance.state.healthCheck();
  const bootManagerHealth = preloaderInstance.bootManager.healthCheck();
  const cleanupHealth = preloaderInstance.cleanupManager.healthCheck();
  const contractsHealth = contractsHealthCheck();
  const telemetryHealth = PreloaderTelemetry.healthCheck();
  const hasEventBus = !!preloaderInstance.eventBus;
  const hasBootManager = !!preloaderInstance.bootManager;
  const notDestroyed = !preloaderInstance.destroyed;
  const contractsOk = preloaderInstance.contractsValid;
  const globalStateOk = preloaderInstance._integrationsStatus.globalStateConnected;
  const orchestratorOk = preloaderInstance._integrationsStatus.orchestratorConnected;
  const routerOk = preloaderInstance._integrationsStatus.routerGlobalConnected;
  const stateOk = stateHealth.status !== 'UNHEALTHY';
  const bootOk = bootManagerHealth.status !== 'UNHEALTHY';
  const cleanupOk = cleanupHealth.status !== 'UNHEALTHY';
  const checks = { hasEventBus, hasBootManager, notDestroyed, contractsOk, globalStateOk, orchestratorOk, routerOk, stateOk, bootOk, cleanupOk, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const issues = [];
  if (!hasEventBus) issues.push('EventBus not available');
  if (!hasBootManager) issues.push('BootManager not initialized');
  if (preloaderInstance.destroyed) issues.push('Instance destroyed');
  if (!contractsOk) issues.push('Event contracts invalid');
  if (preloaderInstance.finalizing) issues.push('Currently finalizing');
  if (stateHealth.status === 'UNHEALTHY') issues.push('State unhealthy');
  if (bootManagerHealth.status === 'UNHEALTHY') issues.push('BootManager unhealthy');
  
  // v1.4.0: progressSource ao invés de trackerCapabilities
  const progressSource = getProgressSource();
  
  return { 
    status: passed >= 9 ? 'HEALTHY' : (passed >= 6 ? 'DEGRADED' : 'UNHEALTHY'), 
    score: `${passed}/11`, 
    version: VERSION, 
    diagnosticsVersion: DIAGNOSTICS_VERSION, 
    moduleId: MODULE_ID, 
    checks, 
    mounted: preloaderInstance.mounted, 
    destroyed: preloaderInstance.destroyed, 
    showing: preloaderInstance.showing, 
    finalizing: preloaderInstance.finalizing, 
    phase: preloaderInstance.state.fase, 
    progress: preloaderInstance.state.progressoAtual, 
    bootId: preloaderInstance.bootId, 
    bootDuration: preloaderInstance.state.getBootDuration(), 
    forceMode: preloaderInstance.state.forceMode, 
    contractsValid: preloaderInstance.contractsValid, 
    integrations: Object.assign({}, preloaderInstance._integrationsStatus), 
    orchestratorState: preloaderInstance.orchestratorState, 
    // v1.4.0: Bootstrap-v2 é a fonte única de progresso
    progressSource,
    bootstrapIntegrated: true,
    submoduleHealth: { 
      state: stateHealth, 
      bootManager: bootManagerHealth, 
      cleanup: cleanupHealth, 
      contracts: contractsHealth, 
      telemetry: telemetryHealth 
    }, 
    issues: issues.length > 0 ? issues : null, 
    metrics: Object.assign({}, preloaderInstance._metrics), 
    portsInitialized: Ports.isInitialized(), 
    timestamp: Date.now() 
  };
}

export function info(preloaderInstance: Record<string, any>) {
  _initPorts();
  const progressSource = getProgressSource();
  
  return { 
    version: VERSION, 
    diagnosticsVersion: DIAGNOSTICS_VERSION, 
    moduleId: MODULE_ID, 
    status: getStatus(preloaderInstance), 
    healthCheck: healthCheck(preloaderInstance), 
    config: { 
      timeoutGlobal: preloaderInstance.config.timeoutGlobal, 
      timeoutComponentsReady: preloaderInstance.config.timeoutComponentsReady, 
      timeoutLogin: preloaderInstance.config.timeoutLogin, 
      debug: preloaderInstance.config.debug, 
      telemetrySchema: preloaderInstance.config.telemetrySchema 
    }, 
    contracts: { 
      authEventsSource: '/core/runtime/events/index.js', 
      preloaderEventsCount: Object.keys(PRELOADER_EVENTS).length, 
      componentEventsCount: Object.keys(COMPONENT_EVENTS).length, 
      valid: preloaderInstance.contractsValid 
    }, 
    // v1.4.0: Info sobre fonte de progresso
    progressSource,
    bootstrapIntegrated: true,
    trace: { 
      entries: preloaderInstance.bootTrace.length, 
      maxEntries: preloaderInstance.config.maxTraceEntries, 
      lastEntry: preloaderInstance.bootTrace[preloaderInstance.bootTrace.length - 1] || null 
    }, 
    integrations: Object.assign({}, preloaderInstance._integrationsStatus), 
    metrics: Object.assign({}, preloaderInstance._metrics), 
    submodules: { 
      state: preloaderInstance.state.info(), 
      bootManager: preloaderInstance.bootManager.info(), 
      cleanup: preloaderInstance.cleanupManager.info(), 
      telemetry: PreloaderTelemetry.info() 
    }, 
    versions: { 
      self: VERSION, 
      diagnostics: DIAGNOSTICS_VERSION, 
      state: getStateVersion(), 
      bootManager: getBootManagerVersion(), 
      contracts: getContractsVersion(), 
      cleanup: getCleanupVersion(), 
      telemetry: getTelemetryVersion() 
    }, 
    portsInitialized: Ports.isInitialized(), 
    timestamp: Date.now() 
  };
}

export function getStatus(preloaderInstance: Record<string, any>) {
  return { 
    version: VERSION, 
    diagnosticsVersion: DIAGNOSTICS_VERSION, 
    moduleId: MODULE_ID, 
    mounted: preloaderInstance.mounted, 
    destroyed: preloaderInstance.destroyed, 
    showing: preloaderInstance.showing, 
    finalizing: preloaderInstance.finalizing, 
    mountSource: preloaderInstance.mountSource, 
    phase: preloaderInstance.state.fase, 
    progress: preloaderInstance.state.progressoAtual, 
    bootId: preloaderInstance.bootId, 
    bootDuration: preloaderInstance.state.getBootDuration(), 
    orchestratorState: preloaderInstance.orchestratorState, 
    integrations: Object.assign({}, preloaderInstance._integrationsStatus), 
    metrics: Object.assign({}, preloaderInstance._metrics), 
    // v1.4.0: Bootstrap-v2 integrado
    bootstrapIntegrated: true,
    portsInitialized: Ports.isInitialized() 
  };
}

export default { healthCheck, info, getStatus, injectPorts, getPorts, DIAGNOSTICS_VERSION };
