import { createStatePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-datahub/state/store";
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class StateStore {
  constructor() {
    this.state = { datasets: [], connections: [], loading: false, error: null, activeDataset: null };
    this.listeners = /* @__PURE__ */ new Set();
    _initPorts();
  }
  getState() {
    return { ...this.state };
  }
  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
  setDatasets(datasets) {
    this.setState({ datasets, loading: false, error: null });
  }
  setConnections(connections) {
    this.setState({ connections });
  }
  setLoading(loading) {
    this.setState({ loading });
  }
  setError(error) {
    this.setState({ error, loading: false });
  }
  setActiveDataset(dataset) {
    this.setState({ activeDataset: dataset });
  }
  reset() {
    this.state = { datasets: [], connections: [], loading: false, error: null, activeDataset: null };
    this.notify();
  }
  healthCheck() {
    return { status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, state: { datasetCount: this.state.datasets.length, connectionCount: this.state.connections.length, loading: this.state.loading }, portsInitialized: Ports.snapshot()._initialized };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized };
  }
}
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const store = new StateStore();
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  store
};
