// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-sessions/core/data-loader
// PURPOSE: Panel User Sessions - Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATES from ./states.js
//   MAX_CONSECUTIVE_ERRORS, REFRESH_INTERVAL, REFRESH_INTERVAL_DEGRADED from ./co...
//   listSessions from ../services/api.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { STATES } from './states.js';

// @ts-expect-error TS migration - TS2614
import { MAX_CONSECUTIVE_ERRORS, REFRESH_INTERVAL, REFRESH_INTERVAL_DEGRADED } from './config.js';

// @ts-expect-error TS migration - TS2614
import { listSessions } from '../services/api.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-sessions/core/data-loader';

export function DataLoader(this: any, context: Record<string, unknown>) {
  this.ctx = context;
  this.currentRequestId = 0;
  this.activeLoadRequest = null;
}

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

  return listSessions().then((data: Record<string, unknown>) => {
    if (self.activeLoadRequest !== requestId) return;
    const loadTime = performance.now() - loadStartTime;
    if (data) {
      if (ctx.consecutiveErrors > 0) { ctx.consecutiveErrors = 0; if (ctx.isDegraded) { ctx.isDegraded = false; ctx.setState(STATES.READY); } }
      if (!ctx.initialLoadDone) ctx.initialLoadDone = true;
      ctx.store.setSessions(data.sessions || []);
      ctx.store.setCurrentSessionId(data.currentSessionId);
      ctx.store.setLoginHistory(data.loginHistory || []);
      ctx.store.setError(null);
      ctx.circuitBreaker.recordSuccess();
      self.updatePerformanceMetrics(loadTime, true);
      ctx.telemetry.ready({ sessionsCount: Array.isArray(data.sessions) ? (data.sessions as unknown[]).length : 0 });
      ctx.setState(STATES.READY);
    } else { throw new Error('Invalid response'); }
  }).catch((error: Error) => {
    if (error.name === 'AbortError') return;
    ctx.consecutiveErrors++;
    ctx.performanceMetrics.failedRequests++;
    ctx.circuitBreaker.recordFailure(error);
    ctx.store.setError(error.message);
    const loadTime = performance.now() - loadStartTime;
    self.updatePerformanceMetrics(loadTime, false);
    ctx.telemetry.error(error, { consecutiveErrors: ctx.consecutiveErrors });
    if (ctx.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !ctx.isDegraded) { ctx.isDegraded = true; ctx.setState(STATES.DEGRADED); } else { ctx.setState(STATES.ERROR); }
  }).finally(() => {
    if (self.activeLoadRequest === requestId) self.activeLoadRequest = null;
    ctx.store.setLoading(false);
    ctx.lastLoadTime = Date.now();
    ctx.loadCount++;
  });
};

DataLoader.prototype.getRefreshInterval = function() { return this.ctx.isDegraded ? REFRESH_INTERVAL_DEGRADED : REFRESH_INTERVAL; };
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
