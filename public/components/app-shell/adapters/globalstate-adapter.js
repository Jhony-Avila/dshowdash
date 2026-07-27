import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { recordAccess, ACCESS_TYPES, ACCESS_SOURCES } from "/core/policies/globalstate-access-policy.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-globalstate-adapter";
const MAX_RETRIES = 5;
const RETRY_DELAY = 500;
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
function _recordAccess(type, key) {
  try {
    recordAccess({
      type,
      source: ACCESS_SOURCES.PORTS,
      key,
      caller: MODULE_ID,
      moduleId: MODULE_ID
    });
  } catch (e) {
  }
}
let _cleanups = [];
let _retryCount = 0;
let _connected = false;
const _metrics = {
  connects: 0,
  disconnects: 0,
  syncs: 0,
  errors: 0,
  retries: 0
};
function _log(event, data) {
  if (!data) data = {};
  try {
    const logger = _getPort("logger");
    if (logger && logger.info) {
      logger.info(`[${MODULE_ID}] ${event}`, data);
    }
  } catch (e) {
  }
}
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
function connect(callbacks) {
  if (!callbacks) callbacks = {};
  if (_connected) {
    _log("already-connected");
    return true;
  }
  const globalState = _getPort("globalState");
  if (!globalState) {
    if (_retryCount < MAX_RETRIES) {
      _retryCount++;
      _metrics.retries++;
      const delay = RETRY_DELAY * _retryCount;
      _trackEvent("retry-scheduled", { attempt: _retryCount, delay });
      setTimeout(() => {
        connect(callbacks);
      }, delay);
      return false;
    }
    _metrics.errors++;
    _trackEvent("max-retries-reached", { attempts: _retryCount });
    return false;
  }
  try {
    if (callbacks.onLoading) {
      _recordAccess(ACCESS_TYPES.SUBSCRIBE, "app.isLoading");
      const unsub1 = globalState.subscribe((isLoading) => {
        _metrics.syncs++;
        callbacks.onLoading(isLoading);
      }, "app.isLoading");
      if (typeof unsub1 === "function") _cleanups.push(unsub1);
    }
    if (callbacks.onMaintenance) {
      _recordAccess(ACCESS_TYPES.SUBSCRIBE, "app.maintenanceMode");
      const unsub2 = globalState.subscribe((mode) => {
        _metrics.syncs++;
        callbacks.onMaintenance(mode);
      }, "app.maintenanceMode");
      if (typeof unsub2 === "function") _cleanups.push(unsub2);
    }
    _connected = true;
    _metrics.connects++;
    _trackEvent("connected", { subscriptions: _cleanups.length, retriesNeeded: _retryCount });
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
  _retryCount = 0;
  _connected = false;
  _metrics.disconnects++;
  _trackEvent("disconnected");
}
function dispatchLoading(isLoading) {
  try {
    const globalState = _getPort("globalState");
    if (globalState && globalState.dispatch && globalState.actions && globalState.actions.setLoading) {
      _recordAccess(ACCESS_TYPES.DISPATCH, "app.isLoading");
      globalState.dispatch(globalState.actions.setLoading(isLoading));
      return true;
    }
  } catch (e) {
    _metrics.errors++;
  }
  return false;
}
function dispatchAppReady(isReady) {
  try {
    const globalState = _getPort("globalState");
    if (globalState && globalState.dispatch) {
      _recordAccess(ACCESS_TYPES.DISPATCH, "app.ready");
      globalState.dispatch({
        type: isReady ? "SET_APP_READY" : "CLEAR_APP_READY",
        payload: isReady
      });
      return true;
    }
  } catch (e) {
    _metrics.errors++;
  }
  return false;
}
function isConnected() {
  return _connected;
}
function getRetryCount() {
  return _retryCount;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function getStatus() {
  const globalState = _getPort("globalState");
  const hasGlobalState = !!globalState;
  if (_connected) return "connected";
  if (!hasGlobalState && _retryCount > 0 && _retryCount < MAX_RETRIES) return "retrying";
  if (!hasGlobalState && _retryCount >= MAX_RETRIES) return "failed";
  return "pending";
}
function healthCheck() {
  const ps = Ports.snapshot();
  const globalState = _getPort("globalState");
  const checks = {
    globalStateExists: !!globalState,
    connected: _connected,
    noExcessiveRetries: _retryCount < MAX_RETRIES,
    lowErrorRate: _metrics.connects === 0 || _metrics.errors / _metrics.connects < 0.2,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed === 5 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: `${passed}/5`,
    checks,
    metrics: getMetrics(),
    connectionStatus: getStatus(),
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
    status: getStatus(),
    subscriptions: _cleanups.length,
    retryCount: _retryCount,
    maxRetries: MAX_RETRIES,
    portsInitialized: ps._initialized,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var globalstate_adapter_default = {
  connect,
  disconnect,
  dispatchLoading,
  dispatchAppReady,
  isConnected,
  getRetryCount,
  getMetrics,
  getStatus,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  connect,
  globalstate_adapter_default as default,
  disconnect,
  dispatchAppReady,
  dispatchLoading,
  getMetrics,
  getPorts,
  getRetryCount,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  isConnected
};
