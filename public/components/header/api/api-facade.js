import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { createFetchClient } from "./fetch.js";
import { HealthAPI } from "./health.js";
import { AlertsAPI } from "./alerts.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/api/api-facade";
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
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, args.join(" "));
  else if (level === "warn" && logger.warn) logger.warn(prefix, args.join(" "));
  else if (level === "info" && logger.info) logger.info(prefix, args.join(" "));
};
let _fetchClient = null;
let _healthAPI = null;
let _alertsAPI = null;
let _initialized = false;
let _config = null;
const _metrics = {
  initCount: 0,
  fetchCalls: 0,
  healthCalls: 0,
  alertsCalls: 0,
  lastCallAt: null
};
function init(config, dependencies) {
  if (_initialized) {
    _log("warn", "API Facade ja inicializada");
    return;
  }
  _initPorts();
  config = config || {};
  dependencies = dependencies || {};
  _config = {
    api: {
      // @ts-expect-error TS migration - TS2339
      timeout: config.api && config.api.timeout || 6e3,
      // @ts-expect-error TS migration - TS2339
      retries: config.api && config.api.retries || 3,
      // @ts-expect-error TS migration - TS2339
      healthEndpoint: config.api && config.api.healthEndpoint || "/api/health/status.php",
      // @ts-expect-error TS migration - TS2339
      alertsEndpoint: config.api && config.api.alertsEndpoint || "/api/alerts/header-alerts.php"
    }
  };
  _fetchClient = createFetchClient({
    // @ts-expect-error TS migration - TS2339
    timeout: _config.api.timeout,
    // @ts-expect-error TS migration - TS2339
    retries: _config.api.retries,
    instanceId: "header-fetch"
  });
  _healthAPI = new HealthAPI(_config, dependencies.timers, dependencies.logger, dependencies.eventBus);
  _alertsAPI = new AlertsAPI(_config, dependencies.logger, dependencies.eventBus);
  _initialized = true;
  _metrics.initCount++;
  _log("info", "API Facade inicializada");
}
function fetch(url, options) {
  _ensureInitialized();
  _metrics.fetchCalls++;
  _metrics.lastCallAt = Date.now();
  return _fetchClient.fetch(url, options);
}
function fetchJSON(url, options) {
  options = options || {};
  return fetch(url, options).then((response) => response.json());
}
function post(url, data, options) {
  options = options || {};
  return fetch(url, Object.assign({}, options, {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" }, options.headers || {}),
    body: JSON.stringify(data)
  }));
}
function postJSON(url, data, options) {
  return post(url, data, options).then((response) => response.json());
}
function ping() {
  _ensureInitialized();
  _metrics.healthCalls++;
  _metrics.lastCallAt = Date.now();
  return _healthAPI.ping();
}
function getHealthMetrics() {
  _ensureInitialized();
  return _healthAPI.getMetrics();
}
function getHealthHistory(limit) {
  _ensureInitialized();
  return _healthAPI.getHistory(limit);
}
function getAlerts(options) {
  _ensureInitialized();
  _metrics.alertsCalls++;
  _metrics.lastCallAt = Date.now();
  return _alertsAPI.getAlerts(options);
}
function getAlertsMetrics() {
  _ensureInitialized();
  return _alertsAPI.getMetrics();
}
function getCachedAlerts() {
  _ensureInitialized();
  return _alertsAPI.getCachedData();
}
function invalidateAlertsCache() {
  _ensureInitialized();
  return _alertsAPI.invalidateCache();
}
function getFetchClient() {
  _ensureInitialized();
  return _fetchClient;
}
function getHealthAPI() {
  _ensureInitialized();
  return _healthAPI;
}
function getAlertsAPI() {
  _ensureInitialized();
  return _alertsAPI;
}
function getCircuitStatus() {
  _ensureInitialized();
  return _fetchClient.getCircuitMetrics();
}
function resetCircuit() {
  _ensureInitialized();
  return _fetchClient.resetCircuit();
}
function isCircuitOpen() {
  _ensureInitialized();
  const metrics = _fetchClient.getCircuitMetrics();
  return metrics.state === "open";
}
function _ensureInitialized() {
  if (!_initialized) {
    throw new Error("API Facade nao inicializada. Chame init() primeiro.");
  }
}
function getMetrics() {
  const fetchMetrics = _fetchClient ? _fetchClient.getMetrics() : null;
  const healthMetrics = _healthAPI ? _healthAPI.getMetrics() : null;
  const alertsMetrics = _alertsAPI ? _alertsAPI.getMetrics() : null;
  return {
    facade: Object.assign({}, _metrics),
    fetch: fetchMetrics,
    health: healthMetrics,
    alerts: alertsMetrics
  };
}
function resetMetrics() {
  _metrics.fetchCalls = 0;
  _metrics.healthCalls = 0;
  _metrics.alertsCalls = 0;
  _metrics.lastCallAt = null;
  if (_fetchClient) _fetchClient.resetMetrics();
  if (_healthAPI) _healthAPI.resetMetrics();
  if (_alertsAPI) _alertsAPI.resetMetrics();
}
function healthCheck() {
  const fetchHealth = _fetchClient ? _fetchClient._internalHealthCheck() : { status: "UNKNOWN" };
  const healthApiHealth = _healthAPI ? _healthAPI.healthCheck() : { status: "UNKNOWN" };
  const alertsHealth = _alertsAPI ? _alertsAPI.healthCheck() : { status: "UNKNOWN" };
  const checks = {
    initialized: _initialized,
    fetchHealthy: fetchHealth.status === "HEALTHY" || fetchHealth.status === "DEGRADED",
    healthApiHealthy: healthApiHealth.status === "HEALTHY" || healthApiHealth.status === "DEGRADED",
    alertsApiHealthy: alertsHealth.status === "HEALTHY" || alertsHealth.status === "DEGRADED",
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    apis: {
      fetch: fetchHealth,
      health: healthApiHealth,
      alerts: alertsHealth
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    config: _config,
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}
function destroy() {
  if (_fetchClient) {
    _fetchClient.destroy();
    _fetchClient = null;
  }
  if (_healthAPI) {
    _healthAPI.destroy();
    _healthAPI = null;
  }
  if (_alertsAPI) {
    _alertsAPI.destroy();
    _alertsAPI = null;
  }
  _initialized = false;
  _config = null;
  _log("info", "API Facade destruida");
}
var api_facade_default = {
  VERSION,
  MODULE_ID,
  init,
  destroy,
  fetch,
  fetchJSON,
  post,
  postJSON,
  ping,
  getHealthMetrics,
  getHealthHistory,
  getAlerts,
  getAlertsMetrics,
  getCachedAlerts,
  invalidateAlertsCache,
  getFetchClient,
  getHealthAPI,
  getAlertsAPI,
  getCircuitStatus,
  resetCircuit,
  isCircuitOpen,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  api_facade_default as default,
  destroy,
  fetch,
  fetchJSON,
  getAlerts,
  getAlertsAPI,
  getAlertsMetrics,
  getCachedAlerts,
  getCircuitStatus,
  getFetchClient,
  getHealthAPI,
  getHealthHistory,
  getHealthMetrics,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  invalidateAlertsCache,
  isCircuitOpen,
  ping,
  post,
  postJSON,
  resetCircuit,
  resetMetrics
};
