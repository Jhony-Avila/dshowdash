// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-notifications/core/data-loader
// PURPOSE: Panel User Notifications - Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATES from ./states.js
//   MAX_CONSECUTIVE_ERRORS, REFRESH_INTERVAL, REFRESH_INTERVAL_DEGRADED, DEFAULT_...
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
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
//   window.Toast (via Ports fallback only)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { STATES } from './states.js';

// @ts-expect-error TS migration - TS2614
import { MAX_CONSECUTIVE_ERRORS, REFRESH_INTERVAL, REFRESH_INTERVAL_DEGRADED, DEFAULT_SETTINGS } from './config.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-user-notifications/core/data-loader';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const API_ENDPOINT = '/api/users/notification-settings.php';

function _getToast() {
  if (typeof window === 'undefined') return null;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const wt = window.Core.windowAdapter.get('Toast');
    if (wt) return wt;
  }
  if (strictMode) return null;
  if (window.Toast) {
    recordViolation('WINDOW_TOAST_FALLBACK', { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}

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

    const res = await fetch(API_ENDPOINT, { credentials: 'include', signal: ctx.abortController ? ctx.abortController.signal : undefined });
    if (self.activeLoadRequest !== requestId) return;

    const loadTime = performance.now() - loadStartTime;

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        store.setSettings(data.data);
      } else {
        store.setSettings(Object.assign({}, DEFAULT_SETTINGS));
      }
      
      if (ctx.consecutiveErrors > 0) {
        ctx.consecutiveErrors = 0;
        if (ctx.isDegraded) { ctx.isDegraded = false; }
      }
      if (!ctx.initialLoadDone) ctx.initialLoadDone = true;

      store.setError(null);
      circuitBreaker.recordSuccess();
      self.updatePerformanceMetrics(loadTime, true);
      telemetry.ready({});
      ctx.setState(STATES.READY);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    ctx.consecutiveErrors++;
    ctx.performanceMetrics.failedRequests++;
    circuitBreaker.recordFailure(error);
    store.setError(error.message);
    const loadTime2 = performance.now() - loadStartTime;
    self.updatePerformanceMetrics(loadTime2, false);
    telemetry.error(error, { consecutiveErrors: ctx.consecutiveErrors });

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

DataLoader.prototype.saveSettings = async function(settings: Record<string, unknown>) {
  const self = this;
  const ctx = self.ctx;
  const circuitBreaker = ctx.circuitBreaker;
  const store = ctx.store;
  const telemetry = ctx.telemetry;

  try {
    ctx.setState(STATES.SAVING);
    store.setSaving(true);

    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: ctx.abortController ? ctx.abortController.signal : undefined,
      body: JSON.stringify(settings)
    });

    const data = await res.json();
    if (data.success) {
      store.setDirty(false);
      circuitBreaker.recordSuccess();
      telemetry.saved({});
      const toastService = _getToast(); if (toastService?.show) toastService.show('Configurações salvas', 'success');
      ctx.setState(STATES.READY);
      return true;
    } else {
      throw new Error(data.error || 'Erro ao salvar');
    }
  } catch (error: any) {
    circuitBreaker.recordFailure(error);
    telemetry.error(error, { action: 'save' });
    const toastErr = _getToast(); if (toastErr?.show) toastErr.show(`Erro: ${error.message}`, 'error');
    ctx.setState(STATES.ERROR);
    return false;
  } finally {
    store.setSaving(false);
  }
};

DataLoader.prototype.getRefreshInterval = function() {
  return this.ctx.isDegraded ? REFRESH_INTERVAL_DEGRADED : REFRESH_INTERVAL;
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
    storeAvailable: !!(ctx && ctx.store)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
};

DataLoader.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, activeRequest: this.activeLoadRequest, currentRequestId: this.currentRequestId, p25Compliant: true };
};

export default DataLoader;
