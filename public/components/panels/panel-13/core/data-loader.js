import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import { PAINEL_ID, REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED } from "./constants.js";
import { STATES } from "./states.js";
import { MAX_CONSECUTIVE_ERRORS, REQUEST_TIMEOUT } from "./config.js";
const MODULE_ID = "panel-13/core/data-loader";
const VERSION = "9.3.0-P2-ENTERPRISE";
function DataLoader(context) {
  this.ctx = context;
  this.currentRequestId = 0;
  this.activeLoadRequest = null;
}
DataLoader.prototype.loadData = function() {
  const self = this;
  const ctx = self.ctx;
  if (!ctx.mounted || ctx.destroyed) return Promise.resolve();
  try {
    ctx.circuitBreaker.check();
  } catch (error) {
    ctx.setState(STATES.DEGRADED);
    return Promise.resolve();
  }
  const requestId = ++self.currentRequestId;
  self.activeLoadRequest = requestId;
  const loadStartTime = performance.now();
  ctx.setState(STATES.LOADING);
  ctx.store.setLoading(true);
  ctx.performanceMetrics.totalRequests++;
  return ctx.apiClient.fetchData({ signal: ctx.abortController.signal, timeout: REQUEST_TIMEOUT }).then((data) => {
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
      ctx.store.setData(data.payload || data);
      ctx.circuitBreaker.recordSuccess();
      self.updatePerformanceMetrics(loadTime, true);
      ctx.telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { loadTime, requestId, success: true, panelId: PAINEL_ID });
      ctx.setState(STATES.READY);
    } else {
      throw new Error(data && data.error ? String(data.error) : "Invalid response format");
    }
  }).catch((error) => {
    if (error.name === "AbortError") return;
    ctx.consecutiveErrors++;
    ctx.performanceMetrics.failedRequests++;
    ctx.circuitBreaker.recordFailure();
    ctx.store.setError(error.message);
    const loadTime = performance.now() - loadStartTime;
    self.updatePerformanceMetrics(loadTime, false);
    ctx.telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { error: error.message, consecutiveErrors: ctx.consecutiveErrors, panelId: PAINEL_ID });
    if (ctx.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !ctx.isDegraded) {
      ctx.isDegraded = true;
      ctx.setState(STATES.DEGRADED);
      ctx.telemetry.track(LIFECYCLE_EVENTS.MODE_DEGRADED, { consecutiveErrors: ctx.consecutiveErrors, panelId: PAINEL_ID });
    } else {
      ctx.setState(STATES.ERROR);
    }
  }).finally(() => {
    if (self.activeLoadRequest === requestId) self.activeLoadRequest = null;
    ctx.store.setLoading(false);
    ctx.lastLoadTime = Date.now();
    ctx.loadCount++;
  });
};
DataLoader.prototype.getRefreshInterval = function() {
  if (this.ctx.isDegraded) return REFRESH_INTERVAL_DEGRADED;
  if (navigator.connection && navigator.connection.effectiveType) {
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
DataLoader.prototype.info = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
DataLoader.prototype.healthCheck = function() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { activeRequest: this.activeLoadRequest !== null } };
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
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
