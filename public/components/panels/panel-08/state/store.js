import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-08.state.store";
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
const _log = (level, ...args) => {
  const L = _getPort("logger");
  if (L?.[level]) L[level](`[${MODULE_ID}]`, ...args);
};
const initialState = { mounted: false, loading: false, refreshInProgress: false, error: null, alerts: [], meta: {}, lastUpdate: null, dataHash: null, acknowledgedIds: /* @__PURE__ */ new Set() };
let state = { ...initialState, acknowledgedIds: /* @__PURE__ */ new Set() };
const listeners = /* @__PURE__ */ new Set();
let pendingNotify = false;
const hashData = (data) => {
  if (!data) return null;
  try {
    return JSON.stringify(data);
  } catch (e) {
    return null;
  }
};
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify() {
  if (pendingNotify) return;
  pendingNotify = true;
  queueMicrotask(() => {
    pendingNotify = false;
    listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {
        _log("error", "notify error", e);
      }
    });
  });
}
function dispatch(action) {
  if (action.type === "SET_LOADING") {
    if (state.alerts.length > 0 && action.payload) return;
    state = { ...state, loading: action.payload };
  } else if (action.type === "SET_REFRESH_IN_PROGRESS") {
    state = { ...state, refreshInProgress: action.payload };
  } else if (action.type === "SET_ALERTS") {
    const newHash = hashData(action.payload);
    if (newHash === state.dataHash) {
      state = { ...state, loading: false };
    } else {
      state = { ...state, alerts: action.payload || [], dataHash: newHash, loading: false, error: null };
    }
  } else if (action.type === "SET_META") {
    state = { ...state, meta: action.payload || {} };
  } else if (action.type === "SET_ERROR") {
    state = { ...state, error: action.payload, loading: false };
  } else if (action.type === "SET_LAST_REFRESH") {
    state = { ...state, lastUpdate: action.payload };
  } else if (action.type === "ACKNOWLEDGE_ALERT") {
    const newAck = new Set(state.acknowledgedIds);
    newAck.add(action.payload);
    state = { ...state, acknowledgedIds: newAck };
  } else {
    return;
  }
  notify();
}
function getState() {
  return state;
}
function getAlerts() {
  return state.alerts;
}
function getMeta() {
  return state.meta;
}
function hasData() {
  return state.alerts.length > 0;
}
function isRefreshInProgress() {
  return state.refreshInProgress;
}
function reset() {
  state = { ...initialState, acknowledgedIds: /* @__PURE__ */ new Set() };
  listeners.clear();
  pendingNotify = false;
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = { stateInitialized: !!state, listenersAvailable: !!listeners, notifyMechanismReady: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, alertsCount: state.alerts.length, listenersCount: listeners.size, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, alertsCount: state.alerts.length, listenersCount: listeners.size, hasData: hasData(), p25Compliant: true };
}
var store_default = { VERSION, MODULE_ID, subscribe, dispatch, getState, getAlerts, getMeta, hasData, isRefreshInProgress, reset, getVersion, healthCheck, info, injectPorts, getPorts };
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
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  dispatch,
  getAlerts,
  getMeta,
  getPorts,
  getState,
  getVersion,
  hasData,
  healthCheck,
  info,
  injectPorts,
  isRefreshInProgress,
  reset,
  subscribe
};
