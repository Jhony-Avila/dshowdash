import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.6.1-P18EC";
const MODULE_ID = "sidebar._shared.base-feature";
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
class BaseFeature {
  constructor(config = {}) {
    this.moduleId = config.moduleId || "base-feature";
    this.version = config.version || VERSION;
    this._initialized = false;
    this._enabled = true;
    this._eventBus = null;
    this._container = null;
    this._cleanups = [];
    this._metrics = { calls: 0, errors: 0, lastCall: null };
  }
  init(eventBus, container) {
    if (this._initialized) return this;
    this._eventBus = eventBus;
    this._container = container;
    this._initialized = true;
    this._emit("init");
    return this;
  }
  destroy() {
    this._cleanups.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        _getPort("logger")?.warn?.(`[${this.moduleId}] cleanup error:`, e);
      }
    });
    this._cleanups = [];
    this._initialized = false;
    this._emit("destroy");
  }
  enable() {
    this._enabled = true;
    this._emit("enabled");
    return this;
  }
  disable() {
    this._enabled = false;
    this._emit("disabled");
    return this;
  }
  isEnabled() {
    return this._enabled;
  }
  addCleanup(fn) {
    if (typeof fn === "function") this._cleanups.push(fn);
  }
  _emit(event, data = {}) {
    this._eventBus?.emit?.(`sidebar:${this.moduleId}:${event}`, { moduleId: this.moduleId, timestamp: Date.now(), ...data });
  }
  _track(action) {
    this._metrics.calls++;
    this._metrics.lastCall = Date.now();
  }
  getMetrics() {
    return { ...this._metrics, cleanups: this._cleanups.length };
  }
  healthCheck() {
    return { status: this._initialized && this._enabled ? "HEALTHY" : "DEGRADED", version: this.version, moduleId: this.moduleId, checks: { initialized: this._initialized, enabled: this._enabled, hasEventBus: !!this._eventBus, hasContainer: !!this._container, cleanups: this._cleanups.length, portsInitialized: Ports.isInitialized() }, metrics: this.getMetrics() };
  }
  info() {
    return { moduleId: this.moduleId, version: this.version, initialized: this._initialized, enabled: this._enabled, metrics: this.getMetrics() };
  }
}
function getMetrics() {
  return { classAvailable: true };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { classAvailable: true, portsInitialized: Ports.isInitialized() }, metrics: getMetrics() };
}
var base_feature_default = BaseFeature;
export {
  BaseFeature,
  MODULE_ID,
  VERSION,
  base_feature_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
