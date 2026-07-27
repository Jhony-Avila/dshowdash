import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { NETWORK_EVENTS } from "/core/runtime/events/catalog/network.events.js";
const MODULE_ID = "components.footer.status-connection";
const VERSION = "2.3.0-P18EC-CATALOG";
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
function getPorts() {
  return Ports.snapshot();
}
const STATES = { ONLINE: "online", OFFLINE: "offline", SLOW: "slow", UNKNOWN: "unknown" };
const _state = { initialized: false, status: STATES.UNKNOWN, latency: null };
let _cleanup = null;
const _metrics = { checks: 0, offlineEvents: 0, onlineEvents: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
    return true;
  }
  return false;
}
function _handleOnline() {
  _state.status = STATES.ONLINE;
  _metrics.onlineEvents++;
  _emit(NETWORK_EVENTS.ONLINE, { status: STATES.ONLINE });
}
function _handleOffline() {
  _state.status = STATES.OFFLINE;
  _metrics.offlineEvents++;
  _emit(NETWORK_EVENTS.OFFLINE, { status: STATES.OFFLINE });
}
function checkConnection() {
  _metrics.checks++;
  if (typeof navigator !== "undefined") {
    _state.status = navigator.onLine ? STATES.ONLINE : STATES.OFFLINE;
  }
  return { ok: true, status: _state.status };
}
function getStatus() {
  return _state.status;
}
function isOnline() {
  return _state.status === STATES.ONLINE;
}
function setLatency(ms) {
  _state.latency = ms;
  if (ms > 1e3) _state.status = STATES.SLOW;
  _emit(NETWORK_EVENTS.LATENCY_MEASURED, { latency: ms, slow: ms > 1e3 });
  return { ok: true };
}
function render() {
  return `<span class="footer-connection footer-connection--${_state.status}"></span>`;
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (typeof window !== "undefined") {
    window.addEventListener("online", _handleOnline);
    window.addEventListener("offline", _handleOffline);
    _cleanup = () => {
      window.removeEventListener("online", _handleOnline);
      window.removeEventListener("offline", _handleOffline);
    };
  }
  checkConnection();
  _state.initialized = true;
  _emit(NETWORK_EVENTS.INIT, { status: _state.status });
  return { ok: true, version: VERSION };
}
function cleanup() {
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }
  _state.initialized = false;
  _emit(NETWORK_EVENTS.SHUTDOWN, {});
  return { ok: true };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return {
    status: isOnline() ? "HEALTHY" : "DEGRADED",
    score: isOnline() ? 100 : 50,
    moduleId: MODULE_ID,
    version: VERSION,
    p18ecCatalog: true,
    checks: {
      initialized: { ok: _state.initialized, severity: "info" },
      isOnline: { ok: isOnline(), severity: "warn" },
      portsInitialized: { ok: ps._initialized, severity: "info" }
    },
    metrics: _metrics
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p18ecCatalog: true,
    usesNetworkEvents: true,
    initialized: _state.initialized,
    status: _state.status,
    latency: _state.latency,
    metrics: _metrics,
    portsInitialized: ps._initialized
  };
}
const CONNECTION_EVENTS = {
  ONLINE: NETWORK_EVENTS.ONLINE,
  OFFLINE: NETWORK_EVENTS.OFFLINE
};
var status_connection_default = { MODULE_ID, VERSION, STATES, CONNECTION_EVENTS, init, cleanup, checkConnection, getStatus, isOnline, setLatency, render, healthCheck, info, injectPorts, getPorts };
export {
  CONNECTION_EVENTS,
  MODULE_ID,
  STATES,
  VERSION,
  checkConnection,
  cleanup,
  status_connection_default as default,
  getPorts,
  getStatus,
  healthCheck,
  info,
  init,
  injectPorts,
  isOnline,
  render,
  setLatency
};
