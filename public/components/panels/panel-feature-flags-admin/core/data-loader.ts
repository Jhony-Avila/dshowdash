// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin/core/data-loader
// PURPOSE: Panel Feature Flags Admin - Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   REFRESH_INTERVAL, REFRESH_INTERVAL_DEGRADED from ./constants.js
//   STATES from ./states.js
//   MAX_CONSECUTIVE_ERRORS, REQUEST_TIMEOUT from ./config.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   DataLoader() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { REFRESH_INTERVAL, REFRESH_INTERVAL_DEGRADED } from './constants.js';
import { STATES } from './states.js';
import { MAX_CONSECUTIVE_ERRORS, REQUEST_TIMEOUT } from './config.js';

export const MODULE_ID = 'panel-feature-flags-admin/core/data-loader';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function DataLoader(this: any, context: Record<string, unknown>) {
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

  try { circuitBreaker.check(); }
  catch (error: any) { ctx.setState(STATES.DEGRADED); return; }

  const requestId = ++self.currentRequestId;
  self.activeLoadRequest = requestId;
  const loadStartTime = performance.now();

  try {
    ctx.setState(STATES.LOADING);
    store.setLoading(true);
    ctx.performanceMetrics.totalRequests++;

    const data = await apiClient.fetchFlags({ signal: abortController ? abortController.signal : undefined, timeout: REQUEST_TIMEOUT });

    if (self.activeLoadRequest !== requestId) return;
    const loadTime = performance.now() - loadStartTime;

    if (data && data.success) {
      if (ctx.consecutiveErrors > 0) {
        ctx.consecutiveErrors = 0;
        if (ctx.isDegraded) { ctx.isDegraded = false; ctx.setState(STATES.READY); }
      }
      if (!ctx.initialLoadDone) ctx.initialLoadDone = true;

      const flags = (data.payload && data.payload.flags) ? data.payload.flags : (data.payload || []);
      store.setFlags(flags);
      circuitBreaker.recordSuccess();
      self.updatePerformanceMetrics(loadTime, true);
      telemetry.trackLoad(loadTime, true, store.getFlags().length);
      ctx.setState(STATES.READY);
    } else {
      throw new Error((data && data.error) ? data.error : 'Invalid response');
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    ctx.consecutiveErrors++;
    ctx.performanceMetrics.failedRequests++;
    circuitBreaker.recordFailure(error);
    store.setError(error.message);
    const loadTime2 = performance.now() - loadStartTime;
    self.updatePerformanceMetrics(loadTime2, false);
    telemetry.trackError(error, { consecutiveErrors: ctx.consecutiveErrors });

    if (ctx.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !ctx.isDegraded) {
      ctx.isDegraded = true;
      ctx.setState(STATES.DEGRADED);
    } else {
      ctx.setState(STATES.ERROR);
    }
  } finally {
    if (self.activeLoadRequest === requestId) self.activeLoadRequest = null;
    store.setLoading(false);
    ctx.lastLoadTime = Date.now();
    ctx.loadCount++;
  }
};

DataLoader.prototype.getRefreshInterval = function() {
  if (this.ctx.isDegraded) return REFRESH_INTERVAL_DEGRADED;
  return REFRESH_INTERVAL;
};

DataLoader.prototype.updatePerformanceMetrics = function(loadTime: number, success: boolean) {
  const total = this.ctx.performanceMetrics.totalRequests;
  this.ctx.performanceMetrics.avgLoadTime = (this.ctx.performanceMetrics.avgLoadTime * (total - 1) + loadTime) / total;
  this.ctx.performanceMetrics.successRate = ((total - this.ctx.performanceMetrics.failedRequests) / total) * 100;
};

DataLoader.prototype.reset = function() {
  this.currentRequestId = 0;
  this.activeLoadRequest = null;
};

DataLoader.prototype.healthCheck = function() {
  const ctx = this.ctx;
  const checks = {
    hasContext: !!ctx,
    circuitBreakerAvailable: !!(ctx && ctx.circuitBreaker),
    storeAvailable: !!(ctx && ctx.store),
    apiClientAvailable: !!(ctx && ctx.apiClient)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
};

DataLoader.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, activeRequest: this.activeLoadRequest, currentRequestId: this.currentRequestId, p25Compliant: true };
};

export default DataLoader;
