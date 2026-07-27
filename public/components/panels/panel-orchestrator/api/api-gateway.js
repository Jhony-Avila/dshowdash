import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS } from "../bus/events-map.js";
import apiPolicies from "./api-policies.js";
import logger from "../utils/logger.js";
import { normalizeApiResponse } from "../utils/normalization.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-api-gateway";
class ApiGateway {
  constructor() {
    this.pendingRequests = /* @__PURE__ */ new Map();
    this.cache = /* @__PURE__ */ new Map();
    this.stats = { totalRequests: 0, successCount: 0, failureCount: 0, cacheHits: 0, dedupeHits: 0, retryCount: 0 };
    this.initialized = false;
    this.destroyed = false;
    this.initTimestamp = null;
  }
  getVersion() {
    return VERSION;
  }
  isInitialized() {
    return this.initialized && !this.destroyed;
  }
  healthCheck() {
    const issues = [];
    if (!this.initialized) issues.push("Not initialized");
    if (this.destroyed) issues.push("Is destroyed");
    if (this.stats.failureCount > this.stats.successCount) {
      issues.push("More failures than successes");
    }
    const openCircuits = apiPolicies.getOpenCircuits();
    if (openCircuits.length > 0) {
      issues.push(`Open circuits: ${openCircuits.join(", ")}`);
    }
    return { healthy: issues.length === 0, version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, stats: this.stats, openCircuits, issues: issues.length > 0 ? issues : null, timestamp: Date.now() };
  }
  init() {
    if (this.initialized) return this;
    this.initialized = true;
    this.destroyed = false;
    this.initTimestamp = Date.now();
    logger.info(`API Gateway inicializado (${VERSION})`);
    return this;
  }
  async request(endpoint, options = {}) {
    const requestId = this._generateRequestId(endpoint, options);
    const policy = apiPolicies.getPolicy(endpoint);
    if (apiPolicies.isCircuitOpen(endpoint)) {
      logger.warn(`Circuit breaker aberto para: ${endpoint}`);
      orchestratorBus.emit(ORCHESTRATOR_EVENTS.API_CIRCUIT_OPEN, { endpoint, moduleId: MODULE_ID });
      throw new Error(`Circuit breaker aberto: ${endpoint}`);
    }
    if (options.cache !== false && this.cache.has(requestId)) {
      const cached = this.cache.get(requestId);
      if (Date.now() - cached.timestamp < (options.cacheTTL || policy.cacheTTL || 6e4)) {
        this.stats.cacheHits++;
        logger.debug(`Cache hit: ${endpoint}`);
        return cached.data;
      }
      this.cache.delete(requestId);
    }
    if (options.dedupe !== false && this.pendingRequests.has(requestId)) {
      this.stats.dedupeHits++;
      logger.debug(`Dedupe hit: ${endpoint}`);
      return this.pendingRequests.get(requestId);
    }
    const requestPromise = this._executeRequest(endpoint, options, policy);
    this.pendingRequests.set(requestId, requestPromise);
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }
  // @ts-expect-error TS migration - TS2551
  async _executeRequest(endpoint, options, policy) {
    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;
    while (attempt <= policy.maxRetries) {
      try {
        this.stats.totalRequests++;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), policy.timeout);
        const response = await fetch(endpoint, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const normalized = normalizeApiResponse({ success: true, data });
        this.stats.successCount++;
        apiPolicies.recordSuccess(endpoint);
        const duration = Date.now() - startTime;
        if (options.cache !== false) {
          this.cache.set(this._generateRequestId(endpoint, options), { data: normalized, timestamp: Date.now() });
        }
        orchestratorBus.emit(ORCHESTRATOR_EVENTS.API_SUCCESS, { endpoint, duration, cached: false, moduleId: MODULE_ID });
        return normalized;
      } catch (error) {
        lastError = error;
        attempt++;
        if (attempt <= policy.maxRetries) {
          this.stats.retryCount++;
          const backoff = apiPolicies.calculateBackoff(attempt, policy);
          logger.warn(`Retry ${attempt}/${policy.maxRetries} para ${endpoint}`, { backoff });
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }
    this.stats.failureCount++;
    apiPolicies.recordFailure(endpoint);
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.API_FAILURE, { endpoint, error: lastError.message, attempts: attempt, moduleId: MODULE_ID });
    throw lastError;
  }
  _generateRequestId(endpoint, options = {}) {
    const method = options.method || "GET";
    const body = options.body ? JSON.stringify(options.body) : "";
    return `${method}:${endpoint}:${body}`;
  }
  clearCache(endpoint = null) {
    if (endpoint) {
      for (const [key] of this.cache) {
        if (key.includes(endpoint)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    logger.info("Cache limpo", { endpoint });
  }
  getStats() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, ...this.stats, pendingCount: this.pendingRequests.size, cacheSize: this.cache.size, uptime: this.initTimestamp ? Date.now() - this.initTimestamp : 0 };
  }
  reset() {
    this.pendingRequests.clear();
    this.cache.clear();
    this.stats = { totalRequests: 0, successCount: 0, failureCount: 0, cacheHits: 0, dedupeHits: 0, retryCount: 0 };
    this.destroyed = false;
    apiPolicies.reset();
    logger.info("API Gateway resetado");
  }
  destroy() {
    this.pendingRequests.clear();
    this.cache.clear();
    this.initialized = false;
    this.destroyed = true;
    logger.info("API Gateway destru\xEDdo");
  }
}
const apiGateway = new ApiGateway();
var api_gateway_default = apiGateway;
export {
  ApiGateway,
  MODULE_ID,
  VERSION,
  apiGateway,
  api_gateway_default as default
};
