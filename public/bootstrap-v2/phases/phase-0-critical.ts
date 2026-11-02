// Phase 0 - Critical Infrastructure
// @version 3.1.0-TIMEOUT-FORMALIZED
// @changelog v3.1.0-TIMEOUT-FORMALIZED - Config timeout 8000 → TIMEOUTS.CONFIG_WAIT (constante formal)
// @changelog v3.0.1-STEP8 - Fix: Restaurado window.Core namespace (30+ arquivos dependem como guard)
// @changelog v3.0.0-STEP8 - Etapa 8: Eliminados 6 window.Core.X module assignments redundantes
// @changelog v2.8.0-HEALTH-CONTRACT - Health contract integration
// @changelog v2.7.0-DOMAIN-PURE - _log() window.Logger fallback → _resolveLogger() via windowAdapter → window fallback (cadeia AAA)
// @changelog v2.6.0-DOMAIN-PURE - window.EventBus.emit() → referência local _eventBus. window.Logger fallback → ports.logger
// @changelog v2.5.0-EVENTS-FORMALIZED - Removido fallback string solta: CORE_EVENTS.PRELOADER_READY agora é constante formal
// @changelog v2.4.0-PRELOADER-MANAGED - Etapa 2: Bootstrap controla inicialização do Preloader (Item 10.2 Briefing)
// @changelog v2.3.1-P24 - Fixed Config timeout: now calls Config.load() before waitReady()
// @changelog v2.3.0-P24 - Added emit metrics instrumentation (P24 compliance)
// FUNDAÇÃO DO SISTEMA - EventBus, Logger, Config, Environment, SecurityCSRF, Preloader
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via execute(ports)):
//   ports.logger        — Logger instance for phase-level logging
//   ports.telemetry     — Telemetry tracker for metrics
//   ports.windowAdapter — Adapter for exposing globals safely
//
// RESOLVES Logger via _resolveLogger():
//   1. ports.logger (captured as _portsLogger) — injeção preferida
//   2. windowAdapter.get('Logger')             — adapter layer
//   3. window.Logger                           — último fallback
//
// CREATES (via windowAdapter.expose — canal oficial):
//   EventBus, Logger, LoggerGlobal, ErrorBoundary, Config, APP_CONFIG,
//   SecurityCSRF, EnvironmentManager
//
// CREATES (window-level — LEGÍTIMO, public API / infra):
//   window.Core                               — Namespace guard (30+ arquivos dependem)
//   window.EventBus                           — Main EventBus reference (frozen)
//   window.isEnterpriseEventBus               — Utility checker
//   window.__PRELOADER_MANAGED_BY_BOOTSTRAP__ — Flag to prevent Preloader autoInit
//
// TIMEOUTS: Uses TIMEOUTS.CONFIG_WAIT from boot-manifest/constants.js (v3.1.0)
//
// REMOVED in v3.0.0-STEP8 (module assignments):
//   window.Core.EventBus, window.Core.Logger, window.Core.ErrorBoundary,
//   window.Core.Config, window.Core.SecurityCSRF, window.Core.Environment
//   → Todos disponíveis via windowAdapter.get('NomeDoModulo')
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CORE_EVENTS } from '/core/runtime/events/catalog/core.events.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
import { TIMEOUTS } from '../boot-manifest/constants.js';

var MODULE_ID = 'phase-0-critical';
var VERSION = '3.1.0-TIMEOUT-FORMALIZED';

// Local EventBus reference (set after creation in execute())
var _eventBus: { emit?: (event: string, data: Record<string, unknown>) => void } | null = null;

// ============================================================================
// PRELOADER MANAGED FLAG (Item 10.2 do Briefing GRUPO 1)
// ============================================================================
if (typeof window !== 'undefined') {
  (window as any).__PRELOADER_MANAGED_BY_BOOTSTRAP__ = true;
}

// P24: Métricas de emissão
var _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName: string) { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); }

// v2.7.0: Resolver Logger via cadeia AAA (ports → windowAdapter → window fallback)
var _portsLogger: Record<string, Function> | null = null;
function _resolveLogger() {
  if (_portsLogger) return _portsLogger;
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var resolved = window.Core.windowAdapter.get('Logger');
    if (resolved) return resolved;
  }
  return (typeof window !== 'undefined') ? (window as any).Logger : null;
}

function _log(level: string, ...rest: unknown[]) {
  var args = Array.prototype.slice.call(arguments, 1);
  var logger = _resolveLogger();
  if (logger && typeof logger[level] === 'function') { logger[level].apply(logger, ['[phase-0]'].concat(args)); }
}

// v2.6.0: safe emit via local reference (tolerant when _eventBus not yet created)
function _emit(eventName: string, data: Record<string, unknown>) {
  if (_eventBus && _eventBus.emit) {
    try {
      _eventBus.emit(eventName, data);
    } catch (e) {}
  }
}

var phase0 = {
  id: 'phase-0-critical',
  name: 'Critical Infrastructure',
  order: 0,
  critical: true,
  recoverable: false,
  dependsOn: [] as string[],
  parallel: false,

  modules: [
    { id: 'eventbus', name: 'EventBus Enterprise', critical: true, timeout: 3000 },
    { id: 'logger', name: 'Logger Global', critical: true, timeout: 5000 },
    { id: 'preloader', name: 'Preloader System', critical: false, timeout: 3000 },
    { id: 'error-boundary', name: 'Error Boundary', critical: true, timeout: 3000 },
    { id: 'config', name: 'Config Loader', critical: true, timeout: TIMEOUTS.CONFIG_WAIT },
    { id: 'security-csrf', name: 'Security CSRF', critical: false, timeout: 3000 },
    { id: 'environment', name: 'Environment Manager', critical: false, timeout: 3000 }
  ],

  execute: function(ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    var windowAdapter = ports.windowAdapter as Record<string, Function> | null;
    var results: { initialized: string[]; failed: Array<{ id: string; error: string; critical?: boolean }> } = { initialized: [], failed: [] };
    var startTime = performance.now();

    // v2.7.0: capture ports.logger for _resolveLogger() chain
    _portsLogger = logger;

    // v3.0.1-STEP8: Criar namespace window.Core UMA vez (30+ arquivos dependem como guard)
    // Módulos NÃO são mais atribuídos aqui — windowAdapter.expose é o canal oficial
    if (typeof window !== 'undefined') {
      window.Core = window.Core || {};
    }

    _log('info', 'Starting Critical Infrastructure v3.1.0-TIMEOUT-FORMALIZED');

    return Promise.resolve().then(function() {
      // 1. EVENTBUS ENTERPRISE
      return import('/core/js/event-bus/index.js').then(function(EventBusModule) {
        var EventBus = EventBusModule.default || (EventBusModule as any).eventBusInstance;
        if (!EventBus) throw new Error('EventBus instance not found in module');

        // v2.6.0: capture local reference for all subsequent emits
        // @ts-expect-error strict migration — TS2322
        _eventBus = EventBus;

        if (typeof window !== 'undefined') {
          if ((window as any).EventBus && (window as any).EventBus !== EventBus) { _log('warn', 'Replacing existing window.EventBus with Enterprise version'); }
          Object.defineProperty(window, 'EventBus', { value: EventBus, writable: false, configurable: false });
          (window as any).isEnterpriseEventBus = function() { return EventBus.version && EventBus.version.includes('ENTERPRISE'); };
        }
        if (windowAdapter && windowAdapter.expose) windowAdapter.expose('EventBus', EventBus);
        results.initialized.push('eventbus');
        _trackEmit('EVENTBUS_READY');
        _emit(CORE_EVENTS.EVENTBUS_READY, { version: EventBus.version, timestamp: Date.now(), source: MODULE_ID });
        _log('info', 'EventBus Enterprise ' + EventBus.version + ' ready (singleton, frozen)');
      }).catch(function(error) { results.failed.push({ id: 'eventbus', error: error.message }); _log('error', 'CRITICAL: EventBus failed', error); throw error; });
    }).then(function() {
      // 2. LOGGER GLOBAL
      return import('/assets/js/core/logger-global/index.js').then(function(LoggerModule) {
        var Logger = LoggerModule.Logger || LoggerModule.default;
        if (Logger) {
          if (windowAdapter && windowAdapter.expose) { windowAdapter.expose('Logger', Logger); windowAdapter.expose('LoggerGlobal', Logger); }
          results.initialized.push('logger');
          if (logger && logger.info) logger.info('Logger Global ready');
          _trackEmit('LOGGER_READY');
          _emit(CORE_EVENTS.LOGGER_READY, { timestamp: Date.now(), source: MODULE_ID });
        }
      }).catch(function(error) { results.failed.push({ id: 'logger', error: error.message }); _log('error', 'Logger Global failed', error); throw error; });
    }).then(function() {
      // 3. PRELOADER SYSTEM (Controlado pelo Bootstrap)
      return import('/components/preloader/index.js').then(function(PreloaderModule) {
        var startPreloader = PreloaderModule.startPreloader;
        if (startPreloader && typeof startPreloader === 'function') {
          return startPreloader({ useAAAMode: true }).then(function(preloaderInstance) {
            if (preloaderInstance) {
              results.initialized.push('preloader');
              _trackEmit('PRELOADER_READY');
              _emit(CORE_EVENTS.PRELOADER_READY, {
                version: PreloaderModule.VERSION || 'unknown',
                managedByBootstrap: true,
                timestamp: Date.now(),
                source: MODULE_ID
              });
              _log('info', 'Preloader System ready (managed by Bootstrap)', { version: PreloaderModule.VERSION });
            }
            return preloaderInstance;
          });
        } else {
          _log('warn', 'startPreloader not found, falling back to autoInit');
          var autoInit = PreloaderModule.autoInit;
          if (autoInit) return autoInit();
        }
      }).catch(function(error) {
        results.failed.push({ id: 'preloader', error: error.message, critical: false });
        _log('warn', 'Preloader System failed (non-critical, continuing)', { error: error.message });
      });
    }).then(function() {
      // 4. ERROR BOUNDARY
      return import('/components/error-boundary/index.js').then(function(ErrorBoundaryModule) {
        var ErrorBoundary = ErrorBoundaryModule.ErrorBoundary || ErrorBoundaryModule.default;
        if (ErrorBoundary) {
          return Promise.resolve(ErrorBoundary.init({ autoCapture: true })).then(function() {
            var ErrorCatcher = ErrorBoundaryModule.ErrorCatcher;
            if (ErrorCatcher) { ErrorCatcher.startGlobalCapture({ rateLimitWindow: 60000, rateLimitMax: 10 }); }
            if (windowAdapter && windowAdapter.expose) windowAdapter.expose('ErrorBoundary', ErrorBoundary);
            results.initialized.push('error-boundary');
            if (logger && logger.info) logger.info('Error Boundary ready - Global capture active');
            _trackEmit('ERROR_BOUNDARY_READY');
            _emit(CORE_EVENTS.ERROR_BOUNDARY_READY, { timestamp: Date.now(), source: MODULE_ID });
          });
        }
      }).catch(function(error) { results.failed.push({ id: 'error-boundary', error: error.message }); if (logger && logger.warn) logger.warn('Error Boundary failed (continuing)', { error: error.message }); });
    }).then(function() {
      // 5. CONFIG LOADER
      // v3.1.0: TIMEOUTS.CONFIG_WAIT em vez de 8000 hardcoded
      return import('/assets/js/core/config-loader/index.js').then(function(ConfigModule) {
        var Config: Record<string, any> = ConfigModule.default || ConfigModule;
        if (Config) {
          if (Config.load && typeof Config.load === 'function') {
            Config.load();
            _log('info', 'Config.load() called explicitly');
          }
          var waitPromise = Config.waitReady ? Config.waitReady(TIMEOUTS.CONFIG_WAIT) : Promise.resolve();
          return Promise.race([waitPromise, new Promise(function(_, reject) { setTimeout(function() { reject(new Error('Config timeout')); }, TIMEOUTS.CONFIG_WAIT); })]).then(function(ready) {
            if (ready === false) {
              _log('warn', 'Config.waitReady() resolved with false, proceeding anyway');
            }
            if (windowAdapter && windowAdapter.expose) { windowAdapter.expose('Config', Config); windowAdapter.expose('APP_CONFIG', Config.getAll ? Config.getAll() : {}); }
            results.initialized.push('config');
            if (logger && logger.info) logger.info('Config Loader ready');
            _trackEmit('CONFIG_READY');
            _emit(CORE_EVENTS.CONFIG_READY, { timestamp: Date.now(), source: MODULE_ID });
          });
        }
      }).catch(function(error) { results.failed.push({ id: 'config', error: error.message }); if (logger && logger.error) logger.error('Config Loader failed', { error: error.message }); throw error; });
    }).then(function() {
      // 6. SECURITY CSRF
      return import('/components/security/csrf-token-manager/index.js').then(function(CSRFModule) {
        var SecurityCSRF = CSRFModule.SecurityCSRF || CSRFModule.default;
        if (SecurityCSRF) {
          if (windowAdapter && windowAdapter.expose) windowAdapter.expose('SecurityCSRF', SecurityCSRF);
          results.initialized.push('security-csrf');
          if (logger && logger.info) logger.info('Security CSRF ready');
          _trackEmit('SECURITY_CSRF_READY');
          _emit(CORE_EVENTS.SECURITY_CSRF_READY, { timestamp: Date.now(), source: MODULE_ID });
        }
      }).catch(function(error) { results.failed.push({ id: 'security-csrf', error: error.message }); if (logger && logger.warn) logger.warn('Security CSRF failed (non-critical)', { error: error.message }); });
    }).then(function() {
      // 7. ENVIRONMENT MANAGER
      return import('/assets/js/core/environment-manager/index.js').then(function(EnvModule) {
        var EnvironmentManager = EnvModule.default || EnvModule;
        if (EnvironmentManager) {
          if (windowAdapter && windowAdapter.expose) windowAdapter.expose('EnvironmentManager', EnvironmentManager);
          results.initialized.push('environment');
          if (logger && logger.info) logger.info('Environment Manager ready');
          _trackEmit('ENVIRONMENT_READY');
          _emit(CORE_EVENTS.ENVIRONMENT_READY, { timestamp: Date.now(), source: MODULE_ID });
        }
      }).catch(function(error) { results.failed.push({ id: 'environment', error: error.message }); if (logger && logger.warn) logger.warn('Environment Manager failed (non-critical)', { error: error.message }); });
    }).then(function() {
      // FINALIZAÇÃO
      var elapsed = Math.round(performance.now() - startTime);
      _trackEmit('PHASE0_COMPLETE');
      _emit(CORE_EVENTS.PHASE0_COMPLETE, { initialized: results.initialized, failed: results.failed.map(function(f) { return f.id; }), time: elapsed, timestamp: Date.now(), source: MODULE_ID, preloaderManaged: true });
      if (telemetry && telemetry.track) telemetry.track('phase-0-complete', { initialized: results.initialized.length, failed: results.failed.length, time: elapsed, preloaderManaged: true });
      if (logger && logger.info) logger.info('Phase 0 complete', { initialized: results.initialized, failed: results.failed, time: elapsed, preloaderManaged: true });
      _log('info', 'Complete: ' + results.initialized.length + ' modules, ' + elapsed + 'ms (Preloader managed by Bootstrap)');
      var criticalFailed = results.failed.filter(function(f) { return f.id === 'eventbus' || f.id === 'logger' || f.id === 'config'; });
      return { success: criticalFailed.length === 0, initialized: results.initialized, failed: results.failed, time: elapsed, emitMetrics: Object.assign({}, _emitMetrics), preloaderManaged: true };
    });
  },

  getEmitMetrics: function() { return Object.assign({}, _emitMetrics); },

  healthCheck: function() {
    return createHealthResult({ status: HEALTH_STATUS.HEALTHY, moduleId: MODULE_ID, version: VERSION, details: { emitMetrics: Object.assign({}, _emitMetrics), p24Instrumented: true, preloaderManaged: true } });
  },

  info: function() {
    return { moduleId: MODULE_ID, version: VERSION, modules: phase0.modules.map(function(m) { return m.id; }), emitMetrics: Object.assign({}, _emitMetrics), preloaderManaged: true };
  }
};

export { phase0, MODULE_ID, VERSION };
export default phase0;
