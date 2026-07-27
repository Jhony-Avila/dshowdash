import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { SHELL_EVENTS } from "/core/runtime/events/catalog/shell.events.js";
import { setPhase, setMounted, setReady, setError, getState } from "../state/store.js";
const VERSION = "5.6.2-EXPORT-FIX";
const MODULE_ID = "app-shell-lifecycle";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPortsSnapshot() {
  return Ports.snapshot();
}
const _metrics = { inits: 0, readyMarks: 0, failMarks: 0, resets: 0 };
function initialize() {
  _initPorts();
  _metrics.inits++;
  setPhase("initializing");
  return true;
}
function markMounted() {
  _initPorts();
  setMounted(true);
  setPhase("mounted");
  return true;
}
function markReady() {
  _initPorts();
  _metrics.readyMarks++;
  setReady(true);
  setPhase("ready");
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(SHELL_EVENTS.READY, { timestamp: Date.now() });
  }
  return true;
}
function markFailed(error) {
  _initPorts();
  _metrics.failMarks++;
  setError(error);
  setPhase("failed");
  return true;
}
function markUnmounting() {
  _initPorts();
  setPhase("unmounting");
  return true;
}
function markDegraded(reason) {
  _initPorts();
  setPhase("degraded");
  setError({ type: "degraded", reason });
  return true;
}
function reset() {
  _initPorts();
  _metrics.resets++;
  setPhase("idle");
  setMounted(false);
  setReady(false);
  setError(null);
  return true;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const state = getState();
  const portsSnapshot = Ports.snapshot();
  const checks = {
    validPhase: ["idle", "initializing", "mounted", "ready", "degraded", "failed", "unmounting"].indexOf(state.phase) >= 0,
    noErrors: !state.error || state.phase === "degraded",
    portsInitialized: portsSnapshot._initialized
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    phase: state.phase,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const state = getState();
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    phase: state.phase,
    mounted: state.mounted,
    ready: state.ready,
    error: state.error,
    metrics: getMetrics(),
    portsStatus: { initialized: portsSnapshot._initialized },
    timestamp: Date.now()
  };
}
function getLifecycleInfo() {
  return info();
}
var lifecycle_default = {
  VERSION,
  MODULE_ID,
  initialize,
  markMounted,
  markReady,
  markFailed,
  markUnmounting,
  markDegraded,
  reset,
  getMetrics,
  healthCheck,
  info,
  getLifecycleInfo,
  injectPorts,
  getPortsSnapshot
};
export {
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getLifecycleInfo,
  getMetrics,
  getPortsSnapshot,
  healthCheck,
  info,
  initialize,
  injectPorts,
  markDegraded,
  markFailed,
  markMounted,
  markReady,
  markUnmounting,
  reset
};
