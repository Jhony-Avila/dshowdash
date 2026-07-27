const MODULE_ID = "panel-04/state/store";
const VERSION = "9.3.0-P2-ENTERPRISE";
class StateStore {
  constructor(options = {}) {
    this.logger = options.logger || options;
    this.debug = options.debug || (() => false);
    this.state = {
      current: "IDLE",
      loading: false,
      error: null,
      data: null,
      lastUpdate: null,
      updateCount: 0
    };
    this.listeners = /* @__PURE__ */ new Set();
    this.stateHistory = [];
    this.maxHistory = 10;
  }
  _log(level, action, data = {}) {
    if (level === "debug" && !this.debug?.()) return;
    if (this.logger?.info) {
      const fn = this.logger[level] || this.logger.info;
      if (typeof fn === "function") fn.call(this.logger, action, data);
    }
  }
  _saveHistory() {
    this.stateHistory.push({
      timestamp: Date.now(),
      state: { ...this.state, data: "[DATA]" }
    });
    if (this.stateHistory.length > this.maxHistory) {
      this.stateHistory.shift();
    }
  }
  subscribe(listener) {
    if (typeof listener !== "function") {
      this._log("error", "store.invalid-listener", { type: typeof listener });
      return () => {
      };
    }
    this.listeners.add(listener);
    this._log("debug", "store.listener-added", { total: this.listeners.size });
    return () => {
      this.listeners.delete(listener);
      this._log("debug", "store.listener-removed", { total: this.listeners.size });
    };
  }
  notify() {
    const stateCopy = { ...this.state };
    this.listeners.forEach((fn) => {
      try {
        fn(stateCopy);
      } catch (error) {
        this._log("error", "store.notify-error", {
          error: error.message
        });
      }
    });
  }
  setState(key, value) {
    if (!Object.prototype.hasOwnProperty.call(this.state, key)) {
      this._log("warn", "store.unknown-key", { key });
    }
    const oldValue = this.state[key];
    this.state[key] = value;
    this._log("debug", "store.state-changed", {
      key,
      oldValue: typeof oldValue === "object" ? "[Object]" : oldValue,
      newValue: typeof value === "object" ? "[Object]" : value
    });
    this._saveHistory();
    this.notify();
  }
  setLoading(loading) {
    this.state.loading = Boolean(loading);
    if (loading) {
      this.state.current = "LOADING";
    }
    this.notify();
  }
  setError(error) {
    this.state.error = error;
    this.state.loading = false;
    this.state.current = "ERROR";
    this._log("warn", "store.error-set", { error });
    this._saveHistory();
    this.notify();
  }
  setData(data) {
    this.state = {
      ...this.state,
      data,
      error: null,
      loading: false,
      current: "READY",
      lastUpdate: Date.now(),
      updateCount: this.state.updateCount + 1
    };
    this._log("debug", "store.data-set", {
      dataSize: data ? JSON.stringify(data).length : 0,
      updateCount: this.state.updateCount
    });
    this._saveHistory();
    this.notify();
  }
  getState() {
    return { ...this.state };
  }
  getData() {
    return this.state.data;
  }
  isLoading() {
    return this.state.loading;
  }
  hasError() {
    return !!this.state.error;
  }
  hasData() {
    return !!this.state.data;
  }
  getHistory() {
    return [...this.stateHistory];
  }
  reset() {
    this.state = {
      current: "IDLE",
      loading: false,
      error: null,
      data: null,
      lastUpdate: null,
      updateCount: 0
    };
    this.listeners.clear();
    this.stateHistory = [];
    this._log("debug", "store.reset");
  }
  healthCheck() {
    return {
      status: "HEALTHY",
      moduleId: MODULE_ID,
      version: VERSION,
      state: this.state.current,
      listenersCount: this.listeners.size,
      hasData: this.hasData(),
      updateCount: this.state.updateCount,
      lastUpdate: this.state.lastUpdate
    };
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      current: this.state.current,
      listeners: this.listeners.size
    };
  }
}
const store = new StateStore();
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  store
};
