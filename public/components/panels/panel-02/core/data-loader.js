import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import { REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED } from "./constants.js";
import { STATES } from "./states.js";
import { MAX_CONSECUTIVE_ERRORS, REQUEST_TIMEOUT } from "./config.js";
const MODULE_ID = "panel-02/core/data-loader";
const VERSION = "9.3.0-P2-ENTERPRISE";
function DataLoader(context) {
  this.ctx = context;
  this.currentRequestId = 0;
  this.activeLoadRequest = null;
}
DataLoader.prototype.loadData = async function() {
  const self = this;
  const ctx = self.ctx;
  const mounted = ctx.mounted;
  const destroyed = ctx.destroyed;
  const circuitBreaker = ctx.circuitBreaker;
  const store = ctx.store;
  const apiClient = ctx.apiClient;
  const abortController = ctx.abortController;
  const telemetry = ctx.telemetry;
  if (!mounted || destroyed) return;
  try {
    circuitBreaker.check();
  } catch (error) {
    ctx.setState(STATES.DEGRADED);
    return;
  }
  const requestId = ++self.currentRequestId;
  self.activeLoadRequest = requestId;
  const loadStartTime = performance.now();
  try {
    ctx.setState(STATES.LOADING);
    store.setLoading(true);
    ctx.performanceMetrics.totalRequests++;
    const data = await apiClient.fetchData({ signal: abortController.signal, timeout: REQUEST_TIMEOUT });
    if (self.activeLoadRequest !== requestId) return;
    const loadTime = performance.now() - loadStartTime;
    if (data && data.success) {
      if (ctx.consecutiveErrors > 0) {
        ctx.consecutiveErrors = 0;
        if (ctx.isDegraded) {
          ctx.isDegraded = false;
          ctx.setState(STATES.READY);
        }
      }
      if (!ctx.initialLoadDone) ctx.initialLoadDone = true;
      store.setData(data.payload || data);
      circuitBreaker.recordSuccess();
      self.updatePerformanceMetrics(loadTime, true);
      telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { loadTime, requestId, success: true });
      ctx.setState(STATES.READY);
    } else {
      throw new Error(data && data.error ? data.error : "Invalid response format");
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    ctx.consecutiveErrors++;
    ctx.performanceMetrics.failedRequests++;
    circuitBreaker.recordFailure();
    store.setError(error.message);
    const loadTime2 = performance.now() - loadStartTime;
    self.updatePerformanceMetrics(loadTime2, false);
    telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { error: error.message, consecutiveErrors: ctx.consecutiveErrors });
    if (ctx.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !ctx.isDegraded) {
      ctx.isDegraded = true;
      ctx.setState(STATES.DEGRADED);
      telemetry.track(LIFECYCLE_EVENTS.MODE_DEGRADED, { consecutiveErrors: ctx.consecutiveErrors });
    } else {
      ctx.setState(STATES.ERROR);
    }
  } finally {
    if (self.activeLoadRequest === requestId) {
      self.activeLoadRequest = null;
    }
    store.setLoading(false);
    ctx.lastLoadTime = Date.now();
    ctx.loadCount++;
  }
};
DataLoader.prototype.getRefreshInterval = function() {
  if (this.ctx.isDegraded) return REFRESH_INTERVAL_DEGRADED;
  if (typeof navigator !== "undefined" && navigator.connection && navigator.connection.effectiveType) {
    const type = navigator.connection.effectiveType;
    if (type === "slow-2g" || type === "2g") return REFRESH_INTERVAL_BASE * 4;
    if (type === "3g") return REFRESH_INTERVAL_BASE * 2;
  }
  return REFRESH_INTERVAL_BASE;
};
DataLoader.prototype.updatePerformanceMetrics = function(loadTime, success) {
  const total = this.ctx.performanceMetrics.totalRequests;
  this.ctx.performanceMetrics.avgLoadTime = (this.ctx.performanceMetrics.avgLoadTime * (total - 1) + loadTime) / total;
  this.ctx.performanceMetrics.successRate = (total - this.ctx.performanceMetrics.failedRequests) / total * 100;
};
DataLoader.prototype.reset = function() {
  this.currentRequestId = 0;
  this.activeLoadRequest = null;
};
DataLoader.prototype.healthCheck = function() {
  const ctx = this.ctx;
  const checks = { hasContext: !!ctx, circuitBreakerAvailable: !!(ctx && ctx.circuitBreaker), storeAvailable: !!(ctx && ctx.store), apiClientAvailable: !!(ctx && ctx.apiClient) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
};
DataLoader.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, activeRequest: this.activeLoadRequest, currentRequestId: this.currentRequestId, p25Compliant: true };
};
var data_loader_default = DataLoader;
export {
  DataLoader,
  MODULE_ID,
  VERSION,
  data_loader_default as default
};
