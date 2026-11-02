// Bootstrap-V2 Loader - Public API
// @version 6.3.0-DOMAIN-PURE
// @changelog v6.3.0-DOMAIN-PURE: getKernel() via windowAdapter → window.Kernel fallback (cadeia AAA)
// @changelog v6.2.1: Versão anterior
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.3.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES Kernel via getKernel():
//   1. bootstrapInstance.getKernel() — injeção preferida
//   2. windowAdapter.get('Kernel')   — adapter layer
//   3. window.Kernel                 — último fallback
// IMPORTS: loader/constants, loader/state, domain modules
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID, VERSION, hasWindow } from './constants.js';
import { getPreBootResult, getBootResult, getBootstrapInstance, getPreBootOrchestrator } from './state.js';

import * as ModuleEvents from '../domain/module-events.js';
import * as OpenTelemetryAdapter from '../adapters/OpenTelemetryAdapter.js';
import * as NetworkDetector from '../domain/network-detector.js';
import * as ManifestIntegrity from '../domain/manifest-integrity.js';
import * as PhaseRollback from '../domain/phase-rollback.js';
import * as LazyLoader from '../domain/lazy-loader.js';
import * as BootCancellation from '../domain/boot-cancellation.js';
import * as PartialReinit from '../domain/partial-reinit.js';

// v6.3.0: Resolver Kernel via windowAdapter → window fallback
function _resolveKernel() {
  if (!hasWindow) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var resolved = window.Core.windowAdapter.get('Kernel');
    if (resolved) return resolved;
  }
  return (window as any).Kernel || null;
}

export function getKernel() {
  var instance = getBootstrapInstance();
  if (instance && instance.getKernel) {
    return instance.getKernel();
  }
  return _resolveKernel();
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    sprints: 9,
    totalImprovements: 26,
    features: {
      enterprise: true,
      robust: true,
      observability: true,
      quality: true,
      persistence: true,
      observabilityAdvanced: true,
      resilienceAdvanced: true,
      performance: true,
      featuresToolbar: true,
      featuresIntegration: true
    },
    modules: {
      ModuleEvents: ModuleEvents.info(),
      OpenTelemetry: OpenTelemetryAdapter.info(),
      NetworkDetector: NetworkDetector.info(),
      ManifestIntegrity: ManifestIntegrity.info(),
      PhaseRollback: PhaseRollback.info(),
      LazyLoader: LazyLoader.info(),
      BootCancellation: BootCancellation.info(),
      PartialReinit: PartialReinit.info()
    },
    hasPreBootResult: !!getPreBootResult(),
    hasBootResult: !!getBootResult()
  };
}

export function healthCheck() {
  var orchestrator = getPreBootOrchestrator();
  var instance = getBootstrapInstance();

  var preBootHealth = orchestrator ? orchestrator.healthCheck() : null;
  var bootstrapHealth = instance ? instance.healthCheck() : null;

  var overallStatus = 'INITIALIZING';
  if (bootstrapHealth) {
    overallStatus = bootstrapHealth.status;
  }

  if (NetworkDetector.isNetworkPoor()) {
    overallStatus = overallStatus === 'HEALTHY' ? 'DEGRADED' : overallStatus;
  }

  if (instance && instance.getManifest) {
    var integrityCheck = ManifestIntegrity.validateIntegrity(instance.getManifest());
    if (!integrityCheck.valid) {
      overallStatus = 'UNHEALTHY';
    }
  }

  return {
    status: overallStatus,
    moduleId: MODULE_ID,
    version: VERSION,
    sprints: 9,
    totalImprovements: 26,
    stages: {
      preBoot: preBootHealth,
      bootstrap: bootstrapHealth
    },
    network: NetworkDetector.healthCheck(),
    manifestIntegrity: ManifestIntegrity.healthCheck(),
    cancellation: BootCancellation.healthCheck(),
    timestamp: Date.now()
  };
}

export { getPreBootResult, getBootResult, getBootstrapInstance, getPreBootOrchestrator };
