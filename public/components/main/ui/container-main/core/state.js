import { CONTAINER_MAIN_EVENTS } from "./constants.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-main:state";
function createStateProxy(initialState, containerId, onStateChange) {
  const state = { ...initialState };
  return new Proxy(state, {
    set(target, prop, value) {
      const key = String(prop);
      const oldValue = target[key];
      target[key] = value;
      if (oldValue !== value && typeof onStateChange === "function") {
        onStateChange(key, value, oldValue, containerId);
      }
      return true;
    }
  });
}
function createStateEmitter(eventBridge, containerId) {
  return function emitStateChanged(state) {
    eventBridge.emit(CONTAINER_MAIN_EVENTS.STATE_CHANGED, {
      containerId,
      state: { mounted: state.mounted || false, collapsed: state.collapsed || false, fullscreen: state.fullscreen || false, minimized: state.minimized || false, loading: state.loading || false, attachMode: state.attachMode || false }
    });
  };
}
function getInitialState(isAttachMode = false) {
  return { mounted: false, collapsed: false, fullscreen: false, minimized: false, loading: false, error: null, attachMode: isAttachMode };
}
function healthCheck() {
  const checks = { proxySupported: typeof Proxy !== "undefined", stateReady: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, proxySupported: typeof Proxy !== "undefined", initialStateKeys: Object.keys(getInitialState()) };
}
export {
  MODULE_ID,
  VERSION,
  createStateEmitter,
  createStateProxy,
  getInitialState,
  healthCheck,
  info
};
