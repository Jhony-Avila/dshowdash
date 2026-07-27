// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   patchEventListeners, unpatchEventListeners, patchTimers,
//     unpatchTimers from ./patchers.js
//   checkForLeaks from ./detection.js
//
// PROVIDES: enable(), disable(), isEnabled(), checkNow(),
//   getTrackedListeners/Intervals/Timeouts(), getLeakReports(),
//   getLastReport(), clearReports(), trackReference(), untrackReference(),
//   configure(), getConfig(), getMetrics(), healthCheck(), info(),
//   VERSION, MODULE_ID
//
// BROWSER APIs (legítimo — leak detection):
//   setInterval/clearInterval (auto-check cycle)
//   Map/WeakMap (resource tracking)
// ═══════════════════════════════════════════════════════════════
/**
 * Memory Leak Detector — Orquestrador
 * @module app-shell/devtools/memory-leak-detector
 * @version 1.1.0
 * @description Sprint 2 Fase 2: Melhoria #24 - Memory Leaks (modularizado v1.1.0)
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-memory-leak-detector';

import { patchEventListeners, unpatchEventListeners, patchTimers, unpatchTimers } from './patchers.js';
import { checkForLeaks } from './detection.js';


// ── State ───────────────────────────────────────────────────────────

const _trackedListeners = new Map();
const _trackedIntervals = new Map();
const _trackedTimeouts = new Map();
const _trackedReferences = new WeakMap();
const _leakReports: DynObj[] = [];
let _enabled = false;
let _checkInterval: DynObj = null;

const _config = {
  autoCheck: false,
  checkIntervalMs: 60000,
  maxReports: 100,
  warnThreshold: 50,
  criticalThreshold: 100
};

const _metrics = {
  checksPerformed: 0,
  leaksDetected: 0,
  leaksResolved: 0,
  lastCheck: null as DynObj
};

const _stateProxy = {
  get trackedListeners() { return _trackedListeners; },
  get trackedIntervals() { return _trackedIntervals; },
  get trackedTimeouts() { return _trackedTimeouts; },
  get leakReports() { return _leakReports; },
  get config() { return _config; },
  get metrics() { return _metrics; }
};

// ── Control ─────────────────────────────────────────────────────────

function enable() {
  if (_enabled) return false;

  _enabled = true;
  patchEventListeners(_trackedListeners);
  patchTimers(_trackedIntervals, _trackedTimeouts);

  if (_config.autoCheck) {
    _checkInterval = setInterval(() => { checkForLeaks(_stateProxy); }, _config.checkIntervalMs);
  }

  return true;
}

function disable() {
  if (!_enabled) return false;

  _enabled = false;
  unpatchEventListeners();
  unpatchTimers();

  if (_checkInterval) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }

  return true;
}

function isEnabled() { return _enabled; }
function checkNow() { return checkForLeaks(_stateProxy); }

// ── Getters ─────────────────────────────────────────────────────────

function getTrackedListeners() {
  const result: DynObj[] = [];
  _trackedListeners.forEach(entry => {
    result.push({ id: entry.id, targetName: entry.targetName, type: entry.type, age: Date.now() - entry.addedAt });
  });
  return result;
}

function getTrackedIntervals() {
  const result: DynObj[] = [];
  _trackedIntervals.forEach(entry => {
    result.push({ id: entry.id, delay: entry.delay, age: Date.now() - entry.createdAt });
  });
  return result;
}

function getTrackedTimeouts() {
  const result: DynObj[] = [];
  _trackedTimeouts.forEach(entry => {
    result.push({ id: entry.id, delay: entry.delay, age: Date.now() - entry.createdAt });
  });
  return result;
}

function getLeakReports(limit: number) {
  if (limit) return _leakReports.slice(-limit);
  return _leakReports.slice();
}

function getLastReport() {
  return _leakReports.length > 0 ? _leakReports[_leakReports.length - 1] : null;
}

function clearReports() { _leakReports.length = 0; }

// ── Manual Tracking ─────────────────────────────────────────────────

function trackReference(name: string, ref: DynObj) {
  if (!ref || typeof ref !== 'object') return;
  _trackedReferences.set(ref, { name, trackedAt: Date.now() });
}

function untrackReference(ref: DynObj) { _trackedReferences.delete(ref); }

// ── Config ──────────────────────────────────────────────────────────

function configure(options: DynObj) {
  if (options.autoCheck !== undefined) _config.autoCheck = !!options.autoCheck;
  if (options.checkIntervalMs !== undefined) _config.checkIntervalMs = Math.max(10000, options.checkIntervalMs);
  if (options.maxReports !== undefined) _config.maxReports = Math.max(10, options.maxReports);
  if (options.warnThreshold !== undefined) _config.warnThreshold = options.warnThreshold;
  if (options.criticalThreshold !== undefined) _config.criticalThreshold = options.criticalThreshold;

  if (_enabled && _config.autoCheck && !_checkInterval) {
    _checkInterval = setInterval(() => { checkForLeaks(_stateProxy); }, _config.checkIntervalMs);
  } else if (_checkInterval && !_config.autoCheck) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }
}

function getConfig() {
  return {
    enabled: _enabled,
    autoCheck: _config.autoCheck,
    checkIntervalMs: _config.checkIntervalMs,
    maxReports: _config.maxReports,
    warnThreshold: _config.warnThreshold,
    criticalThreshold: _config.criticalThreshold
  };
}

// ── Health & Info ───────────────────────────────────────────────────

function getMetrics() {
  return {
    checksPerformed: _metrics.checksPerformed,
    leaksDetected: _metrics.leaksDetected,
    leaksResolved: _metrics.leaksResolved,
    lastCheck: _metrics.lastCheck,
    trackedListeners: _trackedListeners.size,
    trackedIntervals: _trackedIntervals.size,
    trackedTimeouts: _trackedTimeouts.size,
    reportCount: _leakReports.length
  };
}

function healthCheck() {
  const currentMetrics = getMetrics();
  const checks = {
    notTooManyListeners: currentMetrics.trackedListeners < _config.criticalThreshold,
    notTooManyIntervals: currentMetrics.trackedIntervals < 50,
    recentCheck: !_config.autoCheck || !_metrics.lastCheck || (Date.now() - _metrics.lastCheck) < _config.checkIntervalMs * 2
  };

  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  let status = 'HEALTHY';
  if (currentMetrics.trackedListeners >= _config.criticalThreshold || currentMetrics.trackedIntervals >= 50) {
    status = 'UNHEALTHY';
  } else if (currentMetrics.trackedListeners >= _config.warnThreshold) {
    status = 'DEGRADED';
  } else if (passed < keys.length) {
    status = 'DEGRADED';
  }

  return {
    status,
    score: `${passed}/${keys.length}`,
    checks,
    metrics: currentMetrics,
    config: getConfig(),
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
    lastReport: getLastReport(),
    timestamp: Date.now()
  };
}

// ── Exports ─────────────────────────────────────────────────────────

export { enable, disable, isEnabled, checkNow };
export { getTrackedListeners, getTrackedIntervals, getTrackedTimeouts };
export { getLeakReports, getLastReport, clearReports };
export { trackReference, untrackReference };
export { configure, getConfig, getMetrics, healthCheck, info };

export default {
  VERSION,
  MODULE_ID,
  enable,
  disable,
  isEnabled,
  checkNow,
  getTrackedListeners,
  getTrackedIntervals,
  getTrackedTimeouts,
  getLeakReports,
  getLastReport,
  clearReports,
  trackReference,
  untrackReference,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info
};
