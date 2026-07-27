// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.9.0-BOOTSTRAP-FORCE-INFO)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-boot-manager
// PURPOSE: Boot Manager - Preloader System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, COMPONENT_EVENTS, PRELOADER_EVENTS from /core/runtime/events/index.js
//   PHASES from ./state.js
//   ProgressMonitor from ./progress.js
//   carregarVideo from ../ui/video.js
//   showDashboard from ../ui/animation.js
//   AuthObserver from ./auth-observer.js
//   waitForAuthDecision from ./auth-decision.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEGRADED_REASONS — exported value
//   BootstrapBridge — exported value
//   BootManager() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { PRELOADER_EVENTS } from '/core/runtime/events/catalog/preloader.events.js';

import { PHASES } from './state.js';
import { ProgressMonitor } from './progress.js';
import { carregarVideo } from '../ui/video.js';
import { showDashboard } from '../ui/animation.js';
import { AuthObserver } from './auth-observer.js';
import { waitForAuthDecision } from './auth-decision.js';

const VERSION = '3.9.0-BOOTSTRAP-FORCE-INFO';
const MODULE_ID = 'preloader-boot-manager';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

const _debugEnabled = () => { const cfg = _getPort('config'); return hasWindow && cfg && cfg.app && cfg.app.debug === true; };
const _log = function(level: string, ...rest: any[]) {
  const args = rest;
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error(`[${MODULE_ID}]`, args.join(' ')); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(`[${MODULE_ID}]`, args.join(' ')); return; }
  if (level === 'info') { if (logger.info) logger.info(`[${MODULE_ID}]`, args.join(' ')); return; }
  if (_debugEnabled() && logger.debug) logger.debug(`[${MODULE_ID}]`, args.join(' '));
};

function _setAppState(state: string) {
  if (!hasDocument) return;
  const gs = _getPort('globalState');
  if (gs && gs.dispatch) { try { gs.dispatch({ type: 'SET_APP_STATE', payload: state }); _log('info', 'GlobalState.dispatch SET_APP_STATE:', state); } catch (e: any) { _log('warn', 'GlobalState dispatch failed:', e.message); } }
  if (document.body) { document.body.dataset.state = state; _log('debug', 'body.dataset.state legacy sync:', state); }
}

// ============================================================================
// DEGRADED MODE REASONS (Item 10.4)
// ============================================================================
const DEGRADED_REASONS = Object.freeze({
  AUTH_TIMEOUT: 'auth-timeout',
  COMPONENTS_TIMEOUT: 'components-timeout',
  MONITOR_INACTIVE: 'monitor-inactive',
  MAX_RETRIES: 'max-retries',
  FORCED_FINALIZE: 'forced-finalize',
  UNKNOWN: 'unknown'
});

// ============================================================================
// BOOTSTRAP BRIDGE (Item 10.5 - Decisões Delegáveis)
// ============================================================================
const BootstrapBridge = {
  _bootstrapControlled: false,
  _decisions: {},
  
  setBootstrapControlled(value: boolean) {
    this._bootstrapControlled = value === true;
    _log('info', `BootstrapBridge: controlled=${this._bootstrapControlled}`);
  },
  
  isBootstrapControlled() {
    return this._bootstrapControlled;
  },
  
  setDecision(key: string, value: unknown) {
    // @ts-expect-error strict migration — TS7053
    this._decisions[key] = { value, timestamp: Date.now(), source: 'bootstrap' };
    _log('info', `BootstrapBridge: decision ${key}=${value}`);
  },
  
  getDecision(key: string) {
    // @ts-expect-error strict migration — TS7053
    const decision = this._decisions[key];
    return decision ? decision.value : null;
  },
  
  hasDecision(key: string) {
    return this._decisions.hasOwnProperty(key);
  },
  
  getDecisions() {
    return Object.assign({}, this._decisions);
  },
  
  reset() {
    this._decisions = {};
  },
  
  info() {
    return {
      controlled: this._bootstrapControlled,
      decisions: Object.keys(this._decisions),
      decisionCount: Object.keys(this._decisions).length
    };
  }
};

// ============================================================================
// BOOT MANAGER
// ============================================================================

function BootManager(this: Record<string, any>, system: Record<string, any>) {
  this.system = system;
  this.componentsReadyBuffer = null;
  this.componentsReadyBufferConsumed = false;
  this.componentsReadyReceived = false;
  this.componentsReadyProcessed = false;
  this.componentsReadyTimeoutRetries = 0;
  this.finalizeCalled = false;
  this.forceMode = false;
  this.authDecision = null;
  this._bootCount = 0;
  this._lastBootAt = null;
  this._errors = [];
  this._degradedMode = false;
  this._degradedReason = null;
  this._degradedAt = null;
  this._degradedCount = 0;
  this._decisionsUsed = { bootstrap: 0, default: 0 };
  this._authGraceTimer = null;
  this._authGraceAttempts = 0;
  _initPorts();
}

// ============================================================================
// DECISION HELPERS (Item 10.5)
// ============================================================================

BootManager.prototype._decide = function(key: string, defaultValue?: unknown, context?: Record<string, unknown>) {
  const bootstrapDecision = BootstrapBridge.getDecision(key);
  if (bootstrapDecision !== null) {
    this._decisionsUsed.bootstrap++;
    _log('debug', `Decision ${key}: using Bootstrap value=${bootstrapDecision}`);
    return bootstrapDecision;
  }
  this._decisionsUsed.default++;
  _log('debug', `Decision ${key}: using default value=${defaultValue}`);
  return defaultValue;
};

BootManager.prototype._decideShouldLoadVideo = function(config: Record<string, unknown>) {
  if (BootstrapBridge.hasDecision('shouldLoadVideo')) {
    return this._decide('shouldLoadVideo', true);
  }
  if (!hasWindow) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (conn && conn.saveData) return false;
  if (conn && conn.effectiveType && ['slow-2g', '2g'].indexOf(conn.effectiveType) !== -1) return false;
  this._decisionsUsed.default++;
  return true;
};

BootManager.prototype._decidePodeShowDashboard = function(status: Record<string, unknown>, faseAtual: string, force: boolean) {
  if (BootstrapBridge.hasDecision('shouldShowDashboard')) {
    return this._decide('shouldShowDashboard', false);
  }
  const monitorAtivo = this.system.progressMonitor !== null;
  const progressCompleto = this.system.state.progressoAtual >= 100;
  const pode = (status.temSessaoValida && (force || (faseAtual === PHASES.LOADING || this.componentsReadyReceived)) && (force || (monitorAtivo && progressCompleto) || this.componentsReadyReceived));
  this._decisionsUsed.default++;
  return pode;
};

// ============================================================================
// DEGRADED MODE (Item 10.4)
// ============================================================================

BootManager.prototype._enterDegradedMode = function(reason: string, uiMessage?: string) {
  const self = this;
  if (self._degradedMode && self._degradedReason === reason) {
    if (uiMessage) { self.system.degradedUI.showMessage(uiMessage, self.system.$screen, self.system.addTrace.bind(self.system)); }
    return;
  }
  self._degradedMode = true;
  self._degradedReason = reason;
  self._degradedAt = Date.now();
  self._degradedCount++;
  _log('warn', `⚠️ ENTERING DEGRADED MODE: ${reason}`);
  self.system.addTrace('degraded:enter', { reason, count: self._degradedCount, timestamp: self._degradedAt });
  if (self.system.modeManager && typeof self.system.modeManager.setDegraded === 'function') { self.system.modeManager.setDegraded(); }
  self.system.emit(PRELOADER_EVENTS.DEGRADED || 'preloader:degraded', { bootId: self.system.bootId, reason, count: self._degradedCount, timestamp: self._degradedAt });
  if (uiMessage) { self.system.degradedUI.showMessage(uiMessage, self.system.$screen, self.system.addTrace.bind(self.system)); }
  self._trackDegradedMode(reason);
};

BootManager.prototype._exitDegradedMode = function() {
  const self = this;
  if (!self._degradedMode) return;
  const duration = Date.now() - self._degradedAt;
  _log('info', `✅ EXITING DEGRADED MODE after ${duration}ms`);
  self.system.addTrace('degraded:exit', { reason: self._degradedReason, duration });
  self._degradedMode = false;
};

BootManager.prototype._trackDegradedMode = function(reason: string) {
  if (!hasWindow) return;
  try {
    const degradedHistory = JSON.parse(localStorage.getItem('boot-degraded-history') || '[]');
    degradedHistory.push({ bootId: this.system.bootId, reason, timestamp: new Date().toISOString(), retries: this.componentsReadyTimeoutRetries });
    localStorage.setItem('boot-degraded-history', JSON.stringify(degradedHistory.slice(-10)));
  } catch (e: any) { _log('warn', 'Erro ao salvar histórico de degradação:', e.message); }
};

BootManager.prototype.isDegraded = function() { return this._degradedMode; };

BootManager.prototype.getDegradedInfo = function() {
  return { degraded: this._degradedMode, reason: this._degradedReason, since: this._degradedAt, duration: this._degradedAt ? Date.now() - this._degradedAt : null, count: this._degradedCount };
};

// ============================================================================
// BOOT FLOW
// ============================================================================

BootManager.prototype.startBoot = function() {
  const self = this;
  const config = self.system.config;
  const state = self.system.state;
  const timers = self.system.timers;
  self._bootCount++;
  self._lastBootAt = Date.now();
  _log('info', `===== BOOT INICIADO ${VERSION} =====`);
  _log('info', `BootstrapBridge controlled: ${BootstrapBridge.isBootstrapControlled()}`);
  self.system.addTrace('init:start', { bootstrapControlled: BootstrapBridge.isBootstrapControlled() });
  self.system.show();
  self.system.registrarListeners();

  const timeoutGlobal = this._decide('timeoutGlobal', config.timeoutGlobal);
  timers.global = setTimeout(() => {
    _log('warn', `TIMEOUT GLOBAL (${timeoutGlobal}ms) - FORCANDO FINALIZACAO`);
    self.system.addTrace('timeout:global:force');
    self.forceMode = true;
    state.enableForceMode();
    self._enterDegradedMode(DEGRADED_REASONS.FORCED_FINALIZE, 'degraded');
    self.system.finalizar('timeout-global-forced', true);
  }, timeoutGlobal);

  const videoEl = hasDocument ? document.querySelector('#loading-video') : null;
  const videoControlledExternally = videoEl && (videoEl as any).dataset.controlledBy;
  const shouldLoadVideo = !videoControlledExternally && self._decideShouldLoadVideo(config);
  const videoPromise = shouldLoadVideo ? carregarVideo(config.timeoutVideo) : Promise.resolve({ loaded: false, reason: videoControlledExternally ? 'external-control' : 'network-policy' });

  return Promise.all([videoPromise, waitForAuthDecision(10000)]).then((results: any[]) => {
    const videoResult = results[0];
    const authResult = results[1];
    self.authDecision = authResult;
    state.setVideoCarregado(videoResult.loaded !== false);
    const sessaoValida = authResult.authenticated === true;
    state.setSessao(true, sessaoValida);
    _log('info', `Auth: authenticated=${sessaoValida}, source=${authResult.source}`);
    if (videoResult.loaded) { self.system.emit(PRELOADER_EVENTS.VIDEO_LOADED, { bootId: self.system.bootId, timestamp: Date.now() }); }
    else { self.system.emit(PRELOADER_EVENTS.VIDEO_ERROR, { bootId: self.system.bootId, reason: videoResult.reason || 'unknown', timestamp: Date.now() }); }
    self.system.addTrace('session:checked', { verified: true, valid: sessaoValida, source: authResult.source });
    // v3.8.0: Se auth resolveu e havia grace timer pendente, re-tentar finalizar
    if (sessaoValida && self._authGraceTimer) {
      clearTimeout(self._authGraceTimer);
      self._authGraceTimer = null;
      _log('info', 'Auth resolvido durante grace period - re-tentando finalizar');
      self.finalizar('auth-grace-resolved');
    }
    self.decidirProximaFase();
  }).catch(error => {
    self._errors.push({ error: error.message, timestamp: Date.now() });
    _log('error', 'Erro na inicializacao:', error);
    self.system.addTrace('init:error', { error: error.message });
    self.system.emit(COMPONENT_EVENTS.ERROR, { bootId: self.system.bootId, componentName: 'preloader', error: error.message, phase: state.fase, timestamp: Date.now() });
    self.decidirProximaFase();
  });
};

BootManager.prototype.decidirProximaFase = function() {
  const self = this;
  const config = self.system.config;
  const state = self.system.state;
  const authResult = self.authDecision || { authenticated: state.getStatus().temSessaoValida };
  const isAuthenticated = authResult.authenticated === true;
  _log('info', `Decidindo fase: authenticated=${isAuthenticated}, source=${authResult.source || 'state'}`);
  self.system.addTrace('decide:phase', { authenticated: isAuthenticated, source: authResult.source });

  if (BootstrapBridge.hasDecision('nextPhase')) {
    const nextPhase = BootstrapBridge.getDecision('nextPhase');
    _log('info', `Using Bootstrap decision for nextPhase: ${nextPhase}`);
    if (nextPhase === 'dashboard') { self.iniciarDashboard(); }
    else if (nextPhase === 'waitAuth') { self._startAuthObserver(); }
    return;
  }

  if (isAuthenticated) {
    _log('info', 'Autenticado - iniciando dashboard');
    self.system.emit(AUTH_EVENTS.SESSION_CHECKED, { bootId: self.system.bootId, authenticated: true, phase: state.fase, source: authResult.source, timestamp: Date.now() });
    self.system.addTrace('authenticated');
    self.iniciarDashboard();
  } else {
    _log('info', 'Nao autenticado - aguardando login');
    self.system.addTrace('login:required:observed');
    self._startAuthObserver();
  }
};

BootManager.prototype._startAuthObserver = function() {
  const self = this;
  const config = self.system.config;
  const authObserver = new (AuthObserver as unknown as new (opts: Record<string, unknown>) => Record<string, any>)({ eventBus: self.system.eventBus, cleanupManager: self.system.cleanupManager, timers: self.system.timers, config, addTrace: self.system.addTrace.bind(self.system), transitionPhase: self.system.transitionPhase.bind(self.system), iniciarDashboard() { self.iniciarDashboard(); } });
  authObserver.observe();
};

BootManager.prototype.iniciarDashboard = function() {
  const self = this;
  const config = self.system.config;
  const state = self.system.state;
  const timers = self.system.timers;
  _log('info', '===== CARREGANDO DASHBOARD =====');
  self.system.transitionPhase(PHASES.LOADING, self.forceMode);
  _setAppState('loading-dashboard');
  self.system.addTrace('dashboard:loading');
  self.system.progressMonitor = new (ProgressMonitor as unknown as new (s: Record<string, any>) => Record<string, any>)(state);
  self.system.progressMonitor.start(config.pollInterval);
  if (self.componentsReadyBuffer && !self.componentsReadyBufferConsumed && !self.componentsReadyProcessed) {
    _log('info', 'Processando components:ready bufferizado');
    self.componentsReadyBufferConsumed = true;
    self.componentsReadyProcessed = true;
    self.system.progressMonitor.updateUI(100);
    timers.finalizeBuffered = setTimeout(() => { self.system.finalizar('components-ready-buffered'); }, config.hideDelayMs);
    self.componentsReadyBuffer = null;
  }
};

BootManager.prototype.scheduleComponentsReadyTimeout = function(isRetry: boolean) {
  const self = this;
  const config = self.system.config;
  const timers = self.system.timers;
  const state = self.system.state;
  if (isRetry) {
    self.componentsReadyTimeoutRetries++;
    if (self.componentsReadyTimeoutRetries >= config.timeoutComponentsReadyMax) {
      _log('warn', `Maximo de retries atingido (${config.timeoutComponentsReadyMax})`);
      self._enterDegradedMode(DEGRADED_REASONS.MAX_RETRIES, 'waiting-components');
      setTimeout(() => { self.system.finalizar('max-retries-forced', true); }, 3000);
      return;
    }
  }
  const baseTimeout = this._decide('componentsTimeout', config.timeoutComponentsReady);
  const timeout = isRetry ? config.timeoutComponentsReadyBackoff * self.componentsReadyTimeoutRetries : baseTimeout;
  timers.componentsReady = setTimeout(() => {
    if (self.componentsReadyReceived) return;
    const status = state.getStatus();
    const monitorAtivo = self.system.progressMonitor !== null;
    if (!status.temSessaoValida) { _log('warn', 'components:ready timeout - nao autenticado'); self._enterDegradedMode(DEGRADED_REASONS.AUTH_TIMEOUT, 'waiting-auth'); self.scheduleComponentsReadyTimeout(true); return; }
    if (!monitorAtivo) { _log('warn', 'components:ready timeout - monitor inativo'); self._enterDegradedMode(DEGRADED_REASONS.MONITOR_INACTIVE, 'waiting-monitor'); self.scheduleComponentsReadyTimeout(true); return; }
    _log('warn', `components:ready timeout (${timeout}ms)`);
    self._enterDegradedMode(DEGRADED_REASONS.COMPONENTS_TIMEOUT, 'degraded');
    self.system.finalizar('components-ready-timeout');
  }, timeout);
};

BootManager.prototype.handleComponentsReady = function(event: Record<string, any>) {
  const self = this;
  const config = self.system.config;
  const timers = self.system.timers;
  if (self.componentsReadyProcessed) return;
  self.componentsReadyReceived = true;
  if (timers.componentsReady) { clearTimeout(timers.componentsReady); delete timers.componentsReady; }
  _log('info', 'components:ready recebido!');
  self.system.addTrace('components:ready:received', event.detail);
  if (self._degradedMode) { self._exitDegradedMode(); }
  if (!self.system.progressMonitor && !self.componentsReadyBufferConsumed) { _log('info', 'Buffering components:ready'); self.componentsReadyBuffer = event.detail; return; }
  self.componentsReadyProcessed = true;
  if (self.system.progressMonitor) { self.system.progressMonitor.updateUI(100); }
  timers.finalize = setTimeout(() => { self.system.finalizar('components-ready'); }, config.hideDelayMs);
};

// ============================================================================
// FINALIZAR - v3.9.0: Bootstrap-aware log levels
// ============================================================================
BootManager.prototype.finalizar = function(motivo: string, force?: boolean) {
  const self = this;
  motivo = motivo || 'normal';
  const config = self.system.config;
  const state = self.system.state;
  const timers = self.system.timers;
  if (!force && !self.system.allowFinalize) { self.system.addTrace('finalize:blocked', { motivo }); return; }
  if (!force && self.finalizeCalled) return;
  if (!force && self.system.finalizing) return;
  if (!force && state.fase === PHASES.VISIBLE) return;
  const faseAtual = state.fase;
  const status = state.getStatus();
  const podeShowDashboard = self._decidePodeShowDashboard(status, faseAtual, force);

  if (!force && !podeShowDashboard && motivo !== 'debug-force') {
    // v3.8.0: Grace period - quando auth ainda não resolveu mas components-ready já chegou,
    // aguardar 2s antes de entrar em degraded mode (race condition típico do boot)
    if (!status.temSessaoValida && !self._authGraceTimer && self._authGraceAttempts < 2) {
      self._authGraceAttempts++;
      _log('info', `finalizar() - auth pendente, grace period 2s (tentativa ${self._authGraceAttempts})`);
      self.system.addTrace('finalize:auth-grace', { motivo, attempt: self._authGraceAttempts });
      self._authGraceTimer = setTimeout(() => {
        self._authGraceTimer = null;
        _log('info', 'Grace period expirado - re-tentando finalizar');
        self.finalizar(motivo);
      }, 2000);
      return;
    }
    
    _log('warn', 'finalizar() - condicoes nao satisfeitas');
    self.system.addTrace('finalize:deferred', { motivo, fase: faseAtual, validSession: status.temSessaoValida, progress: state.progressoAtual });
    if (!status.temSessaoValida) { self._enterDegradedMode(DEGRADED_REASONS.AUTH_TIMEOUT, 'waiting-auth'); }
    else if (!self.system.progressMonitor) { self._enterDegradedMode(DEGRADED_REASONS.MONITOR_INACTIVE, 'waiting-monitor'); }
    else { self._enterDegradedMode(DEGRADED_REASONS.UNKNOWN, 'degraded'); }
    return;
  }

  // Limpar grace timer se existir
  if (self._authGraceTimer) { clearTimeout(self._authGraceTimer); self._authGraceTimer = null; }

  self.finalizeCalled = true;
  const duration = state.getBootDuration();
  _log('info', `===== FINALIZANDO BOOT ${force ? '(FORCADO)' : ''} =====`);
  _log('info', `Tempo: ${duration}ms | Motivo: ${motivo} | Degraded: ${self._degradedMode}`);
  _log('info', `Decisões: Bootstrap=${self._decisionsUsed.bootstrap} Default=${self._decisionsUsed.default}`);
  self.system.addTrace('finalize:start', { motivo, duration, fase: faseAtual, forced: force, degraded: self._degradedMode, degradedReason: self._degradedReason, decisionsUsed: Object.assign({}, self._decisionsUsed) });
  self.system.transitionPhase(PHASES.FINALIZING, force);
  if (self.system.progressMonitor) { self.system.progressMonitor.stop(); }
  self._saveTelemetry(duration, motivo, force);

  self.system.hide(() => {
    if (force) {
      if (status.temSessaoValida) { showDashboard(); self.system.transitionPhase(PHASES.VISIBLE, true); self.system.addTrace('dashboard:visible:forced'); }
      else {
        // v3.9.0: Quando Bootstrap controla auth, force sem sessão é comportamento ESPERADO
        // (Bootstrap Phase-2 resolverá auth depois). Não emitir como warning.
        const isBootstrapManaged = BootstrapBridge.isBootstrapControlled();
        _log(isBootstrapManaged ? 'info' : 'warn', `Force mode: aguardando autenticacao (bootstrap-managed=${isBootstrapManaged})`);
        self.system.addTrace('preloader:hidden:waiting-auth', { bootstrapManaged: isBootstrapManaged });
      }
      self.system.emit(COMPONENT_EVENTS.ALL_READY, { bootId: self.system.bootId, durationMs: duration, motivo, forced: true, authenticated: status.temSessaoValida, phase: status.temSessaoValida ? PHASES.VISIBLE : PHASES.WAIT_AUTH, degraded: self._degradedMode, degradedReason: self._degradedReason, decisionsUsed: Object.assign({}, self._decisionsUsed), timestamp: Date.now() });
    } else if (podeShowDashboard) {
      showDashboard();
      self.system.transitionPhase(PHASES.VISIBLE, false);
      self.system.addTrace('dashboard:visible');
      self.system.emit(COMPONENT_EVENTS.ALL_READY, { bootId: self.system.bootId, durationMs: duration, motivo, forced: false, phase: PHASES.VISIBLE, degraded: self._degradedMode, degradedReason: self._degradedReason, decisionsUsed: Object.assign({}, self._decisionsUsed), timestamp: Date.now() });
    } else { _log('warn', 'Dashboard NAO exibido - aguardando condicoes'); self.system.addTrace('dashboard:deferred', { motivo, reason: 'waiting-conditions' }); }
  });
};

BootManager.prototype._saveTelemetry = function(duration: number, motivo: string, force?: boolean) {
  if (!hasWindow) return;
  const self = this;
  try {
    const telemetry = { bootId: self.system.bootId, schema: self.system.config.telemetrySchema, duration, motivo, forced: force, progressoFinal: self.system.state.progressoAtual, degraded: self._degradedMode, degradedReason: self._degradedReason, degradedCount: self._degradedCount, decisionsUsed: Object.assign({}, self._decisionsUsed), bootstrapControlled: BootstrapBridge.isBootstrapControlled(), timestamp: new Date().toISOString(), bootTrace: self.system.bootTrace.slice(-50), performanceMarks: self.system.getPerformanceMarks() };
    const existingTraces = JSON.parse(localStorage.getItem('boot-telemetry-history') || '[]');
    existingTraces.push(telemetry);
    localStorage.setItem('boot-telemetry-history', JSON.stringify(existingTraces.slice(-5)));
    localStorage.setItem('boot-telemetry', JSON.stringify(telemetry));
  } catch (e: any) { _log('warn', 'Erro telemetria:', e); }
};

BootManager.prototype._shouldLoadVideo = function(config: Record<string, unknown>) { return this._decideShouldLoadVideo(config); };

BootManager.prototype.reset = function() {
  if (this._authGraceTimer) { clearTimeout(this._authGraceTimer); this._authGraceTimer = null; }
  this.componentsReadyBuffer = null; this.componentsReadyBufferConsumed = false; this.componentsReadyReceived = false; this.componentsReadyProcessed = false; this.componentsReadyTimeoutRetries = 0; this.finalizeCalled = false; this.forceMode = false; this.authDecision = null; this._degradedMode = false; this._degradedReason = null; this._degradedAt = null; this._decisionsUsed = { bootstrap: 0, default: 0 }; this._authGraceAttempts = 0;
  BootstrapBridge.reset();
};

BootManager.prototype.healthCheck = function() {
  const systemAvailable = !!this.system;
  const notFinalized = !this.finalizeCalled || this.forceMode;
  const lowErrors = this._errors.length < 5;
  const notDegraded = !this._degradedMode;
  const checks = { systemAvailable, notFinalized, lowErrors, notDegraded, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, componentsReadyReceived: this.componentsReadyReceived, componentsReadyProcessed: this.componentsReadyProcessed, retries: this.componentsReadyTimeoutRetries, forceMode: this.forceMode, bootCount: this._bootCount, errorCount: this._errors.length, degraded: this._degradedMode, degradedReason: this._degradedReason, degradedCount: this._degradedCount, decisionsUsed: Object.assign({}, this._decisionsUsed), bootstrapBridge: BootstrapBridge.info(), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};

BootManager.prototype.info = function() { 
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck(), bootCount: this._bootCount, lastBootAt: this._lastBootAt, componentsReady: { received: this.componentsReadyReceived, processed: this.componentsReadyProcessed, buffered: !!this.componentsReadyBuffer }, retries: this.componentsReadyTimeoutRetries, finalizeCalled: this.finalizeCalled, forceMode: this.forceMode, authDecision: this.authDecision, degradedInfo: this.getDegradedInfo(), decisionsUsed: Object.assign({}, this._decisionsUsed), bootstrapBridge: BootstrapBridge.info(), portsInitialized: Ports.isInitialized(), errors: this._errors.slice(-5) }; 
};

BootManager.prototype.getVersion = () => VERSION;
BootManager.prototype.getBootstrapBridge = () => BootstrapBridge;

// ============================================================================
// EXPORTS (Consolidados - Sem duplicatas)
// ============================================================================
export { VERSION, MODULE_ID, DEGRADED_REASONS, BootstrapBridge, BootManager };
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function getVersion() { return VERSION; }
