import { AUTH_EVENTS, AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
import { API_EVENTS } from "/core/runtime/events/catalog/api.events.js";
import { PAINEL_ID, API_ENDPOINT } from "../core/constants.js";
import { EventBusPort, AuthPort } from "../ports/index.js";
const MODULE_ID = "panel-16:api";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CONFIG = Object.freeze({
  TIMEOUT_MS: 15e3,
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 1e3,
  RETRY_MAX_DELAY_MS: 1e4,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_RESET_MS: 3e4,
  RETRYABLE_ERRORS: ["NETWORK_ERROR", "HTTP_500", "HTTP_502", "HTTP_503", "HTTP_504", "TIMEOUT"]
});
function _emit(eventName, data = {}) {
  EventBusPort.emit(eventName, { ...data, source: MODULE_ID });
}
function _isAuthenticated() {
  return AuthPort.isAuthenticated();
}
function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function _calculateBackoff(attempt, baseDelay, maxDelay) {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = delay * 0.2 * Math.random();
  return Math.floor(delay + jitter);
}
class CircuitBreaker {
  constructor(threshold, resetTimeout) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
    this.failures = 0;
    this.lastFailure = 0;
    this.state = "CLOSED";
  }
  recordSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }
  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      _emit(API_EVENTS.CIRCUIT_OPEN, { failures: this.failures });
    }
  }
  canRequest() {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailure >= this.resetTimeout) {
        this.state = "HALF_OPEN";
        return true;
      }
      return false;
    }
    return true;
  }
  getState() {
    return { state: this.state, failures: this.failures, lastFailure: this.lastFailure };
  }
}
class ApiClient {
  constructor(panelId, logger) {
    this.panelId = panelId || PAINEL_ID;
    this.logger = logger;
    this.activeController = null;
    this.circuitBreaker = new CircuitBreaker(CONFIG.CIRCUIT_BREAKER_THRESHOLD, CONFIG.CIRCUIT_BREAKER_RESET_MS);
    this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, retryCount: 0, avgResponseTime: 0, lastResponseTime: 0, circuitBreakerTrips: 0 };
    this._responseTimeSum = 0;
  }
  async fetchData(options = {}) {
    if (!_isAuthenticated()) {
      _emit(AUTH_INTENTS.LOGIN, { source: this.panelId });
      return { success: false, error: "AUTH_REQUIRED" };
    }
    if (!this.circuitBreaker.canRequest()) {
      this.logger?.warn("fetch.circuit-open", { state: this.circuitBreaker.getState() });
      return { success: false, error: "CIRCUIT_OPEN", retryAfter: CONFIG.CIRCUIT_BREAKER_RESET_MS };
    }
    const { action = "list", signal, timeout = CONFIG.TIMEOUT_MS, retries = CONFIG.MAX_RETRIES, ...params } = options;
    let lastError = null;
    for (let attempt = 0; attempt <= Number(retries); attempt++) {
      const result = await this._executeRequest(action, params, signal, timeout);
      if (result.success) {
        this.circuitBreaker.recordSuccess();
        return result;
      }
      lastError = result.error;
      if (!CONFIG.RETRYABLE_ERRORS.includes(result.error) || attempt === retries) {
        this.circuitBreaker.recordFailure();
        return result;
      }
      const delay = _calculateBackoff(attempt, CONFIG.RETRY_BASE_DELAY_MS, CONFIG.RETRY_MAX_DELAY_MS);
      this._metrics.retryCount++;
      this.logger?.debug("fetch.retry", { attempt: attempt + 1, delay, error: result.error });
      _emit(API_EVENTS.RETRY, { attempt: attempt + 1, delay, error: result.error });
      await _sleep(delay);
    }
    this.circuitBreaker.recordFailure();
    return { success: false, error: lastError || "MAX_RETRIES_EXCEEDED" };
  }
  async _executeRequest(action, params, externalSignal, timeout) {
    const controller = new AbortController();
    this.activeController = controller;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (externalSignal) externalSignal.addEventListener("abort", () => controller.abort());
    const queryParams = new URLSearchParams();
    queryParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== void 0 && v !== null && v !== "") queryParams.set(k, String(v));
    });
    const url = `${API_ENDPOINT}?${queryParams}`;
    this._metrics.fetchCount++;
    const startTime = performance.now();
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: "include", headers: { "Content-Type": "application/json", "X-Panel-Id": this.panelId, "X-Request-Id": `${this.panelId}-${Date.now()}` } });
      clearTimeout(timeoutId);
      this._recordResponseTime(startTime);
      if (response.status === 401) {
        _emit(AUTH_EVENTS.SESSION_EXPIRED, { source: this.panelId });
        return { success: false, error: "AUTH_REQUIRED" };
      }
      if (response.status === 403) return { success: false, error: "FORBIDDEN" };
      if (response.status >= 500) {
        this._metrics.errorCount++;
        return { success: false, error: `HTTP_${response.status}` };
      }
      if (!response.ok) {
        this._metrics.errorCount++;
        return { success: false, error: `HTTP_${response.status}` };
      }
      const data = await response.json();
      if (data && data.ok) {
        this._metrics.successCount++;
        return { success: true, payload: data.data };
      }
      this._metrics.errorCount++;
      return { success: false, error: data?.error || "INVALID_RESPONSE" };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        if (externalSignal?.aborted) return { success: false, error: "REQUEST_ABORTED" };
        this._metrics.errorCount++;
        return { success: false, error: "TIMEOUT" };
      }
      this._metrics.errorCount++;
      this.logger?.error("fetch.error", { error: error.message });
      return { success: false, error: "NETWORK_ERROR", message: error.message };
    }
  }
  _recordResponseTime(startTime) {
    const responseTime = performance.now() - startTime;
    this._metrics.lastResponseTime = Math.round(responseTime);
    this._responseTimeSum += responseTime;
    this._metrics.avgResponseTime = Math.round(this._responseTimeSum / this._metrics.fetchCount);
  }
  async getKPIs(options = {}) {
    return this.fetchData({ ...options, action: "kpis" });
  }
  async getList(options = {}) {
    return this.fetchData({ ...options, action: "list" });
  }
  async getFornecedor360(id, options = {}) {
    return this.fetchData({ ...options, action: "detail", id });
  }
  async saveFornecedor(data, options = {}) {
    return this.fetchData({ ...options, action: "save", ...data });
  }
  async deleteFornecedor(id, options = {}) {
    return this.fetchData({ ...options, action: "delete", id });
  }
  cancel() {
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }
  }
  resetCircuitBreaker() {
    this.circuitBreaker = new CircuitBreaker(CONFIG.CIRCUIT_BREAKER_THRESHOLD, CONFIG.CIRCUIT_BREAKER_RESET_MS);
    this.logger?.info("circuit-breaker.reset");
  }
  getMetrics() {
    return { ...this._metrics, circuitBreaker: this.circuitBreaker.getState() };
  }
  healthCheck() {
    const metrics = this.getMetrics();
    const circuitState = this.circuitBreaker.getState();
    const checks = { circuitClosed: circuitState.state === "CLOSED", lowErrorRate: metrics.fetchCount === 0 || metrics.errorCount / metrics.fetchCount < 0.3, acceptableResponseTime: metrics.avgResponseTime < 5e3, recentSuccess: metrics.successCount > 0, p18IntentsAvailable: true };
    const score = Object.values(checks).filter(Boolean).length;
    return { status: score === 5 ? "HEALTHY" : score >= 3 ? "DEGRADED" : "UNHEALTHY", score, maxScore: 5, checks, metrics: { fetchCount: metrics.fetchCount, successRate: metrics.fetchCount ? `${(metrics.successCount / metrics.fetchCount * 100).toFixed(1)}%` : "N/A", avgResponseTime: `${metrics.avgResponseTime}ms`, retryCount: metrics.retryCount, circuitState: circuitState.state }, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, endpoint: API_ENDPOINT, usingP18Intents: true, config: { timeout: CONFIG.TIMEOUT_MS, maxRetries: CONFIG.MAX_RETRIES, circuitBreakerThreshold: CONFIG.CIRCUIT_BREAKER_THRESHOLD }, metrics: this.getMetrics(), health: this.healthCheck() };
  }
}
var api_default = ApiClient;
export {
  ApiClient,
  MODULE_ID,
  VERSION,
  api_default as default
};
