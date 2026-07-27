import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P18EC-AAA";
const MODULE_ID = "app-shell-notification-adapter";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const NOTIFICATION_EVENTS = Object.freeze({
  SHOW: "notification:show",
  HIDE: "notification:hide",
  CLEAR_ALL: "notification:clear-all",
  COUNT_CHANGED: "notification:count-changed"
});
let _cleanups = [];
let _connected = false;
let _toastRegion = null;
const _metrics = {
  connects: 0,
  disconnects: 0,
  shows: 0,
  hides: 0,
  errors: 0
};
function _trackEvent(event, data) {
  if (!data) data = {};
  try {
    const telemetry = _getPort("telemetry");
    if (telemetry && telemetry.event) {
      telemetry.event(`${MODULE_ID}:${event}`, data);
    }
  } catch (e) {
  }
}
function connect(toastRegionId, callbacks) {
  if (!toastRegionId) toastRegionId = "shell-toast-region";
  if (!callbacks) callbacks = {};
  if (_connected) return true;
  _toastRegion = document.getElementById(toastRegionId);
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _trackEvent("no-eventbus");
    return false;
  }
  try {
    const showHandler = (data) => {
      _metrics.shows++;
      if (callbacks.onShow) callbacks.onShow(data);
    };
    const hideHandler = (data) => {
      _metrics.hides++;
      if (callbacks.onHide) callbacks.onHide(data);
    };
    const countHandler = (data) => {
      if (callbacks.onCountChange) {
        callbacks.onCountChange(data && data.count ? data.count : 0);
      }
    };
    eventBus.on(NOTIFICATION_EVENTS.SHOW, showHandler);
    eventBus.on(NOTIFICATION_EVENTS.HIDE, hideHandler);
    eventBus.on(NOTIFICATION_EVENTS.COUNT_CHANGED, countHandler);
    _cleanups = [
      () => {
        eventBus.off(NOTIFICATION_EVENTS.SHOW, showHandler);
      },
      () => {
        eventBus.off(NOTIFICATION_EVENTS.HIDE, hideHandler);
      },
      () => {
        eventBus.off(NOTIFICATION_EVENTS.COUNT_CHANGED, countHandler);
      }
    ];
    _connected = true;
    _metrics.connects++;
    _trackEvent("connected", { hasToastRegion: !!_toastRegion });
    return true;
  } catch (error) {
    _metrics.errors++;
    _trackEvent("connect-error", { error: error.message });
    return false;
  }
}
function disconnect() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _toastRegion = null;
  _connected = false;
  _metrics.disconnects++;
  _trackEvent("disconnected");
}
function show(message, type, options) {
  if (!type) type = "info";
  if (!options) options = {};
  const toast = _getPort("toast");
  if (toast && toast.show) {
    return toast.show(message, type, options);
  }
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(NOTIFICATION_EVENTS.SHOW, Object.assign({
      message,
      type,
      source: MODULE_ID
    }, options));
    return true;
  }
  return false;
}
function clearAll() {
  const toast = _getPort("toast");
  if (toast && toast.clearAll) {
    return toast.clearAll();
  }
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(NOTIFICATION_EVENTS.CLEAR_ALL, { source: MODULE_ID });
    return true;
  }
  return false;
}
function isConnected() {
  return _connected;
}
function getToastRegion() {
  return _toastRegion;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const ps = Ports.snapshot();
  const toast = _getPort("toast");
  const checks = {
    connected: _connected,
    hasToastRegion: !!_toastRegion,
    toastServiceExists: !!toast,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed >= 2 ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: `${passed}/4`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    connected: _connected,
    hasToastRegion: !!_toastRegion,
    events: NOTIFICATION_EVENTS,
    portsInitialized: ps._initialized,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var notification_adapter_default = {
  connect,
  disconnect,
  show,
  clearAll,
  isConnected,
  getToastRegion,
  getMetrics,
  healthCheck,
  info,
  NOTIFICATION_EVENTS,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  clearAll,
  connect,
  notification_adapter_default as default,
  disconnect,
  getMetrics,
  getPorts,
  getToastRegion,
  healthCheck,
  info,
  injectPorts,
  isConnected,
  show
};
