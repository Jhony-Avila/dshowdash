import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { fetchWithTimeout } from "./fetch.js";
const VERSION = "5.5.0-P17WI";
const MODULE_ID = "header/api/alerts";
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
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(`[${MODULE_ID}]`, ...args);
};
class AlertsAPI {
  // @ts-expect-error TS migration - TS2339
  constructor(config, logger, eventBus) {
    if (!config || !config.api) throw new TypeError("Config \xE9 obrigat\xF3rio e deve conter api");
    this.config = { endpoint: config.api.alertsEndpoint || "/api/alerts/header-alerts.php", timeout: config.api.timeout || 6e3, retries: config.api.retries || 0, instanceId: config.instanceId || "alerts-api-default" };
    this.logger = logger || this._createLogger();
    this.eventBus = eventBus;
    this._debug = false;
    this.cache = { data: null, timestamp: null, ttl: 3e4 };
    this._metrics = { totalRequests: 0, totalSuccesses: 0, totalFailures: 0, cacheHits: 0, cacheMisses: 0, lastRequestAt: null, lastSuccessAt: null, lastFailureAt: null, avgResponseTime: 0 };
    this.history = [];
    this.maxHistorySize = 50;
    this.isDestroyed = false;
    this.isFetching = false;
  }
  _createLogger() {
    const prefix = `[AlertsAPI:${this.config.instanceId}]`;
    return { debug: (...args) => _log("debug", prefix, ...args), info: (...args) => _log("info", prefix, ...args), warn: (...args) => _log("warn", prefix, ...args), error: (...args) => _log("error", prefix, ...args) };
  }
  _log(level, ...args) {
    if (!this._debug && level === "debug") return;
    _log(level, ...args);
  }
  _isCacheValid() {
    if (!this.cache.data || !this.cache.timestamp) return false;
    return Date.now() - this.cache.timestamp < this.cache.ttl;
  }
  async getAlerts(options = {}) {
    if (this.isDestroyed) {
      this._log("warn", "AlertsAPI destru\xEDdo - getAlerts ignorado");
      return this._getErrorResponse("API_DESTROYED");
    }
    const { forceRefresh = false, timeout = this.config.timeout } = options;
    if (!forceRefresh && this._isCacheValid()) {
      this._metrics.cacheHits++;
      this._log("debug", "Cache hit");
      return { ...this.cache.data, fromCache: true };
    }
    this._metrics.cacheMisses++;
    if (this.isFetching) {
      this._log("debug", "Fetch j\xE1 em andamento");
      if (this.cache.data) return { ...this.cache.data, fromCache: true, stale: true };
      return this._getErrorResponse("FETCH_IN_PROGRESS");
    }
    this.isFetching = true;
    const startTime = performance.now();
    this._metrics.totalRequests++;
    this._metrics.lastRequestAt = Date.now();
    try {
      const response = await fetchWithTimeout(this.config.endpoint, { method: "GET", cache: "no-store", headers: { "X-Requested-With": "XMLHttpRequest", "Cache-Control": "no-cache, no-store, must-revalidate" }, timeout });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      const duration = Math.round(performance.now() - startTime);
      const validated = this._validateResponse(data);
      this.cache.data = validated;
      this.cache.timestamp = Date.now();
      this._metrics.totalSuccesses++;
      this._metrics.lastSuccessAt = Date.now();
      this._updateAvgResponseTime(duration);
      const result = { ...validated, success: true, fromCache: false, duration };
      this._addToHistory(result);
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this._metrics.totalFailures++;
      this._metrics.lastFailureAt = Date.now();
      let errorType = "UNKNOWN_ERROR";
      if (error.name === "AbortError") errorType = "REQUEST_ABORTED";
      else if (error.message.includes("timeout")) errorType = "REQUEST_TIMEOUT";
      else if (error.message.includes("Network")) errorType = "NETWORK_ERROR";
      else if (error.message.includes("HTTP")) errorType = "HTTP_ERROR";
      else if (error.message.includes("JSON")) errorType = "PARSE_ERROR";
      this._log("error", "Erro ao buscar alertas:", error.message);
      const result = this._getErrorResponse(errorType, error.message, duration);
      this._addToHistory(result);
      if (this.cache.data && !forceRefresh) {
        this._log("warn", "Retornando cache ap\xF3s erro");
        return { ...this.cache.data, success: true, fromCache: true, stale: true, error: errorType };
      }
      return result;
    } finally {
      this.isFetching = false;
    }
  }
  // @ts-expect-error TS migration - TS2365
  _validateResponse(data) {
    if (!data || typeof data !== "object") throw new TypeError("Resposta inv\xE1lida");
    return { critical: typeof data.critical_count === "number" ? Math.max(0, data.critical_count) : 0, warning: typeof data.warning_count === "number" ? Math.max(0, data.warning_count) : 0, info: typeof data.info_count === "number" ? Math.max(0, data.info_count) : 0, total: (data.critical_count || 0) + (data.warning_count || 0) + (data.info_count || 0), lastErrorAt: data.last_error_at || null, lastWarningAt: data.last_warning_at || null, timestamp: Date.now() };
  }
  // @ts-expect-error strict migration — TS2322
  _getErrorResponse(errorType, message = null, duration = 0) {
    return { success: false, error: errorType, errorMessage: message, critical: 0, warning: 0, info: 0, total: 0, lastErrorAt: null, lastWarningAt: null, duration, timestamp: Date.now() };
  }
  _updateAvgResponseTime(duration) {
    const total = this._metrics.totalSuccesses;
    this._metrics.avgResponseTime = (this._metrics.avgResponseTime * (total - 1) + duration) / total;
  }
  // @ts-expect-error TS migration - TS2698
  _addToHistory(result) {
    this.history.push({ ...result, timestamp: Date.now() });
    if (this.history.length > this.maxHistorySize) this.history.shift();
  }
  getMetrics() {
    const successRate = this._metrics.totalRequests > 0 ? this._metrics.totalSuccesses / this._metrics.totalRequests : 0;
    const cacheHitRate = this._metrics.cacheHits + this._metrics.cacheMisses > 0 ? this._metrics.cacheHits / (this._metrics.cacheHits + this._metrics.cacheMisses) : 0;
    return { ...this._metrics, avgResponseTime: Math.round(this._metrics.avgResponseTime), successRate: Math.round(successRate * 100) / 100, cacheHitRate: Math.round(cacheHitRate * 100) / 100, cacheValid: this._isCacheValid(), cacheAge: this.cache.timestamp ? Date.now() - this.cache.timestamp : null, historySize: this.history.length, isDestroyed: this.isDestroyed, isFetching: this.isFetching };
  }
  healthCheck() {
    const metrics = this.getMetrics();
    const checks = { notDestroyed: !this.isDestroyed, notFetching: !this.isFetching, hasEndpoint: !!this.config.endpoint, goodSuccessRate: metrics.successRate > 0.5 || metrics.totalRequests === 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), endpoint: this.config.endpoint, successRate: metrics.successRate, cacheHitRate: metrics.cacheHitRate, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  // @ts-expect-error strict migration — TS2322
  getHistory(limit = null) {
    const history = [...this.history];
    return limit ? history.slice(-limit) : history;
  }
  getCachedData() {
    if (!this._isCacheValid()) return null;
    return { ...this.cache.data };
  }
  getCacheAge() {
    if (!this.cache.timestamp) return null;
    return Date.now() - this.cache.timestamp;
  }
  invalidateCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
    this._log("debug", "Cache invalidado");
  }
  setCacheTTL(ttl) {
    if (typeof ttl !== "number" || ttl < 0) throw new TypeError("TTL deve ser n\xFAmero positivo");
    this.cache.ttl = ttl;
    this._log("info", `Cache TTL: ${ttl}ms`);
  }
  getRecentSuccesses(count = 5) {
    return this.history.filter((h) => h.success).slice(-count);
  }
  getRecentFailures(count = 5) {
    return this.history.filter((h) => !h.success).slice(-count);
  }
  resetMetrics() {
    this._metrics = { totalRequests: 0, totalSuccesses: 0, totalFailures: 0, cacheHits: 0, cacheMisses: 0, lastRequestAt: null, lastSuccessAt: null, lastFailureAt: null, avgResponseTime: 0 };
    this.history = [];
    this._log("info", "M\xE9tricas resetadas");
  }
  destroy() {
    if (this.isDestroyed) {
      this._log("warn", "AlertsAPI j\xE1 destru\xEDdo");
      return;
    }
    this.cache.data = null;
    this.cache.timestamp = null;
    this.history = [];
    this.isDestroyed = true;
    this.isFetching = false;
    this._log("info", "AlertsAPI destru\xEDdo");
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), endpoint: this.config.endpoint, cacheValid: this._isCacheValid(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
}
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
}
var alerts_default = AlertsAPI;
export {
  AlertsAPI,
  MODULE_ID,
  VERSION,
  alerts_default as default,
  getPorts,
  getVersion,
  injectPorts,
  setDebug
};
