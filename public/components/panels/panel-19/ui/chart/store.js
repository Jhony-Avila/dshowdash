class ChartStore {
  constructor() {
    this._state = { loading: false, error: null, data: null, dataHash: null };
    this._listeners = /* @__PURE__ */ new Set();
    this._pending = false;
  }
  _hash(data) {
    if (!data) return null;
    try {
      return JSON.stringify(data);
    } catch {
      return null;
    }
  }
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  _notify() {
    if (this._pending) return;
    this._pending = true;
    queueMicrotask(() => {
      this._pending = false;
      this._listeners.forEach((fn) => {
        try {
          fn(this._state);
        } catch {
        }
      });
    });
  }
  getState() {
    return this._state;
  }
  hasData() {
    return this._state.data !== null;
  }
  hasError() {
    return this._state.error !== null;
  }
  getError() {
    return this._state.error;
  }
  setLoading(loading) {
    if (this._state.data && loading) return;
    this._state.loading = loading;
    this._notify();
  }
  setError(error) {
    this._state = { ...this._state, error, loading: false };
    this._notify();
  }
  setData(data) {
    const hash = this._hash(data);
    if (hash === this._state.dataHash) return;
    this._state = { loading: false, error: null, data, dataHash: hash };
    this._notify();
  }
  reset() {
    this._state = { loading: false, error: null, data: null, dataHash: null };
    this._listeners.clear();
  }
}
var store_default = ChartStore;
const MODULE_ID = "panels-ui-chart-store";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true } };
}
export {
  ChartStore,
  MODULE_ID,
  VERSION,
  store_default as default,
  healthCheck,
  info
};
