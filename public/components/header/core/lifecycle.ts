// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.7.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/lifecycle
// PURPOSE: Lifecycle state machine manager with circuit breaker and auto-recovery
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   HEADER_EVENTS from /core/runtime/events/catalog/header.events.js
// PROVIDES:
//   LifecycleManager(config) — constructor for lifecycle state machine
//   LIFECYCLE_STATES — frozen enum of all lifecycle states
//   TIMEOUTS — frozen enum of timeout values
//   injectPorts(p) — inject dependency ports
//   getPorts() — get ports snapshot
//   getVersion() — return module version
// EMITS (eventos):
//   LIFECYCLE_EVENTS.* — lifecycle state transition events via eventBus
// ═══════════════════════════════════════════════════════════════
// Header - Lifecycle Manager (Enterprise Autocontained)
// @version 5.7.0-ES6
// @changelog v5.7.0-ES6 - Task 10.1 B07: var → const/let
// @changelog v5.6.1-ENTERPRISE - ES5 conversion
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';

export const VERSION = '5.7.0-ES6';
export const MODULE_ID = 'header/core/lifecycle';

export const LIFECYCLE_STATES = Object.freeze({ IDLE: 'idle', MOUNTING: 'mounting', MOUNTED: 'mounted', READY: 'ready', DEGRADED: 'degraded', ERROR: 'error', WARNING: 'warning', UNMOUNTING: 'unmounting', UNMOUNTED: 'unmounted', DESTROYED: 'destroyed' });
export const TIMEOUTS = Object.freeze({ MOUNT: 10000, READY: 5000, UNMOUNT: 3000, HOOK: 5000 });

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const STATE_TO_EVENT = {};
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.MOUNTING] = LIFECYCLE_EVENTS.MOUNTING;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.MOUNTED] = LIFECYCLE_EVENTS.MOUNTED;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.READY] = LIFECYCLE_EVENTS.READY;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.DEGRADED] = LIFECYCLE_EVENTS.DEGRADED;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.ERROR] = LIFECYCLE_EVENTS.ERROR;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.WARNING] = LIFECYCLE_EVENTS.WARNING;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.UNMOUNTING] = LIFECYCLE_EVENTS.UNMOUNTING;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.UNMOUNTED] = LIFECYCLE_EVENTS.UNMOUNTED;
(STATE_TO_EVENT as Record<string,unknown>)[LIFECYCLE_STATES.DESTROYED] = LIFECYCLE_EVENTS.DESTROYED;

export function LifecycleManager(this: any, config: Record<string,unknown>) {
  config = config || {};
  this.config = { maxHistorySize: config.maxHistorySize || 50, transitionTimeout: config.transitionTimeout || TIMEOUTS.MOUNT, maxErrorCount: config.maxErrorCount || 5, maxDegradedCount: config.maxDegradedCount || 3, autoRecovery: config.autoRecovery !== false, autoRecoveryDelay: config.autoRecoveryDelay || 30000, enableTelemetry: config.enableTelemetry !== false, instanceId: config.instanceId || 'lifecycle-default' };
  this._debug = false;
  this._metrics = { transitionCount: 0, hookCount: 0, errorCount: 0, recoveryCount: 0, lastTransitionAt: null };
  this.eventBus = config.eventBus || null;
  this.currentState = LIFECYCLE_STATES.IDLE;
  this.previousState = null;
  this.isDestroyed = false;
  this.isTransitioning = false;
  this.stateHistory = [];
  this.hooks = { onMounting: [], onMounted: [], onReady: [], onDegraded: [], onRecovered: [], onError: [], onWarning: [], onUnmounting: [], onUnmounted: [], onDestroyed: [] };
  this.metadata = { mountedAt: null, readyAt: null, destroyedAt: null, errorCount: 0, degradedCount: 0, recoveryCount: 0, transitionCount: 0, lastTransitionAt: null, lastErrorAt: null, lastDegradedAt: null };
  this.circuitBreaker = { isOpen: false, failures: 0, lastFailureTime: null, resetTimeout: 30000 };
  this.recoveryTimer = null;
  this._initAutoRecovery();
}

LifecycleManager.prototype._initAutoRecovery = function() {
  const self = this;
  if (!this.config.autoRecovery) return;
  this.recoveryTimer = setInterval(() => {
    if (self.isDestroyed) return;
    if (self.isDegraded() && self.metadata.degradedCount < self.config.maxDegradedCount) {
      const timeSinceDegraded = Date.now() - self.metadata.lastDegradedAt;
      if (timeSinceDegraded > self.config.autoRecoveryDelay) { _log('info', 'Auto-recovery iniciado'); self.recover({ auto: true }); }
    }
    if (self.circuitBreaker.isOpen) {
      const timeSinceFailure = Date.now() - self.circuitBreaker.lastFailureTime;
      if (timeSinceFailure > self.circuitBreaker.resetTimeout) { self.circuitBreaker.isOpen = false; self.circuitBreaker.failures = 0; _log('info', 'Circuit breaker resetado'); }
    }
  }, 5000);
};

LifecycleManager.prototype._validateState = (state: Record<string,unknown>) => {
  if (!state || typeof state !== 'string') throw new TypeError('Estado deve ser uma string não-vazia');
  const stateKeys = Object.keys(LIFECYCLE_STATES);
  const validStates = [];
  for (let i = 0; i < stateKeys.length; i++) validStates.push((LIFECYCLE_STATES as Record<string,unknown>)[stateKeys[i]]);
  if (validStates.indexOf(state) === -1) throw new Error(`Estado inválido: ${state}`);
  return true;
};

LifecycleManager.prototype.getState = function() { return this.currentState; };
LifecycleManager.prototype.is = function(state: Record<string,unknown>) { this._validateState(state); return this.currentState === state; };
LifecycleManager.prototype.isMounted = function() { return [LIFECYCLE_STATES.MOUNTED, LIFECYCLE_STATES.READY, LIFECYCLE_STATES.DEGRADED].indexOf(this.currentState) !== -1; };
LifecycleManager.prototype.isReady = function() { return this.currentState === LIFECYCLE_STATES.READY; };
LifecycleManager.prototype.isDegraded = function() { return this.currentState === LIFECYCLE_STATES.DEGRADED; };
LifecycleManager.prototype.isError = function() { return this.currentState === LIFECYCLE_STATES.ERROR; };
LifecycleManager.prototype.isDestroyedState = function() { return this.isDestroyed || this.currentState === LIFECYCLE_STATES.DESTROYED; };

LifecycleManager.prototype.transition = function(newState: Record<string,unknown>, metadata: unknown) {
  const self = this;
  metadata = metadata || {};
  if (this.isDestroyed) { _log('warn', 'Lifecycle destruído - transição ignorada'); return Promise.resolve(false); }
  try { this._validateState(newState); } catch (error: any) { _log('error', 'Estado inválido:', error.message); return Promise.resolve(false); }
  if (this.currentState === newState) { _log('debug', `Já está em estado: ${newState}`); return Promise.resolve(true); }
  if (this.isTransitioning) { _log('warn', 'Transição em andamento - aguarde'); return Promise.resolve(false); }
  // @ts-expect-error TS migration - TS2367
  if (this.circuitBreaker.isOpen && newState === LIFECYCLE_STATES.ERROR) { _log('warn', 'Circuit breaker aberto'); return Promise.resolve(false); }
  if (!this._isValidTransition(this.currentState, newState)) { _log('error', `Transicao invalida: ${this.currentState} -> ${newState}`); return Promise.resolve(false); }
  this.isTransitioning = true;
  const transitionPromise = this._executeTransition(newState, metadata);
  const timeoutPromise = new Promise((_, reject) => { setTimeout(() => { reject(new Error('Timeout de transição')); }, self.config.transitionTimeout); });
  return Promise.race([transitionPromise, timeoutPromise]).then(() => { self.isTransitioning = false; return true; }).catch(error => { _log('error', 'Erro na transição:', error); self._handleTransitionError(error); self.isTransitioning = false; return false; });
};

LifecycleManager.prototype._executeTransition = function(newState: Record<string,unknown>, metadata: unknown) {
  const self = this;
  const oldState = this.currentState;
  const timestamp = Date.now();
  this.previousState = oldState;
  this.currentState = newState;
  this.metadata.transitionCount++;
  this.metadata.lastTransitionAt = timestamp;
  this._metrics.transitionCount++;
  this._metrics.lastTransitionAt = timestamp;
  this._updateMetadata(newState, timestamp);
  this._addToHistory({ from: oldState, to: newState, timestamp, metadata });
  _log('info', `Lifecycle: ${oldState} -> ${newState}`);
  // @ts-expect-error TS migration - TS2352
  if (this.eventBus) { try { const eventName = (STATE_TO_EVENT as Record<string,unknown>)[newState as string] || (LIFECYCLE_EVENTS.PREFIX + newState); this.eventBus.emit(eventName, { previousState: oldState, currentState: newState, timestamp, metadata }); } catch (error: any) { _log('error', 'Erro ao emitir evento:', error); } }
  return this._executeHooks(newState, { oldState, newState, timestamp, metadata });
};

LifecycleManager.prototype._updateMetadata = function(state: Record<string,unknown>, timestamp: number) {
  switch (state) {
    // @ts-expect-error TS migration - TS2678
    case LIFECYCLE_STATES.MOUNTED: this.metadata.mountedAt = timestamp; break;
    // @ts-expect-error TS migration - TS2678
    case LIFECYCLE_STATES.READY: this.metadata.readyAt = timestamp; if (this.previousState === LIFECYCLE_STATES.DEGRADED) { this.metadata.recoveryCount++; this._metrics.recoveryCount++; } break;
    // @ts-expect-error TS migration - TS2678
    case LIFECYCLE_STATES.ERROR: this.metadata.errorCount++; this.metadata.lastErrorAt = timestamp; this._metrics.errorCount++; break;
    // @ts-expect-error TS migration - TS2678
    case LIFECYCLE_STATES.DEGRADED: this.metadata.degradedCount++; this.metadata.lastDegradedAt = timestamp; break;
    // @ts-expect-error TS migration - TS2678
    case LIFECYCLE_STATES.DESTROYED: this.metadata.destroyedAt = timestamp; this.isDestroyed = true; break;
  }
};

LifecycleManager.prototype._handleTransitionError = function(error: unknown) { this.circuitBreaker.failures++; this.circuitBreaker.lastFailureTime = Date.now(); if (this.circuitBreaker.failures >= this.config.maxErrorCount) { this.circuitBreaker.isOpen = true; _log('error', 'Circuit breaker ABERTO após múltiplas falhas'); } };

LifecycleManager.prototype._isValidTransition = (from: unknown, to: unknown) => {
  const validTransitions = {};
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.IDLE] = [LIFECYCLE_STATES.MOUNTING];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.MOUNTING] = [LIFECYCLE_STATES.MOUNTED, LIFECYCLE_STATES.ERROR];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.MOUNTED] = [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.UNMOUNTING];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.READY] = [LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.UNMOUNTING];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.DEGRADED] = [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.UNMOUNTING];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.ERROR] = [LIFECYCLE_STATES.MOUNTING, LIFECYCLE_STATES.UNMOUNTING, LIFECYCLE_STATES.DEGRADED];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.WARNING] = [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.DEGRADED, LIFECYCLE_STATES.ERROR];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.UNMOUNTING] = [LIFECYCLE_STATES.UNMOUNTED];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.UNMOUNTED] = [LIFECYCLE_STATES.MOUNTING, LIFECYCLE_STATES.DESTROYED];
  (validTransitions as Record<string,unknown>)[LIFECYCLE_STATES.DESTROYED] = [];
  const allowed = (validTransitions as Record<string,unknown>)[from as string];
  // @ts-expect-error TS migration - TS2339
  return allowed && allowed.indexOf(to) !== -1;
};

LifecycleManager.prototype._addToHistory = function(transition: Record<string,unknown>) { this.stateHistory.push(transition); if (this.stateHistory.length > this.config.maxHistorySize) this.stateHistory.shift(); };

LifecycleManager.prototype._executeHooks = function(state: Record<string,unknown>, context: Record<string,unknown>) {
  const self = this;
  const hookName = this._getHookName(state);
  if (!hookName) return Promise.resolve();
  const hooks = this.hooks[hookName] || [];
  let index = 0;
  function runNext(): unknown {
    if (index >= hooks.length) return Promise.resolve();
    const hook = hooks[index++];
    self._metrics.hookCount++;
    const hookPromise = Promise.resolve().then(() => hook(context));
    const timeoutPromise = new Promise((_, reject) => { setTimeout(() => { reject(new Error('Hook timeout')); }, TIMEOUTS.HOOK); });
    return Promise.race([hookPromise, timeoutPromise]).catch(error => { _log('error', `Erro em hook ${hookName}:`, error); }).then(runNext);
  }
  return runNext();
};

// @ts-expect-error TS migration - TS2352
LifecycleManager.prototype._getHookName = (state: Record<string,unknown>) => { const hookMap = {}; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.MOUNTING] = 'onMounting'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.MOUNTED] = 'onMounted'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.READY] = 'onReady'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.DEGRADED] = 'onDegraded'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.ERROR] = 'onError'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.WARNING] = 'onWarning'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.UNMOUNTING] = 'onUnmounting'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.UNMOUNTED] = 'onUnmounted'; (hookMap as Record<string,unknown>)[LIFECYCLE_STATES.DESTROYED] = 'onDestroyed'; return (hookMap as Record<string,unknown>)[state as string] || null; };

LifecycleManager.prototype.registerHook = function(hookName: string, callback: Function) { if (!this.hooks[hookName]) { _log('warn', `Hook inválido: ${hookName}`); return false; } if (typeof callback !== 'function') { _log('error', 'Hook callback deve ser função'); return false; } if (this.hooks[hookName].indexOf(callback) !== -1) { _log('debug', `Hook já registrado: ${hookName}`); return true; } this.hooks[hookName].push(callback); _log('debug', `Hook registrado: ${hookName}`); return true; };
LifecycleManager.prototype.unregisterHook = function(hookName: string, callback: Function) { if (!this.hooks[hookName]) return false; const index = this.hooks[hookName].indexOf(callback); if (index > -1) { this.hooks[hookName].splice(index, 1); return true; } return false; };

LifecycleManager.prototype.mount = function(metadata: unknown) { const self = this; metadata = metadata || {}; if (this.isMounted()) { _log('debug', 'Já está montado'); return Promise.resolve(true); } return this.transition(LIFECYCLE_STATES.MOUNTING, metadata).then(() => self.transition(LIFECYCLE_STATES.MOUNTED, metadata)).then(() => true); };
LifecycleManager.prototype.ready = function(metadata: unknown) { metadata = metadata || {}; if (this.isReady()) { _log('debug', 'Já está pronto'); return Promise.resolve(true); } return this.transition(LIFECYCLE_STATES.READY, metadata).then(() => true); };
LifecycleManager.prototype.degrade = function(reason: string, metadata: unknown) { reason = reason || 'unknown'; metadata = metadata || {}; return this.transition(LIFECYCLE_STATES.DEGRADED, Object.assign({ reason }, metadata)).then(() => true); };
LifecycleManager.prototype.recover = function(metadata: unknown) { metadata = metadata || {}; if (!this.isDegraded()) { _log('warn', 'Não está degradado - recovery ignorado'); return Promise.resolve(false); } return this.transition(LIFECYCLE_STATES.READY, Object.assign({ recovered: true }, metadata)).then(() => true); };
// @ts-expect-error TS migration - TS2339
LifecycleManager.prototype.error = function(error: unknown, metadata: unknown) { metadata = metadata || {}; const errorMsg = error && error.message ? error.message : error; const errorStack = error && error.stack ? error.stack : null; return this.transition(LIFECYCLE_STATES.ERROR, Object.assign({ error: errorMsg, stack: errorStack }, metadata)).then(() => true); };
LifecycleManager.prototype.warning = function(message: string, metadata: unknown) { metadata = metadata || {}; return this.transition(LIFECYCLE_STATES.WARNING, Object.assign({ message }, metadata)).then(() => true); };
LifecycleManager.prototype.unmount = function(metadata: unknown) { const self = this; metadata = metadata || {}; if (!this.isMounted()) { _log('debug', 'Não está montado'); return Promise.resolve(true); } return this.transition(LIFECYCLE_STATES.UNMOUNTING, metadata).then(() => self.transition(LIFECYCLE_STATES.UNMOUNTED, metadata)).then(() => true); };
LifecycleManager.prototype.destroy = function(metadata: unknown) { const self = this; metadata = metadata || {}; if (this.isDestroyed) { _log('debug', 'Já está destruído'); return Promise.resolve(true); } const p = this.isMounted() ? this.unmount() : Promise.resolve(); return p.then(() => self.transition(LIFECYCLE_STATES.DESTROYED, metadata)).then(() => { self._cleanup(); return true; }); };
LifecycleManager.prototype._cleanup = function() { if (this.recoveryTimer) { clearInterval(this.recoveryTimer); this.recoveryTimer = null; } for (const key in this.hooks) this.hooks[key] = []; _log('info', 'Lifecycle limpo'); };
LifecycleManager.prototype.getHistory = function(limit: number) { const history = this.stateHistory.slice(); return limit ? history.slice(-limit) : history; };
LifecycleManager.prototype.getMetrics = function() { const now = Date.now(); return Object.assign({}, { currentState: this.currentState, previousState: this.previousState, isTransitioning: this.isTransitioning, isDestroyed: this.isDestroyed }, this.metadata, { uptime: this.metadata.mountedAt ? now - this.metadata.mountedAt : 0, timeToReady: (this.metadata.readyAt && this.metadata.mountedAt) ? this.metadata.readyAt - this.metadata.mountedAt : null, historySize: this.stateHistory.length, circuitBreakerStatus: this.circuitBreaker.isOpen ? 'OPEN' : 'CLOSED', circuitBreakerFailures: this.circuitBreaker.failures }); };
LifecycleManager.prototype.healthCheck = function() { const checks = { notDestroyed: !this.isDestroyed, notInError: !this.isError(), circuitBreakerClosed: !this.circuitBreaker.isOpen, isOperational: this.isMounted(), belowMaxErrors: this.metadata.errorCount < this.config.maxErrorCount }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) if ((checks as Record<string,unknown>)[checkKeys[i]]) passed++; const total = checkKeys.length; const issues = []; for (let j = 0; j < checkKeys.length; j++) if (!(checks as Record<string,unknown>)[checkKeys[j]]) issues.push(checkKeys[j]); return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, state: this.currentState, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; };
LifecycleManager.prototype.clearHistory = function() { this.stateHistory = []; _log('debug', 'Histórico limpo'); };
LifecycleManager.prototype.reset = function() { if (this.isDestroyed) { _log('warn', 'Não pode resetar lifecycle destruído'); return false; } this.currentState = LIFECYCLE_STATES.IDLE; this.previousState = null; this.isTransitioning = false; this.stateHistory = []; this.metadata = { mountedAt: null, readyAt: null, destroyedAt: null, errorCount: 0, degradedCount: 0, recoveryCount: 0, transitionCount: 0, lastTransitionAt: null, lastErrorAt: null, lastDegradedAt: null }; this.circuitBreaker = { isOpen: false, failures: 0, lastFailureTime: null, resetTimeout: 30000 }; for (const key in this.hooks) this.hooks[key] = []; _log('info', 'Lifecycle resetado'); return true; };
LifecycleManager.prototype.setDebug = function(enabled: boolean) { this._debug = !!enabled; };
LifecycleManager.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, state: this.currentState, isDestroyed: this.isDestroyed, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; };
LifecycleManager.prototype.resetMetrics = function() { this._metrics = { transitionCount: 0, hookCount: 0, errorCount: 0, recoveryCount: 0, lastTransitionAt: null }; };

export function getVersion() { return VERSION; }
export { LIFECYCLE_EVENTS, HEADER_EVENTS };
export default LifecycleManager;
