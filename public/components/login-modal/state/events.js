import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-P17WI";
const MODULE_ID = "login-modal-eventbus";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level) {
  const logger = _getPort("logger");
  if (!logger) return;
  const args = Array.prototype.slice.call(arguments, 1);
  if (level === "error") {
    if (logger.error) logger.error(...["[login-eventbus]"].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...["[login-eventbus]"].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...["[login-eventbus]"].concat(args));
};
function EventBus(config) {
  if (!config) config = {};
  this.namespace = config.namespace || "login-modal";
  this.debug = config.debug || false;
  this.listeners = /* @__PURE__ */ new Map();
  this.history = [];
  this.maxHistory = config.maxHistory || 50;
  this._metrics = { emits: 0, subscriptions: 0, unsubscriptions: 0 };
  _initPorts();
}
EventBus.prototype.on = function(event, callback) {
  this._metrics.subscriptions++;
  const key = this._getKey(event);
  if (!this.listeners.has(key)) this.listeners.set(key, /* @__PURE__ */ new Set());
  this.listeners.get(key).add(callback);
  const self = this;
  return () => {
    self.off(event, callback);
  };
};
EventBus.prototype.off = function(event, callback) {
  this._metrics.unsubscriptions++;
  const key = this._getKey(event);
  const listeners = this.listeners.get(key);
  if (listeners) listeners.delete(callback);
};
EventBus.prototype.emit = function(event, data) {
  if (!data) data = {};
  this._metrics.emits++;
  const key = this._getKey(event);
  const payload = { event, data, timestamp: Date.now(), namespace: this.namespace };
  this._recordHistory(payload);
  const listeners = this.listeners.get(key);
  if (listeners) {
    listeners.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        _log("error", `Erro em listener ${event}:`, error);
      }
    });
  }
  if (this.debug) _log("info", `Evento emitido: ${event}`, data);
};
EventBus.prototype.once = function(event, callback) {
  const self = this;
  const wrapper = (payload) => {
    self.off(event, wrapper);
    callback(payload);
  };
  return this.on(event, wrapper);
};
EventBus.prototype.clear = function() {
  this.listeners.clear();
  this.history = [];
  _log("info", "EventBus limpo");
};
EventBus.prototype._getKey = function(event) {
  return `${this.namespace}:${event}`;
};
EventBus.prototype._recordHistory = function(payload) {
  this.history.push(payload);
  if (this.history.length > this.maxHistory) this.history.shift();
};
EventBus.prototype.getHistory = function() {
  return this.history.slice();
};
EventBus.prototype.getListenerCount = function(event) {
  if (event) {
    const key = this._getKey(event);
    const set = this.listeners.get(key);
    return set ? set.size : 0;
  }
  let total = 0;
  this.listeners.forEach((set) => {
    total += set.size;
  });
  return total;
};
EventBus.prototype.getEventNames = function() {
  const names = [];
  this.listeners.forEach((set, key) => {
    names.push(key);
  });
  return names;
};
EventBus.prototype.getStatus = function() {
  return { namespace: this.namespace, debug: this.debug, totalListeners: this.getListenerCount(), historySize: this.history.length, metrics: Object.assign({}, this._metrics) };
};
EventBus.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, namespace: this.namespace, portsInitialized: Ports.isInitialized(), status: this.getStatus(), timestamp: Date.now() };
};
EventBus.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const checks = { hasNamespace: !!this.namespace, lowHistorySize: this.history.length <= this.maxHistory, noMemoryLeak: this.getListenerCount() < 1e3, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : "DEGRADED", score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var events_default = EventBus;
let _instance = null;
function getEventBus(config) {
  if (!_instance) _instance = new EventBus(config);
  return _instance;
}
function resetEventBus() {
  _instance = null;
}
export {
  EventBus,
  MODULE_ID,
  VERSION,
  events_default as default,
  getEventBus,
  getPorts,
  injectPorts,
  resetEventBus
};
