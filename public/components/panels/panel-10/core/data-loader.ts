// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10-data-loader
// PURPOSE: Panel-10 - Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PAINEL_ID, REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS, STATES from ./constants.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   DataLoader() — exported function
//   createDataLoader() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_EVENTS.REFRESH_DONE
//   PANEL_EVENTS.REFRESH_ERROR
//   PANEL_EVENTS.REFRESH_START
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PAINEL_ID, REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS, STATES } from './constants.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';

export const MODULE_ID = 'panel-10-data-loader';
export const VERSION = '9.3.0-P2-ENTERPRISE';

// DataLoader Class - wrapper for panel instance
export function DataLoader(this: any, panelInstance: Record<string, unknown>) {
  this.panel = panelInstance;
  this.activeRequest = null;
}

DataLoader.prototype.loadData = function() {
  const self = this;
  const panel = this.panel;
  
  if (this.activeRequest) return Promise.resolve();
  if (typeof document !== 'undefined' && document.hidden) return Promise.resolve();
  if (!panel.mounted || panel.destroyed) return Promise.resolve();
  
  // Circuit breaker check
  if (panel.circuitBreaker) {
    try { panel.circuitBreaker.check(); }
    catch (e) {
      if (panel._log) panel._log('warn', 'load.circuit-breaker-open');
      if (panel.setState) panel.setState(STATES.DEGRADED);
      return Promise.resolve();
    }
  }
  
  const requestId = Date.now();
  this.activeRequest = requestId;
  const loadStart = performance.now();
  
  if (panel.setState) panel.setState(STATES.LOADING);
  if (panel.store && panel.store.setLoading) panel.store.setLoading(true);
  if (panel.performanceMetrics) panel.performanceMetrics.totalRequests = (panel.performanceMetrics.totalRequests || 0) + 1;
  
  // Emit refresh start
  if (panel.eventBus && panel.eventBus.emit) {
    panel.eventBus.emit(PANEL_EVENTS.REFRESH_START, { panelId: PAINEL_ID, requestId, source: MODULE_ID });
  }
  
  const apiClient = panel.apiClient;
  if (!apiClient || !apiClient.fetchData) {
    if (panel._log) panel._log('error', 'load.no-api-client');
    this.activeRequest = null;
    return Promise.reject(new Error('No API client'));
  }
  
  const signal = panel.abortController ? panel.abortController.signal : null;
  
  return apiClient.fetchData({ signal, timeout: REQUEST_TIMEOUT }).then((result: Record<string, unknown>) => {
    if (self.activeRequest !== requestId) return;
    
    const loadTime = performance.now() - loadStart;
    
    if (result && result.success) {
      // Success
      panel.consecutiveErrors = 0;
      if (panel.isDegraded) {
        panel.isDegraded = false;
        if (panel.setState) panel.setState(STATES.READY);
        if (panel._log) panel._log('info', 'load.recovered');
      }
      
      if (panel.store && panel.store.setData) panel.store.setData(result.payload || result.data || result);
      if (panel.circuitBreaker && panel.circuitBreaker.recordSuccess) panel.circuitBreaker.recordSuccess();
      
      if (panel._log) panel._log('info', 'load.success', { loadTime: `${loadTime.toFixed(2)}ms` });
      
      if (panel.eventBus && panel.eventBus.emit) {
        panel.eventBus.emit(PANEL_EVENTS.REFRESH_DONE, { panelId: PAINEL_ID, loadTime, source: MODULE_ID });
      }
      
      if (panel.setState) panel.setState(STATES.READY);
      panel.initialLoadDone = true;
    } else {
      throw new Error(result && result.error ? String(result.error) : 'Invalid response');
    }
  }).catch((error: Error) => {
    if (error && error.name === 'AbortError') return;
    
    panel.consecutiveErrors = (panel.consecutiveErrors || 0) + 1;
    if (panel.performanceMetrics) panel.performanceMetrics.failedRequests = (panel.performanceMetrics.failedRequests || 0) + 1;
    
    if (panel.circuitBreaker && panel.circuitBreaker.recordFailure) panel.circuitBreaker.recordFailure(error);
    if (panel.store && panel.store.setError) panel.store.setError(error.message);
    
    if (panel._log) panel._log('error', 'load.failed', { error: error.message, consecutiveErrors: panel.consecutiveErrors });
    
    if (panel.eventBus && panel.eventBus.emit) {
      panel.eventBus.emit(PANEL_EVENTS.REFRESH_ERROR, { panelId: PAINEL_ID, error: error.message, source: MODULE_ID });
    }
    
    if (panel.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !panel.isDegraded) {
      panel.isDegraded = true;
      if (panel.setState) panel.setState(STATES.DEGRADED);
      if (panel._log) panel._log('warn', 'load.degraded-mode');
    } else {
      if (panel.setState) panel.setState(STATES.ERROR);
    }
  }).finally(() => {
    if (self.activeRequest === requestId) self.activeRequest = null;
    if (panel.store && panel.store.setLoading) panel.store.setLoading(false);
    panel.lastLoadTime = Date.now();
    panel.loadCount = (panel.loadCount || 0) + 1;
  });
};

DataLoader.prototype.reset = function() {
  this.activeRequest = null;
};

DataLoader.prototype.info = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});

DataLoader.prototype.healthCheck = () => ({
  status: 'HEALTHY',
  moduleId: MODULE_ID,
  version: VERSION,
  checks: { dataLoaderReady: true }
});

// Factory function (alternative API)
export function createDataLoader(context: Record<string, unknown>) {
  return new (DataLoader as unknown as new (ctx: Record<string, unknown>) => typeof DataLoader.prototype)(context);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { dataLoaderReady: true } }; }

export default { DataLoader, createDataLoader, MODULE_ID, VERSION, info, healthCheck };
