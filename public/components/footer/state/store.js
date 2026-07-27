import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.9.0-P2-ENTERPRISE";
const MODULE_ID = "footer.store";
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
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (level === "info") {
    logger.info?.(prefix, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};
let _metrics = { initCount: 0, onlineChanges: 0, tickCount: 0, errors: 0 };
class FooterStore {
  constructor() {
    this.state = {
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      lastUpdate: null,
      version: null,
      environment: null,
      mounted: false,
      sessionStart: Date.now()
    };
    this._listeners = /* @__PURE__ */ new Set();
    this._timers = /* @__PURE__ */ new Map();
    this._initialized = false;
  }
  init(config = {}) {
    if (this._initialized) return;
    _initPorts();
    _metrics.initCount++;
    const cfg = _getPort("config");
    this.state.version = config.version || cfg?.app?.version || "0.0.0";
    this.state.environment = config.environment || cfg?.app?.env || "production";
    this.state.sessionStart = Date.now();
    this._initialized = true;
    _log("info", "Store initialized");
  }
  getState() {
    return { ...this.state };
  }
  getStatus() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: this._initialized,
      state: this.getState(),
      timerCount: this._timers.size,
      subscriberCount: this._listeners.size,
      metrics: this.getMetrics(),
      timestamp: Date.now()
    };
  }
  setState(partial) {
    const prev = { ...this.state };
    this.state = { ...this.state, ...partial };
    this._notify(prev, this.state);
  }
  setOnline(online) {
    if (this.state.online !== online) {
      _metrics.onlineChanges++;
      this.setState({ online });
    }
  }
  setMounted(mounted) {
    this.setState({ mounted });
  }
  setTimer(name, timerId) {
    if (this._timers.has(name)) clearInterval(this._timers.get(name));
    this._timers.set(name, timerId);
  }
  clearTimer(name) {
    if (this._timers.has(name)) {
      clearInterval(this._timers.get(name));
      this._timers.delete(name);
    }
  }
  getSessionElapsed() {
    return Date.now() - (this.state.sessionStart || Date.now());
  }
  tick() {
    _metrics.tickCount++;
    this.setState({ lastUpdate: Date.now() });
  }
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }
  _notify(prev, next) {
    this._listeners.forEach((cb) => {
      try {
        cb(next, prev);
      } catch (e) {
        _metrics.errors++;
        _log("error", "Subscriber error:", e);
      }
    });
  }
  destroy() {
    this._timers.forEach((timerId) => clearInterval(timerId));
    this._timers.clear();
    this._listeners.clear();
    this._initialized = false;
    _log("info", "Store destroyed");
  }
  getMetrics() {
    return { ..._metrics };
  }
  info() {
    const portsSnapshot = Ports.snapshot();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      state: this.getState(),
      initialized: this._initialized,
      subscriberCount: this._listeners.size,
      timerCount: this._timers.size,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  }
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = {
      initialized: this._initialized,
      validState: !!this.state,
      lowErrors: _metrics.errors < 10,
      sessionActive: !!this.state.sessionStart,
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : "DEGRADED",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      metrics: _metrics,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }
}
const store = new FooterStore();
var store_default = FooterStore;
export {
  FooterStore,
  MODULE_ID,
  VERSION,
  store_default as default,
  getPorts,
  injectPorts,
  store
};
