// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.core.event-bus
// PURPOSE: Footer Internal Event Bus - Isolated event system
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract FOOTER_EVENT_BUS - FooterEventBus() constructor
// @contract GET_INSTANCE - getInstance() returns singleton instance
// @contract CREATE_INSTANCE - createInstance() creates new instance
// @contract EMIT - emit() emits event to listeners
// @contract ON - on() registers event listener
// @contract ONCE - once() registers one-time listener
// @contract OFF - off() removes event listener
// @contract CLEAR - clear() removes all listeners
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   FooterEventBus() — exported constructor
//   getInstance() — exported function
//   createInstance() — exported function
//   emit() — exported function
//   on() — exported function
//   once() — exported function
//   off() — exported function
//   clear() — exported function
//   clearAll() — exported function
//   getEventBus() — exported function
//   isAvailable() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   emitGlobalAction() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): ui:action (via global EventBus)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v5.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v5.4.1-ENTERPRISE: ES5 conversion (Object.values → for loop in healthCheck)
// @changelog P18EC: Events Contracts Migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '5.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'footer.core.event-bus';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = {
  info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(`[${MODULE_ID}] ${msg}`, ctx || {}); },
  warn(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(`[${MODULE_ID}] ${msg}`, ctx || {}); },
  error(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.error) logger.error(`[${MODULE_ID}] ${msg}`, ctx || {}); },
  debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(`[${MODULE_ID}] ${msg}`, ctx || {}); }
};

export function FooterEventBus(this: any, instanceId: string) {
  this.instanceId = instanceId || 'default';
  this.listeners = new Map();
  this.eventHistory = [];
  this.maxHistorySize = 50;
  this.isDestroyed = false;
  this._metrics = { totalEmitted: 0, totalListeners: 0, errors: 0, lastEventTime: null };
  this.circuitBreaker = { failures: 0, maxFailures: 5, resetTimeout: 30000, isOpen: false, lastFailureTime: null };
  this.healthCheckInterval = null;
  this._initHealthCheck();
  _log.info('FooterEventBus created (ISOLATED)', { instanceId: this.instanceId });
}

FooterEventBus.prototype._initHealthCheck = function() {
  const self = this;
  this.healthCheckInterval = setInterval(() => {
    if (self.isDestroyed) { clearInterval(self.healthCheckInterval); return; }
    if (self.circuitBreaker.isOpen && Date.now() - self.circuitBreaker.lastFailureTime > self.circuitBreaker.resetTimeout) {
      self.circuitBreaker.isOpen = false;
      self.circuitBreaker.failures = 0;
      _log.info('Circuit breaker auto-reset');
    }
  }, 5000);
};

FooterEventBus.prototype._validateEventName = (eventName: string) => {
  if (!eventName || typeof eventName !== 'string') throw new TypeError('Event name must be a non-empty string');
  return true;
};

FooterEventBus.prototype._validateCallback = (callback: Function) => {
  if (typeof callback !== 'function') throw new TypeError('Callback must be a function');
  return true;
};

FooterEventBus.prototype.on = function(eventName: string, callback: Function, options: Record<string,unknown>) {
  const self = this;
  options = options || {};
  if (this.isDestroyed) { _log.warn('Bus destroyed - on() ignored'); return () => {}; }
  this._validateEventName(eventName);
  this._validateCallback(callback);
  if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
  const arr = this.listeners.get(eventName);
  let existing = null;
  for (let i = 0; i < arr.length; i++) { if (arr[i].callback === callback) { existing = arr[i]; break; } }
  if (existing) { _log.debug(`Duplicate listener ignored: ${eventName}`); return () => { self.off(eventName, callback); }; }
  const listener = {
    callback,
    once: options.once || false,
    priority: options.priority || 0,
    id: `${eventName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    registeredAt: Date.now()
  };
  this.listeners.get(eventName).push(listener);
  // @ts-expect-error TS migration - TS2339
  this.listeners.get(eventName).sort((a: unknown, b: unknown) => b.priority - a.priority);
  this._metrics.totalListeners++;
  _log.debug(`Listener registered: ${eventName}`);
  return () => { self.off(eventName, callback); };
};

FooterEventBus.prototype.once = function(eventName: string, callback: Function, options: Record<string,unknown>) {
  options = options || {};
  return this.on(eventName, callback, Object.assign({}, options, { once: true }));
};

FooterEventBus.prototype.off = function(eventName: string, callback: Function) {
  if (this.isDestroyed) return false;
  if (!this.listeners.has(eventName)) return false;
  const callbacks = this.listeners.get(eventName);
  let index = -1;
  for (let i = 0; i < callbacks.length; i++) { if (callbacks[i].callback === callback) { index = i; break; } }
  if (index > -1) {
    callbacks.splice(index, 1);
    if (callbacks.length === 0) this.listeners.delete(eventName);
    _log.debug(`Listener removed: ${eventName}`);
    return true;
  }
  return false;
};

FooterEventBus.prototype.emit = function(eventName: string, data: Record<string,unknown>) {
  const self = this;
  data = data || {};
  if (this.isDestroyed) { _log.warn('Bus destroyed - emit() ignored'); return 0; }
  this._validateEventName(eventName);
  if (this.circuitBreaker.isOpen) { _log.warn(`Circuit breaker open - emit blocked: ${eventName}`); return 0; }
  const timestamp = Date.now();
  this._metrics.lastEventTime = timestamp;
  this._metrics.totalEmitted++;
  this._addToHistory({ eventName, data, timestamp });
  if (!this.listeners.has(eventName)) { _log.debug(`Event without listeners: ${eventName}`); return 0; }
  const listeners = this.listeners.get(eventName).slice();
  let executedCount = 0;
  for (let i = 0; i < listeners.length; i++) {
    (listener => {
      try {
        Promise.resolve().then(() => {
          listener.callback(Object.assign({}, data, { _meta: { eventName, timestamp, instanceId: self.instanceId, listenerId: listener.id } }));
        }).catch(error => { self._handleListenerError(error); });
        executedCount++;
        if (listener.once) self.off(eventName, listener.callback);
      } catch (error) {
        self._metrics.errors++;
        self._handleListenerError(error);
      }
    })(listeners[i]);
  }
  _log.debug(`Event emitted (LOCAL): ${eventName} (${executedCount} listeners)`);
  return executedCount;
};

FooterEventBus.prototype._handleListenerError = function(error: unknown) {
  this.circuitBreaker.failures++;
  this.circuitBreaker.lastFailureTime = Date.now();
  if (this.circuitBreaker.failures >= this.circuitBreaker.maxFailures) {
    this.circuitBreaker.isOpen = true;
    _log.error(`Circuit breaker OPENED after ${this.circuitBreaker.failures} failures`);
  }
};

FooterEventBus.prototype._addToHistory = function(event: string) {
  this.eventHistory.push(event);
  if (this.eventHistory.length > this.maxHistorySize) this.eventHistory.shift();
};

FooterEventBus.prototype.getHistory = function(eventName: string) {
  if (eventName) {
    const result = [];
    for (let i = 0; i < this.eventHistory.length; i++) {
      if (this.eventHistory[i].eventName === eventName) result.push(this.eventHistory[i]);
    }
    return result;
  }
  return this.eventHistory.slice();
};

FooterEventBus.prototype.clearHistory = function() { this.eventHistory = []; };
FooterEventBus.prototype.clear = function() { this.listeners.clear(); this._metrics.totalListeners = 0; _log.info('All listeners removed'); };
FooterEventBus.prototype.clearAll = function() { this.clear(); this.clearHistory(); };

FooterEventBus.prototype.listenerCount = function(eventName: string) {
  const arr = this.listeners.get(eventName);
  return arr ? arr.length : 0;
};

FooterEventBus.prototype.getRegisteredEvents = function() { return Array.from(this.listeners.keys()); };

FooterEventBus.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, {
    activeListeners: this.listeners.size,
    historySize: this.eventHistory.length,
    circuitBreakerStatus: this.circuitBreaker.isOpen ? 'OPEN' : 'CLOSED',
    circuitBreakerFailures: this.circuitBreaker.failures,
    isHealthy: !this.circuitBreaker.isOpen && !this.isDestroyed
  });
};

FooterEventBus.prototype.resetMetrics = function() {
  const self = this;
  const keys = Object.keys(this._metrics);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    self._metrics[k] = typeof self._metrics[k] === 'number' ? 0 : null;
  }
};

FooterEventBus.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  const checks = {
    notDestroyed: !this.isDestroyed,
    circuitBreakerClosed: !this.circuitBreaker.isOpen,
    listenersMapReady: this.listeners instanceof Map,
    historyReady: Array.isArray(this.eventHistory),
    noExcessiveErrors: this._metrics.errors < 100,
    portsInitialized: portsSnapshot._initialized
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as Record<string,unknown>)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  const issues = [];
  for (let j = 0; j < checkKeys.length; j++) { if (!(checks as Record<string,unknown>)[checkKeys[j]]) issues.push(checkKeys[j]); }
  return {
    status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    issues,
    version: VERSION,
    moduleId: MODULE_ID,
    instanceId: this.instanceId,
    isolation: 'FULL',
    timestamp: new Date().toISOString()
  };
};

FooterEventBus.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    instanceId: this.instanceId,
    isolation: 'FULL',
    registeredEvents: this.getRegisteredEvents(),
    metrics: this.getMetrics(),
    healthCheck: this.healthCheck()
  };
};

FooterEventBus.prototype.getVersion = () => VERSION;

FooterEventBus.prototype.destroy = function() {
  if (this.isDestroyed) return;
  this.isDestroyed = true;
  this.clear();
  this.clearHistory();
  if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
  _log.info('FooterEventBus destroyed');
};

let _instance: {[k:string]:Function}|null = null;

export function getInstance() {
  if (!_instance) _instance = (new (FooterEventBus as unknown as { new(..._args: unknown[]): {[k:string]:Function} })('footer-singleton'));
  return _instance;
}

export function createInstance(instanceId: string) { return (new (FooterEventBus as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(instanceId)); }

export function emit(event: string, data: Record<string,unknown>) { return getInstance().emit(event, data); }
export function on(event: string, callback: Function, options: Record<string,unknown>) { return getInstance().on(event, callback, options); }
export function once(event: string, callback: Function, options: Record<string,unknown>) { return getInstance().once(event, callback, options); }
export function off(event: string, callback: Function) { return getInstance().off(event, callback); }
export function clear() { return getInstance().clear(); }
export function clearAll() { return getInstance().clearAll(); }
export function getEventBus() { return getInstance(); }
export function isAvailable() { return !!getInstance(); }
export function info() { return getInstance().info(); }
export function healthCheck() { return getInstance().healthCheck(); }

export function emitGlobalAction(actionId: string, meta: Record<string,unknown>) {
  meta = meta || {};
  const bus = _getPort('eventBus');
  if (!bus || !bus.emit) { _log.warn('Global EventBus not available for ui:action'); return false; }
  bus.emit(UI_EVENTS.ACTION, { actionId, source: MODULE_ID, timestamp: Date.now(), meta });
  _log.debug(`ui:action emitted to Global: ${actionId}`);
  return true;
}

export default {
  FooterEventBus,
  getInstance,
  createInstance,
  emit,
  on,
  once,
  off,
  clear,
  clearAll,
  getEventBus,
  isAvailable,
  info,
  healthCheck,
  emitGlobalAction,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
