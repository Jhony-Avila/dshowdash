import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "3.4.0-P2-ENTERPRISE";
const MODULE_ID = "notification-manager-api";
const _Ports = createUiPorts({ moduleId: MODULE_ID });
const _getPort = (name) => _Ports.get(name);
const injectPorts = (p) => _Ports.inject(p);
const getPortsSnapshot = () => _Ports.snapshot();
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return null;
}
const _log = (level, ...args) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) {
    logger[level](prefix, ...args);
  } else if (!isStrict() && (level === "error" || level === "warn")) {
    console.debug(prefix, ...args);
  }
};
let _metrics = { requests: 0, errors: 0, contractViolations: 0, authErrors: 0 };
function _validateResponseContract(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.indexOf("application/json") !== -1;
  return { ok: response.ok, status: response.status, isJson, isContractViolation: !isJson && response.ok, isAuthError: response.status === 401 || response.status === 403 };
}
function _createFallback(reason) {
  return { notifications: [], unread_count: 0, _fallback: true, _reason: reason };
}
async function fetchNotifications(endpoint = "/api/notifications") {
  _metrics.requests++;
  try {
    const url = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
    const res = await fetch(url, { credentials: "include", headers: { "Accept": "application/json" } });
    const contract = _validateResponseContract(res);
    if (contract.isAuthError) {
      _metrics.authErrors++;
      return _createFallback("auth-required");
    }
    if (contract.isContractViolation) {
      _metrics.contractViolations++;
      _log("warn", "API_CONTRACT_VIOLATION: Expected JSON, got HTML");
      return _createFallback("contract-violation");
    }
    if (!res.ok) {
      _metrics.errors++;
      return _createFallback("http-error");
    }
    return await res.json();
  } catch (e) {
    _metrics.errors++;
    return _createFallback("network-error");
  }
}
async function markAsRead(id, endpoint = "/api/notifications") {
  _metrics.requests++;
  try {
    const url = `${endpoint}/?action=read&id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "PATCH", credentials: "include", headers: { "Accept": "application/json" } });
    if (res.status === 401 || res.status === 403) {
      _metrics.authErrors++;
      return false;
    }
    return res.ok;
  } catch (e) {
    _metrics.errors++;
    return false;
  }
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const checks = {
    lowErrorRate: _metrics.requests === 0 || _metrics.errors / _metrics.requests < 0.2,
    lowContractViolations: _metrics.requests === 0 || _metrics.contractViolations / _metrics.requests < 0.1
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/2`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
const fetchFromServer = fetchNotifications;
const markAllAsRead = async function(ids) {
  if (ids) {
    for (const id of ids) {
      await markAsRead(id);
    }
  }
};
const deleteNotification = async function(id) {
  return markAsRead(id);
};
const createNotification = async function(data) {
  return data;
};
var api_default = { fetchNotifications, markAsRead, getMetrics, healthCheck, info, injectPorts, getPorts: getPortsSnapshot, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createNotification,
  api_default as default,
  deleteNotification,
  fetchFromServer,
  fetchNotifications,
  getMetrics,
  getPortsSnapshot,
  healthCheck,
  info,
  injectPorts,
  markAllAsRead,
  markAsRead
};
