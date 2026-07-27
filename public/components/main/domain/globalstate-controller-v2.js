import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "main-globalstate-v2";
class GlobalStateControllerV2 {
  constructor(context = {}) {
    this._statePort = context.ports?.state || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._slices = /* @__PURE__ */ new Map();
    this._subscribers = /* @__PURE__ */ new Map();
    this._metrics = { slicesCreated: 0, dispatches: 0 };
  }
  createSlice(name, initialState = {}, reducers = {}) {
    if (this._slices.has(name)) return this._slices.get(name);
    const slice = { name, state: { ...initialState }, reducers, createdAt: Date.now() };
    this._slices.set(name, slice);
    this._subscribers.set(name, /* @__PURE__ */ new Set());
    this._metrics.slicesCreated++;
    this._telemetry?.track?.(MAIN_EVENTS.GLOBALSTATE_SLICE_CREATED, { name });
    this._emit(MAIN_EVENTS.GLOBALSTATE_SLICE_CREATED, { name });
    return {
      getState: () => ({ ...slice.state }),
      dispatch: (action) => this._dispatchToSlice(name, action),
      subscribe: (handler) => this._subscribeToSlice(name, handler)
    };
  }
  _dispatchToSlice(sliceName, action) {
    const slice = this._slices.get(sliceName);
    if (!slice) return;
    const reducer = slice.reducers[action.type];
    if (reducer) {
      const prevState = { ...slice.state };
      slice.state = reducer(slice.state, action);
      this._notifySubscribers(sliceName, slice.state, prevState);
      this._metrics.dispatches++;
      this._telemetry?.track?.(MAIN_EVENTS.GLOBALSTATE_DISPATCH, { slice: sliceName, action: action.type });
    }
  }
  _subscribeToSlice(sliceName, handler) {
    const subscribers = this._subscribers.get(sliceName);
    if (!subscribers || typeof handler !== "function") return () => {
    };
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }
  _notifySubscribers(sliceName, newState, prevState) {
    const subscribers = this._subscribers.get(sliceName);
    if (!subscribers) return;
    subscribers.forEach((handler) => {
      try {
        handler(newState, prevState);
      } catch (e) {
      }
    });
  }
  select(selectorFn) {
    if (typeof selectorFn !== "function") return null;
    const allState = {};
    this._slices.forEach((slice, name) => {
      allState[name] = { ...slice.state };
    });
    const legacyState = this._statePort?.getState?.() || {};
    return selectorFn({ ...legacyState, slices: allState });
  }
  dispatch(action) {
    if (action?.slice) this._dispatchToSlice(action.slice, action);
  }
  subscribe(selector, handler) {
    if (typeof selector === "string") return this._subscribeToSlice(selector, handler);
    return () => {
    };
  }
  getSlice(name) {
    return this._slices.get(name) || null;
  }
  getAllSlices() {
    return Array.from(this._slices.keys());
  }
  getMetrics() {
    return { ...this._metrics };
  }
  syncWithLegacy(key, sliceName) {
    if (!this._statePort) return;
    const legacyValue = this._statePort.get?.(key);
    const slice = this._slices.get(sliceName);
    if (slice && legacyValue !== void 0) slice.state = { ...slice.state, [key]: legacyValue };
  }
  _emit(event, data = {}) {
    this._events?.emit?.(event, data);
  }
  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      sliceCount: this._slices.size,
      slices: this.getAllSlices(),
      metrics: this.getMetrics()
    };
  }
  healthCheck() {
    const hasStatePort = !!this._statePort;
    const hasEvents = !!this._events;
    const subscriberCount = Array.from(this._subscribers.values()).reduce((acc, set) => acc + set.size, 0);
    let status = "HEALTHY";
    if (!hasStatePort && this._slices.size === 0) status = "DEGRADED";
    return {
      status,
      version: VERSION,
      moduleId: MODULE_ID,
      checks: {
        hasStatePort,
        hasEvents,
        hasTelemetry: !!this._telemetry,
        sliceCount: this._slices.size,
        subscriberCount
      },
      metrics: this.getMetrics()
    };
  }
}
function createGlobalStateControllerV2(context) {
  return new GlobalStateControllerV2(context);
}
var globalstate_controller_v2_default = { GlobalStateControllerV2, createGlobalStateControllerV2, VERSION, MODULE_ID };
export {
  GlobalStateControllerV2,
  MODULE_ID,
  VERSION,
  createGlobalStateControllerV2,
  globalstate_controller_v2_default as default
};
