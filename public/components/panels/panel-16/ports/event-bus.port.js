import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "panel-16.ports.event-bus";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
let _injectedEventBus = null;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPortEventBus() {
  _initPorts();
  return Ports.get("eventBus");
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function setEventBus(bus) {
  _injectedEventBus = bus;
}
function getEventBus() {
  if (_injectedEventBus) return _injectedEventBus;
  const bus = _getPortEventBus();
  if (bus) return bus;
  if (window.Core?.windowAdapter?.get) {
    const wBus = window.Core.windowAdapter.get("EventBus");
    if (wBus) return wBus;
  }
  return null;
}
function emit(event, data) {
  const bus = getEventBus();
  if (bus?.emit) {
    bus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    return true;
  }
  return false;
}
function on(event, handler) {
  const bus = getEventBus();
  if (bus?.on) {
    const cleanup = bus.on(event, handler);
    return typeof cleanup === "function" ? cleanup : () => off(event, handler);
  }
  return () => {
  };
}
function off(event, handler) {
  const bus = getEventBus();
  if (bus?.off) {
    bus.off(event, handler);
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    hasInjectedEventBus: !!_injectedEventBus,
    hasPortEventBus: !!_getPortEventBus()
  };
}
function healthCheck() {
  const hasEventBus = !!getEventBus();
  return {
    status: hasEventBus ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    p0Enterprise: true,
    checks: {
      eventBusAvailable: hasEventBus,
      portsInitialized: _portsInitialized
    }
  };
}
var event_bus_port_default = { setEventBus, getEventBus, emit, on, off, injectPorts, getPorts, info, healthCheck, MODULE_ID, VERSION };
const EventBusPort = { setEventBus, getEventBus, emit, on, off, injectPorts, getPorts, info, healthCheck, MODULE_ID, VERSION };
export {
  EventBusPort,
  MODULE_ID,
  VERSION,
  event_bus_port_default as default,
  emit,
  getEventBus,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  off,
  on,
  setEventBus
};
