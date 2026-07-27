class StateStore {
  constructor(logger) {
    this.logger = logger;
    this.state = { current: "IDLE", loading: false, error: null, data: null, lastUpdate: null };
    this.listeners = /* @__PURE__ */ new Set();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.state);
      } catch (e) {
        this.logger.error("store.notify", { error: e.message });
      }
    });
  }
  setState(key, value) {
    this.state[key] = value;
    this.notify();
  }
  setLoading(loading) {
    this.setState("loading", loading);
  }
  setError(error) {
    this.setState("error", error);
    this.setState("loading", false);
  }
  setData(data) {
    this.state = { ...this.state, data, error: null, loading: false, lastUpdate: Date.now() };
    this.notify();
  }
  reset() {
    this.state = { current: "IDLE", loading: false, error: null, data: null, lastUpdate: null };
    this.listeners.clear();
  }
}
const store = new StateStore();
var store_default = StateStore;
const MODULE_ID = "panels-panel-09-state-store";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true } };
}
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  healthCheck,
  info,
  store
};
