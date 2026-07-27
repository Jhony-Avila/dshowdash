const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-10-store";
const MAX_HISTORY = 10;
class StateStore {
  constructor(logger) {
    this.logger = logger;
    this.state = { current: "IDLE", loading: false, error: null, data: null, lastUpdate: null, refreshCount: 0, errorCount: 0 };
    this.listeners = [];
    this.history = [];
    this._previousData = null;
  }
  subscribe(listener) {
    if (typeof listener !== "function") {
      this.logger?.warn?.("store.subscribe: listener must be function");
      return () => {
      };
    }
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx > -1) this.listeners.splice(idx, 1);
    };
  }
  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.state);
      } catch (e) {
        this.logger?.error?.("store.notify", { error: e.message });
      }
    });
  }
  setState(key, value) {
    const prevValue = this.state[key];
    if (prevValue === value) return;
    this._saveHistory(`SET_${key.toUpperCase()}`);
    this.state[key] = value;
    this.notify();
  }
  setLoading(loading) {
    this.setState("loading", loading);
  }
  setError(error) {
    this._saveHistory("SET_ERROR");
    this.state.error = error;
    this.state.loading = false;
    this.state.errorCount++;
    this.notify();
  }
  setData(data) {
    this._saveHistory("SET_DATA");
    this._previousData = this.state.data;
    this.state.data = data;
    this.state.error = null;
    this.state.loading = false;
    this.state.lastUpdate = Date.now();
    this.state.refreshCount++;
    this.notify();
  }
  setCurrent(current) {
    this.setState("current", current);
  }
  select(selector) {
    if (typeof selector === "function") return selector(this.state);
    if (typeof selector === "string") return this.state[selector];
    return null;
  }
  getData() {
    return this.state.data;
  }
  getError() {
    return this.state.error;
  }
  isLoading() {
    return this.state.loading;
  }
  getLastUpdate() {
    return this.state.lastUpdate;
  }
  getPreviousData() {
    return this._previousData;
  }
  hasData() {
    return this.state.data !== null;
  }
  getCPU() {
    return this.state.data?.local?.cpu_percent ?? null;
  }
  getRAM() {
    return this.state.data?.local?.ram_percent ?? null;
  }
  getDisk() {
    return this.state.data?.local?.disk_percent ?? null;
  }
  getUptime() {
    const local = this.state.data?.local;
    if (!local) return null;
    return { days: local.uptime_days, hours: local.uptime_hours, minutes: local.uptime_minutes, seconds: local.uptime_seconds, text: local.uptime_text };
  }
  getServerStatus() {
    return this.state.data?.status ?? "unknown";
  }
  getVMInfo() {
    const data = this.state.data;
    if (!data) return null;
    return { id: data.vm_id, state: data.vm_state, plan: data.vm_plan, cpus: data.vm_cpus, memory: data.vm_memory_mb, disk: data.vm_disk_mb, ipv4: data.vm_ipv4 };
  }
  _saveHistory(action) {
    this.history.push({ action, timestamp: Date.now(), prevState: { ...this.state } });
    if (this.history.length > MAX_HISTORY) this.history.shift();
  }
  getHistory() {
    return [...this.history];
  }
  reset() {
    this._saveHistory("RESET");
    this.state = { current: "IDLE", loading: false, error: null, data: null, lastUpdate: null, refreshCount: 0, errorCount: 0 };
    this._previousData = null;
    this.listeners = [];
    this.history = [];
  }
  getState() {
    return { ...this.state };
  }
  getStats() {
    return { refreshCount: this.state.refreshCount, errorCount: this.state.errorCount, listenersCount: this.listeners.length, historyLength: this.history.length, hasData: this.hasData(), lastUpdate: this.state.lastUpdate };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, listenersCount: this.listeners.length };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stateReady: !!this.state, listenersReady: Array.isArray(this.listeners) } };
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { classReady: typeof StateStore === "function" } };
}
const store = new StateStore();
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  healthCheck,
  info,
  store
};
