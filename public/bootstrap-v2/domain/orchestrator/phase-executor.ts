// Phase Executor - Execução de fases do boot
// @version 3.3.0-ACTION3
// @description Sprint 6: #8 Rollback Automático de Fase + Ação 3: Validação de globais
// @changelog v3.3.0-ACTION3: Passa resolveGlobal (windowAdapter.get) para dependency-checker (Ação 3)
// @changelog v3.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v3.2.0-ROLLBACK: Integração do sistema de rollback automático
// @changelog v3.1.0-MODULAR: Refatorado para arquitetura modular
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.3.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   MODULE_ID, DEFAULT_CIRCUIT_BREAKER_CONFIG,
//   createHelpers, createConfigResolver, createBreakerManager,
//   createExecutionGuard, createPhaseMetrics,
//   createDependencyChecker, createSuccessHandler,
//   createSuppressionHandler, createErrorHandler,
//   createSkipHandler, createPhaseRunner, createPublicAPI,
//   createRollbackRegistry, createRollbackExecutor
//   from ./phase-executor/index.js
//
// RECEIVES (via createPhaseExecutor options):
//   options.logger, telemetry, eventEmitter, retryExecutor,
//   options.degradationHandler, metricsSummary, getPhaseConfig,
//   options.moduleId, healthAggregator, notificationsEnabled,
//   options.circuitBreakerEnabled, rollbackEnabled,
//   options.windowAdapter — For globals validation (Action 3)
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  MODULE_ID, DEFAULT_CIRCUIT_BREAKER_CONFIG,
  createHelpers, createConfigResolver,
  createBreakerManager, createExecutionGuard,
  createPhaseMetrics,
  createDependencyChecker, createSuccessHandler, createSuppressionHandler,
  createErrorHandler, createSkipHandler, createPhaseRunner,
  createPublicAPI,
  // Sprint 6 #8: Rollback
  createRollbackRegistry, createRollbackExecutor
} from './phase-executor/index.js';

export const VERSION = '2.4.1-CONTRACTS';

interface PhaseExecutorOptions {
  moduleId?: string;
  circuitBreakerEnabled?: boolean;
  circuitBreakerConfig?: Record<string, unknown>;
  notificationsEnabled?: boolean;
  rollbackEnabled?: boolean;
  windowAdapter?: { get: (name: string) => unknown } | null;
  logger?: Record<string, Function> | null;
  telemetry?: Record<string, Function> | null;
  eventEmitter?: Record<string, Function> | null;
  getPhaseConfig?: (phaseId: string) => Record<string, unknown> | null;
  metricsSummary?: Record<string, Function> | null;
  healthAggregator?: Record<string, Function> | null;
  retryExecutor?: Record<string, Function> | null;
  degradationHandler?: Record<string, Function> | null;
  maxEffectsPerPhase?: number;
  rollbackContinueOnError?: boolean;
}

export function createPhaseExecutor(options: PhaseExecutorOptions) {
  if (options === undefined) options = {};

  var moduleId = options.moduleId || MODULE_ID;
  var circuitBreakerEnabled = options.circuitBreakerEnabled !== false;
  var circuitBreakerConfig = options.circuitBreakerConfig || DEFAULT_CIRCUIT_BREAKER_CONFIG;
  var notificationsEnabled = options.notificationsEnabled !== false;
  
  // Sprint 6 #8: Rollback configuration
  var rollbackEnabled = options.rollbackEnabled !== false;

  // v3.3.0-ACTION3: windowAdapter para validação de globais
  var windowAdapter = options.windowAdapter || null;

  // Type for resolveGlobal
  var resolveGlobal: ((name: string) => unknown) | null = null;

  // Create helpers
  var helpers = createHelpers({
    logger: options.logger,
    telemetry: options.telemetry,
    eventEmitter: options.eventEmitter,
    moduleId: moduleId
  });

  // Create config resolver
  var configResolver = createConfigResolver(options.getPhaseConfig);

  // Create phase metrics
  var phaseMetrics = createPhaseMetrics({
    metricsSummary: options.metricsSummary,
    healthAggregator: options.healthAggregator
  });

  // Create breaker manager
  var breakerManager = createBreakerManager({
    enabled: circuitBreakerEnabled,
    breakerConfig: circuitBreakerConfig
  });

  // Create execution guard
  var executionGuard = createExecutionGuard({
    breakerManager: breakerManager,
    helpers: helpers,
    metrics: phaseMetrics,
    notificationsEnabled: notificationsEnabled
  });

  // Phase results storage
  var phaseResults = {};

  // v3.3.0-ACTION3: Create dependency checker with globals validation
  // resolveGlobal: uses windowAdapter.get() — cadeia AAA (adapter → window fallback)
  if (windowAdapter && typeof windowAdapter.get === 'function') {
    resolveGlobal = function(name: string) {
      return windowAdapter!.get(name);
    };
  }

  var dependencyChecker = createDependencyChecker(phaseResults, {
    resolveGlobal: resolveGlobal,
    logger: options.logger
  });

  // Sprint 6 #8: Create rollback system
  var rollbackRegistry: ReturnType<typeof createRollbackRegistry> | null = null;
  var rollbackExecutor: ReturnType<typeof createRollbackExecutor> | null = null;
  
  if (rollbackEnabled) {
    rollbackRegistry = createRollbackRegistry({
      logger: options.logger,
      maxEffectsPerPhase: options.maxEffectsPerPhase || 100
    });
    
    rollbackExecutor = createRollbackExecutor({
      logger: options.logger,
      registry: rollbackRegistry,
      eventEmitter: options.eventEmitter,
      continueOnError: options.rollbackContinueOnError !== false
    });
    
    helpers.log('info', 'Rollback system initialized', { 
      enabled: true,
      maxEffectsPerPhase: options.maxEffectsPerPhase || 100
    });
  }

  // Create suppression handler
  var suppressionHandler = createSuppressionHandler({
    helpers: helpers,
    phaseMetrics: phaseMetrics,
    phaseResults: phaseResults,
    // @ts-expect-error strict migration — TS2322
    degradationHandler: options.degradationHandler,
    notificationsEnabled: notificationsEnabled
  });

  // Create success handler
  var successHandler = createSuccessHandler({
    helpers: helpers,
    phaseMetrics: phaseMetrics,
    phaseResults: phaseResults
  });

  // Create error handler (Sprint 6 #8: com rollbackExecutor)
  var errorHandler = createErrorHandler({
    helpers: helpers,
    phaseMetrics: phaseMetrics,
    phaseResults: phaseResults,
    // @ts-expect-error strict migration — TS2322
    degradationHandler: options.degradationHandler,
    suppressionHandler: suppressionHandler,
    notificationsEnabled: notificationsEnabled,
    rollbackExecutor: rollbackExecutor
  });

  // Create skip handler
  var skipHandler = createSkipHandler({
    helpers: helpers,
    phaseMetrics: phaseMetrics,
    phaseResults: phaseResults,
    // @ts-expect-error strict migration — TS2322
    degradationHandler: options.degradationHandler
  });

  // Create phase runner (Sprint 6 #8: com rollbackRegistry)
  var phaseRunner = createPhaseRunner({
    helpers: helpers,
    configResolver: configResolver,
    executionGuard: executionGuard,
    dependencyChecker: dependencyChecker,
    successHandler: successHandler,
    errorHandler: errorHandler,
    skipHandler: skipHandler,
    // @ts-expect-error strict migration — TS2322
    retryExecutor: options.retryExecutor,
    breakerManager: breakerManager,
    // @ts-expect-error strict migration — TS2322
    rollbackRegistry: rollbackRegistry
  });

  // Create public API
  var publicAPI = createPublicAPI({
    moduleId: moduleId,
    phaseResults: phaseResults,
    phaseMetrics: phaseMetrics,
    breakerManager: breakerManager,
    circuitBreakerEnabled: circuitBreakerEnabled,
    notificationsEnabled: notificationsEnabled
  });

  // Return executor
  return {
    execute: phaseRunner.execute,
    getPhaseCircuitBreaker: publicAPI.getPhaseCircuitBreaker,
    getCircuitBreakerStatus: publicAPI.getCircuitBreakerStatus,
    getMemoryMetrics: publicAPI.getMemoryMetrics,
    getPhaseResult: publicAPI.getPhaseResult,
    getPhaseResults: publicAPI.getPhaseResults,
    getMetrics: publicAPI.getMetrics,
    reset: function() {
      publicAPI.reset();
      if (rollbackRegistry) rollbackRegistry.reset();
      if (rollbackExecutor) rollbackExecutor.reset();
    },
    info: function() {
      var baseInfo = publicAPI.info();
      return Object.assign({}, baseInfo, {
        rollbackEnabled: rollbackEnabled,
        globalsValidationEnabled: !!resolveGlobal,
        rollbackRegistry: rollbackRegistry ? rollbackRegistry.info() : null,
        rollbackExecutor: rollbackExecutor ? rollbackExecutor.info() : null
      });
    },
    
    // Sprint 6 #8: Expor rollback API
    getRollbackRegistry: function() { return rollbackRegistry; },
    getRollbackExecutor: function() { return rollbackExecutor; },
    rollbackPhase: function(phaseId: string) {
      if (!rollbackExecutor) return { success: false, reason: 'rollback-disabled' };
      return rollbackExecutor.rollbackPhase(phaseId);
    }
  };
}

export default { createPhaseExecutor };
