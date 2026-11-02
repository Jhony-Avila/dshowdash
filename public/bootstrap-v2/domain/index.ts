// Bootstrap-V2 Domain v3.0.1-CONTRACTS
// @version 3.0.1-CONTRACTS
// @changelog v3.0.1-CONTRACTS: Dependency Contract formalizado
// @changelog v3.0.0-SPRINT7: Sprint 7 completo - Root Cause Analyzer, métricas expandidas
// @changelog v2.0.0-COMPLETE: Sprint 7-9 completo com todas as melhorias
// @changelog v1.3.0-QUICKWINS: QW#05 circuit-breaker, QW#26 metrics-summary, QW#28 module-cache
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.0.1)
// ═══════════════════════════════════════════════════════════════
// BARREL: Re-exports all domain modules (28 imports)
// Re-exports from: boot-orchestrator, state-machine, phase-runner,
//   dependency-graph, boot-context, boot-health-aggregator,
//   boot-errors, boot-events-catalog, circuit-breaker,
//   boot-metrics-summary, module-cache, degradation-notifier,
//   network-detector, manifest-integrity, module-events,
//   lazy-loader, boot-cancellation, root-cause-analyzer,
//   partial-reinit, phase-rollback
// WINDOW ACCESS: None (pure re-export)
// ═══════════════════════════════════════════════════════════════
// Re-exporta todos os módulos de domínio
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain';

// Core Domain
export { createBootOrchestrator, ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS } from './boot-orchestrator.js';
export { createBootStateMachine } from './state-machine.js';
export { createPhaseRunner, MODULE_STATUS, MODULE_TIMEOUT_MAP } from './phase-runner.js';
export { createDependencyGraph } from './dependency-graph.js';
export { createBootContext, getInstance as getBootContextInstance, CONTEXT_STATES, PROGRESS_EVENTS } from './boot-context.js';
export { createHealthAggregator, getInstance as getHealthAggregatorInstance, HEALTH_THRESHOLDS } from './boot-health-aggregator.js';

// QW#18 + #28: Boot Errors with Root Cause
export { 
  ERROR_TYPES, 
  RECOVERY_STRATEGIES, 
  classifyError, 
  createTypedError, 
  extractRootCause,
  shouldRetry, 
  getFallbackAction,
  getErrorHistory,
  getErrorsByType,
  getErrorsByPhase,
  analyzeErrorPatterns,
  clearErrorHistory
} from './boot-errors.js';

export { EVENTS_CATALOG, getEventByName, getAllEvents, getEventsByCategory, getEventsByEmitter } from './boot-events-catalog.js';

// QW#05: Circuit Breaker
export { createCircuitBreaker, getBreaker, getAllBreakers, resetAll as resetAllBreakers, STATES as CIRCUIT_STATES } from './circuit-breaker.js';

// QW#26: Boot Metrics Summary
export { startBoot, endBoot, recordPhase, recordModule, recordError, recordWarning, recordDegradation, getSummary as getMetricsSummary } from './boot-metrics-summary.js';

// QW#28: Module Cache
export { has as hasModuleCache, get as getModuleCache, set as setModuleCache, getOrLoad, getStats as getCacheStats, clear as clearModuleCache } from './module-cache.js';

// Degradation Notifier
export * as DegradationNotifier from './degradation-notifier.js';

// ============================================================================
// SPRINT 7A: Rede e Integridade
// ============================================================================

// #2: Timeout Dinâmico baseado em Rede
export {
  NETWORK_QUALITY,
  TIMEOUT_MULTIPLIERS,
  detectNetworkQuality,
  getNetworkInfo,
  calculateAdjustedTimeout,
  getPhaseTimeout,
  onNetworkChange,
  isOnline,
  isNetworkPoor,
  getQualityLevel,
  info as networkDetectorInfo,
  healthCheck as networkDetectorHealthCheck
} from './network-detector.js';

// #7: Integridade do Manifest (expandido v2.0.0-SHA256)
export {
  hashString,
  hashStringFNV,
  hashStringSHA256,
  hashObject,
  hashObjectAsync,
  calculateManifestHash,
  calculateManifestHashAsync,
  storeHash as storeManifestHash,
  storeHashAsync as storeManifestHashAsync,
  validateIntegrity as validateManifestIntegrity,
  validateIntegrityAsync as validateManifestIntegrityAsync,
  wasTampered as wasManifestTampered,
  getValidationHistory as getManifestValidationHistory,
  getLastValidation as getLastManifestValidation,
  loadPersistedHash,
  clearPersistedHash,
  info as manifestIntegrityInfo,
  healthCheck as manifestIntegrityHealthCheck
} from './manifest-integrity.js';

// ============================================================================
// SPRINT 7B: Observabilidade
// ============================================================================

// #9: Eventos Granulares por Módulo (expandido v2.0.0-METRICS)
export {
  MODULE_EVENT_TYPES,
  emit as emitModuleEvent,
  on as onModuleEvent,
  emitModuleStart,
  emitModuleProgress,
  emitModuleComplete,
  emitModuleError,
  emitModuleSkip,
  emitModuleRetry,
  emitPhaseModulesStart,
  emitPhaseModulesComplete,
  getEventHistory as getModuleEventHistory,
  getEventsByPhase as getModuleEventsByPhase,
  getEventsByModule,
  getEventsByType as getModuleEventsByType,
  getModuleTimeline,
  getMetrics as getModuleMetrics,
  getModulePerformance,
  getAllModulePerformance,
  getTimingStats,
  clearHistory as clearModuleEventHistory,
  resetMetrics as resetModuleMetrics,
  info as moduleEventsInfo,
  healthCheck as moduleEventsHealthCheck
} from './module-events.js';

// ============================================================================
// SPRINT 7C: Performance
// ============================================================================

// #14: Lazy Loading de Fases (expandido v2.0.0-DEFERRED)

export {
  MODULE_ID as LAZY_LOADER_MODULE_ID,
  VERSION as LAZY_LOADER_VERSION,
  init as initLazyLoader,
  destroy as destroyLazyLoader,
  setLogLevel as setLazyLogLevel,
  loadFeaturesForRoute,
  loadFeature as lazyLoad,
  preloadFeature as preloadLazyFeature,
  preloadForRoute as preloadLazyForRoute,
  setRouteFeatures as setLazyRouteFeatures,
  addRouteFeature as addLazyRouteFeature,
  getRouteMap as getLazyRouteMap,
  isFeatureLoaded as isLazyLoaded,
  getLoadedFeatures as getLazyLoadedFeatures,
  getStatus as getLazyStatus,
  getMetrics as getLazyStats,
  info as lazyLoaderInfo,
  healthCheck as lazyLoaderHealthCheck
} from './lazy-loader.js';

// #17: API de Cancelamento de Boot
export {
  isCancelled,
  canCancel,
  cancel as cancelBoot,
  onCancel,
  checkCancellation,
  makeCancellable,
  getAbortSignal,
  getState as getCancellationState,
  getHistory as getCancellationHistory,
  info as bootCancellationInfo,
  healthCheck as bootCancellationHealthCheck
} from './boot-cancellation.js';

// ============================================================================
// SPRINT 7D: Resiliência
// ============================================================================

// #28: Root Cause Analyzer (NOVO v1.0.0-DIAGNOSTICS)
export {
  CAUSE_TYPES,
  CONTRIBUTING_FACTORS,
  analyze as analyzeRootCause,
  updateContext as updateRootCauseContext,
  recordError as recordRootCauseError,
  getPhaseAnalysis,
  getRecentAnalyses,
  getErrorTrends,
  getSuggestions as getRootCauseSuggestions,
  clearHistory as clearRootCauseHistory,
  info as rootCauseAnalyzerInfo,
  healthCheck as rootCauseAnalyzerHealthCheck
} from './root-cause-analyzer.js';

// #29: Reinicialização Parcial
export {
  REINIT_SUPPORTED_PHASES,
  registerHandler as registerReinitHandler,
  unregisterHandler as unregisterReinitHandler,
  supportsReinit,
  reinitPhase,
  reinitPhases,
  reinitFrom,
  getHistory as getReinitHistory,
  getPhaseHandlers as getReinitHandlers,
  getRegisteredPhases as getReinitRegisteredPhases,
  info as partialReinitInfo,
  healthCheck as partialReinitHealthCheck
} from './partial-reinit.js';

// #8: Rollback Automático de Fase
export {
  ROLLBACK_STATUS,
  registerRollback,
  unregisterRollback,
  markPhaseExecuted,
  clearPhaseExecution,
  rollbackPhase,
  rollbackToPhase,
  getRollbackHistory,
  getPhaseHandlers as getRollbackHandlers,
  getRegisteredPhases as getRollbackRegisteredPhases,
  getExecutedPhases,
  info as phaseRollbackInfo,
  healthCheck as phaseRollbackHealthCheck
} from './phase-rollback.js';

// ============================================================================
// Module Namespace Exports (for direct access)
// ============================================================================

export * as ModuleEvents from './module-events.js';
export * as NetworkDetector from './network-detector.js';
export * as ManifestIntegrity from './manifest-integrity.js';
export * as PhaseRollback from './phase-rollback.js';
export * as LazyLoader from './lazy-loader.js';
export * as BootCancellation from './boot-cancellation.js';
export * as PartialReinit from './partial-reinit.js';
export * as RootCauseAnalyzer from './root-cause-analyzer.js';
