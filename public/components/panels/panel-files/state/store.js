import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-files.state.store";
const VERSION = "9.3.0-P2-ENTERPRISE";
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
class StateStore {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = [];
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }
  getState() {
    return { ...this.state };
  }
  setState(updates) {
    const prev = this.getState();
    this.state = { ...this.state, ...updates };
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.subscribers.forEach((s) => {
      try {
        s(this.state, prev);
        this._metrics.notifyCount++;
      } catch (e) {
        _getPort("logger")?.error(`[${MODULE_ID}] Subscriber error:`, e);
      }
    });
  }
  subscribe(s) {
    this.subscribers.push(s);
    return () => {
      const i = this.subscribers.indexOf(s);
      if (i > -1) this.subscribers.splice(i, 1);
    };
  }
  reset(initialState = {}) {
    this.state = { ...initialState };
  }
  healthCheck() {
    const checks = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers), portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "healthy" : "degraded", score: passed, maxScore: 3, checks, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, subscriberCount: this.subscribers.length, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
const store = new StateStore();
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getPorts,
  injectPorts,
  store
};
