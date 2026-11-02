// Error Handler
// @version 4.0.0-STEP7
// @changelog v4.0.0-STEP7: Separação decisão/execução — decisões via error-outcome-resolver (Etapa 7, P1)
// @changelog v3.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v3.2.0-ROLLBACK: Sprint 6 #8 - Integração com sistema de rollback automático
// @changelog v3.1.1 - Fixed degradation-notifier import path to absolute
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS from ../../constants.js
//   DegradationNotifier from /bootstrap-v2/domain/degradation-notifier.js
//   resolveErrorOutcome, resolveRecoveryFailureOutcome from ./error-outcome-resolver.js
//
// RECEIVES (via createErrorHandler options):
//   options.helpers              — Log/emit/track utilities
//   options.phaseMetrics         — Phase metrics recorder
//   options.phaseResults         — Phase results storage ref
//   options.degradationHandler   — Degradation policy handler
//   options.suppressionHandler   — Error suppression handler
//   options.notificationsEnabled — Whether to send notifications
//   options.rollbackExecutor     — Sprint 6 rollback executor
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS } from '../../constants.js';
import * as DegradationNotifier from '/bootstrap-v2/domain/degradation-notifier.js';
import { resolveErrorOutcome, resolveRecoveryFailureOutcome } from './error-outcome-resolver.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.execution.error-handler';

interface ErrorHandlerOptions {
  helpers: Record<string, Function>;
  phaseMetrics: Record<string, Function>;
  phaseResults: Record<string, unknown>;
  degradationHandler: Record<string, Function>;
  suppressionHandler: Record<string, Function>;
  notificationsEnabled: boolean;
  rollbackExecutor?: Record<string, Function> | null;
}

interface ErrorContext {
  phaseId: string;
  phaseStart: number;
  phase: { id: string; name: string; recover?: (error: Error, ports: unknown) => Promise<void>; [key: string]: unknown };
  ports: unknown;
  critical: boolean;
  recoverable: boolean;
  manifestConfig: Record<string, unknown>;
  bootContext: { setPhaseResult: (phaseId: string, result: Record<string, unknown>) => void } | null;
  setState: (state: string) => void;
  memoryStart: Record<string, unknown> | null;
  breaker: { getState: () => string; getStats: () => Record<string, unknown> } | null;
  [key: string]: unknown;
}

interface MemorySnapshot {
  usedJSHeapSize: number;
  [key: string]: unknown;
}

export function createErrorHandler(options: ErrorHandlerOptions) {
  const helpers = options.helpers;
  const phaseMetrics = options.phaseMetrics;
  const phaseResults = options.phaseResults;
  const degradationHandler = options.degradationHandler;
  const suppressionHandler = options.suppressionHandler;
  const notificationsEnabled = options.notificationsEnabled;
  
  // Sprint 6 #8: Rollback executor (opcional)
  const rollbackExecutor = options.rollbackExecutor;

  /**
   * Sprint 6 #8: Executa rollback de uma fase
   */
  function executeRollback(phaseId: string, context: ErrorContext) {
    if (!rollbackExecutor) {
      helpers.log('debug', 'No rollback executor configured, skipping rollback for: ' + phaseId);
      return { skipped: true, reason: 'no-executor' };
    }
    
    helpers.log('info', 'Executing rollback for phase: ' + phaseId);
    helpers.emit(ORCHESTRATOR_EVENTS.PHASE_ROLLBACK_START || 'phase:rollback:start', { phaseId: phaseId });
    
    try {
      const rollbackResult = rollbackExecutor.rollbackPhase(phaseId);
      
      helpers.log('info', 'Rollback completed for phase: ' + phaseId, {
        success: rollbackResult.success,
        effectsReverted: rollbackResult.effectsReverted,
        effectsFailed: rollbackResult.effectsFailed
      });
      
      helpers.emit(ORCHESTRATOR_EVENTS.PHASE_ROLLBACK_COMPLETE || 'phase:rollback:complete', {
        phaseId: phaseId,
        result: rollbackResult
      });
      
      if (notificationsEnabled && DegradationNotifier && DegradationNotifier.notifyPhaseRollback) {
        DegradationNotifier.notifyPhaseRollback(phaseId, rollbackResult);
      }
      
      return rollbackResult;
    } catch (rollbackError: any) {
      helpers.log('error', 'Rollback failed for phase: ' + phaseId, { error: rollbackError.message });
      
      helpers.emit(ORCHESTRATOR_EVENTS.PHASE_ROLLBACK_ERROR || 'phase:rollback:error', {
        phaseId: phaseId,
        error: rollbackError.message
      });
      
      return { success: false, error: rollbackError.message };
    }
  }

  function handleRecovery(context: ErrorContext, error: Error, phaseTime: number) {
    const phaseId = context.phaseId;
    const phase = context.phase;
    const ports = context.ports;
    const manifestConfig = context.manifestConfig;
    const bootContext = context.bootContext;
    const setState = context.setState;
    const critical = context.critical;

    setState(ORCHESTRATOR_STATES.RECOVERING);
    phaseMetrics.incrementRecoveries();

    // @ts-expect-error strict migration — TS2722
    return Promise.resolve(phase.recover(error, ports)).then(function() {
      helpers.log('info', 'Phase ' + phaseId + ' recovered');
      phaseResults[phaseId] = { status: 'recovered', error: error.message, time: phaseTime };

      if (bootContext) {
        bootContext.setPhaseResult(phaseId, {
          success: true,
          recovered: true,
          degraded: true,
          time: phaseTime,
          error: error.message,
          memory: phaseMetrics.getPhaseMemory(phaseId)
        });
      }

      degradationHandler.applyPolicy(phaseId, manifestConfig);
      helpers.emit(ORCHESTRATOR_EVENTS.RECOVERY, { phaseId: phaseId });

      if (notificationsEnabled && DegradationNotifier) {
        DegradationNotifier.notifyPhaseDegraded(phaseId, 'Recovered from error: ' + error.message);
      }

      return { success: true, recovered: true, time: phaseTime };

    }).catch(function(recoveryError) {
      helpers.log('error', 'Phase ' + phaseId + ' recovery failed', { error: recoveryError.message });

      // DECISION via error-outcome-resolver (was: inline if/else chain)
      const decision = resolveRecoveryFailureOutcome({
        critical: critical,
        shouldSuppress: degradationHandler.shouldSuppressError(phaseId, manifestConfig),
        hasRollback: !!rollbackExecutor
      });

      helpers.log('info', 'Recovery failure outcome decided', {
        phaseId: phaseId,
        outcome: decision.outcome,
        reason: decision.reason
      });

      // EXECUTE based on decision
      let rollbackResult = null;

      // Execute rollback if decision includes it
      if (decision.outcome === 'rollback-then-suppress' || decision.outcome === 'rollback-then-fail') {
        rollbackResult = executeRollback(phaseId, context);
      }

      // Suppress path
      if (decision.outcome === 'suppress' || decision.outcome === 'rollback-then-suppress') {
        return suppressionHandler.handle({
          phaseId: phaseId,
          error: error,
          phaseTime: phaseTime,
          manifestConfig: manifestConfig,
          bootContext: bootContext,
          setState: setState,
          rollbackResult: rollbackResult
        });
      }

      // Critical fail path
      if (decision.outcome === 'fail-critical' || decision.outcome === 'rollback-then-fail') {
        if (bootContext) {
          bootContext.setPhaseResult(phaseId, {
            success: false,
            recovered: false,
            rolledBack: rollbackResult && rollbackResult.success,
            time: phaseTime,
            error: error.message
          });
        }
        setState(ORCHESTRATOR_STATES.FAILED);
        throw new Error('Critical phase failed: ' + phaseId);
      }

      // Soft fail path (non-critical)
      if (bootContext) {
        bootContext.setPhaseResult(phaseId, {
          success: false,
          recovered: false,
          rolledBack: rollbackResult && rollbackResult.success,
          time: phaseTime,
          error: error.message
        });
      }

      return { success: false, error: error.message, time: phaseTime, rollback: rollbackResult };
    });
  }

  return {
    handle: function(context: ErrorContext, error: Error, memoryEnd: MemorySnapshot | null) {
      const phaseId = context.phaseId;
      const phaseStart = context.phaseStart;
      const phase = context.phase;
      const critical = context.critical;
      const recoverable = context.recoverable;
      const manifestConfig = context.manifestConfig;
      const bootContext = context.bootContext;
      const setState = context.setState;
      const memoryStart = context.memoryStart;
      const breaker = context.breaker;

      const phaseTime = phaseMetrics.recordPhase(phaseId, phaseStart, 'failed', null, critical, memoryStart, memoryEnd);

      phaseResults[phaseId] = { status: 'failed', error: error.message, time: phaseTime };
      phaseMetrics.recordError(error, { phaseId: phaseId, critical: critical });

      helpers.log('error', 'Phase ' + phaseId + ' failed', {
        error: error.message,
        time: phaseTime,
        circuitBreakerState: breaker ? breaker.getState() : 'n/a'
      });
      
      helpers.emit(ORCHESTRATOR_EVENTS.PHASE_ERROR, { phaseId: phaseId, error: error.message });
      helpers.track('phase-error', { phaseId: phaseId, error: error.message });

      if (notificationsEnabled && DegradationNotifier) {
        DegradationNotifier.notifyPhaseFailed(phaseId, error.message, critical);
      }

      // DECISION via error-outcome-resolver (was: inline if/else chain)
      const decision = resolveErrorOutcome({
        recoverable: recoverable,
        hasRecover: !!(phase && phase.recover),
        critical: critical,
        shouldSuppress: degradationHandler.shouldSuppressError(phaseId, manifestConfig)
      });

      helpers.log('info', 'Error outcome decided', {
        phaseId: phaseId,
        outcome: decision.outcome,
        reason: decision.reason
      });

      // EXECUTE based on decision

      // Path: Recovery
      if (decision.outcome === 'recover') {
        return handleRecovery(context, error, phaseTime);
      }

      // Sprint 6 #8: Executa rollback se não há recovery
      const rollbackResult = executeRollback(phaseId, context);

      // Path: Suppress
      if (decision.outcome === 'suppress') {
        return suppressionHandler.handle({
          phaseId: phaseId,
          error: error,
          phaseTime: phaseTime,
          manifestConfig: manifestConfig,
          bootContext: bootContext,
          setState: setState,
          rollbackResult: rollbackResult
        });
      }

      // Path: Critical fail
      if (decision.outcome === 'fail-critical') {
        if (bootContext) {
          bootContext.setPhaseResult(phaseId, {
            success: false,
            recovered: false,
            rolledBack: rollbackResult && rollbackResult.success,
            time: phaseTime,
            error: error.message
          });
        }
        setState(ORCHESTRATOR_STATES.FAILED);
        throw new Error('Critical phase failed: ' + phaseId);
      }

      // Path: Soft fail (non-critical)
      if (bootContext) {
        bootContext.setPhaseResult(phaseId, {
          success: false,
          recovered: false,
          rolledBack: rollbackResult && rollbackResult.success,
          time: phaseTime,
          error: error.message
        });
      }

      return { success: false, error: error.message, time: phaseTime, rollback: rollbackResult };
    },
    
    // Sprint 6 #8: Expor método de rollback para uso externo
    executeRollback: executeRollback
  };
}

export default { createErrorHandler };
