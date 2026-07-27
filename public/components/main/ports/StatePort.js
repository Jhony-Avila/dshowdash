const VERSION = "2.0.0-AAA-P4";
const MODULE_ID = "state-port";
function createStatePort(deps = {}) {
  const { get, set, subscribe, createSlice, select, getState } = deps;
  let _metrics = { gets: 0, sets: 0, subscribes: 0, errors: 0 };
  return {
    get(key) {
      _metrics.gets++;
      if (typeof get === "function") return get(key);
      _metrics.errors++;
      throw new Error("StatePort.get not implemented");
    },
    set(key, value) {
      _metrics.sets++;
      if (typeof set === "function") return set(key, value);
      _metrics.errors++;
      throw new Error("StatePort.set not implemented");
    },
    subscribe(key, handler) {
      _metrics.subscribes++;
      if (typeof subscribe === "function") return subscribe(key, handler);
      _metrics.errors++;
      throw new Error("StatePort.subscribe not implemented");
    },
    getState() {
      if (typeof getState === "function") return getState();
      return {};
    },
    createSlice(name, initialState, reducers) {
      if (typeof createSlice === "function") return createSlice(name, initialState, reducers);
      return null;
    },
    select(selectorFn) {
      if (typeof select === "function") return select(selectorFn);
      return null;
    },
    info() {
      return { version: VERSION, moduleId: MODULE_ID };
    },
    getMetrics() {
      return { ..._metrics };
    },
    healthCheck() {
      const hasGet = typeof get === "function";
      const hasSet = typeof set === "function";
      const hasSubscribe = typeof subscribe === "function";
      let status = "HEALTHY";
      if (!hasGet || !hasSet) status = "DEGRADED";
      if (_metrics.errors > 5) status = "DEGRADED";
      return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasGet, hasSet, hasSubscribe }, metrics: _metrics };
    }
  };
}
var StatePort_default = { createStatePort, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createStatePort,
  StatePort_default as default
};
