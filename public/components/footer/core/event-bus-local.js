import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "5.5.0-P2-ENTERPRISE";
const MODULE_ID = "footer.core.event-bus";
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
const _log = {
  info(msg, ctx) {
    const logger = _getPort("logger");
    if (logger && logger.info) logger.info(`[${MODULE_ID}] ${msg}`, ctx || {});
  },
  warn(msg, ctx) {
    const logger = _getPort("logger");
    if (logger && logger.warn) logger.warn(`[${MODULE_ID}] ${msg}`, ctx || {});
  },
  error(msg, ctx) {
    const logger = _getPort("logger");
    if (logger && logger.error) logger.error(`[${MODULE_ID}] ${msg}`, ctx || {});
  },
  debug(msg, ctx) {
    const logger = _getPort("logger");
    if (logger && logger.debug) logger.debug(`[${MODULE_ID}] ${msg}`, ctx || {});
  }
};
function FooterEventBus(instanceId) {
  this.instanceId = instanceId || "default";
  this.listeners = /* @__PURE__ */ new Map();
  this.eventHistory = [];
  this.maxHistorySize = 50;
  this.isDestroyed = false;
  this._metrics = { totalEmitted: 0, totalListeners: 0, errors: 0, lastEventTime: null };
  this.circuitBreaker = { failures: 0, maxFailures: 5, resetTimeout: 3e4, isOpen: false, lastFailureTime: null };
  this.healthCheckInterval = null;
  this._initHealthCheck();
  _log.info("FooterEventBus created (ISOLATED)", { instanceId: this.instanceId });
}
FooterEventBus.prototype._initHealthCheck = function() {
  const self = this;
  this.healthCheckInterval = setInterval(() => {
    if (self.isDestroyed) {
      clearInterval(self.healthCheckInterval);
      return;
    }
    if (self.circuitBreaker.isOpen && Date.now() - self.circuitBreaker.lastFailureTime > self.circuitBreaker.resetTimeout) {
      self.circuitBreaker.isOpen = false;
      self.circuitBreaker.failures = 0;
      _log.info("Circuit breaker auto-reset");
    }
  }, 5e3);
};
FooterEventBus.prototype._validateEventName = (eventName) => {
  if (!eventName || typeof eventName !== "string") throw new TypeError("Event name must be a non-empty string");
  return true;
};
FooterEventBus.prototype._validateCallback = (callback) => {
  if (typeof callback !== "function") throw new TypeError("Callback must be a function");
  return true;
};
FooterEventBus.prototype.on = function(eventName, callback, options) {
  const self = this;
  options = options || {};
  if (this.isDestroyed) {
    _log.warn("Bus destroyed - on() ignored");
    return () => {
    };
  }
  this._validateEventName(eventName);
  this._validateCallback(callback);
  if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
  const arr = this.listeners.get(eventName);
  let existing = null;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].callback === callback) {
      existing = arr[i];
      break;
    }
  }
  if (existing) {
    _log.debug(`Duplicate listener ignored: ${eventName}`);
    return () => {
      self.off(eventName, callback);
    };
  }
  const listener = {
    callback,
    once: options.once || false,
    priority: options.priority || 0,
    id: `${eventName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    registeredAt: Date.now()
  };
  this.listeners.get(eventName).push(listener);
  this.listeners.get(eventName).sort((a, b) => b.priority - a.priority);
  this._metrics.totalListeners++;
  _log.debug(`Listener registered: ${eventName}`);
  return () => {
    self.off(eventName, callback);
  };
};
FooterEventBus.prototype.once = function(eventName, callback, options) {
  options = options || {};
  return this.on(eventName, callback, Object.assign({}, options, { once: true }));
};
FooterEventBus.prototype.off = function(eventName, callback) {
  if (this.isDestroyed) return false;
  if (!this.listeners.has(eventName)) return false;
  const callbacks = this.listeners.get(eventName);
  let index = -1;
  for (let i = 0; i < callbacks.length; i++) {
    if (callbacks[i].callback === callback) {
      index = i;
      break;
    }
  }
  if (index > -1) {
    callbacks.splice(index, 1);
    if (callbacks.length === 0) this.listeners.delete(eventName);
    _log.debug(`Listener removed: ${eventName}`);
    return true;
  }
  return false;
};
FooterEventBus.prototype.emit = function(eventName, data) {
  const self = this;
  data = data || {};
  if (this.isDestroyed) {
    _log.warn("Bus destroyed - emit() ignored");
    return 0;
  }
  this._validateEventName(eventName);
  if (this.circuitBreaker.isOpen) {
    _log.warn(`Circuit breaker open - emit blocked: ${eventName}`);
    return 0;
  }
  const timestamp = Date.now();
  this._metrics.lastEventTime = timestamp;
  this._metrics.totalEmitted++;
  this._addToHistory({ eventName, data, timestamp });
  if (!this.listeners.has(eventName)) {
    _log.debug(`Event without listeners: ${eventName}`);
    return 0;
  }
  const listeners = this.listeners.get(eventName).slice();
  let executedCount = 0;
  for (let i = 0; i < listeners.length; i++) {
    ((listener) => {
      try {
        Promise.resolve().then(() => {
          listener.callback(Object.assign({}, data, { _meta: { eventName, timestamp, instanceId: self.instanceId, listenerId: listener.id } }));
        }).catch((error) => {
          self._handleListenerError(error);
        });
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
FooterEventBus.prototype._handleListenerError = function(error) {
  this.circuitBreaker.failures++;
  this.circuitBreaker.lastFailureTime = Date.now();
  if (this.circuitBreaker.failures >= this.circuitBreaker.maxFailures) {
    this.circuitBreaker.isOpen = true;
    _log.error(`Circuit breaker OPENED after ${this.circuitBreaker.failures} failures`);
  }
};
FooterEventBus.prototype._addToHistory = function(event) {
  this.eventHistory.push(event);
  if (this.eventHistory.length > this.maxHistorySize) this.eventHistory.shift();
};
FooterEventBus.prototype.getHistory = function(eventName) {
  if (eventName) {
    const result = [];
    for (let i = 0; i < this.eventHistory.length; i++) {
      if (this.eventHistory[i].eventName === eventName) result.push(this.eventHistory[i]);
    }
    return result;
  }
  return this.eventHistory.slice();
};
FooterEventBus.prototype.clearHistory = function() {
  this.eventHistory = [];
};
FooterEventBus.prototype.clear = function() {
  this.listeners.clear();
  this._metrics.totalListeners = 0;
  _log.info("All listeners removed");
};
FooterEventBus.prototype.clearAll = function() {
  this.clear();
  this.clearHistory();
};
FooterEventBus.prototype.listenerCount = function(eventName) {
  const arr = this.listeners.get(eventName);
  return arr ? arr.length : 0;
};
FooterEventBus.prototype.getRegisteredEvents = function() {
  return Array.from(this.listeners.keys());
};
FooterEventBus.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, {
    activeListeners: this.listeners.size,
    historySize: this.eventHistory.length,
    circuitBreakerStatus: this.circuitBreaker.isOpen ? "OPEN" : "CLOSED",
    circuitBreakerFailures: this.circuitBreaker.failures,
    isHealthy: !this.circuitBreaker.isOpen && !this.isDestroyed
  });
};
FooterEventBus.prototype.resetMetrics = function() {
  const self = this;
  const keys = Object.keys(this._metrics);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    self._metrics[k] = typeof self._metrics[k] === "number" ? 0 : null;
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
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  const issues = [];
  for (let j = 0; j < checkKeys.length; j++) {
    if (!checks[checkKeys[j]]) issues.push(checkKeys[j]);
  }
  return {
    status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    issues,
    version: VERSION,
    moduleId: MODULE_ID,
    instanceId: this.instanceId,
    isolation: "FULL",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
FooterEventBus.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    instanceId: this.instanceId,
    isolation: "FULL",
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
  _log.info("FooterEventBus destroyed");
};
let _instance = null;
function getInstance() {
  if (!_instance) _instance = new FooterEventBus("footer-singleton");
  return _instance;
}
function createInstance(instanceId) {
  return new FooterEventBus(instanceId);
}
function emit(event, data) {
  return getInstance().emit(event, data);
}
function on(event, callback, options) {
  return getInstance().on(event, callback, options);
}
function once(event, callback, options) {
  return getInstance().once(event, callback, options);
}
function off(event, callback) {
  return getInstance().off(event, callback);
}
function clear() {
  return getInstance().clear();
}
function clearAll() {
  return getInstance().clearAll();
}
function getEventBus() {
  return getInstance();
}
function isAvailable() {
  return !!getInstance();
}
function info() {
  return getInstance().info();
}
function healthCheck() {
  return getInstance().healthCheck();
}
function emitGlobalAction(actionId, meta) {
  meta = meta || {};
  const bus = _getPort("eventBus");
  if (!bus || !bus.emit) {
    _log.warn("Global EventBus not available for ui:action");
    return false;
  }
  bus.emit(UI_EVENTS.ACTION, { actionId, source: MODULE_ID, timestamp: Date.now(), meta });
  _log.debug(`ui:action emitted to Global: ${actionId}`);
  return true;
}
var event_bus_local_default = {
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
export {
  FooterEventBus,
  MODULE_ID,
  VERSION,
  clear,
  clearAll,
  createInstance,
  event_bus_local_default as default,
  emit,
  emitGlobalAction,
  getEventBus,
  getInstance,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isAvailable,
  off,
  on,
  once
};
