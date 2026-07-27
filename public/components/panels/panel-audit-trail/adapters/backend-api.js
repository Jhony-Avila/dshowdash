import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
const MODULE_ID = "panel-audit-trail.adapters.backend-api";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
const API_ENDPOINTS = { audit: "/api/audit/", permissions: "/api/permission-audit/", frontend: "/api/logs/", security: "/api/security-events/" };
const CONFIG = { timeout: 15e3, retryAttempts: 3, retryDelay: 1e3, retryMultiplier: 2, cacheEnabled: true, cacheTTL: 3e4, maxCacheSize: 50 };
let _abortController = null;
const _cache = /* @__PURE__ */ new Map();
const _metrics = { requests: 0, successes: 0, errors: 0, retries: 0, cacheHits: 0, cacheMisses: 0, totalDuration: 0, lastRequestAt: null, lastError: null, lastSuccessAt: null, avgResponseTime: 0 };
function _emit(event, data = {}) {
  data = data || {};
  try {
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data));
  } catch (e) {
  }
}
function _log(level, ...rest) {
  const logger = _getPort("logger");
  if (logger && logger[level]) {
    const args = rest;
    logger[level](...[`[${MODULE_ID}]`].concat(args));
  }
}
function _getCSRFToken() {
  const csrf = _getPort("securityCSRF");
  if (csrf && csrf.getToken) return csrf.getToken();
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.content : "";
}
function _buildCacheKey(url, params) {
  return `${url}?${params.toString()}`;
}
function _getFromCache(key) {
  if (!CONFIG.cacheEnabled) return null;
  const cached = _cache.get(key);
  if (!cached) {
    _metrics.cacheMisses++;
    return null;
  }
  if (Date.now() - cached.timestamp > CONFIG.cacheTTL) {
    _cache.delete(key);
    _metrics.cacheMisses++;
    return null;
  }
  _metrics.cacheHits++;
  return cached.data;
}
function _setCache(key, data) {
  if (!CONFIG.cacheEnabled) return;
  if (_cache.size >= CONFIG.maxCacheSize) {
    const firstKey = _cache.keys().next().value;
    _cache.delete(firstKey);
  }
  _cache.set(key, { data, timestamp: Date.now() });
}
function _clearCache(pattern) {
  if (pattern) {
    const keys = _cache.keys();
    let k = keys.next();
    while (!k.done) {
      if (k.value.indexOf(pattern) !== -1) _cache.delete(k.value);
      k = keys.next();
    }
  } else {
    _cache.clear();
  }
}
function _delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
function _request(url, options) {
  options = options || {};
  const retries = options.retries !== void 0 ? options.retries : CONFIG.retryAttempts;
  const useCache = options.useCache !== false;
  const cacheKey = options.cacheKey || null;
  if (useCache && cacheKey) {
    const cached = _getFromCache(cacheKey);
    if (cached) {
      _log("debug", "Cache hit:", cacheKey);
      return Promise.resolve(cached);
    }
  }
  const startTime = performance.now();
  _metrics.requests++;
  _metrics.lastRequestAt = Date.now();
  let lastError = null;
  let attempt = 0;
  function tryRequest() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, CONFIG.timeout);
    if (_abortController) {
      _abortController.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }
    return fetch(url, { method: options.method || "GET", credentials: "include", headers: Object.assign({ "Content-Type": "application/json", "Accept": "application/json", "X-CSRF-Token": _getCSRFToken(), "X-Request-ID": `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }, options.headers), signal: controller.signal, body: options.body }).then((response) => {
      clearTimeout(timeoutId);
      if (response.status === 401) {
        _emit(AUTH_EVENTS.SESSION_EXPIRED);
        throw new Error("SESSION_EXPIRED");
      }
      if (response.status === 403) throw new Error("ACCESS_DENIED");
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "5";
        return _delay(parseInt(retryAfter, 10) * 1e3).then(() => {
          attempt++;
          return tryRequest();
        });
      }
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      return response.json();
    }).then((data) => {
      if (data.ok === false || data.success === false) throw new Error(data.error || data.message || "API_ERROR");
      const duration = performance.now() - startTime;
      _metrics.successes++;
      _metrics.totalDuration += duration;
      _metrics.avgResponseTime = _metrics.totalDuration / _metrics.successes;
      _metrics.lastSuccessAt = Date.now();
      if (useCache && cacheKey) _setCache(cacheKey, data);
      return data;
    }).catch((error) => {
      lastError = error;
      if (["SESSION_EXPIRED", "ACCESS_DENIED"].indexOf(error.message) !== -1) throw error;
      if (error.name === "AbortError") throw new Error("REQUEST_ABORTED");
      if (attempt < retries) {
        _metrics.retries++;
        const d = CONFIG.retryDelay * Math.pow(CONFIG.retryMultiplier, attempt);
        _log("warn", `Request failed, retrying in ${d}ms (attempt ${attempt + 1}/${retries})`, error.message);
        return _delay(d).then(() => {
          attempt++;
          return tryRequest();
        });
      }
      _metrics.errors++;
      _metrics.lastError = { message: lastError.message, timestamp: Date.now() };
      _log("error", "Request failed after retries:", lastError.message);
      throw lastError;
    });
  }
  return tryRequest();
}
function _buildParams(filters, defaults = {}) {
  filters = filters || {};
  defaults = defaults || {};
  const params = new URLSearchParams({ action: "list", limit: String(filters.limit || defaults.limit || 50), offset: String(filters.offset || defaults.offset || 0) });
  if (filters.days) params.append("days", String(filters.days));
  if (filters.userId) params.append("user_id", String(filters.userId));
  if (filters.search) params.append("search", String(filters.search));
  if (filters.startDate) params.append("start_date", String(filters.startDate));
  if (filters.endDate) params.append("end_date", String(filters.endDate));
  if (filters.sortBy) params.append("sort_by", String(filters.sortBy));
  if (filters.sortDir) params.append("sort_dir", String(filters.sortDir));
  const keys = Object.keys(filters);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (filters[key] && !params.has(key) && ["limit", "offset", "useCache"].indexOf(key) === -1) params.append(key, String(filters[key]));
  }
  for (let j = 0; j < keys.length; j++) {
    const k = keys[j];
    if (k.indexOf("inline_") === 0 && filters[k]) {
      const col = k.replace("inline_", "");
      params.append(col, String(filters[k]));
    }
  }
  return params;
}
function fetchAuditLogs(filters) {
  filters = filters || {};
  const params = _buildParams(filters);
  const cacheKey = _buildCacheKey(API_ENDPOINTS.audit, params);
  return _request(`${API_ENDPOINTS.audit}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then((data) => ({
    logs: data.entries || data.logs || data.data || [],
    total: data.total || data.count || 0,
    page: data.page || Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
    hasMore: data.hasMore !== void 0 ? data.hasMore : data.total > (filters.offset || 0) + (data.entries || []).length
  }));
}
function fetchPermissionLogs(filters) {
  filters = filters || {};
  const params = _buildParams(filters);
  if (filters.actionType) params.append("action_type", String(filters.actionType));
  if (filters.permissionKey) params.append("permission_key", String(filters.permissionKey));
  const cacheKey = _buildCacheKey(API_ENDPOINTS.permissions, params);
  return _request(`${API_ENDPOINTS.permissions}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then((data) => ({
    logs: data.logs || data.data || [],
    total: data.total || 0,
    hasMore: data.hasMore || false
  }));
}
function fetchFrontendLogs(filters) {
  filters = filters || {};
  const params = _buildParams(filters);
  if (filters.level) params.append("level", String(filters.level));
  if (filters.logger) params.append("logger", String(filters.logger));
  const cacheKey = _buildCacheKey(API_ENDPOINTS.frontend, params);
  return _request(`${API_ENDPOINTS.frontend}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then((data) => ({
    logs: data.logs || data.data || [],
    total: data.total || 0,
    hasMore: data.hasMore || false
  }));
}
function fetchSecurityLogs(filters) {
  filters = filters || {};
  const params = _buildParams(filters);
  if (filters.severity) params.append("severity", String(filters.severity));
  if (filters.eventType) params.append("event_type", String(filters.eventType));
  const cacheKey = _buildCacheKey(API_ENDPOINTS.security, params);
  return _request(`${API_ENDPOINTS.security}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then((data) => ({
    logs: data.logs || data.events || data.data || [],
    total: data.total || 0,
    hasMore: data.hasMore || false
  }));
}
function fetchLogs(tab, filters) {
  const fetchers = { audit: fetchAuditLogs, permissions: fetchPermissionLogs, frontend: fetchFrontendLogs, security: fetchSecurityLogs };
  const fetcher = fetchers[tab] || fetchers.audit;
  return fetcher(filters);
}
function exportLogs(tab, filters, format) {
  format = format || "csv";
  const endpoint = API_ENDPOINTS[tab] || API_ENDPOINTS.audit;
  const params = new URLSearchParams(Object.assign({ action: "export", format, limit: 1e4 }, filters));
  return _request(`${endpoint}?${params}`, { useCache: false });
}
function fetchLogDetails(tab, logId) {
  const endpoint = API_ENDPOINTS[tab] || API_ENDPOINTS.audit;
  const params = new URLSearchParams({ action: "detail", id: logId });
  return _request(`${endpoint}?${params}`, { useCache: true, cacheKey: `detail-${tab}-${logId}` });
}
function setAbortController(controller) {
  _abortController = controller;
}
function abort() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}
function createAbortController() {
  abort();
  _abortController = new AbortController();
  return _abortController;
}
function clearCache(tab) {
  if (tab) _clearCache(API_ENDPOINTS[tab]);
  else _clearCache();
}
function getCacheStats() {
  return { size: _cache.size, maxSize: CONFIG.maxCacheSize, ttl: CONFIG.cacheTTL, hits: _metrics.cacheHits, misses: _metrics.cacheMisses, hitRate: _metrics.cacheHits + _metrics.cacheMisses > 0 ? `${(_metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses) * 100).toFixed(1)}%` : "0%" };
}
function getMetrics() {
  return Object.assign({ successRate: _metrics.requests > 0 ? `${(_metrics.successes / _metrics.requests * 100).toFixed(1)}%` : "0%", cache: getCacheStats() }, _metrics);
}
function resetMetrics() {
  _metrics.requests = 0;
  _metrics.successes = 0;
  _metrics.errors = 0;
  _metrics.retries = 0;
  _metrics.cacheHits = 0;
  _metrics.cacheMisses = 0;
  _metrics.totalDuration = 0;
  _metrics.avgResponseTime = 0;
}
function getLastError() {
  return _metrics.lastError;
}
function healthCheck() {
  const errorRate = _metrics.requests > 0 ? _metrics.errors / _metrics.requests : 0;
  let status = "HEALTHY";
  if (errorRate > 0.5) status = "UNHEALTHY";
  else if (errorRate > 0.2 || _metrics.avgResponseTime > 5e3) status = "DEGRADED";
  return { status, metrics: getMetrics(), config: { timeout: CONFIG.timeout, retryAttempts: CONFIG.retryAttempts, cacheEnabled: CONFIG.cacheEnabled, cacheTTL: CONFIG.cacheTTL }, endpoints: Object.keys(API_ENDPOINTS), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var backend_api_default = { VERSION, MODULE_ID, fetchAuditLogs, fetchPermissionLogs, fetchFrontendLogs, fetchSecurityLogs, fetchLogs, fetchLogDetails, exportLogs, setAbortController, createAbortController, abort, clearCache, getCacheStats, getMetrics, resetMetrics, getLastError, healthCheck, getVersion, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  abort,
  clearCache,
  createAbortController,
  backend_api_default as default,
  exportLogs,
  fetchAuditLogs,
  fetchFrontendLogs,
  fetchLogDetails,
  fetchLogs,
  fetchPermissionLogs,
  fetchSecurityLogs,
  getCacheStats,
  getLastError,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  setAbortController
};
