import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { fetchWithTimeout } from "./fetch.js";
const VERSION = "5.5.0-P17WI";
const MODULE_ID = "header/api/health";
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
class HealthAPI {
  // @ts-expect-error TS migration - TS2339
  constructor(config, timers, logger, eventBus) {
    if (!config || !config.api) throw new TypeError("Config \xE9 obrigat\xF3rio e deve conter api");
    this.config = { endpoint: config.api.healthEndpoint || "/api/health/status.php", withCredentials: config.api.healthWithCredentials || false, timeout: config.api.timeout || 6e3, retries: config.api.retries || 0, instanceId: config.instanceId || "health-api-default" };
    this.timers = timers;
    this.logger = logger || this._createLogger();
    this.eventBus = eventBus;
    this._debug = false;
    this._metrics = { totalRequests: 0, totalSuccesses: 0, totalFailures: 0, totalTimeouts: 0, avgRtt: 0, minRtt: Infinity, maxRtt: 0, lastRequestAt: null, lastSuccessAt: null, lastFailureAt: null };
    this.history = [];
    this.maxHistorySize = 50;
    this.isDestroyed = false;
    this.isPinging = false;
  }
  _createLogger() {
    const prefix = `[HealthAPI:${this.config.instanceId}]`;
    return { debug: (...args) => _log("debug", prefix, ...args), info: (...args) => _log("info", prefix, ...args), warn: (...args) => _log("warn", prefix, ...args), error: (...args) => _log("error", prefix, ...args) };
  }
  _log(level, ...args) {
    if (!this._debug && level === "debug") return;
    _log(level, ...args);
  }
  // @ts-expect-error TS migration - TS2339
  async ping() {
    if (this.isDestroyed) {
      this._log("warn", "HealthAPI destru\xEDdo - ping ignorado");
      return this._getErrorResponse("API_DESTROYED", 0);
    }
    if (this.isPinging) {
      this._log("debug", "Ping j\xE1 em andamento - ignorado");
      return this._getErrorResponse("PING_IN_PROGRESS", 0);
    }
    this.isPinging = true;
    const startTime = performance.now();
    this._metrics.totalRequests++;
    this._metrics.lastRequestAt = Date.now();
    let controller = null;
    try {
      controller = new AbortController();
      if (this.timers) this.timers.setAbortController("health", controller);
      const fetchOptions = { method: "GET", signal: controller.signal, cache: "no-store", headers: { "X-Requested-With": "XMLHttpRequest", "Cache-Control": "no-cache, no-store, must-revalidate" }, timeout: this.config.timeout };
      if (this.config.withCredentials) fetchOptions.credentials = "include";
      const response = await fetchWithTimeout(this.config.endpoint, fetchOptions);
      const rttMs = Math.round(performance.now() - startTime);
      this._metrics.totalSuccesses++;
      this._metrics.lastSuccessAt = Date.now();
      this._updateRttMetrics(rttMs);
      const result = { ok: response.ok, status: response.status, rttMs, timestamp: Date.now() };
      if (response.ok) {
        try {
          result.data = await response.json();
        } catch (e) {
        }
      }
      this._addToHistory(result);
      return result;
    } catch (error) {
      const rttMs = Math.round(performance.now() - startTime);
      this._metrics.totalFailures++;
      this._metrics.lastFailureAt = Date.now();
      let errorType = "UNKNOWN_ERROR";
      if (error.name === "AbortError") errorType = "REQUEST_ABORTED";
      else if (error.message.includes("timeout")) {
        errorType = "REQUEST_TIMEOUT";
        this._metrics.totalTimeouts++;
      } else if (error.message.includes("Network")) errorType = "NETWORK_ERROR";
      else if (error.message.includes("HTTP")) errorType = "HTTP_ERROR";
      const result = this._getErrorResponse(errorType, rttMs, error.message);
      this._addToHistory(result);
      this._log("warn", `Health ping falhou: ${errorType} (${rttMs}ms)`);
      return result;
    } finally {
      this.isPinging = false;
      if (this.timers) this.timers.abortAbortController("health");
    }
  }
  // @ts-expect-error strict migration — TS2322
  _getErrorResponse(errorType, rttMs, message = null) {
    return { ok: false, status: null, error: errorType, errorMessage: message, rttMs, timestamp: Date.now() };
  }
  // @ts-expect-error TS migration - TS2365, TS2345
  _updateRttMetrics(rttMs) {
    const total = this._metrics.totalSuccesses;
    this._metrics.avgRtt = (this._metrics.avgRtt * (total - 1) + rttMs) / total;
    this._metrics.minRtt = Math.min(this._metrics.minRtt, rttMs);
    this._metrics.maxRtt = Math.max(this._metrics.maxRtt, rttMs);
  }
  // @ts-expect-error TS migration - TS2698
  _addToHistory(result) {
    this.history.push({ ...result, timestamp: Date.now() });
    if (this.history.length > this.maxHistorySize) this.history.shift();
  }
  getMetrics() {
    const successRate = this._metrics.totalRequests > 0 ? this._metrics.totalSuccesses / this._metrics.totalRequests : 0;
    return { ...this._metrics, avgRtt: Math.round(this._metrics.avgRtt), minRtt: this._metrics.minRtt === Infinity ? 0 : this._metrics.minRtt, maxRtt: this._metrics.maxRtt, successRate: Math.round(successRate * 100) / 100, historySize: this.history.length, isDestroyed: this.isDestroyed, isPinging: this.isPinging };
  }
  healthCheck() {
    const metrics = this.getMetrics();
    const checks = { notDestroyed: !this.isDestroyed, notPinging: !this.isPinging, hasEndpoint: !!this.config.endpoint, goodSuccessRate: metrics.successRate > 0.5 || metrics.totalRequests === 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), endpoint: this.config.endpoint, successRate: metrics.successRate, avgRtt: metrics.avgRtt, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  // @ts-expect-error strict migration — TS2322
  getHistory(limit = null) {
    const history = [...this.history];
    return limit ? history.slice(-limit) : history;
  }
  getRecentSuccesses(count = 5) {
    return this.history.filter((h) => h.ok).slice(-count);
  }
  getRecentFailures(count = 5) {
    return this.history.filter((h) => !h.ok).slice(-count);
  }
  calculateUptime() {
    if (this.history.length === 0) return 1;
    const recent = this.history.slice(-20);
    const successes = recent.filter((h) => h.ok).length;
    return successes / recent.length;
  }
  resetMetrics() {
    this._metrics = { totalRequests: 0, totalSuccesses: 0, totalFailures: 0, totalTimeouts: 0, avgRtt: 0, minRtt: Infinity, maxRtt: 0, lastRequestAt: null, lastSuccessAt: null, lastFailureAt: null };
    this.history = [];
    this._log("info", "M\xE9tricas resetadas");
  }
  destroy() {
    if (this.isDestroyed) {
      this._log("warn", "HealthAPI j\xE1 destru\xEDdo");
      return;
    }
    if (this.isPinging && this.timers) this.timers.abortAbortController("health");
    this.history = [];
    this.isDestroyed = true;
    this.isPinging = false;
    this._log("info", "HealthAPI destru\xEDdo");
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), endpoint: this.config.endpoint, metrics: this.getMetrics(), healthCheck: this.healthCheck() };
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
var health_default = HealthAPI;
export {
  HealthAPI,
  MODULE_ID,
  VERSION,
  health_default as default,
  getPorts,
  getVersion,
  injectPorts,
  setDebug
};
