// Phase Runner
// @version 3.2.1-CONTRACTS
// @changelog v3.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v3.2.0-ROLLBACK: Sprint 6 #8 - Passa rollback tracker para fases
// @changelog v3.1.0-MODULAR: Versão modular inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS from ../../constants.js
//   captureMemory from ../utils/memory.js
//
// RECEIVES (via createPhaseRunner options):
//   options.helpers, configResolver, executionGuard,
//   options.dependencyChecker, successHandler, errorHandler,
//   options.skipHandler, retryExecutor, breakerManager,
//   options.rollbackRegistry
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS } from '../../constants.js';
import { captureMemory } from '../utils/memory.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.execution.phase-runner';

interface BreakerCheckResult {
  canExecute: boolean;
  breaker?: { execute: (fn: () => Promise<unknown>) => Promise<unknown>; getState: () => string; getStats: () => Record<string, unknown> } | null;
  state?: string;
}

interface PhaseRunnerOptions {
  helpers: { log: Function; emit: Function; track: Function };
  configResolver: { resolve: Function };
  executionGuard: { canExecute: (phaseId: string, config: Record<string, unknown>) => BreakerCheckResult };
  dependencyChecker: { check: Function };
  successHandler: { handle: Function };
  errorHandler: { handle: Function };
  skipHandler: { handle: Function };
  retryExecutor: Record<string, Function>;
  breakerManager: { isEnabled: () => boolean };
  rollbackRegistry?: { startPhase: (phaseId: string) => Record<string, unknown>; hasEffects: (phaseId: string) => boolean; info: () => { phases: Array<{ phaseId: string; effectCount: number }> } } | null;
}

interface RunnerPhase {
  id: string;
  name?: string;
  modules?: unknown[];
  critical?: boolean;
  recoverable?: boolean;
  execute?: (ports: unknown) => Promise<unknown>;
  [key: string]: unknown;
}

export function createPhaseRunner(options: PhaseRunnerOptions) {
  var helpers = options.helpers;
  var configResolver = options.configResolver;
  var executionGuard = options.executionGuard;
  var dependencyChecker = options.dependencyChecker;
  var successHandler = options.successHandler;
  var errorHandler = options.errorHandler;
  var skipHandler = options.skipHandler;
  var retryExecutor = options.retryExecutor;
  var breakerManager = options.breakerManager;
  
  // Sprint 6 #8: Rollback registry
  var rollbackRegistry = options.rollbackRegistry;

  return {
    execute: function(phase: RunnerPhase, ports: Record<string, unknown>, bootContext: Record<string, unknown> | null, setState: (state: string) => void) {
      var phaseId = phase.id;
      var phaseStart = performance.now();
      var memoryStart = captureMemory();

      var manifestConfig = configResolver.resolve(phase) as Record<string, unknown>;
      var effectiveCritical = manifestConfig.critical as boolean;
      var effectiveRecoverable = (manifestConfig.recoverable || phase.recoverable) as boolean;
      var retryConfig = (manifestConfig.retry || { enabled: false, maxAttempts: 1 }) as Record<string, unknown>;

      // Check Circuit Breaker
      var breakerCheck = executionGuard.canExecute(phaseId, manifestConfig);

      if (!breakerCheck.canExecute) {
        var memoryEnd = captureMemory();
        return skipHandler.handle({
          phaseId: phaseId,
          phaseStart: phaseStart,
          critical: effectiveCritical,
          manifestConfig: manifestConfig,
          bootContext: bootContext,
          breakerState: breakerCheck.state,
          memoryStart: memoryStart,
          memoryEnd: memoryEnd
        });
      }

      setState(ORCHESTRATOR_STATES.PHASE_EXECUTING);

      // Sprint 6 #8: Cria tracker para esta fase
      var effectTracker: Record<string, unknown> | null = null;
      if (rollbackRegistry) {
        effectTracker = rollbackRegistry.startPhase(phaseId);
      }

      helpers.log('info', 'Phase ' + phaseId + ' starting', {
        name: phase.name,
        modules: phase.modules ? phase.modules.length : 0,
        critical: effectiveCritical,
        retryEnabled: retryConfig.enabled,
        circuitBreakerEnabled: breakerManager.isEnabled() && manifestConfig.circuitBreaker !== false,
        rollbackEnabled: !!rollbackRegistry,
        memoryAtStart: memoryStart ? memoryStart.usedJSHeapSize : null
      });

      helpers.emit(ORCHESTRATOR_EVENTS.PHASE_START, { phaseId: phaseId, name: phase.name });
      helpers.track('phase-start', { phaseId: phaseId, name: phase.name });

      var executeFunction = function() {
        return Promise.resolve().then(function() {
          var depCheck = dependencyChecker.check(phase);
          if (!depCheck.satisfied) {
            throw new Error('Dependency not met: ' + depCheck.missingDependency);
          }
          
          // Sprint 6 #8: Passa effectTracker para a fase via ports estendido
          var extendedPorts = Object.assign({}, ports, {
            effectTracker: effectTracker
          });
          
          // @ts-expect-error strict migration — TS2722
          return phase.execute(extendedPorts);
        });
      };

      var breaker = breakerCheck.breaker;
      var executionPromise;

      if (breaker && breakerManager.isEnabled()) {
        executionPromise = breaker.execute(function() {
          return retryExecutor.execute(executeFunction, retryConfig, phaseId);
        });
      } else {
        executionPromise = retryExecutor.execute(executeFunction, retryConfig, phaseId);
      }

      var context = {
        phaseId: phaseId,
        phaseStart: phaseStart,
        phase: phase,
        ports: ports,
        critical: effectiveCritical,
        recoverable: effectiveRecoverable,
        manifestConfig: manifestConfig,
        bootContext: bootContext,
        setState: setState,
        memoryStart: memoryStart,
        breaker: breaker,
        effectTracker: effectTracker
      };

      return executionPromise.then(function(result: unknown) {
        var memoryEnd = captureMemory();
        
        // Sprint 6 #8: Log de effects registrados em caso de sucesso
        if (rollbackRegistry && rollbackRegistry.hasEffects(phaseId)) {
          var registryInfo = rollbackRegistry.info();
          var phaseEffects = registryInfo.phases.find(function(p: { phaseId: string; effectCount: number }) { return p.phaseId === phaseId; });
          helpers.log('debug', 'Phase ' + phaseId + ' registered effects for potential rollback', {
            effectCount: phaseEffects ? phaseEffects.effectCount : 0
          });
        }
        
        return successHandler.handle(Object.assign({}, context, {
          result: result,
          memoryEnd: memoryEnd
        }));
      }).catch(function(error: Error) {
        var memoryEnd = captureMemory();
        return errorHandler.handle(context, error, memoryEnd);
      });
    }
  };
}

export default { createPhaseRunner };
