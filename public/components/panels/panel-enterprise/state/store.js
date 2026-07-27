const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-enterprise/state/store";
let _listeners = [];
let _store = {
  mounted: false,
  loading: false,
  error: null,
  features: [],
  activeFeatures: [],
  subscription: null,
  lastUpdate: null,
  _initialized: false
};
const getState = () => ({ ..._store });
const get = (key) => key ? _store[key] : getState();
const set = (key, value) => {
  if (typeof key === "object") {
    Object.assign(_store, key);
  } else {
    _store[key] = value;
  }
  _store.lastUpdate = Date.now();
  _notify();
};
const setFeatures = (features) => {
  _store.features = features || [];
  _notify();
};
const setActiveFeatures = (features) => {
  _store.activeFeatures = features || [];
  _notify();
};
const setSubscription = (sub) => {
  _store.subscription = sub;
  _notify();
};
const isFeatureActive = (featureId) => _store.activeFeatures.includes(featureId);
const reset = () => {
  _store = { mounted: false, loading: false, error: null, features: [], activeFeatures: [], subscription: null, lastUpdate: null, _initialized: false };
  _notify();
};
const subscribe = (fn) => {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
};
const _notify = () => {
  _listeners.forEach((fn) => {
    try {
      fn(getState());
    } catch (e) {
    }
  });
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, featureCount: _store.features.length });
var store_default = { getState, get, set, setFeatures, setActiveFeatures, setSubscription, isFeatureActive, reset, subscribe };
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  get,
  getState,
  healthCheck,
  info,
  isFeatureActive,
  reset,
  set,
  setActiveFeatures,
  setFeatures,
  setSubscription,
  subscribe
};
