import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator-manager.state.store";
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
function _debug() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug;
}
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
}
const initialState = { triggers: [], rules: [], flags: [], selectedTab: "triggers", editingItem: null, isLoading: false, error: null, searchTerm: "", filterComponent: "all" };
let _state = Object.assign({}, initialState);
let _subscribers = [];
function _notify() {
  _subscribers.forEach((fn) => {
    try {
      fn(_state);
    } catch (e) {
      _log("error", "Subscriber error:", e.message);
    }
  });
}
const state = {
  init() {
    _initPorts();
    _state = Object.assign({}, initialState);
    _subscribers = [];
  },
  getState() {
    return Object.assign({}, _state);
  },
  setState(partial) {
    _state = Object.assign({}, _state, partial);
    _notify();
  },
  subscribe(fn) {
    _subscribers.push(fn);
    return () => {
      _subscribers = _subscribers.filter((s) => s !== fn);
    };
  },
  reset() {
    _state = Object.assign({}, initialState);
    _notify();
  },
  setTriggers(triggers) {
    this.setState({ triggers, isLoading: false });
  },
  setRules(rules) {
    this.setState({ rules, isLoading: false });
  },
  setFlags(flags) {
    this.setState({ flags, isLoading: false });
  },
  setTab(tab) {
    this.setState({ selectedTab: tab });
  },
  setEditing(item) {
    this.setState({ editingItem: item });
  },
  clearEditing() {
    this.setState({ editingItem: null });
  },
  setLoading(loading) {
    this.setState({ isLoading: loading });
  },
  setError(error) {
    this.setState({ error, isLoading: false });
  },
  setSearch(term) {
    this.setState({ searchTerm: term });
  },
  setFilter(component) {
    this.setState({ filterComponent: component });
  },
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { stateReady: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  },
  info() {
    return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: state.healthCheck() };
  }
};
var store_default = state;
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  getPorts,
  injectPorts,
  state
};
