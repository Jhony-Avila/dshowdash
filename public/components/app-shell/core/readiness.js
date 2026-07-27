import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { getState, isReady, subscribe, setPhase, getBootTime, SHELL_PHASES } from "../state/store.js";
const VERSION = "4.2.1-P2-ENTERPRISE";
const MODULE_ID = "app-shell-readiness";
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
let _pendingCallbacks = [];
let _notifiedCount = 0;
let _storeUnsubscribe = null;
const _metrics = {
  callbacksRegistered: 0,
  callbacksExecuted: 0,
  timeouts: 0,
  errors: 0
};
function _trackEvent(event, data) {
  if (!data) data = {};
  Ports.init();
  try {
    const telemetry = _getPort("telemetry");
    if (telemetry && telemetry.event) {
      telemetry.event(`${MODULE_ID}:${event}`, data);
    }
  } catch (e) {
  }
}
function _isValidCallback(fn) {
  if (typeof fn !== "function") return false;
  const fnStr = fn.toString();
  if (fnStr.indexOf("eval(") !== -1 || fnStr.indexOf("Function(") !== -1) return false;
  return true;
}
function _safeCall(fn, data) {
  const args = Array.prototype.slice.call(arguments, 1);
  try {
    return fn.apply(null, args);
  } catch (e) {
    _metrics.errors++;
    return null;
  }
}
function _notifyPending() {
  if (_pendingCallbacks.length === 0) return;
  const state = getState();
  const callbacks = _pendingCallbacks.splice(0);
  for (let i = 0; i < callbacks.length; i++) {
    _safeCall(callbacks[i], state);
    _metrics.callbacksExecuted++;
  }
  _notifiedCount++;
  _trackEvent("pending-notified", {
    count: callbacks.length,
    notifiedCount: _notifiedCount,
    bootTime: getBootTime()
  });
}
function _ensureStoreSubscription() {
  if (_storeUnsubscribe) return;
  _storeUnsubscribe = subscribe((state) => {
    if (state.ready && _pendingCallbacks.length > 0) {
      _notifyPending();
    }
  });
}
function onReady(callback) {
  if (!_isValidCallback(callback)) {
    _metrics.errors++;
    return () => {
    };
  }
  _metrics.callbacksRegistered++;
  if (isReady()) {
    _safeCall(callback, getState());
    _metrics.callbacksExecuted++;
    return () => {
    };
  }
  _pendingCallbacks.push(callback);
  _ensureStoreSubscription();
  return function unsubscribeOnReady() {
    const idx = _pendingCallbacks.indexOf(callback);
    if (idx >= 0) _pendingCallbacks.splice(idx, 1);
  };
}
function waitForReady(timeout) {
  if (timeout === void 0) timeout = 1e4;
  return new Promise((resolve, reject) => {
    if (isReady()) {
      resolve(getState());
      return;
    }
    let settled = false;
    let timer = null;
    const cleanup = onReady((state) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(state);
    });
    timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      _metrics.timeouts++;
      _trackEvent("timeout", { timeout, pending: _pendingCallbacks.length });
      reject(new Error(`Shell ready timeout after ${timeout}ms`));
    }, timeout);
  });
}
function markShellMounted() {
  setPhase(SHELL_PHASES.MOUNTED);
}
function markShellReady() {
  setPhase(SHELL_PHASES.READY);
  _notifyPending();
}
function resetReadiness() {
  _pendingCallbacks = [];
  _notifiedCount = 0;
  if (_storeUnsubscribe) {
    _storeUnsubscribe();
    _storeUnsubscribe = null;
  }
  _trackEvent("reset");
}
function getPendingListeners() {
  return _pendingCallbacks.length;
}
function getReadinessInfo() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    isReady: isReady(),
    pendingCallbacks: _pendingCallbacks.length,
    notifiedCount: _notifiedCount,
    hasStoreSubscription: !!_storeUnsubscribe,
    bootTime: getBootTime(),
    metrics: Object.assign({}, _metrics),
    portsStatus: { initialized: ps._initialized },
    note: "Este m\xF3dulo \xE9 DERIVA\xC7\xC3O do Store",
    timestamp: Date.now()
  };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const ready = isReady();
  const checks = {
    storeAccessible: true,
    noPendingIfReady: !ready || _pendingCallbacks.length === 0,
    lowErrorRate: _metrics.callbacksRegistered === 0 || _metrics.errors / _metrics.callbacksRegistered < 0.1,
    lowTimeoutRate: _metrics.callbacksRegistered === 0 || _metrics.timeouts / _metrics.callbacksRegistered < 0.1,
    portsInitialized: ps._initialized
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    isReady: ready,
    pendingCallbacks: _pendingCallbacks.length,
    bootTime: getBootTime(),
    metrics: Object.assign({}, _metrics),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return getReadinessInfo();
}
var readiness_default = {
  onReady,
  waitForReady,
  markShellMounted,
  markShellReady,
  resetReadiness,
  getPendingListeners,
  getReadinessInfo,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  readiness_default as default,
  getPendingListeners,
  getPorts,
  getReadinessInfo,
  healthCheck,
  info,
  injectPorts,
  markShellMounted,
  markShellReady,
  onReady,
  resetReadiness,
  waitForReady
};
