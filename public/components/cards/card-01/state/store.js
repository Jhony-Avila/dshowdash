import { STATES } from "../core/constants.js";
const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-01.state.store";
function CardState(cardId) {
  this.cardId = cardId;
  this.state = STATES.IDLE;
  this.data = null;
  this.error = null;
  this.locked = false;
  this._listeners = [];
}
CardState.prototype.withLock = function(operation, callback) {
  const self = this;
  if (self.locked) {
    return Promise.resolve();
  }
  self.locked = true;
  return Promise.resolve().then(callback).finally(() => {
    self.locked = false;
  });
};
CardState.prototype.setState = function(newState, data) {
  const oldState = this.state;
  this.state = newState;
  if (newState === STATES.SUCCESS) {
    this.data = data;
    this.error = null;
  } else if (newState === STATES.ERROR) {
    this.error = data;
  }
  this._notify({ oldState, newState, data });
};
CardState.prototype.is = function(state) {
  return this.state === state;
};
CardState.prototype.isLoading = function() {
  return this.state === STATES.LOADING;
};
CardState.prototype.isSuccess = function() {
  return this.state === STATES.SUCCESS;
};
CardState.prototype.isError = function() {
  return this.state === STATES.ERROR;
};
CardState.prototype.isPaused = function() {
  return this.state === STATES.PAUSED;
};
CardState.prototype.isIdle = function() {
  return this.state === STATES.IDLE;
};
CardState.prototype.getState = function() {
  return { cardId: this.cardId, state: this.state, data: this.data, error: this.error, locked: this.locked };
};
CardState.prototype.reset = function() {
  this.state = STATES.IDLE;
  this.data = null;
  this.error = null;
  this.locked = false;
  this._notify({ reset: true });
};
CardState.prototype.subscribe = function(fn) {
  const self = this;
  this._listeners.push(fn);
  return () => {
    self._listeners = self._listeners.filter((l) => l !== fn);
  };
};
CardState.prototype._notify = function(event) {
  const self = this;
  this._listeners.forEach((fn) => {
    try {
      fn(self.getState(), event);
    } catch (e) {
    }
  });
};
CardState.prototype.destroy = function() {
  this._listeners = [];
  this.state = STATES.IDLE;
  this.data = null;
  this.error = null;
  this.locked = false;
};
function createStore(cardId) {
  return new CardState(cardId);
}
function healthCheck() {
  const checks = { createStoreReady: typeof createStore === "function", cardStateReady: typeof CardState === "function" };
  const allOk = Object.values(checks).every(Boolean);
  return { status: allOk ? "HEALTHY" : "DEGRADED", checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["CardState", "createStore"],
    timestamp: Date.now()
  };
}
var store_default = { CardState, createStore };
export {
  CardState,
  MODULE_ID,
  VERSION,
  createStore,
  store_default as default,
  healthCheck,
  info
};
