class StateStore {
  constructor(logger) {
    this.logger = logger;
    this.state = {
      current: "IDLE",
      loading: false,
      error: null,
      data: null,
      lastUpdate: null
    };
    this.listeners = /* @__PURE__ */ new Set();
  }
  // Adiciona listener reativo - retorna função de unsubscribe
  subscribe(listener) {
    if (typeof listener !== "function") {
      this.logger.error("store.invalid-listener", { type: typeof listener });
      return () => {
      };
    }
    this.listeners.add(listener);
    this.logger.debug("store.listener-added", { total: this.listeners.size });
    return () => {
      this.listeners.delete(listener);
      this.logger.debug("store.listener-removed", { total: this.listeners.size });
    };
  }
  // Notifica todos os listeners
  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn({ ...this.state });
      } catch (error) {
        this.logger.error("store.notify-error", {
          error: error.message,
          stack: error.stack
        });
      }
    });
  }
  // Atualiza estado e notifica
  setState(key, value) {
    if (!this.state.hasOwnProperty(key)) {
      this.logger.warn("store.unknown-key", { key });
    }
    const oldValue = this.state[key];
    this.state[key] = value;
    this.logger.debug("store.state-changed", {
      key,
      oldValue,
      newValue: value
    });
    this.notify();
  }
  setLoading(loading) {
    this.setState("loading", Boolean(loading));
  }
  setError(error) {
    this.state.error = error;
    this.state.loading = false;
    this.logger.warn("store.error-set", { error });
    this.notify();
  }
  // Atualiza dados + timestamp
  setData(data) {
    this.state = {
      ...this.state,
      data,
      error: null,
      loading: false,
      lastUpdate: Date.now()
    };
    this.logger.debug("store.data-set", {
      dataSize: JSON.stringify(data).length,
      timestamp: this.state.lastUpdate
    });
    this.notify();
  }
  // Retorna cópia imutável
  getState() {
    return { ...this.state };
  }
  // Limpa tudo
  reset() {
    this.state = {
      current: "IDLE",
      loading: false,
      error: null,
      data: null,
      lastUpdate: null
    };
    this.listeners.clear();
    this.logger.debug("store.reset");
  }
}
const store = new StateStore();
var store_default = StateStore;
const MODULE_ID = "panel-03/state/store";
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
