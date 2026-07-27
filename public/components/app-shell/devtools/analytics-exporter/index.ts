// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   registerAdapter, unregisterAdapter, enableAdapter, disableAdapter,
//     getAdapters, useBuiltInAdapter from ./adapters.js
//   track, trackPerformance, trackError, trackHealthCheck,
//     flush, flushAll from ./tracking.js
//
// PROVIDES: registerAdapter/unregisterAdapter/enableAdapter/disableAdapter/
//   getAdapters/useBuiltInAdapter, track/trackPerformance/trackError/
//   trackHealthCheck/flush/flushAll, enable/disable/isEnabled/
//   getQueueSize/clearQueue, configure/getConfig/getMetrics/healthCheck/info,
//   VERSION, MODULE_ID
//
// BROWSER APIs (legítimo — batch processing):
//   setInterval/clearInterval (batch flush timer)
// ═══════════════════════════════════════════════════════════════
/**
 * Analytics Exporter — Orquestrador
 * @module app-shell/devtools/analytics-exporter
 * @version 1.1.0
 * @description Sprint 2 Fase 2: Melhoria #28 - Export de métricas (modularizado v1.1.0)
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-analytics-exporter';

import {
  registerAdapter as _registerAdapter,
  unregisterAdapter as _unregisterAdapter,
  enableAdapter as _enableAdapter,
  disableAdapter as _disableAdapter,
  getAdapters as _getAdapters,
  useBuiltInAdapter as _useBuiltInAdapter
} from './adapters.js';

import {

  track as _track,
  trackPerformance as _trackPerformance,
  trackError as _trackError,
  trackHealthCheck as _trackHealthCheck,
  flush as _flush,
  flushAll as _flushAll
} from './tracking.js';

// ── State ───────────────────────────────────────────────────────────

const _adapters = new Map();
const _queue: DynObj[] = [];
let _enabled = false;
let _batchInterval: DynObj = null;

const _config = {
  batchSize: 10,
  batchIntervalMs: 5000,
  maxQueueSize: 1000,
  retryAttempts: 3,
  retryDelayMs: 1000
};

const _metrics = {
  eventsQueued: 0,
  eventsSent: 0,
  eventsFailed: 0,
  batchesSent: 0
};

const _stateProxy = {
  get enabled() { return _enabled; },
  get queue() { return _queue; },
  get adapters() { return _adapters; },
  get config() { return _config; },
  get metrics() { return _metrics; }
};

// ── Public API — Adapters ───────────────────────────────────────────

function registerAdapter(name: string, adapter: DynObj) { return _registerAdapter(name, adapter, _adapters); }
function unregisterAdapter(name: string) { return _unregisterAdapter(name, _adapters); }
function enableAdapter(name: string) { return _enableAdapter(name, _adapters); }
function disableAdapter(name: string) { return _disableAdapter(name, _adapters); }
function getAdapters() { return _getAdapters(_adapters); }
function useBuiltInAdapter(name: string, options: DynObj) { return _useBuiltInAdapter(name, options, _adapters); }

// ── Public API — Tracking ───────────────────────────────────────────

function track(eventName: string, data: DynObj) { return _track(eventName, data, _stateProxy); }
function trackPerformance(name: string, duration: number, metadata: DynObj) { return _trackPerformance(name, duration, metadata, _stateProxy); }
function trackError(error: DynObj, context: DynObj) { return _trackError(error, context, _stateProxy); }
function trackHealthCheck(result: DynObj) { return _trackHealthCheck(result, _stateProxy); }
function flush() { return _flush(_stateProxy); }
function flushAll() { return _flushAll(_stateProxy); }

// ── Control ─────────────────────────────────────────────────────────

function enable() {
  if (_enabled) return false;
  _enabled = true;
  if (_config.batchIntervalMs > 0) {
    _batchInterval = setInterval(flush, _config.batchIntervalMs);
  }
  return true;
}

function disable() {
  if (!_enabled) return false;
  _enabled = false;
  if (_batchInterval) {
    clearInterval(_batchInterval);
    _batchInterval = null;
  }
  return true;
}

function isEnabled() { return _enabled; }
function getQueueSize() { return _queue.length; }

function clearQueue() {
  const count = _queue.length;
  _queue.length = 0;
  return count;
}

// ── Config ──────────────────────────────────────────────────────────

function configure(options: DynObj) {
  if (options.batchSize !== undefined) _config.batchSize = Math.max(1, options.batchSize);
  if (options.batchIntervalMs !== undefined) _config.batchIntervalMs = Math.max(0, options.batchIntervalMs);
  if (options.maxQueueSize !== undefined) _config.maxQueueSize = Math.max(100, options.maxQueueSize);
  if (options.retryAttempts !== undefined) _config.retryAttempts = Math.max(0, options.retryAttempts);
  if (options.retryDelayMs !== undefined) _config.retryDelayMs = Math.max(100, options.retryDelayMs);

  if (_enabled && _batchInterval) {
    clearInterval(_batchInterval);
    if (_config.batchIntervalMs > 0) {
      _batchInterval = setInterval(flush, _config.batchIntervalMs);
    } else {
      _batchInterval = null;
    }
  }
}

function getConfig() {
  return {
    enabled: _enabled,
    batchSize: _config.batchSize,
    batchIntervalMs: _config.batchIntervalMs,
    maxQueueSize: _config.maxQueueSize,
    retryAttempts: _config.retryAttempts,
    retryDelayMs: _config.retryDelayMs
  };
}

// ── Health & Info ───────────────────────────────────────────────────

function getMetrics() {
  return {
    eventsQueued: _metrics.eventsQueued,
    eventsSent: _metrics.eventsSent,
    eventsFailed: _metrics.eventsFailed,
    batchesSent: _metrics.batchesSent,
    currentQueueSize: _queue.length,
    adaptersCount: _adapters.size
  };
}

function healthCheck() {
  const currentMetrics = getMetrics();
  let hasEnabledAdapter = false;
  _adapters.forEach(entry => {
    if (entry.enabled) hasEnabledAdapter = true;
  });

  const checks = {
    enabled: _enabled,
    hasAdapters: hasEnabledAdapter,
    queueNotFull: _queue.length < _config.maxQueueSize * 0.9,
    lowFailRate: _metrics.eventsQueued === 0 || (_metrics.eventsFailed / _metrics.eventsQueued) < 0.1
  };

  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${keys.length}`,
    checks,
    metrics: currentMetrics,
    adapters: getAdapters(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    config: getConfig(),
    metrics: getMetrics(),
    adapters: getAdapters(),
    queueSize: _queue.length,
    timestamp: Date.now()
  };
}

// ── Exports ─────────────────────────────────────────────────────────

export { registerAdapter, unregisterAdapter, enableAdapter, disableAdapter, getAdapters, useBuiltInAdapter };
export { track, trackPerformance, trackError, trackHealthCheck, flush, flushAll };
export { enable, disable, isEnabled, getQueueSize, clearQueue };
export { configure, getConfig, getMetrics, healthCheck, info };

export default {
  VERSION,
  MODULE_ID,
  registerAdapter,
  unregisterAdapter,
  enableAdapter,
  disableAdapter,
  getAdapters,
  useBuiltInAdapter,
  track,
  trackPerformance,
  trackError,
  trackHealthCheck,
  flush,
  flushAll,
  enable,
  disable,
  isEnabled,
  getQueueSize,
  clearQueue,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info
};
