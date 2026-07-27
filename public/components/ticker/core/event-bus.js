import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "ticker.core.event-bus";
const hasWindow = typeof window !== "undefined";
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
class TickerEventBus {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
    this._metrics = { emitCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, lastEmitAt: null };
  }
  on(event, handler) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(handler);
    this._metrics.listenerAddCount++;
    _log("debug", `Listener added: ${event}`);
  }
  off(event, handler) {
    if (!this.events.has(event)) return;
    const handlers = this.events.get(event).filter((h) => h !== handler);
    this.events.set(event, handlers);
    this._metrics.listenerRemoveCount++;
    _log("debug", `Listener removed: ${event}`);
  }
  emit(event, data) {
    if (!this.events.has(event)) return;
    this.events.get(event).forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        _log("error", `Error in handler for "${event}":`, error);
      }
    });
    this._metrics.emitCount++;
    this._metrics.lastEmitAt = Date.now();
    _log("debug", `Event emitted: ${event}`);
  }
  destroy() {
    this.events.clear();
    _log("debug", "EventBus destroyed");
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { eventsMapReady: this.events instanceof Map, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, eventCount: this.events.size, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { emitCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, lastEmitAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var event_bus_default = TickerEventBus;
export {
  MODULE_ID,
  TickerEventBus,
  VERSION,
  event_bus_default as default,
  getPorts,
  getVersion,
  injectPorts
};
