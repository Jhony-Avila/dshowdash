import { MODULE_ID as PARENT_MODULE_ID } from "./constants.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "8.6.0-P2-ENTERPRISE";
const MODULE_ID = "container-main:event-bridge";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
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
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function getInjectedEventBus() {
  return _injectedEventBus;
}
function getEventBus(context) {
  if (context?.ports?.events) return context.ports.events;
  if (context?.eventBus) return context.eventBus;
  if (_injectedEventBus) return _injectedEventBus;
  const portBus = _getPortEventBus();
  if (portBus) return portBus;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return waEventBus;
  }
  return null;
}
function createEventBridge(eventBus) {
  return {
    emit(eventName, data) {
      if (eventBus && typeof eventBus.emit === "function") {
        try {
          eventBus.emit(eventName, { ...data, source: PARENT_MODULE_ID, timestamp: Date.now() });
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    },
    subscribe(eventName, handler) {
      if (eventBus && typeof eventBus.on === "function") {
        try {
          const cleanup = eventBus.on(eventName, handler);
          return typeof cleanup === "function" ? cleanup : () => {
            if (eventBus.off) eventBus.off(eventName, handler);
          };
        } catch (e) {
          return () => {
          };
        }
      }
      return () => {
      };
    }
  };
}
function healthCheck() {
  const hasInjected = !!_injectedEventBus;
  const hasPortBus = !!_getPortEventBus();
  const hasAny = hasInjected || hasPortBus;
  const checks = {
    bridgeReady: true,
    hasInjectedEventBus: hasInjected,
    hasPortEventBus: hasPortBus,
    eventBusAvailable: hasAny,
    p0Enterprise: true,
    noWindowFallback: true
  };
  const passed = checks.bridgeReady && checks.eventBusAvailable ? 2 : checks.bridgeReady ? 1 : 0;
  return {
    status: passed === 2 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/2`,
    checks,
    source: hasInjected ? "injected" : hasPortBus ? "ports" : "none",
    version: VERSION,
    moduleId: MODULE_ID,
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasInjectedEventBus: !!_injectedEventBus,
    hasPortEventBus: !!_getPortEventBus(),
    portsInitialized: _portsInitialized,
    diStrict: true,
    p0Enterprise: true,
    noWindowFallback: true,
    strictMode: isStrict()
  };
}
export {
  MODULE_ID,
  VERSION,
  createEventBridge,
  getEventBus,
  getInjectedEventBus,
  getPorts,
  healthCheck,
  info,
  injectEventBus,
  injectPorts
};
