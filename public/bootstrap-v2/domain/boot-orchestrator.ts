
// Boot Orchestrator
// @version 2.5.0-BOOT-CONTRACT
// @changelog v2.5.0-BOOT-CONTRACT: Integração com boot-contract.js para boot determinístico
// @changelog v2.4.0-ACTION3: Passa windowAdapter para PhaseExecutor (validação de globais — Ação 3)
// @changelog v2.3.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.3.0-OBSERVABILITY: Sprint 3 - Integração completa #5, #6, #25
// @changelog v2.2.0-MODULAR: Refatorado para arquitetura modular
// @changelog v2.2.0-QUICKWINS: QW#05 Circuit Breaker, QW#26 Metrics Summary integrados
// @changelog v2.1.0-QUICKWINS: QW#01 Validação obrigatória de dependências, QW#04 Backoff exponencial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.5.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   getPhaseConfig, validateManifest from ../boot-manifest/index.js
//   getBootContextInstance from ./boot-context.js
//   getHealthAggregatorInstance from ./boot-health-aggregator.js
//   MetricsSummary from ./boot-metrics-summary.js
//   MODULE_ID, VERSION, ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS,
//   createEventEmitter, createRetryExecutor, createDegradationHandler,
//   createPhaseExecutor from ./orchestrator/index.js
//   BOOT_STATES, canTransition, validateTransition, isBootComplete,
//   isBootFailed, getStateForPhase from ../contracts/boot-contract.js
//
// RECEIVES (via createBootOrchestrator ports):
//   ports.telemetry      — Telemetry tracker
//   ports.logger         — Logger instance
//   ports.windowAdapter  — WindowAdapter for global resolution (Action 3)
//
// CREATES:
//   Boot context, health aggregator, phase executor, event emitter
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPhaseConfig, validateManifest } from '../boot-manifest/index.js';
import { getInstance as getBootContextInstance } from './boot-context.js';
import { getInstance as getHealthAggregatorInstance } from './boot-health-aggregator.js';
import * as MetricsSummary from './boot-metrics-summary.js';

// Imports modulares
import {
  MODULE_ID,
  VERSION,
  ORCHESTRATOR_STATES,
  ORCHESTRATOR_EVENTS,
  createEventEmitter,
  createRetryExecutor,
  createDegradationHandler,
  createPhaseExecutor
} from './orchestrator/index.js';

// v2.5.0: Import boot-contract for deterministic boot
import {
  BOOT_STATES,
  canTransition,
  validateTransition,
  isBootComplete,
  isBootFailed,
  getStateForPhase
} from '../contracts/boot-contract.js';

export { ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS, MODULE_ID, VERSION };

// Types
interface OrchestratorPorts {
  telemetry?: Record<string, Function>;
  logger?: Record<string, Function>;
  windowAdapter?: (Record<string, Function> & { get: (name: string) => unknown }) | null;
  [key: string]: unknown;
}

interface PhaseConfig {
  id: string;
  name?: string;
  modules?: unknown[];
  critical?: boolean;
  recoverable?: boolean;
  execute?: (ports: unknown) => Promise<unknown>;
  [key: string]: unknown;
}

interface PhaseResult {
  success?: boolean;
  error?: string;
  skipped?: boolean;
  [key: string]: unknown;
}

interface OrchestratorError {
  phase: string;
  error: string;
  time: number;
}

function createBootOrchestrator(ports: OrchestratorPorts) {
  if (ports === undefined) ports = {};
  var telemetry = ports.telemetry;
  var logger = ports.logger;
  // v2.4.0-ACTION3: windowAdapter para validação de globais por phase
  var windowAdapter = ports.windowAdapter || null;

  var state: string = ORCHESTRATOR_STATES.IDLE;
  var currentPhase: string | null = null;
  var startTime: number | null = null;
  var errors: OrchestratorError[] = [];

  // v2.5.0: Boot contract state tracking
  var _bootState: string = BOOT_STATES.COLD;
  var _bootStateHistory: string[] = [BOOT_STATES.COLD];
  var _transitionErrors: Array<{ from: string; to: string; errors: string[]; timestamp: number }> = [];

  var _bootContext: ReturnType<typeof getBootContextInstance> | null = null;
  var _healthAggregator: ReturnType<typeof getHealthAggregatorInstance> | null = null;
  var _phaseExecutor: ReturnType<typeof createPhaseExecutor> | null = null;

  var totalMetrics = {
    totalTime: 0,
    retryAttempts: 0
  };

  // Componentes modulares (criados na inicialização)
  var eventEmitter = createEventEmitter({ logger: logger, moduleId: MODULE_ID });
  
  var retryExecutor = createRetryExecutor({
    logger: logger,
    onRetry: function(info: Record<string, unknown>) {
      totalMetrics.retryAttempts++;
    }
  });

  var degradationHandler = createDegradationHandler({
    logger: logger,
    moduleId: MODULE_ID,
    metricsSummary: MetricsSummary as unknown as { recordDegradation: (phaseId: string, message: string) => void },
    bootContext: null
  });

  // #6, #25: PhaseExecutor será recriado no run() com healthAggregator
  // Criar versão inicial sem healthAggregator
  _phaseExecutor = createPhaseExecutor({
    logger: logger,
    telemetry: telemetry,
    eventEmitter: eventEmitter,
    retryExecutor: retryExecutor,
    degradationHandler: degradationHandler,
    metricsSummary: MetricsSummary as unknown as Record<string, Function>,
    getPhaseConfig: getPhaseConfig,
    moduleId: MODULE_ID,
    healthAggregator: null,
    notificationsEnabled: true,
    circuitBreakerEnabled: true,
    windowAdapter: windowAdapter
  });

  function log(level: string, message: string, data?: Record<string, unknown>) {
    if (data === undefined) data = {};
    if (logger && logger[level]) {
      logger[level](message, Object.assign({}, data, { module: MODULE_ID }));
    }
  }

  function track(event: string, payload?: Record<string, unknown>) {
    if (payload === undefined) payload = {};
    if (telemetry && telemetry.track) {
      telemetry.track(event, Object.assign({}, payload, { module: MODULE_ID }));
    }
  }

  function setState(newState: string) {
    var oldState = state;
    state = newState;
    log('info', 'State: ' + oldState + ' → ' + newState);
    track('state-change', { from: oldState, to: newState });
  }

  // v2.5.0: Boot contract state transition with validation
  function setBootState(newBootState: string, context: Record<string, unknown>) {
    var validation = validateTransition(_bootState, newBootState, context);
    
    if (!validation.valid) {
      log('warn', 'Invalid boot state transition', {
        from: _bootState,
        to: newBootState,
        errors: validation.errors
      });
      _transitionErrors.push({
        from: _bootState,
        to: newBootState,
        errors: validation.errors,
        timestamp: Date.now()
      });
      // Continue anyway for backward compatibility but log the violation
    }

    if (validation.warnings && validation.warnings.length > 0) {
      log('info', 'Boot state transition warnings', { warnings: validation.warnings });
    }

    var oldBootState = _bootState;
    _bootState = newBootState;
    _bootStateHistory.push(newBootState);

    log('info', 'Boot state: ' + oldBootState + ' → ' + newBootState, {
      validated: validation.valid,
      historyLength: _bootStateHistory.length
    });
  }

  function validateManifestBeforeBoot() {
    var validation = validateManifest();
    if (!validation.valid) {
      log('error', 'Manifest validation failed', { errors: validation.errors });
      eventEmitter.emit(ORCHESTRATOR_EVENTS.MANIFEST_INVALID, { errors: validation.errors });
      return { valid: false, errors: validation.errors };
    }
    log('info', 'Manifest validated successfully', { phaseCount: validation.phaseCount });
    return { valid: true, errors: [] };
  }

  function run(phases: PhaseConfig[]) {
    if (state !== ORCHESTRATOR_STATES.IDLE) {
      log('warn', 'Orchestrator already running');
      return Promise.resolve({ success: false, reason: 'already-running' });
    }

    var manifestValidation = validateManifestBeforeBoot();
    if (!manifestValidation.valid) {
      log('error', 'Boot aborted due to invalid manifest', { errors: manifestValidation.errors });
      setBootState(BOOT_STATES.FAILED, { reason: 'invalid-manifest' });
      return Promise.resolve({
        success: false,
        reason: 'invalid-manifest',
        errors: manifestValidation.errors
      });
    }

    // v2.5.0: Transition to INITIALIZING using boot-contract
    setBootState(BOOT_STATES.INITIALIZING, { phase0Complete: false });

    MetricsSummary.startBoot();

    _bootContext = getBootContextInstance();
    _healthAggregator = getHealthAggregatorInstance(_bootContext as unknown as Parameters<typeof getHealthAggregatorInstance>[0]);
    _bootContext.start();

    // #6: Capturar baseline de memória
    if (_healthAggregator && _healthAggregator.captureMemoryBaseline) {
      _healthAggregator.captureMemoryBaseline();
      log('info', 'Memory baseline captured by orchestrator');
    }

    // Atualiza degradationHandler com bootContext
    degradationHandler = createDegradationHandler({
      logger: logger,
      moduleId: MODULE_ID,
      metricsSummary: MetricsSummary as unknown as { recordDegradation: (phaseId: string, message: string) => void },
      bootContext: _bootContext
    });

    // #6, #25: Recriar PhaseExecutor com healthAggregator e notificações
    _phaseExecutor = createPhaseExecutor({
      logger: logger,
      telemetry: telemetry,
      eventEmitter: eventEmitter,
      retryExecutor: retryExecutor,
      degradationHandler: degradationHandler,
      metricsSummary: MetricsSummary as unknown as Record<string, Function>,
      getPhaseConfig: getPhaseConfig,
      moduleId: MODULE_ID,
      healthAggregator: _healthAggregator as unknown as Record<string, Function>,
      notificationsEnabled: true,
      circuitBreakerEnabled: true,
      windowAdapter: windowAdapter
    });
    
    log('info', 'PhaseExecutor created with full integration', {
      healthAggregatorEnabled: !!_healthAggregator,
      notificationsEnabled: true,
      circuitBreakerEnabled: true,
      globalsValidationEnabled: !!windowAdapter,
      bootContractEnabled: true
    });

    startTime = performance.now();
    setState(ORCHESTRATOR_STATES.INITIALIZING);

    log('info', 'Boot pipeline starting', { 
      phases: phases.length, 
      manifestIntegrated: true, 
      manifestValidated: true,
      sprint3Integrated: true,
      bootContractEnabled: true
    });
    eventEmitter.emit(ORCHESTRATOR_EVENTS.INIT, { phases: phases.length });
    track('pipeline-start', { phases: phases.length });

    setState(ORCHESTRATOR_STATES.RUNNING);

    var results: Array<PhaseResult & { phaseId: string }> = [];
    var idx = 0;
    var skippedPhases: string[] = [];
    var phase0Complete = false;

    function runNext() {
      if (idx >= phases.length || state === ORCHESTRATOR_STATES.FAILED) {
        return Promise.resolve();
      }
      var phase = phases[idx];
      idx++;
      currentPhase = phase.id;

      // v2.5.0: Transition boot state based on phase using boot-contract
      var phaseBootState = getStateForPhase(phase.id);
      if (phaseBootState) {
        setBootState(phaseBootState, { 
          phase0Complete: phase0Complete,
          skippedPhases: skippedPhases
        });
      }

      return _phaseExecutor!.execute(phase, ports, _bootContext, setState).then(function(result: PhaseResult) {
        if (result.error) {
          errors.push({ phase: phase.id, error: result.error, time: Date.now() });
        }
        
        // v2.5.0: Track phase completion for boot-contract context
        if (phase.id === 'phase-0-critical' && result.success) {
          phase0Complete = true;
        }
        if (result.skipped) {
          skippedPhases.push(phase.id);
        }

        results.push(Object.assign({ phaseId: phase.id }, result));
        return runNext();
      });
    }

    return runNext().then(function() {
      totalMetrics.totalTime = Math.round(performance.now() - startTime!);

      if (state !== ORCHESTRATOR_STATES.FAILED) {
        setState(ORCHESTRATOR_STATES.COMPLETED);
      }

      var bootSuccess = state === ORCHESTRATOR_STATES.COMPLETED;
      var hasDegradation = skippedPhases.length > 0 || errors.length > 0;

      // v2.5.0: Set final boot state using boot-contract
      if (bootSuccess && !hasDegradation) {
        setBootState(BOOT_STATES.READY, { phase0Complete: phase0Complete });
      } else if (bootSuccess && hasDegradation) {
        setBootState(BOOT_STATES.DEGRADED, { 
          phase0Complete: phase0Complete,
          skippedPhases: skippedPhases
        });
      } else {
        setBootState(BOOT_STATES.FAILED, { 
          phase0Complete: phase0Complete,
          errors: errors
        });
      }

      MetricsSummary.endBoot(bootSuccess);

      if (_bootContext) {
        _bootContext.complete(bootSuccess);
      }

      var healthResult = _healthAggregator ? _healthAggregator.calculate() : null;
      var contextSnapshot = _bootContext ? _bootContext.getSnapshot() : null;
      var metricsSummary = MetricsSummary.getSummary();
      var phaseMetrics = _phaseExecutor!.getMetrics();
      
      // #6: Obter métricas de memória
      var memoryMetrics = _healthAggregator && _healthAggregator.getMemoryMetrics 
        ? _healthAggregator.getMemoryMetrics() 
        : null;

      var summary = {
        success: bootSuccess,
        state: state,
        bootState: _bootState,
        totalTime: totalMetrics.totalTime,
        p24Instrumented: true,
        manifestIntegrated: true,
        manifestValidated: true,
        sprint3Integrated: true,
        bootContractEnabled: true,
        phases: results,
        metrics: Object.assign({}, phaseMetrics, { 
          totalTime: totalMetrics.totalTime, 
          retryAttempts: totalMetrics.retryAttempts 
        }),
        errors: errors.slice(),
        context: contextSnapshot,
        health: healthResult,
        metricsSummary: metricsSummary,
        memory: memoryMetrics,
        bootStateHistory: _bootStateHistory.slice(),
        transitionErrors: _transitionErrors.slice()
      };

      log('info', 'Boot pipeline finished', {
        success: summary.success,
        bootState: _bootState,
        totalTime: summary.totalTime,
        health: healthResult ? healthResult.status : 'unknown',
        healthScore: healthResult ? healthResult.score : 0,
        retryAttempts: totalMetrics.retryAttempts,
        metricsErrors: metricsSummary.errorCount,
        metricsWarnings: metricsSummary.warningCount,
        memoryDelta: memoryMetrics ? memoryMetrics.totalDelta : null,
        bootStateHistoryLength: _bootStateHistory.length,
        transitionErrorCount: _transitionErrors.length
      });

      eventEmitter.emit(ORCHESTRATOR_EVENTS.COMPLETE, summary);
      eventEmitter.emit(ORCHESTRATOR_EVENTS.CONTEXT_READY, { context: contextSnapshot });
      eventEmitter.emit(ORCHESTRATOR_EVENTS.HEALTH_UPDATE, { health: healthResult });
      track('pipeline-complete', summary);

      return summary;
    });
  }

  function reset() {
    state = ORCHESTRATOR_STATES.IDLE;
    currentPhase = null;
    startTime = null;
    errors = [];
    totalMetrics.totalTime = 0;
    totalMetrics.retryAttempts = 0;

    // v2.5.0: Reset boot contract state
    _bootState = BOOT_STATES.COLD;
    _bootStateHistory = [BOOT_STATES.COLD];
    _transitionErrors = [];

    if (_phaseExecutor) {
      _phaseExecutor.reset();
    }
    MetricsSummary.reset();
    eventEmitter.clear();

    if (_bootContext) {
      _bootContext.reset();
    }
    _bootContext = null;
    
    if (_healthAggregator && _healthAggregator.reset) {
      _healthAggregator.reset();
    }
    _healthAggregator = null;

    log('info', 'Orchestrator reset (boot-contract compliant)');
  }

  function info() {
    var contextInfo = _bootContext ? _bootContext.info() : null;
    var healthInfo = _healthAggregator ? _healthAggregator.info() : null;
    var phaseMetrics = _phaseExecutor ? _phaseExecutor.getMetrics() : {};
    var phaseExecutorInfo = _phaseExecutor && _phaseExecutor.info ? _phaseExecutor.info() : null;

    return {
      moduleId: MODULE_ID,
      version: '2.5.0-BOOT-CONTRACT',
      state: state,
      bootState: _bootState,
      currentPhase: currentPhase,
      phasesCompleted: _phaseExecutor ? Object.keys(_phaseExecutor.getPhaseResults()).length : 0,
      metrics: Object.assign({}, phaseMetrics, totalMetrics),
      errors: errors.slice(),
      manifestIntegrated: true,
      sprint3Integrated: true,
      bootContractEnabled: true,
      quickWinsApplied: ['QW01-ValidateManifest', 'QW04-BackoffRetry', 'QW26-MetricsSummary'],
      improvements: ['#5-PeriodicHealth', '#6-MemoryMetrics', '#25-DegradationNotifier', 'ACTION3-GlobalsValidation', 'BOOT-CONTRACT'],
      modular: true,
      globalsValidationEnabled: !!windowAdapter,
      bootContext: contextInfo,
      healthAggregator: healthInfo,
      phaseExecutor: phaseExecutorInfo,
      metricsSummary: MetricsSummary.getSummary(),
      bootStateHistory: _bootStateHistory.slice(),
      transitionErrors: _transitionErrors.length
    };
  }

  function healthCheck() {
    var status = state === ORCHESTRATOR_STATES.COMPLETED ? 'healthy'
               : state === ORCHESTRATOR_STATES.FAILED ? 'unhealthy'
               : 'initializing';

    var bootHealth = _healthAggregator ? _healthAggregator.getStatus() : 'unknown';
    var bootScore = _healthAggregator ? _healthAggregator.getScore() : 0;
    var metricsSummary = MetricsSummary.getSummary();
    var phaseMetrics = _phaseExecutor ? _phaseExecutor.getMetrics() : {};
    var memoryMetrics = _healthAggregator && _healthAggregator.getMemoryMetrics 
      ? _healthAggregator.getMemoryMetrics() 
      : null;

    return {
      status: status,
      state: state,
      bootState: _bootState,
      bootStateValid: isBootComplete(_bootState) || isBootFailed(_bootState) || _bootState === BOOT_STATES.COLD,
      phasesSucceeded: phaseMetrics.phasesSucceeded || 0,
      phasesFailed: phaseMetrics.phasesFailed || 0,
      totalTime: totalMetrics.totalTime,
      retryAttempts: totalMetrics.retryAttempts,
      p24Instrumented: true,
      manifestIntegrated: true,
      sprint3Integrated: true,
      bootContractEnabled: true,
      modular: true,
      bootHealth: bootHealth,
      bootScore: bootScore,
      metricsErrors: metricsSummary.errorCount,
      metricsWarnings: metricsSummary.warningCount,
      memory: memoryMetrics,
      transitionErrors: _transitionErrors.length
    };
  }

  return {
    run: run,
    getState: function() { return state; },
    getBootState: function() { return _bootState; },
    getBootStateHistory: function() { return _bootStateHistory.slice(); },
    getCurrentPhase: function() { return currentPhase; },
    getPhaseResult: function(phaseId: string) { return _phaseExecutor ? _phaseExecutor.getPhaseResult(phaseId) : null; },
    getMetrics: function() { return Object.assign({}, _phaseExecutor ? _phaseExecutor.getMetrics() : {}, totalMetrics); },
    getErrors: function() { return errors.slice(); },
    getTransitionErrors: function() { return _transitionErrors.slice(); },
    reset: reset,
    on: eventEmitter.on,
    off: eventEmitter.off,
    info: info,
    healthCheck: healthCheck,
    getBootContext: function() { return _bootContext; },
    getHealthAggregator: function() { return _healthAggregator; },
    getMetricsSummary: function() { return MetricsSummary.getSummary(); },
    // #6: Expor métricas de memória
    getMemoryMetrics: function() { 
      return _healthAggregator && _healthAggregator.getMemoryMetrics 
        ? _healthAggregator.getMemoryMetrics() 
        : null; 
    },
    STATES: ORCHESTRATOR_STATES,
    EVENTS: ORCHESTRATOR_EVENTS,
    // v2.5.0: Expose boot contract states
    BOOT_STATES: BOOT_STATES
  };
}

export { createBootOrchestrator };
export default createBootOrchestrator;
