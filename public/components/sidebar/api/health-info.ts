// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-BULLETPROOF-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health-info
// PURPOSE: Sidebar API - Health & Info
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, CAPABILITIES from ../core/constants.js
//   isCSSLoaded from ../core/utils.js
//   getConfig from ../core/config-loader.js
//   getDegradedComponents, getLastError, getStatus from ../core/error-emitter.js
//
// PROVIDES:
//   createHealthCheck() — exported function
//   createInfo() — exported function
//   createGetState() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { VERSION, MODULE_ID, CAPABILITIES } from '../core/constants.js';
import { isCSSLoaded } from '../core/utils.js';
import { getConfig } from '../core/config-loader.js';
import { getDegradedComponents, getLastError, getStatus } from '../core/error-emitter.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export { VERSION, MODULE_ID };


let _metrics = { healthChecks: 0, infoRequests: 0 };

export function createHealthCheck(dependencies: DynObj) {
  const { engine, renderer, registry, adapters, initialized } = dependencies;
  
  return function healthCheck() {
    _metrics.healthChecks++;
    const engineHealth = engine?.healthCheck?.() || { status: 'UNHEALTHY' };
    const rendererHealth = renderer?.healthCheck?.() || { status: 'UNHEALTHY' };
    const registryHealth = registry?.healthCheck?.() || { status: 'UNHEALTHY' };
    const degradedComponents = getDegradedComponents();
    const status = getStatus();
    const checks = {
      initialized,
      cssLoaded: isCSSLoaded(),
      engineHealthy: engineHealth.status === 'HEALTHY',
      rendererHealthy: rendererHealth.status === 'HEALTHY',
      registryHealthy: registryHealth.status === 'HEALTHY',
      noDegradedComponents: degradedComponents.length === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let finalStatus = 'HEALTHY';
    if (!initialized) finalStatus = 'UNHEALTHY';
    else if (status === 'error') finalStatus = 'UNHEALTHY';
    else if (passed < total) finalStatus = 'DEGRADED';
    return {
      status: finalStatus, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`,
      checks, degradedComponents, lastError: getLastError(),
      engine: engineHealth, renderer: rendererHealth, registry: registryHealth,
      adapters: { router: adapters?.router?.healthCheck?.() || { status: 'UNKNOWN' }, permissions: adapters?.permissions?.healthCheck?.() || { status: 'UNKNOWN' }, ui: adapters?.ui?.healthCheck?.() || { status: 'UNKNOWN' } },
      capabilities: CAPABILITIES, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now()
    };
  };
}

export function createInfo(dependencies: DynObj) {
  const { engine, initialized, keyboardNavEnabled, getExpandedSections, healthCheck } = dependencies;
  return function info() {
    _metrics.infoRequests++;
    return {
      version: VERSION, moduleId: MODULE_ID, initialized, status: getStatus(),
      cssLoaded: isCSSLoaded(), degradedComponents: getDegradedComponents(),
      expandedSections: getExpandedSections?.() ?? [], keyboardNavEnabled,
      state: engine?.getState?.() || null, config: getConfig(), capabilities: CAPABILITIES, healthCheck: healthCheck()
    };
  };
}

export function createGetState(engine: DynObj) { return function getState() { return engine?.getState() || null; }; }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { factoryReady: true }, metrics: getMetrics() }; }

export default { createHealthCheck, createInfo, createGetState, getMetrics, info, healthCheck, VERSION, MODULE_ID };
