const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "performance-monitor-store";
let _state = { measurements: [], config: { sampleRate: 100 } };
let _subscribers = [];
function getState() {
  return { ..._state };
}
function getMeasurements() {
  return [..._state.measurements];
}
function addMeasurement(m) {
  _state.measurements.push({ ...m, timestamp: Date.now() });
  if (_state.measurements.length > 100) _state.measurements.shift();
  _notify();
}
function clear() {
  _state.measurements = [];
  _notify();
}
function subscribe(fn) {
  if (typeof fn === "function") _subscribers.push(fn);
  return () => {
    _subscribers = _subscribers.filter((s) => s !== fn);
  };
}
function _notify() {
  _subscribers.forEach((fn) => {
    try {
      fn(_state);
    } catch (e) {
    }
  });
}
function healthCheck() {
  const checks = { hasState: true, bufferHealthy: _state.measurements.length < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, measurementCount: _state.measurements.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, measurementCount: _state.measurements.length, timestamp: Date.now() };
}
const performanceStore = { getState, getMeasurements, addMeasurement, clear, subscribe, healthCheck, info };
var store_default = { getState, getMeasurements, addMeasurement, clear, subscribe, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addMeasurement,
  clear,
  store_default as default,
  getMeasurements,
  getState,
  healthCheck,
  info,
  performanceStore,
  subscribe
};
