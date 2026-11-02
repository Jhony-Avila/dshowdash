// Bootstrap-V2 Loader - Global API
// @version 6.3.0-DOMAIN-PURE
// @changelog v6.3.0-DOMAIN-PURE: getKernel() via windowAdapter → window.Kernel fallback (cadeia AAA)
// @changelog v6.2.1: Versão anterior
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.3.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES Kernel via _resolveKernel():
//   1. bootstrap.getKernel()         — injeção preferida
//   2. windowAdapter.get('Kernel')   — adapter layer
//   3. window.Kernel                 — último fallback
// IMPORTS: loader/constants, loader/state, domain modules
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, hasWindow } from './constants.js';
import { getPreBootResult, getPreBootOrchestrator } from './state.js';

import * as CircuitBreakerRegistry from '../domain/circuit-breaker.js';
import * as DegradationNotifier from '../domain/degradation-notifier.js';
import * as ModuleEvents from '../domain/module-events.js';
import * as OpenTelemetryAdapter from '../adapters/OpenTelemetryAdapter.js';
import * as NetworkDetector from '../domain/network-detector.js';
import * as ManifestIntegrity from '../domain/manifest-integrity.js';
import * as PhaseRollback from '../domain/phase-rollback.js';
import * as LazyLoader from '../domain/lazy-loader.js';
import * as BootCancellation from '../domain/boot-cancellation.js';
import * as PartialReinit from '../domain/partial-reinit.js';

import type { DynamicInstance } from './state.js';

// v6.3.0: Resolver Kernel via windowAdapter → window fallback
function _resolveKernel() {
  if (!hasWindow) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var resolved = window.Core.windowAdapter.get('Kernel');
    if (resolved) return resolved;
  }
  return (window as any).Kernel || null;
}

export function createGlobalAPI(bootstrap: DynamicInstance, BootstrapV2Module: DynamicInstance) {
  return {
    // Core
    boot: function() { return bootstrap.boot(); },
    getState: function() { return bootstrap.getState(); },
    isReady: function() { return bootstrap.isReady(); },
    getResult: function() { return bootstrap.getResult(); },
    reset: function() { return bootstrap.reset(); },
    getSingletonState: function() { return bootstrap.getSingletonState(); },
    healthCheck: function() { return bootstrap.healthCheck(); },
    info: function() { return bootstrap.info(); },

    // Platform APIs
    getContext: function() { return bootstrap.getContext ? bootstrap.getContext() : null; },
    getContextSnapshot: function() { return bootstrap.getContextSnapshot ? bootstrap.getContextSnapshot() : null; },
    getHealthAggregator: function() { return bootstrap.getHealthAggregator ? bootstrap.getHealthAggregator() : null; },
    getHealthStatus: function() { return bootstrap.getHealthStatus ? bootstrap.getHealthStatus() : null; },
    getManifest: function() { return bootstrap.getManifest ? bootstrap.getManifest() : null; },
    getDependencyGraph: function() { return bootstrap.getDependencyGraph ? bootstrap.getDependencyGraph() : null; },
    getFeatureFlags: function() { return bootstrap.getFeatureFlags ? bootstrap.getFeatureFlags() : null; },
    isFeatureEnabled: function(key: string) { return bootstrap.isFeatureEnabled ? bootstrap.isFeatureEnabled(key) : false; },

    // Pre-Boot APIs
    getPreBootResult: function() { return getPreBootResult(); },
    getPreBootOrchestrator: function() { return getPreBootOrchestrator(); },

    // Enterprise: Kernel
    getKernel: function() {
      return bootstrap.getKernel ? bootstrap.getKernel() : _resolveKernel();
    },
    getStateMachine: function() {
      return bootstrap.getStateMachine ? bootstrap.getStateMachine() : null;
    },

    // Enterprise: Circuit Breaker
    getCircuitBreakerRegistry: function() { return CircuitBreakerRegistry; },
    getCircuitBreaker: function(moduleId: string, config: Record<string, unknown>) { return CircuitBreakerRegistry.getBreaker(moduleId, config); },
    getCircuitBreakerStatus: function() { return CircuitBreakerRegistry.healthCheck(); },
    getAllCircuitBreakers: function() { return CircuitBreakerRegistry.getAllBreakers(); },

    // Robust: Boot Loop Detection
    getBootLoopStatus: function() { return bootstrap.getBootLoopStatus ? bootstrap.getBootLoopStatus() : null; },
    resetBootLoopTracker: function() { return bootstrap.resetBootLoopTracker ? bootstrap.resetBootLoopTracker() : null; },

    // Robust: Global Timeout
    getGlobalTimeoutStatus: function() { return bootstrap.getGlobalTimeoutStatus ? bootstrap.getGlobalTimeoutStatus() : null; },

    // Observability: Periodic Health Check
    getPeriodicHealthStatus: function() { return bootstrap.getPeriodicHealthStatus ? bootstrap.getPeriodicHealthStatus() : null; },

    // Observability: Memory Metrics
    getMemoryMetrics: function() { return bootstrap.getMemoryMetrics ? bootstrap.getMemoryMetrics() : null; },

    // Observability: Degradation Notifier
    getDegradationNotifier: function() { return DegradationNotifier; },
    getActiveNotifications: function() { return DegradationNotifier ? DegradationNotifier.getActive() : []; },
    dismissNotification: function(id: number) { return DegradationNotifier ? DegradationNotifier.dismiss(id) : false; },
    dismissAllNotifications: function() { return DegradationNotifier ? DegradationNotifier.dismissAll() : 0; },

    // Quality: Tests and Validation
    runKernelTests: function() {
      return import('/bootstrap-v2/kernel/__tests__/test-runner.js').then(function(TestRunner) {
        return TestRunner.run();
      }).catch(function(e) {
        return { error: e.message };
      });
    },
    validateManifest: function() {
      return import('/bootstrap-v2/boot-manifest/index.js').then(function(ManifestModule) {
        return ManifestModule.validateManifest();
      }).catch(function(e) {
        return { valid: false, error: e.message };
      });
    },

    // Sprint 5: Persistência
    getCurrentBoot: function() { return bootstrap.getCurrentBoot ? bootstrap.getCurrentBoot() : null; },
    getLastSuccessfulBoot: function() { return bootstrap.getLastSuccessfulBoot ? bootstrap.getLastSuccessfulBoot() : null; },
    hasRecentValidBoot: function(maxAgeMs: number) { return bootstrap.hasRecentValidBoot ? bootstrap.hasRecentValidBoot(maxAgeMs) : false; },

    // Sprint 5: Histórico de Boots
    getBootHistory: function() { return bootstrap.getBootHistory ? bootstrap.getBootHistory() : []; },
    clearBootHistory: function() { return bootstrap.clearBootHistory ? bootstrap.clearBootHistory() : false; },
    analyzeBootHistory: function() { return bootstrap.analyzeBootHistory ? bootstrap.analyzeBootHistory() : null; },

    // Sprint 5: Debug Mode
    enableDebug: function(options: Record<string, unknown>) { return bootstrap.enableDebug ? bootstrap.enableDebug(options) : null; },
    disableDebug: function() { return bootstrap.disableDebug ? bootstrap.disableDebug() : null; },
    toggleDebug: function() { return bootstrap.toggleDebug ? bootstrap.toggleDebug() : null; },
    isDebugEnabled: function() { return bootstrap.isDebugEnabled ? bootstrap.isDebugEnabled() : false; },
    getDebugState: function() { return bootstrap.getDebugState ? bootstrap.getDebugState() : null; },

    // Sprint 7: Observabilidade Avançada
    ModuleEvents: ModuleEvents,
    getModuleEventHistory: function() { return ModuleEvents.getEventHistory(); },
    getModuleTimeline: function(phaseId: string) { return ModuleEvents.getModuleTimeline(phaseId); },
    onModuleEvent: function(eventType: string, handler: (...args: unknown[]) => void) { return ModuleEvents.on(eventType, handler); },

    // OpenTelemetry
    OpenTelemetry: OpenTelemetryAdapter,
    exportOtelSpans: function() { return OpenTelemetryAdapter.exportSpans(); },
    exportOtelMetrics: function() { return OpenTelemetryAdapter.exportMetrics(); },

    // Análise de Causa Raiz
    getErrorHistory: function() {
      return import('../domain/boot-errors.js').then(function(m) { return m.getErrorHistory(); });
    },
    analyzeErrorPatterns: function() {
      return import('../domain/boot-errors.js').then(function(m) { return m.analyzeErrorPatterns(); });
    },

    // Sprint 8: Resiliência Avançada
    NetworkDetector: NetworkDetector,
    getNetworkInfo: function() { return NetworkDetector.getNetworkInfo(); },
    getNetworkQuality: function() { return NetworkDetector.detectNetworkQuality(); },
    calculateAdjustedTimeout: function(baseTimeout: number) { return NetworkDetector.calculateAdjustedTimeout(baseTimeout); },
    isOnline: function() { return NetworkDetector.isOnline(); },
    isNetworkPoor: function() { return NetworkDetector.isNetworkPoor(); },

    ManifestIntegrity: ManifestIntegrity,
    validateManifestIntegrity: function() {
      var manifest = bootstrap.getManifest ? bootstrap.getManifest() : null;
      return ManifestIntegrity.validateIntegrity(manifest);
    },
    wasManifestTampered: function() {
      var manifest = bootstrap.getManifest ? bootstrap.getManifest() : null;
      return ManifestIntegrity.wasTampered(manifest);
    },

    PhaseRollback: PhaseRollback,
    registerRollback: function(phaseId: string, fn: (context: Record<string, unknown>) => void | Promise<void>, opts: Record<string, unknown>) { return PhaseRollback.registerRollback(phaseId, fn, opts); },
    rollbackPhase: function(phaseId: string, ctx: Record<string, unknown>) { return PhaseRollback.rollbackPhase(phaseId, ctx); },
    rollbackToPhase: function(phaseId: string, ctx: Record<string, unknown>) { return PhaseRollback.rollbackToPhase(phaseId, ctx); },
    getRollbackHistory: function() { return PhaseRollback.getRollbackHistory(); },

    // Sprint 9: Performance
    LazyLoader: LazyLoader,
    registerLazyModule: function(id: string, loader: () => Promise<unknown>, opts: Record<string, unknown>) { return (LazyLoader as any).register(id, loader, opts); },
    lazyLoad: function(moduleId: string) { return (LazyLoader as any).load(moduleId); },
    preloadAll: function(ids: string[], opts: Record<string, unknown>) { return (LazyLoader as any).preloadAll(ids, opts); },
    getLazyStats: function() { return (LazyLoader as any).getStats(); },

    BootCancellation: BootCancellation,
    cancelBoot: function(reason: string) { return BootCancellation.cancel(reason); },
    canCancelBoot: function() { return BootCancellation.canCancel(); },
    isBootCancelled: function() { return BootCancellation.isCancelled(); },
    onBootCancel: function(handler: (...args: unknown[]) => void) { return BootCancellation.onCancel(handler); },

    PartialReinit: PartialReinit,
    reinitPhase: function(phaseId: string, ctx: Record<string, unknown>) { return PartialReinit.reinitPhase(phaseId, ctx); },
    reinitPhases: function(phaseIds: string[], ctx: Record<string, unknown>) { return PartialReinit.reinitPhases(phaseIds, ctx); },

    // @ts-expect-error TS migration - TS2554
    reinitFrom: function(phaseId: string, ctx: Record<string, unknown>) { return PartialReinit.reinitFrom(phaseId, ctx); },
    supportsReinit: function(phaseId: string) { return PartialReinit.supportsReinit(phaseId); },

    // Sprint 5: Módulos diretos
    BootPersistence: bootstrap.BootPersistence || null,
    DebugMode: bootstrap.DebugMode || null,

    // Meta
    VERSION: bootstrap.VERSION || BootstrapV2Module.VERSION || '3.4.0-SPRINT7',
    MODULE_ID: bootstrap.MODULE_ID || 'bootstrap-v2',
    LOADER_VERSION: VERSION,

    // Feature flags
    ENTERPRISE: true,
    ROBUST: true,
    OBSERVABILITY: true,
    QUALITY: true,
    PERSISTENCE: true,
    OBSERVABILITY_ADVANCED: true,
    RESILIENCE_ADVANCED: true,
    PERFORMANCE: true,

    // Configs
    BOOT_LOOP_CONFIG: bootstrap.BOOT_LOOP_CONFIG || null,
    GLOBAL_TIMEOUT_CONFIG: bootstrap.GLOBAL_TIMEOUT_CONFIG || null,
    PERIODIC_HEALTH_CONFIG: bootstrap.PERIODIC_HEALTH_CONFIG || null,

    // Debug
    _module: BootstrapV2Module,
    _instance: bootstrap,
    _preBootOrchestrator: getPreBootOrchestrator(),
    _circuitBreakerRegistry: CircuitBreakerRegistry,
    _degradationNotifier: DegradationNotifier
  };
}
