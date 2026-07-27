import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-ES6";
const MODULE_ID = "header.components._base.component-factory";
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
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now(), moduleId: MODULE_ID });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class BaseComponent {
  constructor(options = {}) {
    this.container = options.container || null;
    this.logger = options.logger || null;
    this.telemetry = options.telemetry || null;
    this.eventBus = options.eventBus || _getPort("eventBus");
    this.config = options.config || {};
    this.mounted = false;
    this.element = null;
    this.cleanups = [];
    this._debug = false;
    this._metrics = { mountCount: 0, unmountCount: 0, cleanupCount: 0, lastMountAt: null, lastUnmountAt: null };
  }
  _log(level, ...args) {
    if (!this._debug && level === "debug") return;
    _log(level, ...args);
  }
  mount(container) {
    if (this.mounted) {
      this._log("warn", `[${this.constructor.name}] Already mounted`);
      return this;
    }
    this.container = container || this.container;
    if (!this.container) throw new Error(`[${this.constructor.name}] Container required`);
    this.mounted = true;
    this._metrics.mountCount++;
    this._metrics.lastMountAt = Date.now();
    this._log("debug", `[${this.constructor.name}] Mounted`);
    return this;
  }
  unmount() {
    if (!this.mounted) return;
    this.cleanups.forEach((fn) => {
      try {
        fn();
        this._metrics.cleanupCount++;
      } catch (e) {
        this._log("error", "Cleanup error:", e);
      }
    });
    this.cleanups = [];
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.mounted = false;
    this._metrics.unmountCount++;
    this._metrics.lastUnmountAt = Date.now();
    this._log("debug", `[${this.constructor.name}] Unmounted`);
  }
  destroy() {
    this.unmount();
    this.container = null;
    this.logger = null;
    this.telemetry = null;
    this.eventBus = null;
    this._log("debug", `[${this.constructor.name}] Destroyed`);
  }
  addCleanup(fn) {
    if (typeof fn === "function") this.cleanups.push(fn);
  }
  getState() {
    return { mounted: this.mounted, cleanupsPending: this.cleanups.length };
  }
  healthCheck() {
    const ps = Ports.snapshot();
    const checks = { hasContainer: !!this.container || !this.mounted, isMounted: this.mounted, noOrphanCleanups: this.cleanups.length < 50, portsInitialized: ps._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, componentName: this.constructor.name, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    const ps = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, componentName: this.constructor.name, state: this.getState(), metrics: this._metrics, portsInitialized: ps._initialized, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, cleanupCount: 0, lastMountAt: null, lastUnmountAt: null };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  static getLogs() {
    return [..._logBuffer];
  }
}
function createComponent(ComponentClass, options) {
  return new ComponentClass(options);
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var component_factory_default = BaseComponent;
export {
  BaseComponent,
  MODULE_ID,
  VERSION,
  createComponent,
  component_factory_default as default,
  getLogs,
  getPorts,
  injectPorts,
  setDebug
};
