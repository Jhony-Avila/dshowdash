
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/api/api-facade
// PURPOSE: Unified facade for Header API access
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   createFetchClient from ./fetch.js
//   HealthAPI from ./health.js
//   AlertsAPI from ./alerts.js
// PROVIDES:
//   init(config, deps) — initialize facade with config
//   fetch(url, opts) — resilient fetch
//   fetchJSON(url, opts) — fetch and parse JSON
//   post(url, data, opts) — POST request
//   postJSON(url, data, opts) — POST and parse JSON
//   ping() — health ping
//   getAlerts(opts) — fetch alerts
//   getCircuitStatus() — circuit breaker status
//   healthCheck() — module health status
//   info() — module info
//   destroy() — cleanup all APIs
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
// ═══════════════════════════════════════════════════════════════
// Header - API Facade
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B10: var → const/let
// @description Facade unificada para acesso as APIs do Header
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { createFetchClient } from './fetch.js';
import { HealthAPI } from './health.js';
import { AlertsAPI } from './alerts.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/api/api-facade';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...rest: unknown[]) { const args = rest; const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

let _fetchClient: Record<string,unknown>|null = null;
let _healthAPI: Record<string,unknown>|null = null;
let _alertsAPI: Record<string,unknown>|null = null;
let _initialized = false;
let _config: Record<string,unknown>|null = null;

const _metrics = {
  initCount: 0,
  fetchCalls: 0,
  healthCalls: 0,
  alertsCalls: 0,
  lastCallAt: (null as unknown|null)
};

export function init(config: Record<string,unknown>, dependencies: Record<string,unknown>) {
  if (_initialized) {
    _log('warn', 'API Facade ja inicializada');
    return;
  }
  
  _initPorts();
  config = config || {};
  dependencies = dependencies || {};
  
  _config = {
    api: {
      // @ts-expect-error TS migration - TS2339
      timeout: (config.api && config.api.timeout) || 6000,
      // @ts-expect-error TS migration - TS2339
      retries: (config.api && config.api.retries) || 3,
      // @ts-expect-error TS migration - TS2339
      healthEndpoint: (config.api && config.api.healthEndpoint) || '/api/health/status.php',
      // @ts-expect-error TS migration - TS2339
      alertsEndpoint: (config.api && config.api.alertsEndpoint) || '/api/alerts/header-alerts.php'
    }
  };
  
  _fetchClient = createFetchClient({
    // @ts-expect-error TS migration - TS2339
    timeout: _config.api.timeout,
    // @ts-expect-error TS migration - TS2339
    retries: _config.api.retries,
    instanceId: 'header-fetch'
  });
  
  // @ts-expect-error TS migration - TS2345
  _healthAPI = new HealthAPI(_config, dependencies.timers, dependencies.logger, dependencies.eventBus);
  // @ts-expect-error TS migration - TS2345
  _alertsAPI = new AlertsAPI(_config, dependencies.logger, dependencies.eventBus);
  
  _initialized = true;
  _metrics.initCount++;
  _log('info', 'API Facade inicializada');
}

export function fetch(url: string, options: Record<string,unknown>) {
  _ensureInitialized();
  _metrics.fetchCalls++;
  _metrics.lastCallAt = Date.now();
  // @ts-expect-error TS migration - TS2349
  return _fetchClient.fetch(url, options);
}

export function fetchJSON(url: string, options: Record<string,unknown>) {
  options = options || {};
  return fetch(url, options).then((response: Response) => response.json());
}

export function post(url: string, data: Record<string,unknown>, options: Record<string,unknown>) {
  options = options || {};
  return fetch(url, Object.assign({}, options, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
    body: JSON.stringify(data)
  }));
}

export function postJSON(url: string, data: Record<string,unknown>, options: Record<string,unknown>) {
  return post(url, data, options).then((response: Response) => response.json());
}

export function ping() {
  _ensureInitialized();
  _metrics.healthCalls++;
  _metrics.lastCallAt = Date.now();
  // @ts-expect-error TS migration - TS2349
  return _healthAPI.ping();
}

export function getHealthMetrics() {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  return _healthAPI.getMetrics();
}

export function getHealthHistory(limit: number) {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  return _healthAPI.getHistory(limit);
}

export function getAlerts(options: Record<string,unknown>) {
  _ensureInitialized();
  _metrics.alertsCalls++;
  _metrics.lastCallAt = Date.now();
  // @ts-expect-error TS migration - TS2349
  return _alertsAPI.getAlerts(options);
}

export function getAlertsMetrics() {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  return _alertsAPI.getMetrics();
}

export function getCachedAlerts() {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  return _alertsAPI.getCachedData();
}

export function invalidateAlertsCache() {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  return _alertsAPI.invalidateCache();
}

export function getFetchClient() {
  _ensureInitialized();
  return _fetchClient;
}

export function getHealthAPI() {
  _ensureInitialized();
  return _healthAPI;
}

export function getAlertsAPI() {
  _ensureInitialized();
  return _alertsAPI;
}

export function getCircuitStatus() {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  return _fetchClient.getCircuitMetrics();
}

export function resetCircuit() {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  return _fetchClient.resetCircuit();
}

export function isCircuitOpen() {
  _ensureInitialized();
  // @ts-expect-error TS migration - TS2349
  const metrics = _fetchClient.getCircuitMetrics();
  return metrics.state === 'open';
}

function _ensureInitialized() {
  if (!_initialized) {
    throw new Error('API Facade nao inicializada. Chame init() primeiro.');
  }
}

export function getMetrics() {
  // @ts-expect-error TS migration - TS2349
  const fetchMetrics = _fetchClient ? _fetchClient.getMetrics() : null;
  // @ts-expect-error TS migration - TS2349
  const healthMetrics = _healthAPI ? _healthAPI.getMetrics() : null;
  // @ts-expect-error TS migration - TS2349
  const alertsMetrics = _alertsAPI ? _alertsAPI.getMetrics() : null;
  
  return {
    facade: Object.assign({}, _metrics),
    fetch: fetchMetrics,
    health: healthMetrics,
    alerts: alertsMetrics
  };
}

export function resetMetrics() {
  _metrics.fetchCalls = 0;
  _metrics.healthCalls = 0;
  _metrics.alertsCalls = 0;
  _metrics.lastCallAt = null;
  
  // @ts-expect-error TS migration - TS2349
  if (_fetchClient) _fetchClient.resetMetrics();
  // @ts-expect-error TS migration - TS2349
  if (_healthAPI) _healthAPI.resetMetrics();
  // @ts-expect-error TS migration - TS2349
  if (_alertsAPI) _alertsAPI.resetMetrics();
}

export function healthCheck() {
  // @ts-expect-error TS migration - TS2349
  const fetchHealth = _fetchClient ? _fetchClient._internalHealthCheck() : { status: 'UNKNOWN' };
  // @ts-expect-error TS migration - TS2349
  const healthApiHealth = _healthAPI ? _healthAPI.healthCheck() : { status: 'UNKNOWN' };
  // @ts-expect-error TS migration - TS2349
  const alertsHealth = _alertsAPI ? _alertsAPI.healthCheck() : { status: 'UNKNOWN' };
  
  const checks = {
    initialized: _initialized,
    fetchHealthy: fetchHealth.status === 'HEALTHY' || fetchHealth.status === 'DEGRADED',
    healthApiHealthy: healthApiHealth.status === 'HEALTHY' || healthApiHealth.status === 'DEGRADED',
    alertsApiHealthy: alertsHealth.status === 'HEALTHY' || alertsHealth.status === 'DEGRADED',
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
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
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    config: _config,
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export function destroy() {
  if (_fetchClient) {
    // @ts-expect-error TS migration - TS2349
    _fetchClient.destroy();
    _fetchClient = null;
  }
  if (_healthAPI) {
    // @ts-expect-error TS migration - TS2349
    _healthAPI.destroy();
    _healthAPI = null;
  }
  if (_alertsAPI) {
    // @ts-expect-error TS migration - TS2349
    _alertsAPI.destroy();
    _alertsAPI = null;
  }
  
  _initialized = false;
  _config = null;
  _log('info', 'API Facade destruida');
}

export default {
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
