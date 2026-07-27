// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Offline Manager — Public API
 * @version 1.0.1-FIX
 * @module app-shell/utils/offline-manager/api
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (VERSION, MODULE_ID, CONNECTION_STATUS)
 * @requires ./state.js (_state, _config, _subscribers, getMetrics)
 * @requires ./connection/detection.js (updateConnectionInfo)
 * 
 * @provides isOnline, isOffline, getConnectionStatus, getConnectionInfo, getState
 * @provides ping, configure, getConfig, subscribe, healthCheck, info, destroy
 * 
 * @browserAPI navigator.onLine, (navigator as any).connection, fetch
 * 
 * @description
 * Public API for offline manager. Provides connection status queries,
 * configuration, ping testing, and health checks.
 * 
 * @changelog v1.0.1-FIX - CRITICAL: Fixed pendingQueue → pendingActions (property name mismatch)
 * 
 * @example
 * import { isOnline, ping, healthCheck } from './api.js';
 * if (!isOnline()) showOfflineMessage();
 * const result = await ping();
 * ============================================================================
 */
'use strict';

import { VERSION, MODULE_ID, CONNECTION_STATUS } from './constants.js';
import { _state, _config, _subscribers, getMetrics } from './state.js';
import { updateConnectionInfo } from './connection/detection.js';
import { handleOnline, handleOffline, handleConnectionChange } from './connection/handlers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function isOnline() { return _state.connectionStatus === CONNECTION_STATUS.ONLINE || _state.isOnline; }
export function isOffline() { return _state.connectionStatus === CONNECTION_STATUS.OFFLINE || !_state.isOnline; }
export function getConnectionStatus() { return _state.connectionStatus; }

export function getConnectionInfo() {
  return {
    status: _state.connectionStatus,
    effectiveType: _state.effectiveType,
    downlink: _state.downlink,
    rtt: _state.rtt,
    lastChecked: _state.lastOnline || _state.lastOffline
  };
}

export function getState() {
  return {
    status: _state.connectionStatus,
    connectionInfo: getConnectionInfo(),
    pendingActions: _state.pendingActions ? _state.pendingActions.length : 0,
    syncStatus: _state.syncStatus
  };
}

export function ping(url: string) {
  url = url || _config.pingUrl || '/api/health';
  const startTime = Date.now();
  
  const _pingCtrl = new AbortController();
  const _pingTimeout = setTimeout(() => _pingCtrl.abort(), 5000);
  return fetch(url, {
    method: 'HEAD',
    mode: 'no-cors',
    cache: 'no-store',
    signal: _pingCtrl.signal
  }).then(() => {
    clearTimeout(_pingTimeout);
    const latency = Date.now() - startTime;
    _state.lastPingLatency = latency;
    _state.lastOnline = Date.now();
    return { ok: true, latency: latency };
  }).catch(error => {
    clearTimeout(_pingTimeout);
    return { ok: false, error: error.message };
  });
}

export function configure(options: DynObj) {
  if (!options) return;
  if (options.pingUrl !== undefined) _config.pingUrl = options.pingUrl;
  if (options.pingInterval !== undefined) _config.pingInterval = Math.max(5000, options.pingInterval);
  if (options.maxQueueSize !== undefined) _config.maxQueueSize = Math.max(10, options.maxQueueSize);
  if (options.syncRetryDelay !== undefined) _config.syncRetryDelay = Math.max(1000, options.syncRetryDelay);
  if (options.maxRetries !== undefined) _config.maxRetries = Math.max(1, options.maxRetries);
}

export function getConfig() { return Object.assign({}, _config); }

export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

export function healthCheck() {
  const metrics = getMetrics();
  const pendingCount = _state.pendingActions ? _state.pendingActions.length : 0;
  
  const checks = {
    isOnline: isOnline(),
    queueNotFull: pendingCount < _config.maxQueueSize,
    noSyncErrors: metrics.syncErrors < metrics.actionsSynced * 0.5 || metrics.syncErrors < 3,
    connectionGood: _state.effectiveType !== 'slow-2g' && _state.effectiveType !== '2g'
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  return {
    status: passed >= 3 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${keys.length}`,
    checks: checks,
    connectionInfo: getConnectionInfo(),
    pendingActions: pendingCount,
    metrics: metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const pendingCount = _state.pendingActions ? _state.pendingActions.length : 0;
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    status: _state.connectionStatus,
    connectionInfo: getConnectionInfo(),
    config: getConfig(),
    pendingActions: pendingCount,
    syncStatus: _state.syncStatus,
    metrics: getMetrics(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}

export function destroy() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      (navigator as any).connection.removeEventListener('change', handleConnectionChange);
    }
  }
  if (_state.pendingActions) _state.pendingActions.length = 0;
  _subscribers.length = 0;
}

export { getMetrics };

