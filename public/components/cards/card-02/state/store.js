import { STATES } from "../core/constants.js";
const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-02.state.store";
class CardState {
  cardId;
  state;
  data;
  error;
  locked;
  _listeners;
  constructor(cardId) {
    this.cardId = cardId;
    this.state = STATES.IDLE;
    this.data = null;
    this.error = null;
    this.locked = false;
    this._listeners = /* @__PURE__ */ new Set();
  }
  withLock(operation, callback) {
    if (this.locked) return Promise.resolve();
    this.locked = true;
    return Promise.resolve().then(callback).finally(() => {
      this.locked = false;
    });
  }
  setState(newState, data) {
    const oldState = this.state;
    this.state = newState;
    if (newState === STATES.SUCCESS) {
      this.data = data;
      this.error = null;
    } else if (newState === STATES.ERROR) {
      this.error = data;
    }
    this._notify({ oldState, newState, data });
  }
  getState() {
    return { cardId: this.cardId, state: this.state, data: this.data, error: this.error, locked: this.locked };
  }
  is(state) {
    return this.state === state;
  }
  isLoading() {
    return this.state === STATES.LOADING;
  }
  isSuccess() {
    return this.state === STATES.SUCCESS;
  }
  isError() {
    return this.state === STATES.ERROR;
  }
  isPaused() {
    return this.state === STATES.PAUSED;
  }
  isIdle() {
    return this.state === STATES.IDLE;
  }
  reset() {
    this.state = STATES.IDLE;
    this.data = null;
    this.error = null;
    this.locked = false;
    this._notify({ reset: true });
  }
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  _notify(event) {
    this._listeners.forEach((fn) => {
      try {
        fn(this.getState(), event);
      } catch {
      }
    });
  }
  destroy() {
    this._listeners.clear();
    this.state = STATES.IDLE;
    this.data = null;
    this.error = null;
    this.locked = false;
  }
}
const createStore = (cardId) => new CardState(cardId);
function healthCheck() {
  const checks = { createStoreReady: typeof createStore === "function", cardStateReady: typeof CardState === "function" };
  const allOk = Object.values(checks).every(Boolean);
  return { status: allOk ? "HEALTHY" : "DEGRADED", checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
const info = () => ({ moduleId: MODULE_ID, version: VERSION, exports: ["CardState", "createStore"], timestamp: Date.now() });
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
