// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/core/lifecycle
// PURPOSE: Telemetry Core - Lifecycle Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict from /core/runtime/enterprise/strict-mode.js
//   initStore, resetStore, isReady, updateConfig, getBuffer from ../state/store.js
//   startFlushTimer, stopFlushTimer, flush, sendBeacon from ../transport/send.js
//   emitEvent from ./emitter.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   initTelemetry() — exported function
//   shutdownTelemetry() — exported function
//   isInitialized() — exported function
//   updateTelemetryConfig() — exported function
//   startFlushTimerIfAuthenticated() — exported function
//   manualFlush() — exported function
//   getLifecycleInfo() — exported function
//   getVersion() — exported function
//   setDebug() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   telemetry:core:init
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   document.addEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { initStore, resetStore, isReady, updateConfig, getBuffer } from '../state/store.js';
import { startFlushTimer, stopFlushTimer, flush, sendBeacon, prepararCsrf } from '../transport/send.js';
import { emitEvent } from './emitter.js';

export var VERSION = '5.5.0-STRICT-MODE';
var MODULE_ID = 'telemetry-core/core/lifecycle';

var hasWindow = typeof window !== 'undefined';
var hasDocument = typeof document !== 'undefined';
var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

var _debugMode = false;
var _log = function(level: string, ...rest: any[]) {
  var args = Array.prototype.slice.call(arguments, 1);
  var logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; }
  if (level === 'info') { if (logger.info) logger.info.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; }
  if (_debugMode && logger.debug) logger.debug.apply(logger, ['[' + MODULE_ID + ']'].concat(args));
};

var initialized = false;
var lifecycleHandlers: { target: EventTarget | null; event: string; handler: EventListener }[] = [];
var _metrics = { initCount: 0, shutdownCount: 0, flushOnUnloadCount: 0, lastInitAt: null as unknown | null, lastShutdownAt: null as unknown | null };

// NOTA (2026-07-28): uma reavaliação periódica de autenticação foi implementada aqui para
// religar o flush timer após o login, e REVERTIDA depois de medir: `_isAuthenticated()` não
// tem como virar true nesta arquitetura (port nunca injetado + strict mode). O laço rodaria
// 12 vezes e desistiria, sempre, sem religar nada. Ver a nota em `_isAuthenticated()` para a
// correção real, que é de boot e cabe ao dono decidir.

// ============================================================================
// AUTH RESOLUTION (Ports only in strict mode)
// ============================================================================

/**
 * Verifica se está autenticado usando Ports (único canal autorizado em strict)
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {boolean}
 */
function _isAuthenticated() {
  var strictMode = isStrict();

  // Primary e único em strict: Ports (globalState)
  var gs = _getPort('globalState');
  if (gs) {
    // GlobalStateFacade pode ter isAuthenticated() ou getState().auth
    if (typeof gs.isAuthenticated === 'function') {
      try { return gs.isAuthenticated(); } catch (e) {}
    }
    if (typeof gs.getState === 'function') {
      try {
        var state = gs.getState();
        if (state && state.auth && state.auth.isAuthenticated) return true;
      } catch (e) {}
    }
  }

  // ⚠️ 2026-07-28 — ESTE MÉTODO RESPONDE `false` EM TODA SESSÃO, e não é bug deste arquivo:
  // o port `globalState` nunca é injetado (NINGUÉM chama injectPorts() neste módulo — grep no
  // projeto inteiro), e sob strict mode (medido: isStrict() === true) o contrato proíbe ler
  // window.*. Consequência: o gate P0 abaixo mantém o flush timer DESLIGADO sempre, e a
  // telemetria só é enviada nos flushes de visibilitychange/pagehide — nunca no intervalo
  // periódico. Funciona, mas o buffer pode encher (maxBufferSize 500) e descartar eventos.
  // Medido no runtime: authResolution="none" enquanto window.GlobalState.isAuthenticated()
  // já retornava true. `strictMode` acima segue calculado e sem uso — é o resquício do
  // fallback removido, e a pista de que o canal previsto nunca foi ligado.
  // CORREÇÃO REAL (decisão do dono, mexe no boot): injetar o port no bootstrap, algo como
  // `telemetryLifecycle.injectPorts({ globalState })`. Um fallback para window.* aqui seria
  // código morto sob strict — foi tentado, medido e revertido.
  return false;
}

/**
 * Retorna o método de resolução usado para auth
 * @returns {string}
 */
function _getAuthResolutionMethod() {
  var gs = _getPort('globalState');
  if (gs) return 'Ports.globalState';
  // "none" aqui não é diagnóstico neutro: significa que o gate P0 nunca vai liberar o flush
  // timer nesta sessão. Ver a nota em _isAuthenticated().
  return 'none';
}

// ============================================================================
// LIFECYCLE MANAGEMENT
// ============================================================================

export function initTelemetry(config: Record<string, unknown>) {
  if (!config) config = {};
  if (initialized) { _log('info', 'Already initialized - skipping'); return { success: true, message: 'Already initialized' }; }
  try {
    _metrics.initCount++;
    _metrics.lastInitAt = new Date().toISOString();
    initStore(config);
    registerLifecycleHandlers();
    // Aquece o token CSRF já aqui, e NÃO só quando o flush timer inicia: os handlers de
    // visibilitychange/pagehide acabaram de ser registrados e podem disparar um flush por
    // beacon antes de qualquer envio normal. Sem token em mãos nessa hora o beacon sai sem
    // cabeçalho e volta 403 — era a origem dos 403 que sobravam após a correção do #63.
    prepararCsrf();
    // P0 GATING: Só iniciar flush timer se autenticado (evita loop 401 no login)
    var isAuthenticated = _isAuthenticated();
    if (isAuthenticated) {
      startFlushTimer();
      _log('info', 'Flush timer started (authenticated via ' + _getAuthResolutionMethod() + ')');
    } else {
      _log('info', 'Flush timer deferred: not authenticated (expected on login)');

    }
    initialized = true;
    emitEvent('telemetry:core:init', { config: config, timestamp: Date.now(), version: VERSION, flushTimerStarted: isAuthenticated, authResolution: _getAuthResolutionMethod() }, { component: MODULE_ID, severity: 'info' });
    _log('info', 'Initialized ' + VERSION);
    return { success: true, message: 'Telemetry Core initialized', version: VERSION, flushTimerStarted: isAuthenticated, authResolution: _getAuthResolutionMethod() };
  } catch (error: any) { _log('error', 'Init failed:', error); return { success: false, error: error.message }; }
}

function registerLifecycleHandlers() {
  if (!hasWindow) return;
  var beforeUnloadHandler = function() { flushOnUnload('beforeunload'); };
  var visibilityChangeHandler = function() { if (hasDocument && document.visibilityState === 'hidden') flushOnUnload('visibilitychange'); };
  var pageHideHandler = function() { flushOnUnload('pagehide'); };
  window.addEventListener('beforeunload', beforeUnloadHandler);
  if (hasDocument) document.addEventListener('visibilitychange', visibilityChangeHandler);
  window.addEventListener('pagehide', pageHideHandler);
  lifecycleHandlers = [
    { target: window, event: 'beforeunload', handler: beforeUnloadHandler },
    { target: hasDocument ? document : null, event: 'visibilitychange', handler: visibilityChangeHandler },
    { target: window, event: 'pagehide', handler: pageHideHandler }
  ];
}

function flushOnUnload(reason: string) { _metrics.flushOnUnloadCount++; var buffer = getBuffer(); if (buffer.length > 0) sendBeacon(buffer); }

export function shutdownTelemetry() {
  if (!initialized) return;
  try {
    _metrics.shutdownCount++;
    _metrics.lastShutdownAt = new Date().toISOString();
    stopFlushTimer();

    var buffer = getBuffer();
    if (buffer.length > 0) sendBeacon(buffer);
    lifecycleHandlers.forEach(function(item) { if (item.target) item.target.removeEventListener(item.event, item.handler); });
    lifecycleHandlers = [];
    resetStore();
    initialized = false;
    _log('info', 'Shutdown complete');
  } catch (error: any) { _log('error', 'Shutdown error:', error); }
}

export function isInitialized() { return initialized && isReady(); }
export function updateTelemetryConfig(configPatch: Record<string, unknown>) { if (!initialized) return false; updateConfig(configPatch); if (configPatch.flushIntervalMs) { stopFlushTimer(); startFlushTimer(); } return true; }

// P0: Função para iniciar flush timer após autenticação (chamar após login)
export function startFlushTimerIfAuthenticated() {
  if (!initialized) { _log('warn', 'Cannot start flush timer: not initialized'); return false; }
  var isAuthenticated = _isAuthenticated();
  if (isAuthenticated) {
    // Reaquecimento FORÇADO: a sessão (e o token CSRF) mudou no login. O token guardado
    // antes de autenticar continuaria sendo enviado e o servidor o recusaria com 403.
    prepararCsrf(true);
    startFlushTimer();
    _log('info', 'Flush timer started after authentication (via ' + _getAuthResolutionMethod() + ')');
    return true;
  }
  _log('info', 'Flush timer not started: still not authenticated');
  return false;
}
export function manualFlush(reason: string) { if (!initialized) return Promise.resolve({ success: false, error: 'Not initialized' }); return flush(reason || 'manual'); }

// ============================================================================
// PUBLIC API / DIAGNOSTICS
// ============================================================================

export function getLifecycleInfo() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: initialized,
    handlersCount: lifecycleHandlers.length,
    metrics: Object.assign({}, _metrics),
    authResolution: _getAuthResolutionMethod()
  };
}

export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debugMode = !!enabled; }
export function getMetrics() { return Object.assign({}, _metrics, { initialized: initialized, handlersCount: lifecycleHandlers.length }); }
export function resetMetrics() { _metrics.initCount = 0; _metrics.shutdownCount = 0; _metrics.flushOnUnloadCount = 0; _metrics.lastInitAt = null; _metrics.lastShutdownAt = null; }

export function healthCheck() {
  var strictMode = isStrict();
  var gsPort = _getPort('globalState');
  var checks = {
    isInitialized: initialized,
    storeReady: isReady(),
    handlersRegistered: lifecycleHandlers.length > 0,
    portsGlobalStateAvailable: !!gsPort,
    strictModeCompliant: !strictMode || !!gsPort
  };
  var passed = 0;
  for (var k in checks) { if (checks[k as keyof typeof checks]) passed++; }
  var maxScore = Object.keys(checks).length;
  var issues = [];
  if (!initialized) issues.push('Not initialized');
  if (!isReady()) issues.push('Store not ready');
  if (lifecycleHandlers.length === 0) issues.push('No lifecycle handlers registered');
  var logger = _getPort('logger');
  return {
    status: passed === maxScore ? 'healthy' : passed >= maxScore - 1 ? 'degraded' : 'critical',
    score: passed,
    maxScore: maxScore,
    scoreDisplay: passed + '/' + maxScore,
    checks: checks,
    issues: issues.length > 0 ? issues : null,
    loggerAvailable: !!logger,
    strictMode: strictMode,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: _Ports.isInitialized(),
    authResolution: _getAuthResolutionMethod(),
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    lifecycle: getLifecycleInfo(),
    healthCheck: healthCheck(),
    timestamp: new Date().toISOString()
  };
}

export default {
  initTelemetry: initTelemetry,
  shutdownTelemetry: shutdownTelemetry,
  isInitialized: isInitialized,
  updateTelemetryConfig: updateTelemetryConfig,
  startFlushTimerIfAuthenticated: startFlushTimerIfAuthenticated,
  manualFlush: manualFlush,
  getLifecycleInfo: getLifecycleInfo,
  getVersion: getVersion,
  setDebug: setDebug,
  getMetrics: getMetrics,
  resetMetrics: resetMetrics,
  healthCheck: healthCheck,
  info: info,
  injectPorts: injectPorts,
  getPorts: getPorts
};
