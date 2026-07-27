import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.4.0-P17WI";
const MODULE_ID = "ticker/state/store";
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
const INITIAL_STATE = Object.freeze({ news: [], status: "loading", lastUpdate: null });
const VALID_STATUSES = ["loading", "ok", "offline", "error"];
class StateStore {
  constructor(initialState = {}) {
    this._state = this._freeze({ ...INITIAL_STATE, ...initialState });
    this.listeners = [];
    this._metrics = { updateCount: 0, notifyCount: 0, rejectCount: 0, lastUpdateAt: null };
    _initPorts();
  }
  _freeze(obj) {
    if (Array.isArray(obj)) {
      return Object.freeze(obj.map((item) => typeof item === "object" ? this._freeze(item) : item));
    }
    if (obj && typeof obj === "object") {
      const o = obj;
      Object.keys(o).forEach((key) => {
        if (typeof o[key] === "object") o[key] = this._freeze(o[key]);
      });
      return Object.freeze(o);
    }
    return obj;
  }
  _validateUpdate(updates) {
    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      _log("warn", `Status inv\xE1lido rejeitado: ${updates.status}`);
      this._metrics.rejectCount++;
      return false;
    }
    if (updates.news && !Array.isArray(updates.news)) {
      _log("warn", "news deve ser array");
      this._metrics.rejectCount++;
      return false;
    }
    return true;
  }
  getState() {
    return this._state;
  }
  setState(updates) {
    if (!this._validateUpdate(updates)) return false;
    const newState = { ...this._state, ...updates };
    this._state = this._freeze(newState);
    this._notify();
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    _log("debug", "State updated:", updates);
    return true;
  }
  subscribe(listener) {
    if (typeof listener !== "function") {
      _log("warn", "Listener deve ser fun\xE7\xE3o");
      return () => {
      };
    }
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
  _notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this._state);
        this._metrics.notifyCount++;
      } catch (e) {
        _log("error", "Erro em listener:", e);
      }
    });
  }
  reset() {
    this._state = this._freeze({ ...INITIAL_STATE });
    this.listeners = [];
    _log("debug", "State reset");
  }
  select(selector) {
    try {
      return selector(this._state);
    } catch (e) {
      _log("error", "Erro em selector:", e);
      return null;
    }
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasState: !!this._state, isFrozen: Object.isFrozen(this._state), validStatus: VALID_STATUSES.includes(this._state.status), subscribersReady: Array.isArray(this.listeners), loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, newsCount: this._state.news.length, status: this._state.status, subscriberCount: this.listeners.length, isFrozen: Object.isFrozen(this._state), metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, notifyCount: 0, rejectCount: 0, lastUpdateAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getPorts,
  getVersion,
  injectPorts
};
