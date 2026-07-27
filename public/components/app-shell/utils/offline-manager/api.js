import { VERSION, MODULE_ID, CONNECTION_STATUS } from "./constants.js";
import { _state, _config, _subscribers, getMetrics } from "./state.js";
import { handleOnline, handleOffline, handleConnectionChange } from "./connection/handlers.js";
function isOnline() {
  return _state.connectionStatus === CONNECTION_STATUS.ONLINE || _state.isOnline;
}
function isOffline() {
  return _state.connectionStatus === CONNECTION_STATUS.OFFLINE || !_state.isOnline;
}
function getConnectionStatus() {
  return _state.connectionStatus;
}
function getConnectionInfo() {
  return {
    status: _state.connectionStatus,
    effectiveType: _state.effectiveType,
    downlink: _state.downlink,
    rtt: _state.rtt,
    lastChecked: _state.lastOnline || _state.lastOffline
  };
}
function getState() {
  return {
    status: _state.connectionStatus,
    connectionInfo: getConnectionInfo(),
    pendingActions: _state.pendingActions ? _state.pendingActions.length : 0,
    syncStatus: _state.syncStatus
  };
}
function ping(url) {
  url = url || _config.pingUrl || "/api/health";
  const startTime = Date.now();
  const _pingCtrl = new AbortController();
  const _pingTimeout = setTimeout(() => _pingCtrl.abort(), 5e3);
  return fetch(url, {
    method: "HEAD",
    mode: "no-cors",
    cache: "no-store",
    signal: _pingCtrl.signal
  }).then(() => {
    clearTimeout(_pingTimeout);
    const latency = Date.now() - startTime;
    _state.lastPingLatency = latency;
    _state.lastOnline = Date.now();
    return { ok: true, latency };
  }).catch((error) => {
    clearTimeout(_pingTimeout);
    return { ok: false, error: error.message };
  });
}
function configure(options) {
  if (!options) return;
  if (options.pingUrl !== void 0) _config.pingUrl = options.pingUrl;
  if (options.pingInterval !== void 0) _config.pingInterval = Math.max(5e3, options.pingInterval);
  if (options.maxQueueSize !== void 0) _config.maxQueueSize = Math.max(10, options.maxQueueSize);
  if (options.syncRetryDelay !== void 0) _config.syncRetryDelay = Math.max(1e3, options.syncRetryDelay);
  if (options.maxRetries !== void 0) _config.maxRetries = Math.max(1, options.maxRetries);
}
function getConfig() {
  return Object.assign({}, _config);
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function healthCheck() {
  const metrics = getMetrics();
  const pendingCount = _state.pendingActions ? _state.pendingActions.length : 0;
  const checks = {
    isOnline: isOnline(),
    queueNotFull: pendingCount < _config.maxQueueSize,
    noSyncErrors: metrics.syncErrors < metrics.actionsSynced * 0.5 || metrics.syncErrors < 3,
    connectionGood: _state.effectiveType !== "slow-2g" && _state.effectiveType !== "2g"
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed >= 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${keys.length}`,
    checks,
    connectionInfo: getConnectionInfo(),
    pendingActions: pendingCount,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const pendingCount = _state.pendingActions ? _state.pendingActions.length : 0;
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    status: _state.connectionStatus,
    connectionInfo: getConnectionInfo(),
    config: getConfig(),
    pendingActions: pendingCount,
    syncStatus: _state.syncStatus,
    metrics: getMetrics(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}
function destroy() {
  if (typeof window !== "undefined") {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    if (typeof navigator !== "undefined" && navigator.connection) {
      navigator.connection.removeEventListener("change", handleConnectionChange);
    }
  }
  if (_state.pendingActions) _state.pendingActions.length = 0;
  _subscribers.length = 0;
}
export {
  configure,
  destroy,
  getConfig,
  getConnectionInfo,
  getConnectionStatus,
  getMetrics,
  getState,
  healthCheck,
  info,
  isOffline,
  isOnline,
  ping,
  subscribe
};
