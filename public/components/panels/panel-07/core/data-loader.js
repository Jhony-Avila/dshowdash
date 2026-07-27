import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import { REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED } from "./constants.js";
import { STATES } from "./states.js";
import { MAX_CONSECUTIVE_ERRORS, REQUEST_TIMEOUT } from "./config.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-07/core/data-loader";
class DataLoader {
  constructor(context) {
    this.ctx = context;
    this.currentRequestId = 0;
    this.activeLoadRequest = null;
  }
  async loadData() {
    const ctx = this.ctx;
    const mounted = ctx.mounted;
    const destroyed = ctx.destroyed;
    const circuitBreaker = ctx.circuitBreaker;
    const store = ctx.store;
    const apiClient = ctx.apiClient;
    const abortController = ctx.abortController;
    const telemetry = ctx.telemetry;
    const self = this;
    if (!mounted || destroyed) return;
    try {
      circuitBreaker.check();
    } catch (error) {
      ctx.setState(STATES.DEGRADED);
      return;
    }
    const requestId = ++this.currentRequestId;
    this.activeLoadRequest = requestId;
    const loadStartTime = performance.now();
    try {
      ctx.setState(STATES.LOADING);
      store.setLoading(true);
      ctx.performanceMetrics.totalRequests++;
      const data = await apiClient.fetchData({
        signal: abortController.signal,
        timeout: REQUEST_TIMEOUT
      });
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
      const loadTimeErr = performance.now() - loadStartTime;
      self.updatePerformanceMetrics(loadTimeErr, false);
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
  }
  getRefreshInterval() {
    if (this.ctx.isDegraded) return REFRESH_INTERVAL_DEGRADED;
    if (navigator.connection && navigator.connection.effectiveType) {
      const type = navigator.connection.effectiveType;
      if (type === "slow-2g" || type === "2g") return REFRESH_INTERVAL_BASE * 4;
      if (type === "3g") return REFRESH_INTERVAL_BASE * 2;
    }
    return REFRESH_INTERVAL_BASE;
  }
  updatePerformanceMetrics(loadTime, success) {
    const total = this.ctx.performanceMetrics.totalRequests;
    this.ctx.performanceMetrics.avgLoadTime = (this.ctx.performanceMetrics.avgLoadTime * (total - 1) + loadTime) / total;
    this.ctx.performanceMetrics.successRate = (total - this.ctx.performanceMetrics.failedRequests) / total * 100;
  }
  reset() {
    this.currentRequestId = 0;
    this.activeLoadRequest = null;
  }
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { classAvailable: typeof DataLoader === "function", lifecycleEventsImported: typeof LIFECYCLE_EVENTS !== "undefined" }, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["DataLoader", "healthCheck", "info", "VERSION", "MODULE_ID"], p25Compliant: true };
}
var data_loader_default = DataLoader;
export {
  DataLoader,
  MODULE_ID,
  VERSION,
  data_loader_default as default,
  healthCheck,
  info
};
