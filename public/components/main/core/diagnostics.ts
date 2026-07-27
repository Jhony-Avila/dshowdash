// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.1-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-diagnostics
// PURPOSE: Diagnostics - HealthCheck, Info, Metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatUptime() — exported function
//   buildInfo() — exported function
//   buildHealthCheck() — exported function
//   buildMetrics() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { MainState, CircuitBreaker } from '../types.js';

export const VERSION = '2.0.1-ENTERPRISE';
export const MODULE_ID = 'main-diagnostics';

const _metrics = {
  infoCalls: 0,
  healthChecks: 0,
  metricsCalls: 0,
  errors: 0
};

export function formatUptime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function buildInfo(state: MainState, circuitBreaker: CircuitBreaker) {
  _metrics.infoCalls++;
  const uptime = state.initTimestamp ? Date.now() - state.initTimestamp : 0;
  
  return {
    version: state.version,
    moduleId: 'main',
    initialized: state.initialized,
    uptime,
    uptimeFormatted: formatUptime(uptime),
    engine: (state.engine && typeof state.engine.info === 'function') ? (state.engine.info as () => Record<string, unknown>)() : null,
    container: (state.containerAdapter && typeof state.containerAdapter.info === 'function') ? (state.containerAdapter.info as () => Record<string, unknown>)() : null,
    actionHub: (state.actionHub && typeof state.actionHub.info === 'function') ? (state.actionHub.info as () => Record<string, unknown>)() : null,
    primaryContainer: state.primaryContainer ? { id: state.primaryContainer.id, state: state.primaryContainer.state } : null,
    circuitBreaker: circuitBreaker.getStatus(),
    globalMetrics: Object.assign({}, state.globalMetrics),
    portsCount: Object.keys(state.ports || {}).length,
    adaptersCount: Object.keys(state.adapters || {}).length
  };
}

export function buildHealthCheck(state: MainState, circuitBreaker: CircuitBreaker) {
  _metrics.healthChecks++;
  
  if (!state.engine) return { status: 'UNHEALTHY', initialized: false, version: state.version };
  
  const checks: Record<string, any> = {};
  let unhealthyCount = 0;
  let degradedCount = 0;
  
  try {
    checks.engine = (state.engine.healthCheck as () => Record<string, unknown>)();
    if (checks.engine.status === 'UNHEALTHY') unhealthyCount++;
    else if (checks.engine.status === 'DEGRADED') degradedCount++;
  } catch (e) {
    checks.engine = { status: 'ERROR', error: (e as Error).message };
    unhealthyCount++;
    _metrics.errors++;
  }

  try {
    checks.containerAdapter = (state.containerAdapter && typeof state.containerAdapter.healthCheck === 'function') ? (state.containerAdapter.healthCheck as () => Record<string, unknown>)() : { status: 'UNAVAILABLE' };
    if (checks.containerAdapter.status === 'UNHEALTHY') unhealthyCount++;
    else if (checks.containerAdapter.status === 'DEGRADED') degradedCount++;
  } catch (e) {
    checks.containerAdapter = { status: 'ERROR', error: (e as Error).message };
    unhealthyCount++;
    _metrics.errors++;
  }

  try {
    checks.actionHub = (state.actionHub && typeof state.actionHub.healthCheck === 'function') ? (state.actionHub.healthCheck as () => Record<string, unknown>)() : { status: 'UNAVAILABLE' };
    if (checks.actionHub.status === 'unhealthy') unhealthyCount++;
    else if (checks.actionHub.status === 'degraded') degradedCount++;
  } catch (e) {
    checks.actionHub = { status: 'ERROR', error: (e as Error).message };
    unhealthyCount++;
    _metrics.errors++;
  }

  try {
    const mco = (state.engine && typeof state.engine.getMultiContainerOrchestrator === 'function') ? state.engine.getMultiContainerOrchestrator() : null;
    checks.multiContainer = (mco && typeof (mco as Record<string, unknown>).healthCheck === 'function') ? ((mco as Record<string, unknown>).healthCheck as () => Record<string, unknown>)() : { status: 'UNAVAILABLE' };
    if (checks.multiContainer.status === 'UNHEALTHY') unhealthyCount++;
    else if (checks.multiContainer.status === 'DEGRADED') degradedCount++;
  } catch (e) {
    checks.multiContainer = { status: 'ERROR', error: (e as Error).message };
  }

  try {
    const mc = (state.engine && typeof state.engine.getManifestController === 'function') ? state.engine.getManifestController() : null;
    checks.manifest = (mc && typeof (mc as Record<string, unknown>).healthCheck === 'function') ? ((mc as Record<string, unknown>).healthCheck as () => Record<string, unknown>)() : { status: 'UNAVAILABLE' };
  } catch (e) {
    checks.manifest = { status: 'ERROR', error: (e as Error).message };
  }

  try {
    const lc = (state.engine && typeof state.engine.getLayoutController === 'function') ? state.engine.getLayoutController() : null;
    checks.layout = (lc && typeof (lc as Record<string, unknown>).healthCheck === 'function') ? ((lc as Record<string, unknown>).healthCheck as () => Record<string, unknown>)() : { status: 'UNAVAILABLE' };
  } catch (e) {
    checks.layout = { status: 'ERROR', error: (e as Error).message };
  }
  
  const cbStatus = circuitBreaker.getStatus();
  const cbKeys = Object.keys(cbStatus);
  let openCircuits = 0;
  for (let i = 0; i < cbKeys.length; i++) {
    if (cbStatus[cbKeys[i]].isOpen) openCircuits++;
  }
  checks.circuitBreaker = {
    status: openCircuits === 0 ? 'HEALTHY' : 'DEGRADED',
    openCircuits,
    details: cbStatus
  };
  if (openCircuits > 0) degradedCount++;
  
  const adapterChecks: Record<string, unknown> = {};
  const adapterNames = ['router', 'auth', 'telemetry', 'container'];
  for (let j = 0; j < adapterNames.length; j++) {
    const name = adapterNames[j];
    try {
      const adapter = state.adapters ? state.adapters[name] : null;
      adapterChecks[name] = (adapter && typeof (adapter as Record<string, unknown>).healthCheck === 'function' && ((adapter as Record<string, unknown>).healthCheck as () => Record<string, unknown>)().status) ? ((adapter as Record<string, unknown>).healthCheck as () => Record<string, unknown>)().status : (adapter ? 'OK' : 'MISSING');
    } catch (e) {
      adapterChecks[name] = 'ERROR';
    }
  }
  checks.adapters = adapterChecks;
  
  let overallStatus = 'HEALTHY';
  if (unhealthyCount > 0) overallStatus = 'UNHEALTHY';
  else if (degradedCount > 0) overallStatus = 'DEGRADED';
  
  const totalChecks = Object.keys(checks).length;
  const healthyChecks = totalChecks - unhealthyCount - degradedCount;
  
  return {
    status: overallStatus,
    score: `${healthyChecks}/${totalChecks}`,
    initialized: state.initialized,
    version: state.version,
    uptime: state.initTimestamp ? Date.now() - state.initTimestamp : 0,
    checks,
    summary: { healthy: healthyChecks, degraded: degradedCount, unhealthy: unhealthyCount }
  };
}

export function buildMetrics(state: MainState, circuitBreaker: CircuitBreaker) {
  _metrics.metricsCalls++;
  
  const metrics: {
    timestamp: number;
    uptime: number;
    global: unknown;
    circuitBreaker: { totalFailures: number; openCircuits: number; trips: number };
    subsystems: Record<string, any>;
    adapters: Record<string, any>;
  } = {
    timestamp: Date.now(),
    uptime: state.initTimestamp ? Date.now() - state.initTimestamp : 0,
    global: Object.assign({}, state.globalMetrics),
    circuitBreaker: {
      totalFailures: circuitBreaker.getTotalFailures(),
      openCircuits: circuitBreaker.getOpenCount(),
      trips: state.globalMetrics.circuitBreakerTrips
    },
    subsystems: {},
    adapters: {}
  };
  
  try {
    const engineState = (state.engine && typeof state.engine.getState === 'function') ? state.engine.getState() as Record<string, unknown> : null;

    metrics.subsystems.engine = {
      currentPanel: engineState ? engineState.currentPanel : null,
      navigating: engineState ? engineState.navigating : false,
      manifestLoaded: engineState ? engineState.manifestLoaded : false
    };
  } catch (e) {

    metrics.subsystems.engine = { error: (e as Error).message };
  }

  try {

    metrics.subsystems.container = (state.containerAdapter && typeof state.containerAdapter.getMetrics === 'function') ? (state.containerAdapter.getMetrics as () => Record<string, unknown>)() : {};
  } catch (e) {

    metrics.subsystems.container = { error: (e as Error).message };
  }

  try {

    metrics.subsystems.actionHub = (state.actionHub && typeof state.actionHub.getMetrics === 'function') ? (state.actionHub.getMetrics as () => Record<string, unknown>)() : {};
  } catch (e) {

    metrics.subsystems.actionHub = { error: (e as Error).message };
  }

  try {
    const mco = (state.engine && typeof state.engine.getMultiContainerOrchestrator === 'function') ? state.engine.getMultiContainerOrchestrator() : null;

    metrics.subsystems.multiContainer = (mco && typeof (mco as Record<string, unknown>).getMetrics === 'function') ? ((mco as Record<string, unknown>).getMetrics as () => Record<string, unknown>)() : {};
  } catch (e) {

    metrics.subsystems.multiContainer = { error: (e as Error).message };
  }


  const adapterList = ['router', 'auth', 'telemetry', 'panelLoader'];
  for (let i = 0; i < adapterList.length; i++) {
    const name = adapterList[i];
    try {
      const adapter = state.adapters ? state.adapters[name] : null;

      metrics.adapters[name] = (adapter && typeof (adapter as Record<string, unknown>).getMetrics === 'function') ? ((adapter as Record<string, unknown>).getMetrics as () => Record<string, unknown>)() : {};
    } catch (e) {

      metrics.adapters[name] = { error: (e as Error).message };
    }
  }
  
  return metrics;
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics()
  };
}

export function healthCheck() {
  return {
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      infoCalls: _metrics.infoCalls,
      healthChecks: _metrics.healthChecks,
      metricsCalls: _metrics.metricsCalls,
      errors: _metrics.errors
    },
    metrics: getMetrics()
  };
}

export default { 
  formatUptime, 
  buildInfo, 
  buildHealthCheck, 
  buildMetrics, 
  getMetrics, 
  info, 
  healthCheck,
  VERSION, 
  MODULE_ID 
};
