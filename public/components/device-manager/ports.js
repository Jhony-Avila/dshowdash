import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { DEVICE_EVENTS } from "/core/runtime/events/catalog/device.events.js";
const MODULE_ID = "components.device-manager.ports";
const VERSION = "2.3.0-P2-ENTERPRISE";
const hasWindow = typeof window !== "undefined";
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
function getPort(name) {
  return _getPort(name);
}
function log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const config = _getPort("config");
  const debug = config?.app?.debug;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
  } else if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
  } else if (debug) {
    logger.debug?.(`[${MODULE_ID}]`, ...args);
  }
}
const _state = {
  initialized: false,
  devices: {},
  permissions: {}
};
const _metrics = {
  requests: 0,
  granted: 0,
  denied: 0
};
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(eventName, { source: MODULE_ID, ...data || {} });
  }
}
function requestDevice(type) {
  _metrics.requests++;
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      _metrics.denied++;
      resolve({ ok: false, reason: "MediaDevices not available" });
      return;
    }
    const constraints = {};
    if (type === "camera" || type === "video") constraints.video = true;
    if (type === "microphone" || type === "audio") constraints.audio = true;
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      _metrics.granted++;
      _state.devices[type] = stream;
      _state.permissions[type] = "granted";
      _emit(DEVICE_EVENTS.GRANTED, { type });
      resolve({ ok: true, stream });
    }).catch((error) => {
      _metrics.denied++;
      _state.permissions[type] = "denied";
      _emit(DEVICE_EVENTS.DENIED, { type, error: error.message });
      resolve({ ok: false, error: error.message });
    });
  });
}
function getPermission(type) {
  return _state.permissions[type] || "unknown";
}
function getDevice(type) {
  return _state.devices[type] || null;
}
function releaseDevice(type) {
  if (_state.devices[type]) {
    const stream = _state.devices[type];
    for (const track of stream.getTracks()) {
      track.stop();
    }
    delete _state.devices[type];
    _emit(DEVICE_EVENTS.RELEASED, { type });
    return { ok: true };
  }
  return { ok: false, reason: "Device not found" };
}
function init(ctx) {
  if (_state.initialized) {
    return { ok: true, alreadyInitialized: true };
  }
  _initPorts();
  if (ctx && ctx.ports) {
    injectPorts(ctx.ports);
  }
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  for (const type of Object.keys(_state.devices)) {
    releaseDevice(type);
  }
  _state.devices = {};
  _state.permissions = {};
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    hasMediaDevices: typeof navigator !== "undefined" && !!navigator.mediaDevices,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: { ..._metrics },
    activeDevices: Object.keys(_state.devices),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    activeDevices: Object.keys(_state.devices),
    permissions: { ..._state.permissions },
    metrics: { ..._metrics },
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}
var ports_default = {
  MODULE_ID,
  VERSION,
  hasWindow,
  getPort,
  log,
  init,
  cleanup,
  requestDevice,
  getPermission,
  getDevice,
  releaseDevice,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  ports_default as default,
  getDevice,
  getPermission,
  getPort,
  getPorts,
  hasWindow,
  healthCheck,
  info,
  init,
  injectPorts,
  log,
  releaseDevice,
  requestDevice
};
