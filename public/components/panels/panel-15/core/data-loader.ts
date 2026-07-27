// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15/core/data-loader
// PURPOSE: Panel-15 - Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED from ./constants.js
//   STATES from ./states.js
//   MAX_CONSECUTIVE_ERRORS, REQUEST_TIMEOUT from ./config.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   DataLoader() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED } from './constants.js';
import { STATES } from './states.js';
import { MAX_CONSECUTIVE_ERRORS, REQUEST_TIMEOUT } from './config.js';

export const MODULE_ID = 'panel-15/core/data-loader';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function DataLoader(this: any, context: Record<string, unknown>) { this.ctx = context; this.currentRequestId = 0; this.activeLoadRequest = null; }

DataLoader.prototype.loadData = function() {
  const self = this;
  const ctx = self.ctx;
  if (!ctx.mounted || ctx.destroyed) return Promise.resolve();
  try { ctx.circuitBreaker.check(); } catch (error) { ctx.setState(STATES.DEGRADED); return Promise.resolve(); }
  const requestId = ++self.currentRequestId;
  self.activeLoadRequest = requestId;
  const loadStartTime = performance.now();
  ctx.setState(STATES.LOADING);
  ctx.store.setLoading(true);
  ctx.performanceMetrics.totalRequests++;

  return ctx.apiClient.fetchData({ signal: ctx.abortController.signal, timeout: REQUEST_TIMEOUT }).then((data: Record<string, unknown>) => {
    if (self.activeLoadRequest !== requestId) return;
    const loadTime = performance.now() - loadStartTime;
    if (data && data.success) {
      if (ctx.consecutiveErrors > 0) { ctx.consecutiveErrors = 0; if (ctx.isDegraded) { ctx.isDegraded = false; ctx.setState(STATES.READY); } }
      if (!ctx.initialLoadDone) ctx.initialLoadDone = true;
      ctx.store.setData(data.payload || data);
      ctx.circuitBreaker.recordSuccess();
      self.updatePerformanceMetrics(loadTime, true);
      ctx.telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { loadTime, requestId, success: true });
      ctx.setState(STATES.READY);
    } else { throw new Error(data && data.error ? String(data.error) : 'Invalid response format'); }
  }).catch((error: Error) => {
    if (error.name === 'AbortError') return;
    ctx.consecutiveErrors++;
    ctx.performanceMetrics.failedRequests++;
    ctx.circuitBreaker.recordFailure();
    ctx.store.setError(error.message);
    const loadTime = performance.now() - loadStartTime;
    self.updatePerformanceMetrics(loadTime, false);
    ctx.telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { error: error.message, consecutiveErrors: ctx.consecutiveErrors });
    if (ctx.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !ctx.isDegraded) { ctx.isDegraded = true; ctx.setState(STATES.DEGRADED); ctx.telemetry.track(LIFECYCLE_EVENTS.MODE_DEGRADED, { consecutiveErrors: ctx.consecutiveErrors }); } else { ctx.setState(STATES.ERROR); }
  }).finally(() => {
    if (self.activeLoadRequest === requestId) self.activeLoadRequest = null;
    ctx.store.setLoading(false);
    ctx.lastLoadTime = Date.now();
    ctx.loadCount++;
  });
};


// @ts-expect-error TS migration - TS2339
DataLoader.prototype.getRefreshInterval = function() { if (this.ctx.isDegraded) return REFRESH_INTERVAL_DEGRADED; if (navigator.connection && navigator.connection.effectiveType) { const type = navigator.connection.effectiveType; if (type === 'slow-2g' || type === '2g') return REFRESH_INTERVAL_BASE * 4; if (type === '3g') return REFRESH_INTERVAL_BASE * 2; } return REFRESH_INTERVAL_BASE; };
DataLoader.prototype.updatePerformanceMetrics = function(loadTime: number, success: boolean) { const total = this.ctx.performanceMetrics.totalRequests; this.ctx.performanceMetrics.avgLoadTime = (this.ctx.performanceMetrics.avgLoadTime * (total - 1) + loadTime) / total; this.ctx.performanceMetrics.successRate = ((total - this.ctx.performanceMetrics.failedRequests) / total) * 100; };
DataLoader.prototype.reset = function() { this.currentRequestId = 0; this.activeLoadRequest = null; };
DataLoader.prototype.info = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
DataLoader.prototype.healthCheck = function() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { activeRequest: this.activeLoadRequest !== null } }; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default DataLoader;
