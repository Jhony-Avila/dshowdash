import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ENDPOINTS, TIMEOUTS } from "./constants.js";
import { retryWithJitter } from "./retry-with-jitter.js";
import { getBreaker } from "./circuit-breaker-api.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/header-gateway";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
let _config = {
  baseUrl: "",
  timeout: TIMEOUTS.API_DEFAULT,
  retries: 1,
  withCredentials: true,
  useCircuitBreaker: true,
  useRetry: true
};
const _cache = /* @__PURE__ */ new Map();
const _cacheConfig = {
  enabled: true,
  defaultTTL: 6e4,
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
const _requestInterceptors = [];
const _responseInterceptors = [];
const _errorInterceptors = [];
function init(config) {
  _initPorts();
  if (config) {
    _config = Object.assign({}, _config, config);
  }
  _log("info", "HeaderGateway inicializado");
}
function configure(options) {
  _config = Object.assign({}, _config, options);
}
function _getCacheKey(endpoint, options) {
  return `${endpoint}:${JSON.stringify(options || {})}`;
}
function _getFromCache(key) {
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
function _setCache(key, data, ttl) {
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
function clearCache(pattern) {
  if (pattern) {
    _cache.forEach((value, key) => {
      if (key.indexOf(pattern) !== -1) {
        _cache.delete(key);
      }
    });
  } else {
    _cache.clear();
  }
  _log("debug", "Cache limpo", pattern ? `pattern: ${pattern}` : "completo");
}
function addRequestInterceptor(fn) {
  _requestInterceptors.push(fn);
  return () => {
    const idx = _requestInterceptors.indexOf(fn);
    if (idx > -1) _requestInterceptors.splice(idx, 1);
  };
}
function addResponseInterceptor(fn) {
  _responseInterceptors.push(fn);
  return () => {
    const idx = _responseInterceptors.indexOf(fn);
    if (idx > -1) _responseInterceptors.splice(idx, 1);
  };
}
function addErrorInterceptor(fn) {
  _errorInterceptors.push(fn);
  return () => {
    const idx = _errorInterceptors.indexOf(fn);
    if (idx > -1) _errorInterceptors.splice(idx, 1);
  };
}
function _applyRequestInterceptors(config) {
  let result = config;
  _requestInterceptors.forEach((interceptor) => {
    try {
      result = interceptor(result) || result;
    } catch (e) {
      _log("error", "Request interceptor error:", e.message);
    }
  });
  return result;
}
function _applyResponseInterceptors(response) {
  let result = response;
  _responseInterceptors.forEach((interceptor) => {
    try {
      result = interceptor(result) || result;
    } catch (e) {
      _log("error", "Response interceptor error:", e.message);
    }
  });
  return result;
}
function _applyErrorInterceptors(error) {
  _errorInterceptors.forEach((interceptor) => {
    try {
      interceptor(error);
    } catch (e) {
      _log("error", "Error interceptor error:", e.message);
    }
  });
}
function request(endpoint, options) {
  options = options || {};
  const requestConfig = _applyRequestInterceptors({
    endpoint,
    method: options.method || "GET",
    headers: Object.assign({ "Content-Type": "application/json" }, options.headers),
    body: options.body,
    timeout: options.timeout || _config.timeout,
    credentials: _config.withCredentials ? "include" : "same-origin",
    cache: options.cache !== false,
    cacheTTL: options.cacheTTL,
    useCircuitBreaker: options.useCircuitBreaker !== false && _config.useCircuitBreaker,
    useRetry: options.useRetry !== false && _config.useRetry,
    retries: options.retries !== void 0 ? options.retries : _config.retries
  });
  const url = _config.baseUrl + requestConfig.endpoint;
  const cacheKey = _getCacheKey(url, { method: requestConfig.method, body: requestConfig.body });
  if (requestConfig.method === "GET" && requestConfig.cache) {
    const cached = _getFromCache(cacheKey);
    if (cached) {
      _log("debug", "Cache hit:", endpoint);
      return Promise.resolve(cached);
    }
  }
  const startTime = Date.now();
  _metrics.totalRequests++;
  const fetchFn = () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestConfig.timeout);
    const fetchOptions = {
      method: requestConfig.method,
      headers: requestConfig.headers,
      credentials: requestConfig.credentials,
      signal: controller.signal
    };
    if (requestConfig.body && requestConfig.method !== "GET") {
      fetchOptions.body = typeof requestConfig.body === "string" ? requestConfig.body : JSON.stringify(requestConfig.body);
    }
    return fetch(url, fetchOptions).then((response) => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      return response.json();
    }).catch((error) => {
      clearTimeout(timeoutId);
      throw error;
    });
  };
  let executeRequest;
  if (requestConfig.useRetry && requestConfig.retries > 0) {
    executeRequest = () => retryWithJitter(fetchFn, {
      maxRetries: requestConfig.retries,
      operationName: `gateway:${endpoint}`
      // @ts-expect-error TS migration - TS2339
    }).then((result) => result.result);
  } else {
    executeRequest = fetchFn;
  }
  let finalPromise;
  if (requestConfig.useCircuitBreaker) {
    const breaker = getBreaker(`gateway:${endpoint.split("?")[0]}`, {});
    finalPromise = breaker.execute(executeRequest);
  } else {
    finalPromise = executeRequest();
  }
  return finalPromise.then((data) => {
    const latency = Date.now() - startTime;
    _metrics.successfulRequests++;
    _metrics.totalLatency += latency;
    _metrics.averageLatency = _metrics.totalLatency / _metrics.successfulRequests;
    if (requestConfig.method === "GET" && requestConfig.cache) {
      _setCache(cacheKey, data, requestConfig.cacheTTL);
    }
    return _applyResponseInterceptors(data);
  }).catch((error) => {
    _metrics.failedRequests++;
    _applyErrorInterceptors(error);
    _log("error", "Request failed:", endpoint, error.message);
    throw error;
  });
}
function get(endpoint, options) {
  return request(endpoint, Object.assign({}, options, { method: "GET" }));
}
function post(endpoint, body, options) {
  return request(endpoint, Object.assign({}, options, { method: "POST", body }));
}
function put(endpoint, body, options) {
  return request(endpoint, Object.assign({}, options, { method: "PUT", body }));
}
function del(endpoint, options) {
  return request(endpoint, Object.assign({}, options, { method: "DELETE" }));
}
function fetchHealth(options) {
  options = options || {};
  return get(ENDPOINTS.HEALTH, {
    timeout: TIMEOUTS.API_HEALTH,
    cache: false,
    useRetry: options.useRetry !== false,
    retries: 1
  });
}
function fetchAlerts(options) {
  options = options || {};
  return get(ENDPOINTS.ALERTS, {
    timeout: TIMEOUTS.API_ALERTS,
    cache: options.cache !== false,
    cacheTTL: 3e4
  });
}
function fetchComponents(options) {
  options = options || {};
  return get(ENDPOINTS.COMPONENTS, {
    cache: options.cache !== false,
    cacheTTL: 3e5
  });
}
function fetchPermissions(options) {
  options = options || {};
  return get(ENDPOINTS.PERMISSIONS, {
    cache: options.cache !== false,
    cacheTTL: 6e5
  });
}
function saveComponentOrder(order, options) {
  options = options || {};
  return post(ENDPOINTS.ORDER_SAVE, { order }, {
    cache: false
  }).then((result) => {
    clearCache(ENDPOINTS.COMPONENTS);
    return result;
  });
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    cacheSize: _cache.size,
    cacheHitRate: _metrics.totalRequests > 0 ? `${(_metrics.cachedResponses / _metrics.totalRequests * 100).toFixed(1)}%` : "0%"
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
    lowLatency: _metrics.averageLatency < 2e3,
    cacheWorking: _cacheConfig.enabled,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    successRate: `${(successRate * 100).toFixed(1)}%`,
    averageLatency: `${_metrics.averageLatency.toFixed(0)}ms`,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
var header_gateway_default = {
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
export {
  MODULE_ID,
  VERSION,
  addErrorInterceptor,
  addRequestInterceptor,
  addResponseInterceptor,
  clearCache,
  configure,
  header_gateway_default as default,
  del,
  fetchAlerts,
  fetchComponents,
  fetchHealth,
  fetchPermissions,
  get,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  post,
  put,
  request,
  resetMetrics,
  saveComponentOrder
};
