const MODULE_ID = "panel-16-state-store";
const VERSION = "9.3.0-P2-ENTERPRISE";
class StateStore {
  constructor(options = {}) {
    this._state = { data: null, loading: false, error: null };
    this._subscribers = [];
    this._debug = options.debug || false;
  }
  getState() {
    return { ...this._state };
  }
  getData() {
    return this._state.data;
  }
  isLoading() {
    return this._state.loading;
  }
  getError() {
    return this._state.error;
  }
  setData(data) {
    this._state.data = data;
    this._state.error = null;
    this._notify();
  }
  setLoading(loading) {
    this._state.loading = loading;
    this._notify();
  }
  setError(error) {
    this._state.error = error;
    this._state.loading = false;
    this._notify();
  }
  reset() {
    this._state = { data: null, loading: false, error: null };
    this._notify();
  }
  subscribe(callback) {
    if (typeof callback !== "function") return () => {
    };
    this._subscribers.push(callback);
    return () => {
      const idx = this._subscribers.indexOf(callback);
      if (idx > -1) this._subscribers.splice(idx, 1);
    };
  }
  _notify() {
    const state = this.getState();
    this._subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (e) {
      }
    });
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, hasData: !!this._state.data, isLoading: this._state.loading, hasError: !!this._state.error, subscriberCount: this._subscribers.length };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true } };
  }
}
var store_default = { StateStore, MODULE_ID, VERSION };
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default
};
