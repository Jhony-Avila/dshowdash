import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator.bus.event-bus-adapter";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args));
};
function EventBusAdapter() {
  this.handlers = /* @__PURE__ */ new Map();
  this.eventLog = [];
  this.maxLogSize = 100;
  this.initialized = false;
  this.destroyed = false;
}
EventBusAdapter.prototype.getVersion = () => VERSION;
EventBusAdapter.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
EventBusAdapter.prototype.init = function() {
  if (this.initialized) return this;
  _initPorts();
  this.initialized = true;
  this.destroyed = false;
  this._logEvent("adapter:init", { version: VERSION, timestamp: Date.now() });
  return this;
};
EventBusAdapter.prototype._getGlobalBus = () => _getPort("eventBus");
EventBusAdapter.prototype._logEvent = function(event, data = {}) {
  const entry = { event, data, timestamp: Date.now() };
  this.eventLog.push(entry);
  if (this.eventLog.length > this.maxLogSize) this.eventLog.shift();
};
EventBusAdapter.prototype.emit = function(event, payload) {
  if (payload === void 0) payload = {};
  const bus = this._getGlobalBus();
  const enrichedPayload = Object.assign({}, payload, { _source: "orchestrator", _moduleId: MODULE_ID, _timestamp: Date.now() });
  this._logEvent(event, enrichedPayload);
  if (bus && typeof bus.emit === "function") {
    bus.emit(event, enrichedPayload);
    return true;
  }
  _log("info", `Global EventBus nao disponivel para: ${event} - evento local registrado`);
  return false;
};
EventBusAdapter.prototype.on = function(event, handler) {
  if (typeof handler !== "function") {
    _log("error", "Handler deve ser funcao");
    return () => {
    };
  }
  const self = this;
  const bus = this._getGlobalBus();
  if (!this.handlers.has(event)) this.handlers.set(event, /* @__PURE__ */ new Set());
  this.handlers.get(event).add(handler);
  if (bus && typeof bus.on === "function") bus.on(event, handler);
  this._logEvent("adapter:subscribed", { event });
  return () => {
    self.off(event, handler);
  };
};
EventBusAdapter.prototype.off = function(event, handler) {
  const bus = this._getGlobalBus();
  if (this.handlers.has(event)) this.handlers.get(event).delete(handler);
  if (bus && typeof bus.off === "function") bus.off(event, handler);
  this._logEvent("adapter:unsubscribed", { event });
};
EventBusAdapter.prototype.once = function(event, handler) {
  const self = this;
  const wrappedHandler = (data) => {
    self.off(event, wrappedHandler);
    handler(data);
  };
  return this.on(event, wrappedHandler);
};
EventBusAdapter.prototype.removeAllListeners = function(event) {
  const self = this;
  const bus = this._getGlobalBus();
  if (event) {
    if (this.handlers.has(event)) {
      const handlers = this.handlers.get(event);
      handlers.forEach((handler) => {
        if (bus && typeof bus.off === "function") bus.off(event, handler);
      });
      this.handlers.delete(event);
    }
  } else {
    this.handlers.forEach((handlers, evt) => {
      handlers.forEach((handler) => {
        if (bus && typeof bus.off === "function") bus.off(evt, handler);
      });
    });
    this.handlers.clear();
  }
  this._logEvent("adapter:cleared", { event: event || "all" });
};
EventBusAdapter.prototype.getEventLog = function() {
  return this.eventLog.slice();
};
EventBusAdapter.prototype.getRecentEvents = function(count = 10) {
  return this.eventLog.slice(-count);
};
EventBusAdapter.prototype.getSubscribedEvents = function() {
  return Array.from(this.handlers.keys());
};
EventBusAdapter.prototype.getHandlerCount = function(event) {
  if (event) return this.handlers.has(event) ? this.handlers.get(event).size : 0;
  let total = 0;
  this.handlers.forEach((h) => {
    total += h.size;
  });
  return total;
};
EventBusAdapter.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, hasGlobalBus: !!this._getGlobalBus(), subscribedEvents: this.getSubscribedEvents().length, totalHandlers: this.getHandlerCount(), eventLogSize: this.eventLog.length, portsInitialized: Ports.isInitialized() };
};
EventBusAdapter.prototype.reset = function() {
  this.removeAllListeners();
  this.eventLog = [];
  this.destroyed = false;
};
EventBusAdapter.prototype.destroy = function() {
  this.removeAllListeners();
  this.eventLog = [];
  this.initialized = false;
  this.destroyed = true;
  this._logEvent("adapter:destroyed", {});
};
const orchestratorBus = new EventBusAdapter();
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  const logger = _getPort("logger");
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { ready: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }, timestamp: Date.now() };
}
var event_bus_adapter_default = orchestratorBus;
export {
  EventBusAdapter,
  MODULE_ID,
  VERSION,
  event_bus_adapter_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  orchestratorBus
};
