import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { SECURITY_EVENTS } from "/core/runtime/events/catalog/security.events.js";
const VERSION = "2.4.0-P18EC";
const MODULE_ID = "security.csrf-token-manager.infra.event-bridge";
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
let _listeners = [];
let _eventBusConnected = false;
let _globalStateConnected = false;
let _subscriptions = [];
function on(event, handler) {
  const eb = _getPort("eventBus");
  if (eb && eb.on) eb.on(event, handler);
  _listeners.push({ event, handler });
}
function off(event, handler) {
  const eb = _getPort("eventBus");
  if (eb && eb.off) eb.off(event, handler);
  _listeners = _listeners.filter((l) => !(l.event === event && l.handler === handler));
}
function emit(event, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, data);
}
function connectEventBus(eventBus) {
  if (_eventBusConnected) return true;
  if (eventBus) Ports.inject({ eventBus });
  const eb = _getPort("eventBus");
  if (eb) {
    _eventBusConnected = true;
    return true;
  }
  return false;
}
function disconnectEventBus() {
  if (!_eventBusConnected) return true;
  const eb = _getPort("eventBus");
  _listeners.forEach((item) => {
    if (eb && eb.off) eb.off(item.event, item.handler);
  });
  _listeners = [];
  _eventBusConnected = false;
  return true;
}
function connectGlobalState(globalState) {
  if (_globalStateConnected) return true;
  if (globalState) Ports.inject({ globalState });
  const gs = _getPort("globalState");
  if (gs) {
    _globalStateConnected = true;
    if (typeof gs.subscribe === "function") {
      const unsubscribe = gs.subscribe((state) => {
        if (state && state.session) {
          emit(SECURITY_EVENTS.SESSION_CHANGED, { session: state.session });
        }
      });
      _subscriptions.push(unsubscribe);
    }
    return true;
  }
  return false;
}
function disconnectGlobalState() {
  if (!_globalStateConnected) return true;
  _subscriptions.forEach((unsub) => {
    if (typeof unsub === "function") unsub();
  });
  _subscriptions = [];
  _globalStateConnected = false;
  return true;
}
function cleanup() {
  disconnectEventBus();
  disconnectGlobalState();
}
function getBridgeInfo() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), eventBusConnected: _eventBusConnected, globalStateConnected: _globalStateConnected, hasEventBus: !!_getPort("eventBus"), hasGlobalState: !!_getPort("globalState"), listenerCount: _listeners.length, subscriptionCount: _subscriptions.length, timestamp: Date.now() };
}
function healthCheck() {
  const checks = { eventBusAvailable: !!_getPort("eventBus"), eventBusConnected: _eventBusConnected, globalStateAvailable: !!_getPort("globalState"), globalStateConnected: _globalStateConnected, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed >= 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), listenerCount: _listeners.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), eventBusConnected: _eventBusConnected, globalStateConnected: _globalStateConnected, listenerCount: _listeners.length, timestamp: Date.now() };
}
var event_bridge_default = { on, off, emit, connectEventBus, disconnectEventBus, connectGlobalState, disconnectGlobalState, cleanup, getBridgeInfo, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  connectEventBus,
  connectGlobalState,
  event_bridge_default as default,
  disconnectEventBus,
  disconnectGlobalState,
  emit,
  getBridgeInfo,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  off,
  on
};
