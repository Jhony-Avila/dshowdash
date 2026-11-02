
// Pre-Boot Orchestrator
// @version 1.2.0-DOMAIN-PURE
// @description Orquestrador do Stage -1 (antes do Bootstrap)
// @changelog v1.2.0-DOMAIN-PURE - EventBus via options.eventBus (injeção) + windowAdapter → window fallback
// @changelog v1.1.0-QUICKWINS - QW#06 Pre-Boot Health Check, QW#12 Cleanup de Listeners
// @changelog v1.0.0-ENTERPRISE - P2 Pre-Boot formal separation
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES via options:
//   options.logger   — logger instance
//   options.eventBus — EventBus instance (injeção preferida)
// RESOLVES EventBus via chain (em run()):
//   1. options.eventBus              — injeção direta
//   2. windowAdapter.get('EventBus') — adapter layer
//   3. window.EventBus               — último fallback (pre-boot roda cedo)
// NOTE: Pre-boot executa ANTES da phase-0 em alguns cenários,
//       por isso window.EventBus pode não existir ainda.
// BROWSER APIs (legítimo):
//   window.MetricsPollingManager — registration
//   performance.now()            — timing
// ═══════════════════════════════════════════════════════════════
'use strict';

declare global { interface Window { MetricsPollingManager: { init: () => void; [key: string]: unknown }; } }
import { createPreBootResult, PRE_BOOT_STATES, PRE_BOOT_EVENTS } from './pre-boot-contract.js';

var MODULE_ID = 'pre-boot-orchestrator';
var VERSION = '1.2.0-DOMAIN-PURE';

function createPreBootOrchestrator(options?: Record<string, unknown>) {
  if (options === undefined) options = {};
  
  var _state = PRE_BOOT_STATES.IDLE;
  var _result: Record<string, any> = createPreBootResult();
  var _listeners = {};
  var _unsubscribers: Array<() => void> = [];
  var _logger = options.logger || null;
  var _eventBus = options.eventBus || null; // v1.2.0: aceita via injeção
  
  // QW#06: Health status do pre-boot
  var _healthStatus = {
    status: 'INITIALIZING',
    modulesLoaded: 0,
    totalModules: 3,
    criticalIssues: [] as string[],
    warnings: [] as string[]
  };

  function log(level: string, message: string, data?: unknown) {
    if (_logger) {
      const loggerObj = _logger as Record<string, Function>;
      if (loggerObj[level]) {
        loggerObj[level]('[' + MODULE_ID + '] ' + message, data || '');
      }
    }
  }

  function emit(event: string, data: unknown) {
    var handlers = (_listeners as Record<string, Array<(d: unknown) => void>>)[event] || [];
    for (var i = 0; i < handlers.length; i++) {
      try { handlers[i](data); } catch (e) {}
    }
    if (_eventBus) {
      const eb = _eventBus as Record<string, Function>;
      if (eb.emit) {
        try { eb.emit(event, data); } catch (e) {}
      }
    }
  }

  function on(event: string, handler: (data: unknown) => void) {
    var ls = _listeners as Record<string, Array<(d: unknown) => void>>;
    if (!ls[event]) ls[event] = [];
    ls[event].push(handler);
    // QW#12: Retornar função de unsubscribe e registrar
    var unsubscribe = function() {
      var handlers = ls[event] || [];
      var idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    };
    _unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  function setState(newState: string) {
    var oldState = _state;
    _state = newState;
    _result.state = newState;
    log('info', 'State: ' + oldState + ' → ' + newState);
  }

  // v1.2.0: Resolver EventBus via cadeia AAA
  function _resolveEventBus() {
    if (_eventBus) return; // já injetado
    // 1. Tentar via windowAdapter
    if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      var fromAdapter = window.Core.windowAdapter.get('EventBus');
      if (fromAdapter) {
        _eventBus = fromAdapter;
        return;
      }
    }
    // 2. window.EventBus — último fallback (pode não existir ainda no pre-boot)
    if (typeof window !== 'undefined' && window.EventBus) {
      _eventBus = window.EventBus;
    }
  }

  // Módulo 1: Bridge DOM
  function loadBridge() {
    var startTime = performance.now();
    setState(PRE_BOOT_STATES.LOADING_BRIDGE);
    
    return import('/core/runtime/boot-ready-dom-bridge.js').then(function(bridge) {
      if (bridge && bridge.init) {
        bridge.init();
      }
      var elapsed = Math.round(performance.now() - startTime);
      _result.modules.bridge = { loaded: true, error: null, time: elapsed };
      _result.timing.moduleTimings.bridge = elapsed;
      _healthStatus.modulesLoaded++;
      log('info', 'Bridge loaded', { time: elapsed });
      emit(PRE_BOOT_EVENTS.BRIDGE_READY, { time: elapsed });
      return true;
    }).catch(function(error) {
      var elapsed = Math.round(performance.now() - startTime);
      _result.modules.bridge = { loaded: false, error: error.message, time: elapsed };
      _result.timing.moduleTimings.bridge = elapsed;
      _result.errors.push({ module: 'bridge', error: error.message });
      _healthStatus.warnings.push('Bridge failed: ' + error.message);
      log('warn', 'Bridge failed (non-critical)', { error: error.message });
      return false;
    });
  }

  // Módulo 2: Metrics Polling
  function loadMetrics() {
    var startTime = performance.now();
    setState(PRE_BOOT_STATES.LOADING_METRICS);
    
    return import('/assets/js/core/metrics-polling/index.js').then(function(MetricsModule) {
      if (MetricsModule.default) {
        if (typeof window !== 'undefined') {
          window.MetricsPollingManager = MetricsModule.default;
        }
        MetricsModule.default.init();
      }
      var elapsed = Math.round(performance.now() - startTime);
      _result.modules.metrics = { loaded: true, error: null, time: elapsed };
      _result.timing.moduleTimings.metrics = elapsed;
      _healthStatus.modulesLoaded++;
      log('info', 'Metrics loaded', { time: elapsed });
      emit(PRE_BOOT_EVENTS.METRICS_READY, { time: elapsed });
      return true;
    }).catch(function(error) {
      var elapsed = Math.round(performance.now() - startTime);
      _result.modules.metrics = { loaded: false, error: error.message, time: elapsed };
      _result.timing.moduleTimings.metrics = elapsed;
      _result.errors.push({ module: 'metrics', error: error.message });
      _healthStatus.warnings.push('Metrics failed: ' + error.message);
      log('warn', 'Metrics failed (non-critical)', { error: error.message });
      return false;
    });
  }

  // Módulo 3: Permissions
  function loadPermissions() {
    var startTime = performance.now();
    setState(PRE_BOOT_STATES.LOADING_PERMISSIONS);
    
    return import('/components/_shared/permissions/integration.js').then(function(PermissionsModule) {
      var mode = 'unknown';
      if (PermissionsModule.default) {
        var result: Record<string, any> = PermissionsModule.default.init({ debug: false });
        mode = result.ok ? 'allow-all' : 'error';
      }
      var elapsed = Math.round(performance.now() - startTime);
      _result.modules.permissions = { loaded: true, mode: mode, error: null, time: elapsed };
      _result.timing.moduleTimings.permissions = elapsed;
      _healthStatus.modulesLoaded++;
      log('info', 'Permissions loaded', { mode: mode, time: elapsed });
      emit(PRE_BOOT_EVENTS.PERMISSIONS_READY, { mode: mode, time: elapsed });
      return true;
    }).catch(function(error) {
      var elapsed = Math.round(performance.now() - startTime);
      _result.modules.permissions = { loaded: false, mode: 'error', error: error.message, time: elapsed };
      _result.timing.moduleTimings.permissions = elapsed;
      _result.errors.push({ module: 'permissions', error: error.message });
      _healthStatus.warnings.push('Permissions failed: ' + error.message);
      log('warn', 'Permissions failed (non-critical)', { error: error.message });
      return false;
    });
  }

  // QW#06: Calcular saúde do pre-boot
  function _calculatePreBootHealth() {
    var loadedCount = _healthStatus.modulesLoaded;
    var totalCount = _healthStatus.totalModules;
    
    if (loadedCount === totalCount && _healthStatus.criticalIssues.length === 0) {
      _healthStatus.status = 'HEALTHY';
    } else if (loadedCount >= 1 && _healthStatus.criticalIssues.length === 0) {
      _healthStatus.status = 'DEGRADED';
    } else {
      _healthStatus.status = 'UNHEALTHY';
    }
    
    return _healthStatus;
  }

  // Executar Pre-Boot completo
  function run() {
    if (_state !== PRE_BOOT_STATES.IDLE) {
      log('warn', 'Pre-boot already running or completed');
      return Promise.resolve(_result);
    }

_result = createPreBootResult() as any;
    _result.timing.startTime = performance.now();
    setState(PRE_BOOT_STATES.INITIALIZING);
    
    log('info', 'Pre-boot starting (Stage -1)');
    emit(PRE_BOOT_EVENTS.START, { timestamp: Date.now() });

    // v1.2.0: resolver EventBus via cadeia AAA (se não injetado)
    _resolveEventBus();

    return loadBridge()
      .then(function() { return loadMetrics(); })
      .then(function() { return loadPermissions(); })
      .then(function() {
        _result.timing.endTime = performance.now();
        _result.timing.totalTime = Math.round(_result.timing.endTime - _result.timing.startTime);
        
        // QW#06: Calcular saúde e adicionar ao resultado
        _calculatePreBootHealth();
        _result.health = Object.assign({}, _healthStatus);
        
        _result.success = true;
        setState(PRE_BOOT_STATES.READY);
        
        log('info', 'Pre-boot complete (Stage -1)', { 
          totalTime: _result.timing.totalTime,
          health: _healthStatus.status,
          modules: {
            bridge: _result.modules.bridge.loaded,
            metrics: _result.modules.metrics.loaded,
            permissions: _result.modules.permissions.loaded
          }
        });
        
        emit(PRE_BOOT_EVENTS.COMPLETE, _result);
        return _result;
      })
      .catch(function(error) {
        _result.timing.endTime = performance.now();
        _result.timing.totalTime = Math.round(_result.timing.endTime - _result.timing.startTime);
        _result.success = false;
        _result.errors.push({ module: 'orchestrator', error: error.message });
        _healthStatus.criticalIssues.push('Orchestrator error: ' + error.message);
        _calculatePreBootHealth();
        _result.health = Object.assign({}, _healthStatus);
        setState(PRE_BOOT_STATES.FAILED);
        
        log('error', 'Pre-boot failed', { error: error.message });
        emit(PRE_BOOT_EVENTS.ERROR, { error: error.message, result: _result });
        
        return _result;
      });
  }

  function getState() { return _state; }
  function getResult() { return Object.assign({}, _result); }
  function isReady() { return _state === PRE_BOOT_STATES.READY; }
  
  // QW#06: Getter para health status
  function getHealthStatus() { return Object.assign({}, _healthStatus); }

  // QW#12: Reset com cleanup de listeners
  function reset() {
    // QW#12: Executar todos os unsubscribers
    for (var i = 0; i < _unsubscribers.length; i++) {
      try { _unsubscribers[i](); } catch (e) {}
    }
    _unsubscribers = [];
    
    _state = PRE_BOOT_STATES.IDLE;
    _result = createPreBootResult();
    _listeners = {};
    _healthStatus = {
      status: 'INITIALIZING',
      modulesLoaded: 0,
      totalModules: 3,
      criticalIssues: [],
      warnings: []
    };
    log('info', 'Pre-boot reset (with listener cleanup)');
  }

  function info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      state: _state,
      isReady: isReady(),
      health: _healthStatus.status,
      modules: {
        bridge: _result.modules.bridge.loaded,
        metrics: _result.modules.metrics.loaded,
        permissions: _result.modules.permissions.loaded
      },
      totalTime: _result.timing.totalTime,
      errors: _result.errors.length,
      warnings: _healthStatus.warnings.length,
      quickWinsApplied: ['QW06-HealthCheck', 'QW12-ListenerCleanup']
    };
  }

  function healthCheck() {
    _calculatePreBootHealth();
    return {
      status: _healthStatus.status,
      moduleId: MODULE_ID,
      version: VERSION,
      state: _state,
      modulesLoaded: _healthStatus.modulesLoaded,
      totalModules: _healthStatus.totalModules,
      criticalIssues: _healthStatus.criticalIssues.length,
      warnings: _healthStatus.warnings.length,
      timestamp: Date.now()
    };
  }

  return {
    run: run,
    getState: getState,
    getResult: getResult,
    getHealthStatus: getHealthStatus,
    isReady: isReady,
    reset: reset,
    on: on,
    info: info,
    healthCheck: healthCheck,
    STATES: PRE_BOOT_STATES,
    EVENTS: PRE_BOOT_EVENTS
  };
}

// Singleton
var _instance: ReturnType<typeof createPreBootOrchestrator> | null = null;

function getInstance(options?: Record<string, unknown>) {
  if (!_instance) {
    _instance = createPreBootOrchestrator(options);
  }
  return _instance;
}

function resetInstance() {
  if (_instance) {
    _instance.reset();
  }
  _instance = null;
}

export {
  createPreBootOrchestrator,
  getInstance,
  resetInstance,
  PRE_BOOT_STATES,
  PRE_BOOT_EVENTS,
  MODULE_ID,
  VERSION
};

export default {
  createPreBootOrchestrator: createPreBootOrchestrator,
  getInstance: getInstance,
  resetInstance: resetInstance,
  PRE_BOOT_STATES: PRE_BOOT_STATES,
  PRE_BOOT_EVENTS: PRE_BOOT_EVENTS,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
