
// Phase Runner
// @version 1.4.1-CONTRACTS
// @description Executor de fases e módulos do bootstrap
// @changelog v1.4.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.4.0-QUICKWINS: QW#05 Circuit Breaker, QW#28 Module Cache integrados
// @changelog v1.3.0-QUICKWINS: QW#02 Timeouts individuais por módulo
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.4.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   getTimeout, TIMEOUTS from ../boot-manifest/index.js
//   getBreaker from ./circuit-breaker.js
//   ModuleCache from ./module-cache.js
//   MetricsSummary from ./boot-metrics-summary.js
//
// RECEIVES (via createPhaseRunner ports):
//   ports.telemetry — Telemetry tracker
//   ports.logger    — Logger instance
//
// PROVIDES:
//   createPhaseRunner() — Factory for phase/module execution
//   MODULE_STATUS       — Status enum for modules
//   MODULE_TIMEOUT_MAP  — Module-to-timeout mapping
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getTimeout, TIMEOUTS } from '../boot-manifest/index.js';
// QW#05: Circuit Breaker
import { getBreaker } from './circuit-breaker.js';
// QW#28: Module Cache
import * as ModuleCache from './module-cache.js';
// QW#26: Metrics Summary
import * as MetricsSummary from './boot-metrics-summary.js';

var MODULE_ID = 'phase-runner';
var VERSION = '1.4.1-CONTRACTS';

var MODULE_STATUS = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  SKIPPED: 'skipped',
  TIMEOUT: 'timeout',
  CIRCUIT_OPEN: 'circuit-open'
};

var MODULE_TIMEOUT_MAP: Record<string, string> = {
  'eventbus': 'MODULE_EVENTBUS',
  'logger': 'MODULE_LOGGER',
  'error-boundary': 'MODULE_ERROR_BOUNDARY',
  'config': 'MODULE_CONFIG',
  'security-csrf': 'MODULE_SECURITY',
  'environment': 'MODULE_ENVIRONMENT',
  'global-state': 'MODULE_GLOBAL_STATE',
  'router-global': 'MODULE_ROUTER',
  'ready-flags': 'MODULE_READY_FLAGS',
  'telemetry-core': 'MODULE_TELEMETRY',
  'session-manager': 'MODULE_SESSION',
  'auth-orchestrator': 'MODULE_AUTH',
  'login-modal': 'MODULE_LOGIN',
  'app-shell': 'MODULE_APP_SHELL',
  'header': 'MODULE_HEADER',
  'nav-rail': 'MODULE_NAV',
  'footer': 'MODULE_FOOTER',
  'main-engine': 'MODULE_MAIN_ENGINE',
  'container-main': 'MODULE_CONTAINER',
  'ui-orchestrator': 'MODULE_UI_ORCHESTRATOR',
  'ticker': 'MODULE_TICKER',
  'toast': 'MODULE_TOAST',
  'preloader-fade': 'MODULE_PRELOADER',
  'platform-init': 'MODULE_PLATFORM'
};

// Módulos que usam circuit breaker (externos/instáveis)
var CIRCUIT_BREAKER_MODULES = [
  'telemetry-core',
  'session-manager',
  'auth-orchestrator'
];

// Types
interface PhaseRunnerPorts {
  telemetry?: { track: (event: string, payload: Record<string, unknown>) => void };
  logger?: { [level: string]: (message: string, data?: Record<string, unknown>) => void };
}

interface ModuleConfig {
  id: string;
  loader?: (context: Record<string, unknown>, signal: AbortSignal | null) => unknown | Promise<unknown>;
  initializer?: (mod: unknown, context: Record<string, unknown>) => unknown | Promise<unknown>;
  optional?: boolean;
  timeout?: number;
}

interface PhaseRunConfig {
  id: string;
  name: string;
  modules?: ModuleConfig[];
  parallel?: boolean;
  stopOnError?: boolean;
}

function createPhaseRunner(ports: PhaseRunnerPorts) {
  if (ports === undefined) ports = {};
  var telemetry = ports.telemetry;
  var logger = ports.logger;

  var _metrics = {
    modulesRun: 0,
    modulesSucceeded: 0,
    modulesFailed: 0,
    modulesTimedOut: 0,
    modulesCircuitOpen: 0,
    modulesCached: 0,
    phasesRun: 0,
    phasesSucceeded: 0,
    phasesFailed: 0,
    totalTime: 0,
    moduleTimings: {} as Record<string, { time: number; loadTime?: number; initTime?: number; timeout: number; status: string }>
  };

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

  function _getModuleTimeout(moduleId: string, configTimeout: number | undefined) {
    if (configTimeout && configTimeout > 0) {
      return configTimeout;
    }
    var timeoutKey = MODULE_TIMEOUT_MAP[moduleId];
    if (timeoutKey) {
      return getTimeout(timeoutKey);
    }
    return TIMEOUTS.DEFAULT_MODULE || 10000;
  }

  // QW#05: Verificar se módulo usa circuit breaker
  function _useCircuitBreaker(moduleId: string) {
    return CIRCUIT_BREAKER_MODULES.indexOf(moduleId) !== -1;
  }

  function runModule(moduleConfig: ModuleConfig, context: Record<string, unknown>) {
    if (context === undefined) context = {};
    var id = moduleConfig.id;
    var loader = moduleConfig.loader;
    var initializer = moduleConfig.initializer;
    var optional = moduleConfig.optional || false;
    var timeout = _getModuleTimeout(id, moduleConfig.timeout);
    var startTime = performance.now();
    var loadTime = 0;
    var initTime = 0;

    log('info', 'Module ' + id + ' starting', { timeout: timeout });
    track('module-start', { moduleId: id, timeout: timeout });
    _metrics.modulesRun++;

    // QW#05: Verificar circuit breaker
    if (_useCircuitBreaker(id)) {
      var breaker = getBreaker(id);
      if (!breaker.canExecute()) {
        log('warn', 'Module ' + id + ' skipped - circuit breaker OPEN');
        _metrics.modulesCircuitOpen++;
        return Promise.resolve({
          id: id,
          status: MODULE_STATUS.CIRCUIT_OPEN,
          error: 'Circuit breaker open',
          optional: true
        });
      }
    }

    var moduleRef: unknown = null;
    var abortController: AbortController | null = null;
    var timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (typeof AbortController !== 'undefined') {
      abortController = new AbortController();
    }

    var timeoutPromise = new Promise(function(_, reject) {
      timeoutId = setTimeout(function() {
        if (abortController) abortController.abort();
        reject(new Error('Module timeout after ' + timeout + 'ms'));
      }, timeout);
    });

    var executionPromise = Promise.resolve().then(function() {
      if (!loader) return null;
      
      var loadStart = performance.now();
      
      // QW#28: Tentar cache primeiro
      if (ModuleCache.has(id)) {
        _metrics.modulesCached++;
        log('info', 'Module ' + id + ' loaded from cache');
        return ModuleCache.get(id);
      }
      
      return Promise.resolve(loader(context, abortController ? abortController.signal : null)).then(function(mod) {
        loadTime = Math.round(performance.now() - loadStart);
        // QW#28: Armazenar no cache
        ModuleCache.set(id, mod, { loadTime: loadTime });
        return mod;
      });
    }).then(function(mod) {
      moduleRef = mod;
      log('info', 'Module ' + id + ' loaded', { loadTime: loadTime });
      if (!initializer) return null;
      
      var initStart = performance.now();
      return Promise.resolve(initializer(moduleRef, context)).then(function(result) {
        initTime = Math.round(performance.now() - initStart);
        return result;
      });
    });

    return Promise.race([executionPromise, timeoutPromise]).then(function(result) {
      // @ts-expect-error strict migration — TS2769
      clearTimeout(timeoutId);
      var elapsed = Math.round(performance.now() - startTime);
      _metrics.modulesSucceeded++;
      _metrics.totalTime += elapsed;
      _metrics.moduleTimings[id] = { time: elapsed, loadTime: loadTime, initTime: initTime, timeout: timeout, status: 'success' };

      // QW#05: Registrar sucesso no circuit breaker
      if (_useCircuitBreaker(id)) {
        getBreaker(id).recordSuccess();
      }

      // QW#26: Registrar módulo nas métricas
      MetricsSummary.recordModule(id, {
        phaseId: (context.phaseId as string) || 'unknown',
        loadTime: loadTime,
        initTime: initTime,
        totalTime: elapsed,
        status: 'ready',
        critical: !optional,
        timeout: timeout
      });

      track('module-ready', { moduleId: id, time: elapsed, timeout: timeout });

      return { id: id, status: MODULE_STATUS.READY, module: moduleRef, result: result, time: elapsed, loadTime: loadTime, initTime: initTime, timeout: timeout };
    }).catch(function(error) {
      // @ts-expect-error strict migration — TS2769
      clearTimeout(timeoutId);
      var elapsed = Math.round(performance.now() - startTime);
      var isTimeout = error.message.indexOf('timeout') !== -1;
      
      if (isTimeout) {
        _metrics.modulesTimedOut++;
      }
      _metrics.modulesFailed++;
      _metrics.totalTime += elapsed;
      _metrics.moduleTimings[id] = { time: elapsed, timeout: timeout, status: isTimeout ? 'timeout' : 'error' };

      // QW#05: Registrar falha no circuit breaker
      if (_useCircuitBreaker(id)) {
        getBreaker(id).recordFailure(error);
      }

      // QW#26: Registrar módulo com erro nas métricas
      MetricsSummary.recordModule(id, {
        phaseId: (context.phaseId as string) || 'unknown',
        loadTime: loadTime,
        initTime: initTime,
        totalTime: elapsed,
        status: isTimeout ? 'timeout' : 'error',
        critical: !optional,
        timeout: timeout
      });

      log('error', 'Module ' + id + ' failed', { error: error.message, isTimeout: isTimeout });
      track('module-error', { moduleId: id, error: error.message, isTimeout: isTimeout });

      if (!optional) throw error;

      return { 
        id: id, 
        status: isTimeout ? MODULE_STATUS.TIMEOUT : MODULE_STATUS.ERROR, 
        error: error.message, 
        time: elapsed, 
        timeout: timeout,
        optional: true 
      };
    });
  }

  function runPhase(phaseConfig: PhaseRunConfig, context: Record<string, unknown>) {
    if (context === undefined) context = {};
    var id = phaseConfig.id;
    var name = phaseConfig.name;
    var modules = phaseConfig.modules || [];
    var parallel = phaseConfig.parallel || false;
    var stopOnError = phaseConfig.stopOnError !== false;
    var startTime = performance.now();
    var results: Record<string, unknown>[] = [];

    // Adicionar phaseId ao contexto para métricas
    var phaseContext = Object.assign({}, context, { phaseId: id });

    log('info', 'Phase ' + id + ' (' + name + ') starting', { modules: modules.length, parallel: parallel });
    track('phase-run-start', { phaseId: id, modules: modules.length });
    _metrics.phasesRun++;

    var promise;

    if (parallel) {
      var promises = modules.map(function(m) {
        return runModule(m, phaseContext).catch(function(error) {
          return { id: m.id, status: MODULE_STATUS.ERROR, error: error.message, optional: m.optional };
        });
      });
      promise = Promise.all(promises).then(function(moduleResults) {
        for (var i = 0; i < moduleResults.length; i++) {
          results.push(moduleResults[i]);
        }
        var criticalErrors = moduleResults.filter(function(r) {
          return (r.status === MODULE_STATUS.ERROR || r.status === MODULE_STATUS.TIMEOUT) && !(r as Record<string, unknown>).optional;
        });
        if (criticalErrors.length > 0 && stopOnError) {
          var failedIds = criticalErrors.map(function(e) { return e.id; }).join(', ');
          throw new Error('Critical modules failed: ' + failedIds);
        }
      });
    } else {
      var idx = 0;
      function runNext(): Promise<void> {
        if (idx >= modules.length) return Promise.resolve();
        var moduleConfig = modules[idx];
        idx++;
        return runModule(moduleConfig, phaseContext).then(function(result: Record<string, unknown>) {
          results.push(result);
          return runNext();
        }).catch(function(error: Error) {
          results.push({ id: moduleConfig.id, status: MODULE_STATUS.ERROR, error: error.message });
          if (stopOnError && !moduleConfig.optional) throw error;
          return runNext();
        });
      }
      promise = runNext();
    }

    return promise.then(function() {
      var elapsed = Math.round(performance.now() - startTime);
      var succeeded = results.filter(function(r) { return r.status === MODULE_STATUS.READY; }).length;
      var failed = results.filter(function(r) { return r.status === MODULE_STATUS.ERROR || r.status === MODULE_STATUS.TIMEOUT; }).length;
      var timedOut = results.filter(function(r) { return r.status === MODULE_STATUS.TIMEOUT; }).length;
      var circuitOpen = results.filter(function(r) { return r.status === MODULE_STATUS.CIRCUIT_OPEN; }).length;

      if (failed === 0) _metrics.phasesSucceeded++;

      log('info', 'Phase ' + id + ' complete', { succeeded: succeeded, failed: failed, timedOut: timedOut, circuitOpen: circuitOpen, time: elapsed });
      track('phase-run-complete', { phaseId: id, succeeded: succeeded, failed: failed, timedOut: timedOut, circuitOpen: circuitOpen, time: elapsed });

      return { id: id, name: name, status: failed === 0 ? 'success' : 'partial', modules: results, succeeded: succeeded, failed: failed, timedOut: timedOut, circuitOpen: circuitOpen, time: elapsed };
    }).catch(function(error: Error) {
      var elapsed = Math.round(performance.now() - startTime);
      _metrics.phasesFailed++;

      log('error', 'Phase ' + id + ' failed', { error: error.message });
      track('phase-run-error', { phaseId: id, error: error.message });

      return { id: id, name: name, status: 'failed', modules: results, error: error.message, time: elapsed };
    });
  }

  function getMetrics() { return Object.assign({}, _metrics); }
  function getModuleTimings() { return Object.assign({}, _metrics.moduleTimings); }
  function getCacheStats() { return ModuleCache.getStats(); }

  function resetMetrics() {
    _metrics = { 
      modulesRun: 0, 
      modulesSucceeded: 0, 
      modulesFailed: 0, 
      modulesTimedOut: 0,
      modulesCircuitOpen: 0,
      modulesCached: 0,
      phasesRun: 0, 
      phasesSucceeded: 0, 
      phasesFailed: 0, 
      totalTime: 0,
      moduleTimings: {}
    };
    ModuleCache.resetStats();
  }

  function info() {
    return { 
      moduleId: MODULE_ID, 
      version: VERSION, 
      metrics: getMetrics(), 
      moduleTimings: getModuleTimings(),
      cacheStats: getCacheStats(),
      hasPorts: !!(telemetry || logger), 
      p24Instrumented: true,
      quickWinsApplied: ['QW02-ModuleTimeouts', 'QW05-CircuitBreaker', 'QW28-ModuleCache'],
      timestamp: Date.now() 
    };
  }

  function healthCheck() {
    var m = _metrics;
    var successRate = m.modulesRun > 0 ? (m.modulesSucceeded / m.modulesRun) : 1;
    var timeoutRate = m.modulesRun > 0 ? (m.modulesTimedOut / m.modulesRun) : 0;
    var cacheStats = getCacheStats();

    var checks: Record<string, boolean> = {
      initialized: true,
      lowFailureRate: successRate >= 0.8,
      lowTimeoutRate: timeoutRate <= 0.1,
      hasLogger: !!logger,
      hasTelemetry: !!telemetry,
      cacheWorking: cacheStats.errors === 0
    };

    var passed = 0;
    var total = 0;
    for (var k in checks) {
      if (checks.hasOwnProperty(k)) {
        total++;
        if (checks[k]) passed++;
      }
    }

    var status = passed >= total - 1 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY';

    return {
      status: status,
      score: passed,
      maxScore: total,
      scoreDisplay: passed + '/' + total,
      checks: checks,
      metrics: getMetrics(),
      cacheStats: cacheStats,
      moduleId: MODULE_ID,
      version: VERSION,
      p24Instrumented: true,
      timestamp: Date.now()
    };
  }

  return {
    runModule: runModule,
    runPhase: runPhase,
    getMetrics: getMetrics,
    getModuleTimings: getModuleTimings,
    getCacheStats: getCacheStats,
    resetMetrics: resetMetrics,
    info: info,
    healthCheck: healthCheck,
    MODULE_STATUS: MODULE_STATUS,
    MODULE_TIMEOUT_MAP: MODULE_TIMEOUT_MAP,
    CIRCUIT_BREAKER_MODULES: CIRCUIT_BREAKER_MODULES
  };
}

export { createPhaseRunner, MODULE_STATUS, MODULE_TIMEOUT_MAP, MODULE_ID, VERSION };
export default createPhaseRunner;
