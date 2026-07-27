import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.5.0-P17WI";
const MODULE_ID = "header/core/event-bus";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const L = _getPort("logger");
  if (!L) return;
  if (level === "error") {
    L.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    L.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debugEnabled()) L.debug?.(`[${MODULE_ID}]`, ...args);
};
class HeaderEventBus {
  constructor(instanceId = "default") {
    this.instanceId = instanceId;
    this.listeners = /* @__PURE__ */ new Map();
    this.eventHistory = [];
    this.maxHistorySize = 50;
    this.isDestroyed = false;
    this._metrics = { totalEmitted: 0, totalListeners: 0, errors: 0, lastEventTime: null };
    this.circuitBreaker = { failures: 0, maxFailures: 5, resetTimeout: 3e4, isOpen: false, lastFailureTime: null };
    this._initHealthCheck();
    _log("info", `HeaderEventBus created: ${instanceId}`);
  }
  _initHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(this.healthCheckInterval);
        return;
      }
      if (this.circuitBreaker.isOpen && Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.resetTimeout) {
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
        _log("info", "Circuit breaker auto-reset");
      }
    }, 5e3);
  }
  _validateEventName(eventName) {
    if (!eventName || typeof eventName !== "string") throw new TypeError("Event name must be a non-empty string");
    return true;
  }
  _validateCallback(callback) {
    if (typeof callback !== "function") throw new TypeError("Callback must be a function");
    return true;
  }
  // @ts-expect-error TS migration - TS2339
  on(eventName, callback, options = {}) {
    if (this.isDestroyed) {
      _log("warn", "Bus destroyed - on() ignored");
      return () => {
      };
    }
    this._validateEventName(eventName);
    this._validateCallback(callback);
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
    const existing = this.listeners.get(eventName).find((l) => l.callback === callback);
    if (existing) {
      _log("debug", `Duplicate listener ignored: ${eventName}`);
      return () => this.off(eventName, callback);
    }
    const listener = { callback, once: options.once || false, priority: options.priority || 0, id: `${eventName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, registeredAt: Date.now() };
    this.listeners.get(eventName).push(listener);
    this.listeners.get(eventName).sort((a, b) => b.priority - a.priority);
    this._metrics.totalListeners++;
    _log("debug", `Listener registered: ${eventName}`);
    return () => this.off(eventName, callback);
  }
  once(eventName, callback, options = {}) {
    return this.on(eventName, callback, { ...options, once: true });
  }
  // @ts-expect-error TS migration - TS2339
  off(eventName, callback) {
    if (this.isDestroyed) return false;
    if (!this.listeners.has(eventName)) return false;
    const callbacks = this.listeners.get(eventName);
    const index = callbacks.findIndex((l) => l.callback === callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      if (callbacks.length === 0) this.listeners.delete(eventName);
      _log("debug", `Listener removed: ${eventName}`);
      return true;
    }
    return false;
  }
  // @ts-expect-error TS migration - TS2345
  emit(eventName, data = {}) {
    if (this.isDestroyed) {
      _log("warn", "Bus destroyed - emit() ignored");
      return 0;
    }
    this._validateEventName(eventName);
    if (this.circuitBreaker.isOpen) {
      _log("warn", `Circuit breaker open - emit blocked: ${eventName}`);
      return 0;
    }
    const timestamp = Date.now();
    this._metrics.lastEventTime = timestamp;
    this._metrics.totalEmitted++;
    this._addToHistory({ eventName, data, timestamp });
    if (!this.listeners.has(eventName)) {
      _log("debug", `Event without listeners: ${eventName}`);
      return 0;
    }
    const listeners = [...this.listeners.get(eventName)];
    let executedCount = 0;
    for (const listener of listeners) {
      try {
        Promise.resolve().then(() => {
          listener.callback({ ...data, _meta: { eventName, timestamp, instanceId: this.instanceId, listenerId: listener.id } });
        }).catch((error) => {
          this._handleListenerError(error);
        });
        executedCount++;
        if (listener.once) this.off(eventName, listener.callback);
      } catch (error) {
        this._metrics.errors++;
        this._handleListenerError(error);
      }
    }
    _log("debug", `Event emitted: ${eventName} (${executedCount} listeners)`);
    return executedCount;
  }
  _handleListenerError(error) {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    if (this.circuitBreaker.failures >= this.circuitBreaker.maxFailures) {
      this.circuitBreaker.isOpen = true;
      _log("error", `Circuit breaker OPENED after ${this.circuitBreaker.failures} failures`);
    }
  }
  _addToHistory(event) {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) this.eventHistory.shift();
  }
  // @ts-expect-error TS migration - TS2339
  getHistory(eventName = null) {
    if (eventName) return this.eventHistory.filter((e) => e.eventName === eventName);
    return [...this.eventHistory];
  }
  clearHistory() {
    this.eventHistory = [];
  }
  clear() {
    this.listeners.clear();
    this._metrics.totalListeners = 0;
    _log("info", "All listeners removed");
  }
  listenerCount(eventName) {
    return this.listeners.get(eventName)?.length || 0;
  }
  getRegisteredEvents() {
    return Array.from(this.listeners.keys());
  }
  getMetrics() {
    return { ...this._metrics, activeListeners: this.listeners.size, historySize: this.eventHistory.length, circuitBreakerStatus: this.circuitBreaker.isOpen ? "OPEN" : "CLOSED", circuitBreakerFailures: this.circuitBreaker.failures, isHealthy: !this.circuitBreaker.isOpen && !this.isDestroyed };
  }
  resetMetrics() {
    Object.keys(this._metrics).forEach((k) => {
      this._metrics[k] = typeof this._metrics[k] === "number" ? 0 : null;
    });
  }
  setDebugMode(enabled) {
  }
  setDebug(enabled) {
  }
  healthCheck() {
    const checks = { notDestroyed: !this.isDestroyed, circuitBreakerClosed: !this.circuitBreaker.isOpen, listenersMapReady: this.listeners instanceof Map, historyReady: Array.isArray(this.eventHistory), noExcessiveErrors: this._metrics.errors < 100 };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, instanceId: this.instanceId, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, instanceId: this.instanceId, registeredEvents: this.getRegisteredEvents().length, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
  getVersion() {
    return VERSION;
  }
  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.clear();
    this.clearHistory();
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    _log("info", "HeaderEventBus destroyed");
  }
}
function getVersion() {
  return VERSION;
}
var event_bus_default = HeaderEventBus;
export {
  HeaderEventBus,
  MODULE_ID,
  VERSION,
  event_bus_default as default,
  getPorts,
  getVersion,
  injectPorts
};
