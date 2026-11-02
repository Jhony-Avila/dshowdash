
// P25-COMPLIANT: All EventBus subscriptions have deterministic teardown in reset()
// Bootstrap-V2 Enterprise v3.9.1-DEVTOOLS
// @version 3.9.1-DEVTOOLS
// @changelog v3.9.1-DEVTOOLS - Expõe strictMode e governanceBridge em window.Core para DevTools
// @changelog v3.9.0-GOVERNANCE - Integra GovernanceTelemetryBridge para eventos de governança
// @changelog v3.8.0-STRICT-ACTIVE - Strict mode ATIVADO - migração NR-FULL completa
// @changelog v3.7.0-ENTERPRISE-STRICT - Integra Enterprise Strict Mode (NR-FULL Parte 10)
// @changelog v3.6.0-STEP8 - Etapa 8 Fase 1: Registra windowAdapter em window.Core (ativa 42 linhas de código morto em 20 arquivos)
// @changelog v3.5.0-DOMAIN-PURE - Kernel eventBus via windowAdapter.get() (elimina window.EventBus direto)
// @changelog v3.4.1-EVENTS-FORMALIZED - Migração strings soltas → constantes BOOT_EVENTS (timeout, timeout-warning)
// @changelog v3.4.0-SPRINT7 - Sprint 7: Integração completa de todos os módulos
// @changelog v3.3.0-COMPLETE - Sprint 6: Rollback automático
// @changelog v3.2.0-FALLBACK - Sprint 5: #1 Persistência, #4 Histórico, #20 Debug Unificado
// @changelog v2.7.0-QUALITY - Sprint 4: #19 Testes, #21 Snapshot Imutável, #23 Validação Ciclos
// @changelog v2.6.0-MODULAR - Refatorado para arquitetura modular com 30+ módulos
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS (24 modules):
//   https-guard, BOOT_EVENTS, BOOT_MANIFEST, config, kernel,
//   DegradationNotifier, BootOrchestrator, StateMachine,
//   DependencyGraph, LoggerAdapter, TelemetryAdapter,
//   EventBusAdapter, ReadyFlagsAdapter, WindowAdapter,
//   NetworkDetector, ManifestIntegrity, ModuleEvents,
//   LazyLoader, BootCancellation, RootCauseAnalyzer,
//   PartialReinit, OTelExporter, module/index.js
//
// RECEIVES (via createBootstrapV2 config):
//   userConfig — Bootstrap configuration object
//
// CREATES:
//   Adapters: windowAdapter, loggerAdapter, telemetryAdapter,
//             eventBusAdapter, readyFlagsAdapter
//   Core: stateMachine, orchestrator, kernel, dependencyGraph
//   Sprint 7: globalTimeout, bootExecutor, diagnostics
//
// WINDOW ACCESS:
//   window.Core.windowAdapter — Registra adapter para 20 arquivos internos (v3.6.0)
//   (window as any).__BOOTSTRAP_V2_STATE__ — Singleton state (legítimo, own)
//   window.EventBus via windowAdapter.get() (already purified)
// ═══════════════════════════════════════════════════════════════
'use strict';

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE STRICT MODE - DEVE SER O PRIMEIRO IMPORT
// Política de runtime que define comportamento strict para Ports
// ═══════════════════════════════════════════════════════════════
import { isStrict, getViolations, healthCheck as strictModeHealthCheck, recordViolation, VERSION as STRICT_VERSION, setEventBusGetter, exposeDevTools } from '/core/runtime/enterprise/strict-mode.js';
import * as GovernanceTelemetryBridge from '/core/runtime/enterprise/governance-telemetry-bridge.js';

// ENTERPRISE: Strict mode é DEFAULT ON desde v2.4.0 (isStrict() retorna true a menos que !== false)
// Para desativar: window.__DSHOW_ENTERPRISE_STRICT__ = false (opt-out explícito)

import { enforce as enforceHttps } from './https-guard.js';
enforceHttps();

import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';
import { BOOT_MANIFEST, validateManifest, getAllAdjustedTimeouts, isDynamicTimeoutEnabled } from './boot-manifest/index.js';
import { isFeatureEnabled, getFeatureFlags, getEnabledFeatures, loadConfig } from './config.js';
import { getInstance as getKernelInstance, KERNEL_MODES, KERNEL_EVENTS } from './kernel/index.js';
import * as DegradationNotifier from './domain/degradation-notifier.js';

import { createBootOrchestrator, ORCHESTRATOR_EVENTS } from './domain/boot-orchestrator.js';
import { createBootStateMachine } from './domain/state-machine.js';
import { createDependencyGraph } from './domain/dependency-graph.js';
import { createLoggerAdapter } from './adapters/LoggerAdapter.js';
import { createTelemetryAdapter } from './adapters/TelemetryAdapter.js';
import { createEventBusAdapter } from './adapters/EventBusAdapter.js';
import { createReadyFlagsAdapter } from './adapters/ReadyFlagsAdapter.js';
import { createWindowAdapter } from './adapters/WindowAdapter.js';

// Sprint 7: Imports dos novos módulos
import * as NetworkDetector from './domain/network-detector.js';
import * as ManifestIntegrity from './domain/manifest-integrity.js';
import * as ModuleEvents from './domain/module-events.js';
import * as LazyLoader from './domain/lazy-loader.js';
import * as BootCancellation from './domain/boot-cancellation.js';
import * as RootCauseAnalyzer from './domain/root-cause-analyzer.js';
import * as PartialReinit from './domain/partial-reinit.js';
import * as OTelExporter from './telemetry/otel-exporter.js';

import {
  VERSION, MODULE_ID, SINGLETON_STATES,
  BOOT_LOOP_CONFIG, GLOBAL_TIMEOUT_CONFIG, PERIODIC_HEALTH_CONFIG,
  initSingletonState,
  createGlobalTimeout,
  registerPhases, getPhaseIds,
  createPhaseStartHandler, createPhaseCompleteHandler, createBootExecutor,
  startPeriodicHealthCheck,
  createHealthCheck, createInfoReporter,
  createResetManager,
  getBootLoopStatus as getBootLoopStatusFn,
  resetBootLoopStatus as resetBootLoopStatusFn,
  // Sprint 5: Persistência e Histórico
  saveCurrentBoot,
  getCurrentBoot,
  getLastSuccessfulBoot,
  hasRecentValidBoot,
  addToHistory,
  getHistory,
  clearHistory,
  analyzeHistory,
  // Sprint 5: Debug Mode
  enableDebug,
  disableDebug,
  toggleDebug,
  isDebugEnabled,
  getDebugState,
  BootPersistence,
  DebugMode
} from './module/index.js';

// Initialize singleton
initSingletonState();

var instance: ReturnType<typeof createBootstrapV2> | null = null;

function createBootstrapV2(userConfig?: Record<string, unknown>) {
  if (userConfig === undefined) userConfig = {};
  var config = loadConfig(userConfig);

  var manifestValidation = validateManifest();
  if (!manifestValidation.valid) {
    console.error('[bootstrap-v2] Boot Manifest validation failed', manifestValidation.errors);
  }

  // Sprint 7 #7: Store manifest hash for integrity checking
  try {
    ManifestIntegrity.storeHash(BOOT_MANIFEST);
  } catch (e: any) {
    console.warn('[bootstrap-v2] Failed to store manifest hash', e.message);
  }

  // Create adapters
  var windowAdapter = createWindowAdapter();
  var loggerAdapter = createLoggerAdapter({ prefix: 'bootstrap-v2', debug: config.debug });
  var telemetryAdapter = createTelemetryAdapter({ namespace: config.telemetry.namespace, enabled: config.telemetry.enabled });
  var eventBusAdapter = createEventBusAdapter({ namespace: 'bootstrap-v2' });
  var readyFlagsAdapter = createReadyFlagsAdapter();

  // v3.6.0-STEP8: Registrar windowAdapter em window.Core
  // 20 arquivos internos usam window.Core.windowAdapter.get() como fallback.
  // Até agora esse fallback era código morto (nunca foi registrado).
  // Este registro ativa a cadeia: window.Core.windowAdapter.get('X') → window[X]
  if (typeof window !== 'undefined') {
    window.Core = window.Core || {};
    window.Core.windowAdapter = windowAdapter;
  }

  var ports = { logger: loggerAdapter, telemetry: telemetryAdapter, eventBusAdapter: eventBusAdapter, readyFlagsAdapter: readyFlagsAdapter, windowAdapter: windowAdapter };

  // P0.3: Wire strict-mode event emission via windowAdapter (lazy getter)
  // Antes de Phase 0: getter retorna null → eventos bufferizados
  // Após Phase 0: getter retorna EventBus real → emissão normal
  setEventBusGetter(function() {
    return (windowAdapter && windowAdapter.get) ? windowAdapter.get('EventBus') : null;
  });

  // v3.9.0-GOVERNANCE: Inicializar GovernanceTelemetryBridge
  // Bridge conecta eventos de governança ao sistema de telemetria
  try {
    GovernanceTelemetryBridge.injectPorts({
      eventBus: eventBusAdapter,
      telemetry: telemetryAdapter,
      logger: loggerAdapter
    });
    GovernanceTelemetryBridge.init({ healthCheckInterval: 60000 });
    loggerAdapter.debug('GovernanceTelemetryBridge initialized');
  } catch (e: any) {
    loggerAdapter.warn('Failed to initialize GovernanceTelemetryBridge', { error: e.message });
  }

  // v3.9.1-DEVTOOLS: Expor strictMode e governanceBridge em window.Core para DevTools
  if (typeof window !== 'undefined') {
    window.Core = window.Core || {};
    window.Core.strictMode = {
      isStrict: isStrict,
      getViolations: getViolations,
      healthCheck: strictModeHealthCheck,
      recordViolation: recordViolation,
      version: STRICT_VERSION
    };
    window.Core.governanceBridge = {
      healthCheck: GovernanceTelemetryBridge.healthCheck,
      info: GovernanceTelemetryBridge.info,
      emitComplianceReport: GovernanceTelemetryBridge.emitComplianceReport,
      emitViolationSummary: GovernanceTelemetryBridge.emitViolationSummary,
      version: GovernanceTelemetryBridge.VERSION
    };
    loggerAdapter.debug('window.Core.strictMode and window.Core.governanceBridge exposed');
  }

  // Create core components
  var stateMachine = createBootStateMachine();
  var orchestrator = createBootOrchestrator(ports);
  var dependencyGraphRef = { value: createDependencyGraph() };

  // v3.5.0: Kernel receives EventBus via windowAdapter (not window.EventBus direct)
  var kernel = getKernelInstance({
    windowAdapter: windowAdapter,
    logger: loggerAdapter,
    // @ts-expect-error strict migration — TS2322
    eventBus: windowAdapter && windowAdapter.get ? windowAdapter.get('EventBus') : null
  });

  // Sprint 7 #13: Initialize OpenTelemetry if configured
  if (config.otel && config.otel.enabled) {
    OTelExporter.init({
      enabled: true,
      endpoint: config.otel.endpoint,
      serviceName: config.otel.serviceName || 'bootstrap-v2'
    });
  }

  // Sprint 7 #28: Update root cause context with network info
  try {
    RootCauseAnalyzer.updateContext({
      networkInfo: NetworkDetector.getNetworkInfo()
    });
  } catch (e: any) {}

  // Create global timeout
  var globalTimeout = createGlobalTimeout({
    onTimeout: function(data: Record<string, unknown>) {
      loggerAdapter.error('GLOBAL TIMEOUT - Boot exceeded maximum time', data);
      telemetryAdapter.error('boot-global-timeout', data);
      eventBusAdapter.emit(BOOT_EVENTS.TIMEOUT, data);
      if (DegradationNotifier) DegradationNotifier.notifyBootFailed('Timeout: ' + (data as any).timeoutMs + 'ms');
      // Sprint 7 #28: Analyze timeout
      RootCauseAnalyzer.analyze({ error: new Error('Global timeout') as unknown as { message?: string; [key: string]: unknown }, phaseId: 'global' });
    },
    onWarning: function(data: Record<string, unknown>) {
      loggerAdapter.warn('Boot is taking longer than expected', data);
      telemetryAdapter.track('boot-timeout-warning', data);
      eventBusAdapter.emit(BOOT_EVENTS.TIMEOUT_WARNING, data);
      if (DegradationNotifier) DegradationNotifier.notifyTimeoutWarning(data.elapsed as number, GLOBAL_TIMEOUT_CONFIG.timeoutMs);
    },
    loggerAdapter: loggerAdapter
  });

  // State
  var listeners = [];
  var cleanups = [];
  var periodicHealthStartedRef = { value: false };

  // Register phases
  var phases = registerPhases(config, dependencyGraphRef.value);

  // Setup phase handlers
  var healthAgg = orchestrator.getHealthAggregator();
  var phaseStartHandler = createPhaseStartHandler(stateMachine as unknown as Parameters<typeof createPhaseStartHandler>[0], healthAgg, loggerAdapter);
  var phaseCompleteHandler = createPhaseCompleteHandler(healthAgg);

  // @ts-expect-error strict migration — TS2345
  var phaseStartCleanup = orchestrator.on(ORCHESTRATOR_EVENTS.PHASE_START, phaseStartHandler);
  if (typeof phaseStartCleanup === 'function') cleanups.push(phaseStartCleanup);
  listeners.push({ event: 'PHASE_START', handler: 'phaseStartHandler', registeredAt: Date.now(), longLived: true });

  // @ts-expect-error strict migration — TS2345
  var phaseCompleteCleanup = orchestrator.on(ORCHESTRATOR_EVENTS.PHASE_COMPLETE, phaseCompleteHandler);
  if (typeof phaseCompleteCleanup === 'function') cleanups.push(phaseCompleteCleanup);
  listeners.push({ event: 'PHASE_COMPLETE', handler: 'phaseCompleteHandler', registeredAt: Date.now(), longLived: true });

  loggerAdapter.info('Bootstrap-V2 created (Sprint 7 + Enterprise Strict)', {
    version: VERSION,
    phases: getPhaseIds(phases),
    debug: config.debug,
    manifestVersion: BOOT_MANIFEST.version,
    manifestValid: manifestValidation.valid,
    enabledFeatures: getEnabledFeatures(),
    kernelIntegrated: true,
    modularArchitecture: true,
    persistenceEnabled: true,
    // Sprint 7 info
    dynamicTimeoutEnabled: isDynamicTimeoutEnabled(),
    networkQuality: NetworkDetector.getNetworkInfo().quality,
    otelEnabled: !!(config.otel && config.otel.enabled),
    // Enterprise Strict Mode
    strictMode: isStrict(),
    strictModeVersion: STRICT_VERSION
  });

  // Create boot executor with persistence hooks
  var bootExecutor = createBootExecutor({
    config: config,
    orchestrator: orchestrator as unknown as Record<string, Function>,
    stateMachine: stateMachine as unknown as Record<string, Function> & { STATES: Record<string, string> },
    kernel: kernel as unknown as Record<string, Function>,
    globalTimeout: globalTimeout,
    loggerAdapter: loggerAdapter,
    telemetryAdapter: telemetryAdapter,
    eventBusAdapter: eventBusAdapter,
    degradationNotifier: DegradationNotifier as unknown as Record<string, Function>,
    phases: phases,
    onPeriodicHealthStart: function(healthAgg: unknown) {
      if (!periodicHealthStartedRef.value) {
        // @ts-expect-error strict migration — TS2345
        var result = startPeriodicHealthCheck(healthAgg, loggerAdapter, eventBusAdapter, DegradationNotifier);
        if (result.success) periodicHealthStartedRef.value = true;
      }
    },
    // Sprint 5: Hook para persistir resultado do boot
    onBootComplete: function(bootResult: unknown) {
      try {
        saveCurrentBoot(bootResult as Parameters<typeof saveCurrentBoot>[0]);
        addToHistory(bootResult as Parameters<typeof addToHistory>[0]);
        // P0.3: Expõe DevTools após boot completo (equivalente BOOT_READY)
        exposeDevTools();
        // Sprint 7 #13: Flush OTel traces
        if (config.otel && config.otel.enabled) {
          OTelExporter.flush().catch(function() {});
        }
      } catch (e: any) {
        loggerAdapter.warn('Failed to persist boot result', { error: e.message });
      }
    }
  });

  // Create diagnostics
  var diagnosticsContext = {
    config: config,
    orchestrator: orchestrator as unknown as Record<string, Function>,
    stateMachine: stateMachine,
    kernel: kernel as unknown as Record<string, Function>,
    globalTimeout: globalTimeout,
    degradationNotifier: DegradationNotifier as unknown as { info: () => Record<string, unknown> },
    bootExecutor: bootExecutor,
    listeners: listeners,
    cleanups: cleanups
  };

  var healthCheck = createHealthCheck(diagnosticsContext as unknown as Parameters<typeof createHealthCheck>[0]);
  var infoReporter = createInfoReporter(diagnosticsContext as unknown as Parameters<typeof createInfoReporter>[0]);

  // Create reset manager
  var resetManager = createResetManager({
    orchestrator: orchestrator as unknown as Record<string, Function>,
    stateMachine: stateMachine,
    kernel: kernel,
    globalTimeout: globalTimeout,
    degradationNotifier: DegradationNotifier as unknown as { reset?: () => void },
    loggerAdapter: loggerAdapter,
    bootExecutor: bootExecutor,
    cleanups: cleanups,
    listeners: listeners,
    dependencyGraphRef: dependencyGraphRef,
    periodicHealthStartedRef: periodicHealthStartedRef
  });

  // Public API
  return {
    // Core
    boot: function() { return bootExecutor.execute(); },
    getState: function() { return stateMachine.getState(); },
    isReady: function() { return stateMachine.isReady(); },
    getResult: function() { return bootExecutor.getResult(); },
    reset: resetManager.reset,
    resetBootLoopTracker: resetManager.resetBootLoopTracker,
    healthCheck: healthCheck,
    info: infoReporter,
    
    // Context
    getContext: function() { return orchestrator.getBootContext(); },
    getContextSnapshot: function() { var ctx = orchestrator.getBootContext(); return ctx ? ctx.getSnapshot() : null; },
    getHealthAggregator: function() { return orchestrator.getHealthAggregator(); },
    getHealthStatus: function() { var agg = orchestrator.getHealthAggregator(); return agg ? agg.calculate() : null; },
    getManifest: function() { return JSON.parse(JSON.stringify(BOOT_MANIFEST)); },
    getDependencyGraph: function() { return dependencyGraphRef.value; },
    getFeatureFlags: getFeatureFlags,
    isFeatureEnabled: isFeatureEnabled,
    
    // Kernel
    getKernel: function() { return kernel; },
    getStateMachine: function() { return stateMachine; },
    
    // Sprint 2: Robust
    getBootLoopStatus: function() { return getBootLoopStatusFn(); },
    getGlobalTimeoutStatus: function() { return globalTimeout ? globalTimeout.getStatus() : null; },
    
    // Sprint 3: Observability
    getPeriodicHealthStatus: function() { var h = orchestrator.getHealthAggregator(); return h && h.getPeriodicHistory ? h.getPeriodicHistory() : { running: false, checkCount: 0, history: [] }; },
    getMemoryMetrics: function() { var h = orchestrator.getHealthAggregator(); return h && h.getMemoryMetrics ? h.getMemoryMetrics() : null; },
    getDegradationNotifier: function() { return DegradationNotifier; },
    
    // Sprint 5: #1 Persistência
    getCurrentBoot: getCurrentBoot,
    getLastSuccessfulBoot: getLastSuccessfulBoot,
    hasRecentValidBoot: hasRecentValidBoot,
    
    // Sprint 5: #4 Histórico
    getBootHistory: getHistory,
    clearBootHistory: clearHistory,
    analyzeBootHistory: analyzeHistory,
    
    // Sprint 5: #20 Debug Mode
    enableDebug: enableDebug,
    disableDebug: disableDebug,
    toggleDebug: toggleDebug,
    isDebugEnabled: isDebugEnabled,
    getDebugState: getDebugState,
    
    // =========================================================================
    // Sprint 7: Novos Módulos Integrados
    // =========================================================================
    
    // Sprint 7A #2: Network & Dynamic Timeout
    getNetworkInfo: function() { return NetworkDetector.getNetworkInfo(); },
    getNetworkQuality: function() { return NetworkDetector.getNetworkInfo().quality; },
    isNetworkPoor: function() { return NetworkDetector.isNetworkPoor(); },
    getAllAdjustedTimeouts: getAllAdjustedTimeouts,
    
    // Sprint 7A #7: Manifest Integrity
    validateManifestIntegrity: function() { return ManifestIntegrity.validateIntegrity(BOOT_MANIFEST); },
    wasManifestTampered: function() { return ManifestIntegrity.wasTampered(BOOT_MANIFEST); },
    getManifestIntegrityInfo: function() { return ManifestIntegrity.info(); },
    
    // Sprint 7B #9: Module Events & Metrics
    getModuleMetrics: function() { return ModuleEvents.getMetrics(); },
    getModuleTimeline: function(phaseId: string) { return ModuleEvents.getModuleTimeline(phaseId); },
    getModulePerformance: function(moduleId: string) { return ModuleEvents.getModulePerformance(moduleId); },
    getAllModulePerformance: function() { return ModuleEvents.getAllModulePerformance(); },
    
    // Sprint 7B #13: OpenTelemetry
    getOTelExportData: function() { return OTelExporter.getExportData(); },
    flushOTelTraces: function() { return OTelExporter.flush(); },
    getOTelInfo: function() { return OTelExporter.info(); },
    
    // Sprint 7C #14: Lazy Loading

    loadDeferredPhases: function() { return { ok: true, message: 'deferred phases not implemented' }; },
    isDeferredLoaded: function() { return false; },

    getDeferredStatus: function() { return { ok: true, loaded: false, message: 'deferred phases not implemented' }; },
    getLazyLoaderInfo: function() { return LazyLoader.info(); },
    
    // Sprint 7C #17: Boot Cancellation
    // @ts-expect-error strict migration — TS2345
    cancelBoot: function(reason?: string) { return BootCancellation.cancel(reason); },
    canCancelBoot: function() { return BootCancellation.canCancel(); },
    isBootCancelled: function() { return BootCancellation.isCancelled(); },
    getCancellationState: function() { return BootCancellation.getState(); },
    
    // Sprint 7D #28: Root Cause Analysis
    analyzeError: function(error: unknown, context?: Record<string, unknown>) { return RootCauseAnalyzer.analyze(Object.assign({ error: error }, context || {}) as Parameters<typeof RootCauseAnalyzer.analyze>[0]); },
    getErrorTrends: function() { return RootCauseAnalyzer.getErrorTrends(); },
    getRootCauseSuggestions: function() { return RootCauseAnalyzer.getSuggestions(); },
    
    // Sprint 7D #29: Partial Reinit
    // @ts-expect-error strict migration — TS2345
    reinitPhase: function(phaseId: string, context?: Record<string, unknown>) { return PartialReinit.reinitPhase(phaseId, context); },
    // @ts-expect-error strict migration — TS2345
    reinitPhases: function(phaseIds: string[], context?: Record<string, unknown>) { return PartialReinit.reinitPhases(phaseIds, context); },
    supportsReinit: function(phaseId: string) { return PartialReinit.supportsReinit(phaseId); },
    getReinitInfo: function() { return PartialReinit.info(); },
    
    // Sprint 7: Módulos Diretos (namespace access)
    NetworkDetector: NetworkDetector,
    ManifestIntegrity: ManifestIntegrity,
    ModuleEvents: ModuleEvents,
    LazyLoader: LazyLoader,
    BootCancellation: BootCancellation,
    RootCauseAnalyzer: RootCauseAnalyzer,
    PartialReinit: PartialReinit,
    OTelExporter: OTelExporter,
    
    // Módulos Sprint 5
    BootPersistence: BootPersistence,
    DebugMode: DebugMode,
    
    // Singleton
    getSingletonState: function() { return typeof window !== 'undefined' ? (window as any).__BOOTSTRAP_V2_STATE__ : null; },
    
    // Meta
    VERSION: VERSION,
    MODULE_ID: MODULE_ID,
    BOOT_LOOP_CONFIG: BOOT_LOOP_CONFIG,
    GLOBAL_TIMEOUT_CONFIG: GLOBAL_TIMEOUT_CONFIG,
    PERIODIC_HEALTH_CONFIG: PERIODIC_HEALTH_CONFIG,

    // Enterprise Strict Mode
    isStrictMode: isStrict,
    STRICT_MODE_VERSION: STRICT_VERSION
  };
}

function getInstance(config?: Record<string, unknown>) {
  if (config === undefined) config = {};
  var globalState = typeof window !== 'undefined' ? (window as any).__BOOTSTRAP_V2_STATE__ : null;
  if (globalState && (globalState.state === SINGLETON_STATES.RUNNING || globalState.state === SINGLETON_STATES.COMPLETED)) {
    if (instance) return instance;
  }
  if (!instance) {
    instance = createBootstrapV2(config);
  }
  return instance;
}

function resetInstance() {
  if (instance) {
    instance.reset();
  }
  instance = null;

  // Sprint 7: Reset módulos
  try {
    ModuleEvents.resetMetrics();
    RootCauseAnalyzer.reset();
    OTelExporter.reset();
    (LazyLoader as any).reset();
    BootCancellation.reset();
  } catch (e: any) {}

  // v3.9.0-GOVERNANCE: Shutdown GovernanceTelemetryBridge
  try {
    GovernanceTelemetryBridge.shutdown();
  } catch (e: any) {}

  // v3.6.0-STEP8: Cleanup windowAdapter reference from window.Core
  if (typeof window !== 'undefined' && window.Core) {
    delete window.Core.windowAdapter;
  }
}

export { createBootstrapV2, getInstance, resetInstance, SINGLETON_STATES, BOOT_MANIFEST, KERNEL_MODES, KERNEL_EVENTS };
export default {
  createBootstrapV2: createBootstrapV2,
  getInstance: getInstance,
  resetInstance: resetInstance,
  VERSION: VERSION,
  MODULE_ID: MODULE_ID,
  SINGLETON_STATES: SINGLETON_STATES,
  BOOT_MANIFEST: BOOT_MANIFEST,
  KERNEL_MODES: KERNEL_MODES,
  KERNEL_EVENTS: KERNEL_EVENTS
};
