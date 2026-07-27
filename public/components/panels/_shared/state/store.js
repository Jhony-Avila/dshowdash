import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels._shared.state.store";
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
function StateStore(initialState, options) {
  initialState = initialState || {};
  options = options || {};
  _initPorts();
  this._state = Object.assign({}, initialState);
  this._initialState = Object.assign({}, initialState);
  this._subscribers = /* @__PURE__ */ new Set();
  this._moduleId = options.moduleId || MODULE_ID;
  this._metrics = { updateCount: 0, notifyCount: 0, subscribeCount: 0, lastUpdateAt: null };
}
StateStore.prototype.getState = function() {
  return Object.assign({}, this._state);
};
StateStore.prototype.get = function(key) {
  return this._state[key];
};
StateStore.prototype.setState = function(updates, silent) {
  const prev = this.getState();
  this._state = Object.assign({}, this._state, updates);
  this._metrics.updateCount++;
  this._metrics.lastUpdateAt = Date.now();
  if (!silent) this._notify(prev);
  return this;
};
StateStore.prototype.set = function(key, value, silent) {
  const updates = {};
  updates[key] = value;
  return this.setState(updates, silent);
};
StateStore.prototype._notify = function(prev) {
  const self = this;
  const state = this.getState();
  this._subscribers.forEach((subscriber) => {
    try {
      subscriber(state, prev);
      self._metrics.notifyCount++;
    } catch (e) {
      const logger = _getPort("logger");
      if (logger && logger.error) logger.error(`[${self._moduleId}] Subscriber error:`, e);
    }
  });
};
StateStore.prototype.subscribe = function(subscriber) {
  const self = this;
  this._subscribers.add(subscriber);
  this._metrics.subscribeCount++;
  return () => {
    self.unsubscribe(subscriber);
  };
};
StateStore.prototype.unsubscribe = function(subscriber) {
  this._subscribers.delete(subscriber);
};
StateStore.prototype.reset = function() {
  this._state = Object.assign({}, this._initialState);
  this._notify(this._state);
  return this;
};
StateStore.prototype.destroy = function() {
  this._subscribers.clear();
  this._state = {};
};
StateStore.prototype.select = function(selector) {
  return selector(this._state);
};
StateStore.prototype.healthCheck = function() {
  const checks = { hasState: this._state !== null && typeof this._state === "object", subscribersReady: this._subscribers instanceof Set, hasInitialState: this._initialState !== null, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  let total = 0;
  for (const k in checks) {
    if (checks.hasOwnProperty(k)) {
      total++;
      if (checks[k]) passed++;
    }
  }
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, subscriberCount: this._subscribers.size, version: VERSION, moduleId: this._moduleId };
};
StateStore.prototype.info = function() {
  return { version: VERSION, moduleId: this._moduleId, subscriberCount: this._subscribers.size, stateKeys: Object.keys(this._state), portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
StateStore.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
function createStore(initialState, options) {
  return new StateStore(initialState, options);
}
const store = new StateStore();
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  createStore,
  store_default as default,
  getPorts,
  injectPorts,
  store
};
