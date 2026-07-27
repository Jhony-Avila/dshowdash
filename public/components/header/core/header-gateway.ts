
// ═════════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═════════════════════════════════════════════════════════════════
// MODULE: header/core/header-gateway
// PURPOSE: Unified API gateway for all Header HTTP calls, with
//          caching, circuit breaker, retry-with-jitter, and
//          request/response/error interceptors.
// ─────────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ENDPOINTS, TIMEOUTS from ./constants.js
//   retryWithJitter from ./retry-with-jitter.js
//   getBreaker from ./circuit-breaker-api.js
// PROVIDES:
//   init(config) — initialize gateway configuration
//   configure(options) — update config at runtime
//   request(endpoint, options) — generic HTTP request
//   get / post / put / del — convenience HTTP methods
//   fetchHealth / fetchAlerts / fetchComponents / fetchPermissions
//   saveComponentOrder(order) — POST component order
//   clearCache(pattern?) — clear response cache
//   addRequestInterceptor / addResponseInterceptor / addErrorInterceptor
//   getMetrics() / resetMetrics()
//   healthCheck() / info()
//   injectPorts(p) / getPorts()
// ═════════════════════════════════════════════════════════════════
// Header - Gateway (Unified API Layer)
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B13: var → const/let
// Gateway unificado para todas as chamadas de API do Header
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ENDPOINTS, TIMEOUTS } from './constants.js';
import { retryWithJitter } from './retry-with-jitter.js';
import { getBreaker } from './circuit-breaker-api.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/header-gateway';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...rest: any[]) { const args = rest; const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

let _config = {
  baseUrl: '',
  timeout: TIMEOUTS.API_DEFAULT,
  retries: 1,
  withCredentials: true,
  useCircuitBreaker: true,
  useRetry: true
};

const _cache = new Map();
const _cacheConfig = {
  enabled: true,
  defaultTTL: 60000,
  maxSize: 100
};

let _metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  cachedResponses: 0,
  totalLatency: 0,
  averageLatency: 0
};

// @ts-expect-error strict migration — TS7034
const _requestInterceptors = [];
// @ts-expect-error strict migration — TS7034
const _responseInterceptors = [];
// @ts-expect-error strict migration — TS7034
const _errorInterceptors = [];

function init(config: Record<string,unknown>) {
  _initPorts();
  
  if (config) {
    _config = Object.assign({}, _config, config);
  }
  
  _log('info', 'HeaderGateway inicializado');
}

function configure(options: Record<string,unknown>) {
  _config = Object.assign({}, _config, options);
}

function _getCacheKey(endpoint: string, options: Record<string,unknown>) {
  return `${endpoint}:${JSON.stringify(options || {})}`;
}

function _getFromCache(key: string) {
  if (!_cacheConfig.enabled) return null;
  
  const cached = _cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    _cache.delete(key);
    return null;
  }
  
  _metrics.cachedResponses++;
  return cached.data;
}

function _setCache(key: string, data: Record<string,unknown>, ttl: number) {
  if (!_cacheConfig.enabled) return;
  
  if (_cache.size >= _cacheConfig.maxSize) {
    const firstKey = _cache.keys().next().value;
    _cache.delete(firstKey);
  }
  
  _cache.set(key, {
    data,
    expiresAt: Date.now() + (ttl || _cacheConfig.defaultTTL),
    createdAt: Date.now()
  });
}

function clearCache(pattern?: string) {
  if (pattern) {
    _cache.forEach((value, key) => {
      if (key.indexOf(pattern) !== -1) {
        _cache.delete(key);
      }
    });
  } else {
    _cache.clear();
  }
  _log('debug', 'Cache limpo', pattern ? `pattern: ${pattern}` : 'completo');
}

function addRequestInterceptor(fn: Function) {
  _requestInterceptors.push(fn);
  return () => {
    // @ts-expect-error strict migration — TS7005
    const idx = _requestInterceptors.indexOf(fn);
    // @ts-expect-error strict migration — TS7005
    if (idx > -1) _requestInterceptors.splice(idx, 1);
  };
}

function addResponseInterceptor(fn: Function) {
  _responseInterceptors.push(fn);
  return () => {
    // @ts-expect-error strict migration — TS7005
    const idx = _responseInterceptors.indexOf(fn);
    // @ts-expect-error strict migration — TS7005
    if (idx > -1) _responseInterceptors.splice(idx, 1);
  };
}

function addErrorInterceptor(fn: Function) {
  _errorInterceptors.push(fn);
  return () => {
    // @ts-expect-error strict migration — TS7005
    const idx = _errorInterceptors.indexOf(fn);
    // @ts-expect-error strict migration — TS7005
    if (idx > -1) _errorInterceptors.splice(idx, 1);
  };
}

function _applyRequestInterceptors(config: Record<string,unknown>) {
  let result = config;
  // @ts-expect-error strict migration — TS7005
  _requestInterceptors.forEach(interceptor => {
    try {
      result = interceptor(result) || result;
    } catch (e: any) {
      _log('error', 'Request interceptor error:', e.message);
    }
  });
  return result;
}

function _applyResponseInterceptors(response: Response) {
  let result = response;
  // @ts-expect-error strict migration — TS7005
  _responseInterceptors.forEach(interceptor => {
    try {
      result = interceptor(result) || result;
    } catch (e: any) {
      _log('error', 'Response interceptor error:', e.message);
    }
  });
  return result;
}

function _applyErrorInterceptors(error: unknown) {
  // @ts-expect-error strict migration — TS7005
  _errorInterceptors.forEach(interceptor => {
    try {
      interceptor(error);
    } catch (e: any) {
      _log('error', 'Error interceptor error:', e.message);
    }
  });
}

function request(endpoint: string, options: Record<string,unknown>) {
  options = options || {};
  
  const requestConfig = _applyRequestInterceptors({
    endpoint,
    method: options.method || 'GET',
    headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers),
    body: options.body,
    timeout: options.timeout || _config.timeout,
    credentials: _config.withCredentials ? 'include' : 'same-origin',
    cache: options.cache !== false,
    cacheTTL: options.cacheTTL,
    useCircuitBreaker: options.useCircuitBreaker !== false && _config.useCircuitBreaker,
    useRetry: options.useRetry !== false && _config.useRetry,
    retries: options.retries !== undefined ? options.retries : _config.retries
  });
  
  const url = _config.baseUrl + requestConfig.endpoint;
  const cacheKey = _getCacheKey(url, { method: requestConfig.method, body: requestConfig.body });
  
  if (requestConfig.method === 'GET' && requestConfig.cache) {
    const cached = _getFromCache(cacheKey);
    if (cached) {
      _log('debug', 'Cache hit:', endpoint);
      return Promise.resolve(cached);
    }
  }
  
  const startTime = Date.now();
  _metrics.totalRequests++;
  
  const fetchFn = () => {
    const controller = new AbortController();
    // @ts-expect-error TS migration - TS2769
    const timeoutId = setTimeout(() => controller.abort(), requestConfig.timeout);
    const fetchOptions: Record<string, unknown> = {
      method: requestConfig.method,
      headers: requestConfig.headers,
      credentials: requestConfig.credentials,
      signal: controller.signal
    };

    if (requestConfig.body && requestConfig.method !== 'GET') {
      fetchOptions.body = typeof requestConfig.body === 'string' ? requestConfig.body : JSON.stringify(requestConfig.body);
    }

    return fetch(url, fetchOptions).then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }
      return response.json();
    }).catch(error => {
      clearTimeout(timeoutId);
      throw error;
    });
  };
  
  let executeRequest;
  
  // @ts-expect-error TS migration - TS2365
  if (requestConfig.useRetry && requestConfig.retries > 0) {
    // @ts-expect-error strict migration — TS2571
    executeRequest = () => retryWithJitter(fetchFn, {
      maxRetries: requestConfig.retries,
      operationName: `gateway:${endpoint}`
    // @ts-expect-error TS migration - TS2339
    }).then((result: unknown) => result.result);
  } else {
    executeRequest = fetchFn;
  }
  
  let finalPromise;
  
  if (requestConfig.useCircuitBreaker) {
    const breaker = getBreaker(`gateway:${endpoint.split('?')[0]}`, {});
    finalPromise = breaker.execute(executeRequest);
  } else {
    finalPromise = executeRequest();
  }
  
  return finalPromise.then((data: Record<string,unknown>) => {
    const latency = Date.now() - startTime;
    _metrics.successfulRequests++;
    _metrics.totalLatency += latency;
    _metrics.averageLatency = _metrics.totalLatency / _metrics.successfulRequests;
    
    if (requestConfig.method === 'GET' && requestConfig.cache) {
      // @ts-expect-error TS migration - TS2345
      _setCache(cacheKey, data, requestConfig.cacheTTL);
    }
    
    // @ts-expect-error TS migration - TS2345
    return _applyResponseInterceptors(data);
  }).catch((error: unknown) => {
    _metrics.failedRequests++;
    _applyErrorInterceptors(error);
    // @ts-expect-error TS migration - TS2339
    _log('error', 'Request failed:', endpoint, error.message);
    throw error;
  });
}

function get(endpoint: string, options: Record<string,unknown>) {
  return request(endpoint, Object.assign({}, options, { method: 'GET' }));
}

function post(endpoint: string, body: Record<string,unknown>, options: Record<string,unknown>) {
  return request(endpoint, Object.assign({}, options, { method: 'POST', body }));
}

function put(endpoint: string, body: Record<string,unknown>, options: Record<string,unknown>) {
  return request(endpoint, Object.assign({}, options, { method: 'PUT', body }));
}

function del(endpoint: string, options: Record<string,unknown>) {
  return request(endpoint, Object.assign({}, options, { method: 'DELETE' }));
}

function fetchHealth(options?: Record<string,unknown>) {
  options = options || {};
  return get(ENDPOINTS.HEALTH, {
    timeout: TIMEOUTS.API_HEALTH,
    cache: false,
    useRetry: options.useRetry !== false,
    retries: 1
  });
}

function fetchAlerts(options?: Record<string,unknown>) {
  options = options || {};
  return get(ENDPOINTS.ALERTS, {
    timeout: TIMEOUTS.API_ALERTS,
    cache: options.cache !== false,
    cacheTTL: 30000
  });
}

function fetchComponents(options?: Record<string,unknown>) {
  options = options || {};
  return get(ENDPOINTS.COMPONENTS, {
    cache: options.cache !== false,
    cacheTTL: 300000
  });
}

function fetchPermissions(options?: Record<string,unknown>) {
  options = options || {};
  return get(ENDPOINTS.PERMISSIONS, {
    cache: options.cache !== false,
    cacheTTL: 600000
  });
}

function saveComponentOrder(order: unknown, options: Record<string,unknown>) {
  options = options || {};
  return post(ENDPOINTS.ORDER_SAVE, { order }, {
    cache: false
  }).then((result: unknown) => {
    clearCache(ENDPOINTS.COMPONENTS);
    return result;
  });
}

function getMetrics() {
  return Object.assign({}, _metrics, {
    cacheSize: _cache.size,
    cacheHitRate: _metrics.totalRequests > 0 ? `${(_metrics.cachedResponses / _metrics.totalRequests * 100).toFixed(1)}%` : '0%'
  });
}

function resetMetrics() {
  _metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedResponses: 0,
    totalLatency: 0,
    averageLatency: 0
  };
}

function healthCheck() {
  const successRate = _metrics.totalRequests > 0 ? _metrics.successfulRequests / _metrics.totalRequests : 1;
  const checks = {
    goodSuccessRate: successRate >= 0.8,
    lowLatency: _metrics.averageLatency < 2000,
    cacheWorking: _cacheConfig.enabled,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    successRate: `${(successRate * 100).toFixed(1)}%`,
    averageLatency: `${_metrics.averageLatency.toFixed(0)}ms`,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    config: Object.assign({}, _config),
    metrics: getMetrics(),
    cacheConfig: Object.assign({}, _cacheConfig),
    interceptors: {
      request: _requestInterceptors.length,
      response: _responseInterceptors.length,
      error: _errorInterceptors.length
    },
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}

export {
  init,
  configure,
  request,
  get,
  post,
  put,
  del,
  fetchHealth,
  fetchAlerts,
  fetchComponents,
  fetchPermissions,
  saveComponentOrder,
  clearCache,
  addRequestInterceptor,
  addResponseInterceptor,
  addErrorInterceptor,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};

export default {
  VERSION,
  MODULE_ID,
  init,
  configure,
  request,
  get,
  post,
  put,
  del,
  fetchHealth,
  fetchAlerts,
  fetchComponents,
  fetchPermissions,
  saveComponentOrder,
  clearCache,
  addRequestInterceptor,
  addResponseInterceptor,
  addErrorInterceptor,
  getMetrics,
  healthCheck,
  info
};
