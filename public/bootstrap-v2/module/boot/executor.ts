
// Boot Executor
// @version 3.0.0-STEP7
// @changelog v3.0.0-STEP7 - Separação decisão/execução: 5 setMode() inline → mode-resolver (Etapa 7)
// @changelog v2.10.0-EVENTS-FORMALIZED - Migração string solta 'bootstrap:context-ready' → BOOT_EVENTS.CONTEXT_READY
// @changelog v2.9.0-DOMAIN-PURE - kernel.initialize() recebe eventBus via context.eventBusAdapter (elimina window.EventBus direto)
// @changelog v2.8.0-PERSISTENCE: Sprint 5 - Integração com onBootComplete para persistência
// @changelog v2.6.0-MODULAR: Versão modular inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   BOOT_EVENTS from /core/runtime/events/index.js
//   KERNEL_MODES, KERNEL_EVENTS from ../../kernel/index.js
//   SINGLETON_STATES from ../constants.js
//   getSingletonState, setSingletonState from ../singleton/index.js
//   checkBootLoop from ../boot-loop/index.js
//   PERIODIC_HEALTH_CONFIG from ../configs/index.js
//   resolveBootLoopMode, resolveBootCrashMode, resolveBootSuccessMode,
//     resolveBootFailureMode from ./mode-resolver.js
// RECEIVES via context:
//   config, orchestrator, stateMachine, kernel, globalTimeout,
//   loggerAdapter, telemetryAdapter, eventBusAdapter, degradationNotifier,
//   phases, onPeriodicHealthStart, onBootComplete
// BROWSER APIs (legítimo):
//   performance.now()       — timing
//   window.scrollTo()       — UX reset após boot
// WINDOW ACCESS: window.scrollTo() — LEGÍTIMO (browser API, UX reset)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';
import { KERNEL_MODES, KERNEL_EVENTS } from '../../kernel/index.js';
import { SINGLETON_STATES } from '../constants.js';
import { getSingletonState, setSingletonState } from '../singleton/index.js';
import { checkBootLoop } from '../boot-loop/index.js';
import { PERIODIC_HEALTH_CONFIG } from '../configs/index.js';
import {
  resolveBootLoopMode,
  resolveBootCrashMode,
  resolveBootSuccessMode,
  resolveBootFailureMode
} from './mode-resolver.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.boot.executor';

interface ModeDecision {
  mode: string | null;
  reason: string;
  details?: Record<string, unknown>;
}

interface BootContext {
  config: Record<string, unknown>;
  orchestrator: Record<string, Function>;
  stateMachine: Record<string, Function> & { STATES: Record<string, string> };
  kernel: Record<string, Function> | null;
  globalTimeout: { start: () => void; clear: (reason: string) => void; getStatus: () => Record<string, unknown> };
  loggerAdapter: { info: Function; warn: Function; error: Function };
  telemetryAdapter: { track: Function; error: Function };
  eventBusAdapter: { emit: Function; getEventBus?: Function };
  degradationNotifier: Record<string, Function> | null;
  phases: Array<Record<string, unknown>>;
  onPeriodicHealthStart: ((healthAgg: Record<string, unknown> | null) => void) | null;
  onBootComplete: ((result: BootResultData) => void) | null;
}

interface BootResultData {
  success: boolean;
  error?: string;
  totalTime?: number;
  phases?: Array<Record<string, unknown>>;
  context?: Record<string, unknown> | null;
  health?: { status: string; score?: number } | null;
  errors?: string[];
  cached?: boolean;
  bootLoopDetected?: boolean;
  cooldownMs?: number;
  reason?: string;
}

export function createBootExecutor(context: BootContext) {
  const config = context.config;
  const orchestrator = context.orchestrator;
  const stateMachine = context.stateMachine;
  const kernel = context.kernel;
  const globalTimeout = context.globalTimeout;
  const loggerAdapter = context.loggerAdapter;
  const telemetryAdapter = context.telemetryAdapter;
  const eventBusAdapter = context.eventBusAdapter;
  const degradationNotifier = context.degradationNotifier;
  const phases = context.phases;
  const onPeriodicHealthStart = context.onPeriodicHealthStart;
  const onBootComplete = context.onBootComplete; // Sprint 5: Hook de persistência
  
  let bootResult: BootResultData | null = null;

  // ─────────────────────────────────────────────────────────────
  // HELPER: Apply mode decision to kernel
  // Receives a decision from mode-resolver, EXECUTES it on kernel
  // ─────────────────────────────────────────────────────────────
  function _applyModeDecision(decision: ModeDecision) {
    if (!decision || !decision.mode) {
      // No change needed (null mode = already in correct state)
      return false;
    }
    if (kernel) {
      kernel.setMode(decision.mode, decision.reason);
      loggerAdapter.info('Mode decision applied', {
        mode: decision.mode,
        reason: decision.reason,
        details: decision.details || null
      });
      return true;
    }
    return false;
  }

  function execute() {
    const globalState = getSingletonState();

    // ── Check boot loop ──
    const loopCheck = checkBootLoop(degradationNotifier);
    if (!loopCheck.allowed) {
      loggerAdapter.error('Boot blocked by loop detection', loopCheck);
      telemetryAdapter.error('boot-loop-blocked', loopCheck);
      setSingletonState({ state: SINGLETON_STATES.SAFE_MODE, bootLoopDetected: true });
      
      // DECISION via mode-resolver (was: inline kernel.setMode)
      const loopDecision = resolveBootLoopMode(loopCheck);
      _applyModeDecision(loopDecision);
      
      return Promise.resolve({
        success: false,
        error: loopCheck.reason,
        bootLoopDetected: true,
        cooldownMs: loopCheck.cooldownMs || loopCheck.remainingMs
      });
    }

    // ── Check duplicate boot ──
    if (globalState!.state === SINGLETON_STATES.RUNNING) {
      loggerAdapter.warn('Boot already RUNNING, blocking duplicate');
      return Promise.resolve({ success: false, error: 'DUPLICATE_BOOT_BLOCKED', reason: 'already_running' });
    }

    if (globalState!.state === SINGLETON_STATES.COMPLETED) {
      loggerAdapter.warn('Boot already COMPLETED, returning cached result');
      return Promise.resolve(bootResult || { success: true, cached: true });
    }

    if (bootResult) {
      loggerAdapter.warn('Boot already executed (local guard)');
      return Promise.resolve(bootResult);
    }

    // ── Start boot ──
    setSingletonState({
      state: SINGLETON_STATES.STARTING,
      startCount: globalState!.startCount + 1,
      timestamp: Date.now(),
      bootLoopDetected: false
    });

    const startTime = performance.now();
    
    // Capture memory baseline
    const healthAgg = orchestrator.getHealthAggregator();
    if (healthAgg && healthAgg.captureMemoryBaseline) {
      healthAgg.captureMemoryBaseline();
      loggerAdapter.info('Memory baseline captured');
    }
    
    loggerAdapter.info('Boot pipeline starting', {
      phases: phases.length,
      startCount: globalState!.startCount + 1,
      manifestControlled: true,
      kernelMode: kernel ? kernel.getMode() : 'unknown',
      bootLoopStatus: loopCheck
    });

    setSingletonState({ state: SINGLETON_STATES.RUNNING });
    
    globalTimeout.start();

    telemetryAdapter.track('boot-start', {
      phases: phases.length,
      bootAttempt: loopCheck.bootsInWindow
    });
    stateMachine.transition(stateMachine.STATES.INITIALIZING);

    return orchestrator.run(phases).then(function(result: BootResultData) {
      globalTimeout.clear('boot-completed');
      bootResult = result;
      
      const contextSnapshot = result.context || null;
      const healthResult = result.health || null;
      
      // v2.9.0: Initialize kernel — EventBus via eventBusAdapter (not window.EventBus)
      if (kernel) {
        const initResult = kernel.initialize({
          bootContext: orchestrator.getBootContext(),
          healthAggregator: orchestrator.getHealthAggregator(),
          orchestrator: orchestrator,
          stateMachine: stateMachine,
          eventBus: eventBusAdapter && eventBusAdapter.getEventBus ? eventBusAdapter.getEventBus() : null,
          logger: loggerAdapter
        });
        
        loggerAdapter.info('Kernel initialized with StateMachine sync', {
          success: initResult.success,
          syncEnabled: initResult.syncEnabled
        });
      }
      
      if (bootResult.success) {
        _handleBootSuccess(bootResult, contextSnapshot, healthResult, healthAgg, startTime);
      } else {
        _handleBootFailure(bootResult);
      }
      
      // Sprint 5: Persistir resultado do boot
      if (onBootComplete && typeof onBootComplete === 'function') {
        try {
          onBootComplete(bootResult);
          loggerAdapter.info('Boot result persisted', { success: bootResult.success });
        } catch (e: any) {
          loggerAdapter.warn('Failed to persist boot result', { error: e.message });
        }
      }
      
      telemetryAdapter.track('boot-complete', {
        success: bootResult.success,
        totalTime: bootResult.totalTime,
        health: bootResult.health ? bootResult.health.status : 'unknown',
        kernelMode: kernel ? kernel.getMode() : 'unknown',
        kernelSyncEnabled: kernel ? kernel.info().syncEnabled : false,
        persisted: !!onBootComplete
      });
      
      return bootResult;
    }).catch(function(error: Error) {
      globalTimeout.clear('boot-error');
      
      setSingletonState({ state: SINGLETON_STATES.FAILED });
      stateMachine.transition(stateMachine.STATES.ERROR);
      
      // DECISION via mode-resolver (was: inline kernel.setMode)
      const crashDecision = resolveBootCrashMode(error, kernel ? kernel.getMode() : null);
      _applyModeDecision(crashDecision);
      
      if (degradationNotifier && degradationNotifier.notifyBootFailed) {
        degradationNotifier.notifyBootFailed('Crash: ' + error.message);
      }
      
      bootResult = { success: false, error: error.message, totalTime: Math.round(performance.now() - startTime) };
      
      // Sprint 5: Persistir mesmo em caso de falha
      if (onBootComplete && typeof onBootComplete === 'function') {
        try {
          onBootComplete(bootResult);
        } catch (e: any) {
          // Silently fail
        }
      }
      
      loggerAdapter.error('Boot crashed', { error: error.message, kernelMode: kernel ? kernel.getMode() : 'unknown' });
      telemetryAdapter.error('boot-crash', { error: error.message });
      return bootResult;
    });
  }

  function _handleBootSuccess(result: BootResultData, contextSnapshot: Record<string, unknown> | null, healthResult: { status: string; score?: number } | null, healthAgg: Record<string, Function> | null, startTime: number) {
    setSingletonState({ state: SINGLETON_STATES.COMPLETED });
    
    const readyResult = stateMachine.transition(stateMachine.STATES.READY);
    if (!readyResult.success) {
      loggerAdapter.warn('StateMachine READY transition failed', {
        error: readyResult.error,
        currentState: stateMachine.getState()
      });
    }
    
    // DECISION via mode-resolver (was: inline if/else kernel.setMode)
    const successDecision = resolveBootSuccessMode({
      contextSnapshot: contextSnapshot,
      healthResult: healthResult,
      currentMode: kernel ? kernel.getMode() : null
    });
    const modeApplied = _applyModeDecision(successDecision);
    
    // Notify degradation if mode resolved to DEGRADED
    if (successDecision.mode === KERNEL_MODES.DEGRADED) {
      if (degradationNotifier && degradationNotifier.notifyBootDegraded) {
        degradationNotifier.notifyBootDegraded('Boot completou com degradações', {
          degradationCount: successDecision.details ? successDecision.details.degradationCount : 0,
          healthStatus: successDecision.details ? successDecision.details.healthStatus : 'unknown'
        });
      }
    }
    
    loggerAdapter.info('Kernel mode after boot', {
      mode: kernel ? kernel.getMode() : 'unknown',
      decision: successDecision.reason,
      modeApplied: modeApplied,
      hasDegradations: successDecision.details ? successDecision.details.hasDegradations : false,
      healthDegraded: successDecision.details ? successDecision.details.healthDegraded : false,
      syncEnabled: kernel ? kernel.info().syncEnabled : false
    });
    
    // Emit events
    eventBusAdapter.emit(BOOT_EVENTS.READY, {
      totalTime: result.totalTime,
      // @ts-expect-error strict migration — TS18048
      phases: result.phases.length,
      context: contextSnapshot,
      health: healthResult,
      kernelMode: kernel ? kernel.getMode() : null,
      kernelSyncEnabled: kernel ? kernel.info().syncEnabled : false
    });
    
    // v2.10.0: Migração string solta → constante centralizada
    eventBusAdapter.emit(BOOT_EVENTS.CONTEXT_READY, {
      context: contextSnapshot,
      health: healthResult,
      kernel: kernel ? kernel.getSnapshot() : null,
      timestamp: Date.now()
    });
    
    if (kernel) {
      eventBusAdapter.emit(KERNEL_EVENTS.READY, {
        mode: kernel.getMode(),
        capabilities: kernel.getEnabledCapabilities(),
        health: healthResult,
        syncEnabled: kernel.info().syncEnabled,
        timestamp: Date.now()
      });
    }
    
    // Start periodic health check
    if (PERIODIC_HEALTH_CONFIG.enabled && PERIODIC_HEALTH_CONFIG.autoStart && onPeriodicHealthStart) {
      setTimeout(function() {
        onPeriodicHealthStart(healthAgg);
      }, PERIODIC_HEALTH_CONFIG.startDelay);
    }
    
    // v2.9.0: window.scrollTo — browser API legítima (UX reset)
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    
    // Log final metrics
    const memoryMetrics = healthAgg && healthAgg.getMemoryMetrics ? healthAgg.getMemoryMetrics() : null;
    
    loggerAdapter.info('Boot complete', {
      totalTime: result.totalTime,
      success: true,
      stateMachineState: stateMachine.getState(),
      health: healthResult ? healthResult.status : 'unknown',
      healthScore: healthResult ? healthResult.score : 0,
      degradations: contextSnapshot ? contextSnapshot.degradationCount : 0,
      kernelMode: kernel ? kernel.getMode() : 'unknown',
      kernelCapabilities: kernel ? kernel.getEnabledCapabilities().length : 0,
      kernelSyncEnabled: kernel ? kernel.info().syncEnabled : false,
      globalTimeoutStatus: globalTimeout.getStatus(),
      memoryDelta: memoryMetrics ? memoryMetrics.totalDelta : null,
      periodicHealthEnabled: PERIODIC_HEALTH_CONFIG.enabled,
      persistenceEnabled: !!onBootComplete
    });
  }

  function _handleBootFailure(result: BootResultData) {
    setSingletonState({ state: SINGLETON_STATES.FAILED });
    stateMachine.transition(stateMachine.STATES.ERROR);
    
    // DECISION via mode-resolver (was: inline kernel.setMode)
    const failureDecision = resolveBootFailureMode(result, kernel ? kernel.getMode() : null);
    _applyModeDecision(failureDecision);
    
    if (degradationNotifier && degradationNotifier.notifyBootFailed) {
      degradationNotifier.notifyBootFailed(result.error || 'unknown');
    }
    
    loggerAdapter.error('Boot failed', {
      errors: result.errors,
      decision: failureDecision.reason,
      kernelMode: kernel ? kernel.getMode() : 'unknown'
    });
  }

  return {
    execute: execute,
    getResult: function() { return bootResult; },
    setResult: function(r: BootResultData | null) { bootResult = r; }
  };
}

export default { createBootExecutor };
