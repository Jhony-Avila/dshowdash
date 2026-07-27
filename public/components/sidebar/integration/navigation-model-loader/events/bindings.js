import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { EVENTS } from "../core/contracts.js";
import { MODULE_ID } from "../core/constants.js";
const VERSION = "2.4.0-ES6";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const getEventBus = () => {
  _initPorts();
  return _getPort("eventBus");
};
const emit = (event, data) => {
  if (!data) data = {};
  const bus = getEventBus();
  if (!bus || !bus.emit) return false;
  try {
    bus.emit(event, Object.assign({
      source: MODULE_ID,
      timestamp: Date.now()
    }, data));
    return true;
  } catch (e) {
    return false;
  }
};
const on = (event, handler) => {
  const bus = getEventBus();
  if (!bus || !bus.on) return () => {
  };
  try {
    bus.on(event, handler);
    return () => {
      if (bus.off) bus.off(event, handler);
    };
  } catch (e) {
    return () => {
    };
  }
};
const emitLoadStart = () => emit(EVENTS.LOAD_START);
const emitLoadSuccess = (model, source) => emit(EVENTS.LOAD_SUCCESS, { model, source });
const emitLoadError = (error) => emit(EVENTS.LOAD_ERROR, { error });
const emitLoadFallback = (reason) => emit(EVENTS.LOAD_FALLBACK, { reason });
const emitModelReady = (model) => emit(EVENTS.MODEL_READY, { model });
const emitCacheHit = (source) => emit(EVENTS.CACHE_HIT, { source });
const emitCacheMiss = () => emit(EVENTS.CACHE_MISS);
const emitCacheInvalidate = () => emit(EVENTS.CACHE_INVALIDATE);
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p03PortsOnly: true,
    portsInitialized: Ports.isInitialized()
  };
}
function healthCheck() {
  const hasEventBus = !!getEventBus();
  return {
    status: hasEventBus ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    p03PortsOnly: true,
    checks: { hasEventBus, portsInitialized: Ports.isInitialized() }
  };
}
var bindings_default = { emit, on, emitLoadStart, emitLoadSuccess, emitLoadError, emitLoadFallback, emitModelReady, emitCacheHit, emitCacheMiss, emitCacheInvalidate, info, healthCheck, injectPorts, getPorts, VERSION };
export {
  VERSION,
  bindings_default as default,
  emit,
  emitCacheHit,
  emitCacheInvalidate,
  emitCacheMiss,
  emitLoadError,
  emitLoadFallback,
  emitLoadStart,
  emitLoadSuccess,
  emitModelReady,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  on
};
