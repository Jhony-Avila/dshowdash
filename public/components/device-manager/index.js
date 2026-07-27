import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { DEVICE_EVENTS } from "/core/runtime/events/catalog/device.events.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import {
  generateDeviceId,
  detectDeviceType,
  detectBrowser,
  detectOS,
  clearStoredData,
  hasDeviceId,
  hasFingerprint,
  getStoredDeviceId
} from "./device-detection.js";
import {
  listDevices,
  getCurrentDevice,
  registerDevice,
  setDeviceTrust,
  renameDevice,
  removeDevice,
  trackTelemetry
} from "./api-operations.js";
const VERSION = "3.7.0-P2-ENTERPRISE";
const MODULE_ID = "components.device-manager";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => {
  const config = _getPort("config");
  return config?.app?.debug;
};
const log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
  } else if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
  } else if (_debug()) {
    logger.debug?.(`[${MODULE_ID}]`, ...args);
  }
};
const DeviceManager = /* @__PURE__ */ (() => {
  let devices = [];
  let currentDevice = null;
  let isInitialized = false;
  const abortController = { current: null };
  const listeners = /* @__PURE__ */ new Map();
  const _metrics = {
    registerCount: 0,
    listCount: 0,
    errorCount: 0,
    lastActivity: 0
  };
  const emit = (event, data) => {
    const localEvent = event.indexOf("device:") === 0 ? event.replace("device:", "") : event;
    if (listeners.has(localEvent)) {
      for (const fn of listeners.get(localEvent)) {
        try {
          fn(data);
        } catch (e) {
          log("error", "Listener error:", e);
        }
      }
    }
    const eb = _getPort("eventBus");
    const eventName = event.indexOf("device:") === 0 ? event : `device:${event}`;
    if (hasWindow && eb?.emit) {
      eb.emit(eventName, data);
    }
  };
  const on = (event, callback) => {
    if (!listeners.has(event)) {
      listeners.set(event, /* @__PURE__ */ new Set());
    }
    listeners.get(event).add(callback);
    return () => listeners.get(event).delete(callback);
  };
  const off = (event, callback) => {
    if (listeners.has(event)) {
      if (callback) {
        listeners.get(event).delete(callback);
      } else {
        listeners.delete(event);
      }
    }
  };
  const list = () => listDevices(abortController, _metrics, emit).then((d) => {
    devices = d;
    return d;
  });
  const getCurrent = () => getCurrentDevice(abortController, _metrics, emit).then((d) => {
    currentDevice = d;
    return d;
  });
  const register = (customName) => registerDevice(customName, abortController, _metrics, emit);
  const setTrust = (deviceId, trustLevel) => setDeviceTrust(deviceId, trustLevel, abortController, _metrics, emit);
  const rename = (deviceId, newName) => renameDevice(deviceId, newName, abortController, _metrics, emit);
  const remove = (deviceId) => removeDevice(deviceId, abortController, _metrics, emit).then((data) => {
    devices = devices.filter((d) => d.id != deviceId);
    return data;
  });
  const init = () => {
    if (!hasWindow) return Promise.resolve(false);
    if (isInitialized) return Promise.resolve(true);
    _initPorts();
    abortController.current = new AbortController();
    return register().then(() => {
      isInitialized = true;
      trackTelemetry("ready", { initialized: true }, _metrics);
      emit(DEVICE_EVENTS.READY, { initialized: true });
      log("info", `${VERSION} initialized`);
      return true;
    }).catch((error) => {
      log("error", "Init error:", error);
      emit(DEVICE_EVENTS.ERROR, { action: "init", error: error.message });
      return false;
    });
  };
  const destroy = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    listeners.clear();
    devices = [];
    currentDevice = null;
    isInitialized = false;
    log("info", "Destroyed");
  };
  const reset = () => {
    if (!hasWindow) return;
    destroy();
    clearStoredData();
    log("info", "Reset complete");
  };
  const healthCheck = () => {
    const checks = {
      hasWindow,
      initialized: isInitialized,
      hasDeviceId: hasDeviceId(),
      hasFingerprint: hasFingerprint(),
      hasCurrentDevice: !!currentDevice,
      abortControllerActive: !!abortController.current && !abortController.current.signal.aborted,
      portsInitialized: Ports.isInitialized()
    };
    const issues = [];
    let passed = 0;
    for (const [key, value] of Object.entries(checks)) {
      if (value) passed++;
      else issues.push(key);
    }
    const total = Object.keys(checks).length;
    const status = passed === total ? "HEALTHY" : passed >= total * 0.6 ? "DEGRADED" : "UNHEALTHY";
    return {
      status,
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      portsInitialized: Ports.isInitialized(),
      metrics: { ..._metrics },
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  };
  const getStatus = () => ({
    name: MODULE_ID,
    version: VERSION,
    initialized: isInitialized,
    deviceCount: devices.length,
    currentDevice: currentDevice ? { id: currentDevice.id, name: currentDevice.device_name } : null,
    deviceId: getStoredDeviceId(),
    metrics: { ..._metrics }
  });
  const info = () => ({
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: isInitialized,
    portsInitialized: Ports.isInitialized(),
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS(),
    deviceId: getStoredDeviceId(),
    metrics: { ..._metrics },
    timestamp: Date.now()
  });
  const getMetrics = () => ({ ..._metrics });
  return {
    init,
    destroy,
    reset,
    list,
    getCurrent,
    register,
    setTrust,
    rename,
    remove,
    on,
    off,
    getDevices: () => devices.slice(),
    getCurrentDevice: () => currentDevice,
    getDeviceId: generateDeviceId,
    isInitialized: () => isInitialized,
    healthCheck,
    getStatus,
    info,
    getMetrics,
    getVersion: () => VERSION,
    injectPorts,
    getPorts,
    TRUST_LEVELS: ["unknown", "low", "medium", "high", "trusted"],
    VERSION,
    MODULE_ID
  };
})();
if (hasWindow) {
  const strictMode = isStrict();
  if (!strictMode) {
    window.DeviceManager = DeviceManager;
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.DeviceManager" });
  }
  window.__dev = window.__dev || {};
  window.__dev.deviceManager = DeviceManager;
}
var device_manager_default = DeviceManager;
export {
  DeviceManager,
  MODULE_ID,
  VERSION,
  device_manager_default as default,
  getPorts,
  injectPorts
};
