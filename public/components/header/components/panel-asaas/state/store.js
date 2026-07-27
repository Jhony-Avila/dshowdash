const MODULE_ID = "header-panel-asaas-state-store";
import { VERSION } from "/core/version.js";
let _metrics = { gets: 0, sets: 0, subscriptions: 0 };
class StateStore {
  constructor(initial = {}) {
    this._state = { ...initial };
    this._listeners = /* @__PURE__ */ new Set();
  }
  getState() {
    _metrics.gets++;
    return { ...this._state };
  }
  // @ts-expect-error TS migration - TS2698
  setState(partial) {
    _metrics.sets++;
    this._state = { ...this._state, ...partial };
    this._notify();
  }
  subscribe(fn) {
    _metrics.subscriptions++;
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  _notify() {
    this._listeners.forEach((fn) => fn(this._state));
  }
  getMetrics() {
    return { ..._metrics, listeners: this._listeners.size };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, metrics: this.getMetrics() };
  }
  healthCheck() {
    return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { storeReady: true }, metrics: this.getMetrics() };
  }
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: true ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { storeReady: true } };
}
export {
  MODULE_ID,
  StateStore,
  VERSION,
  getMetrics,
  healthCheck,
  info
};
