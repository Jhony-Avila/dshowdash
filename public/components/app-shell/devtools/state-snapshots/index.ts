// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   capture (as _capture), restore (as _restore), compare (as _compare),
//     getSnapshot, getAllSnapshots, getLatestSnapshot,
//     getByLabel (as _getByLabel), countSnapshots,
//     removeSnapshot, clearSnapshots,
//     exportSnapshot (as _exportSnapshot), exportAllSnapshots,
//     importSnapshot (as _importSnapshot) from ./core.js
//
// PROVIDES: capture/restore/compare (core ops),
//   get/getAll/getLatest/getByLabel/count (queries),
//   remove/clear/exportSnapshot/exportAll/importSnapshot (management),
//   startAutoSnapshot/stopAutoSnapshot/isAutoSnapshotRunning (auto),
//   configure/getConfig/subscribe/getMetrics/healthCheck/info (diagnostics),
//   VERSION, MODULE_ID
//
// RECEIVES (via configure):
//   options — { maxSnapshots, includeDOM, includePerformance,
//     includeAdapters, autoSnapshotInterval }
//
// BROWSER APIs (legítimo — timers):
//   setInterval/clearInterval
// ═══════════════════════════════════════════════════════════════
/**
 * State Snapshots — Orquestrador
 * @module app-shell/devtools/state-snapshots
 * @version 1.1.0-P2-ENTERPRISE
 * @description Sprint 9 Fase 2: Melhoria #28 - State Snapshots (modularizado v1.1.0)
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import {
  capture as _capture,
  restore as _restore,
  compare as _compare,
  getSnapshot,
  getAllSnapshots,
  getLatestSnapshot,
  getByLabel as _getByLabel,
  countSnapshots,
  removeSnapshot,
  clearSnapshots,
  exportSnapshot as _exportSnapshot,
  exportAllSnapshots,
  importSnapshot as _importSnapshot
} from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ── State ───────────────────────────────────────────────────────────

const _snapshots: DynObj[] = [];
const _subscribers: DynObj[] = [];
let _autoSnapshotInterval: DynObj = null;

const _config = {
  maxSnapshots: 50,
  autoSnapshot: false,
  autoSnapshotInterval: 30000,
  includeDOM: false,
  includePerformance: true,
  includeAdapters: true,
  compressData: false,
  persistToStorage: false,
  storageKey: 'app-shell-snapshots'
};

const _metrics = {
  snapshotsTaken: 0,
  snapshotsRestored: 0,
  comparisons: 0,
  errors: 0
};

function _notifySubscribers(event: string) {
  for (let i = 0; i < _subscribers.length; i++) {
    try { _subscribers[i](event); } catch (e) { /* silent */ }
  }
}

const _stateProxy = {
  get snapshots() { return _snapshots; },
  get config() { return _config; },
  get metrics() { return _metrics; },
  notify: _notifySubscribers
};

// ── Public API ──────────────────────────────────────────────────────

function capture(label: string, metadata: DynObj) { return _capture(label, metadata, _stateProxy); }
function restore(snapshotId: string, options: DynObj) { return _restore(snapshotId, options, _stateProxy); }
function compare(snapshotId1: DynObj, snapshotId2: DynObj) { return _compare(snapshotId1, snapshotId2, _stateProxy); }

function get(snapshotId: string) { return getSnapshot(snapshotId, _stateProxy); }
function getAll() { return getAllSnapshots(_stateProxy); }
function getLatest() { return getLatestSnapshot(_stateProxy); }
function getByLabel(label: string) { return _getByLabel(label, _stateProxy); }
function count() { return countSnapshots(_stateProxy); }

function remove(snapshotId: string) { return removeSnapshot(snapshotId, _stateProxy); }
function clear() { clearSnapshots(_stateProxy); }
function exportSnapshot(snapshotId: string) { return _exportSnapshot(snapshotId, _stateProxy); }
function exportAll() { return exportAllSnapshots(_stateProxy); }
function importSnapshot(data: DynObj) { return _importSnapshot(data, _stateProxy); }

function startAutoSnapshot(interval: number) {
  stopAutoSnapshot();
  _config.autoSnapshot = true;
  _config.autoSnapshotInterval = interval || _config.autoSnapshotInterval;
  _autoSnapshotInterval = setInterval(() => {
    capture('Auto Snapshot', { auto: true });
  }, _config.autoSnapshotInterval);
}

function stopAutoSnapshot() {
  if (_autoSnapshotInterval) {
    clearInterval(_autoSnapshotInterval);
    _autoSnapshotInterval = null;
  }
  _config.autoSnapshot = false;
}

function isAutoSnapshotRunning() {
  return _autoSnapshotInterval !== null;
}

function configure(options: DynObj) {
  if (options.maxSnapshots !== undefined) _config.maxSnapshots = options.maxSnapshots;
  if (options.includeDOM !== undefined) _config.includeDOM = !!options.includeDOM;
  if (options.includePerformance !== undefined) _config.includePerformance = !!options.includePerformance;
  if (options.includeAdapters !== undefined) _config.includeAdapters = !!options.includeAdapters;
  if (options.autoSnapshotInterval !== undefined) _config.autoSnapshotInterval = options.autoSnapshotInterval;
}

function getConfig() { return Object.assign({}, _config); }

function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

function getMetrics() { return Object.assign({}, _metrics); }

function healthCheck() {
  const totalSize = _snapshots.reduce((acc, s) => acc + (s.size || 0), 0);
  const checks = {
    hasCapacity: _snapshots.length < _config.maxSnapshots,
    reasonableSize: totalSize < 5000000,
    noExcessiveErrors: _metrics.errors < 10
  };

  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${keys.length}`,
    checks,
    snapshotCount: _snapshots.length,
    totalSize,
    autoSnapshotRunning: isAutoSnapshotRunning(),
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    snapshotCount: _snapshots.length,
    snapshots: getAll(),
    autoSnapshotRunning: isAutoSnapshotRunning(),
    config: getConfig(),
    metrics: getMetrics(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}

// ── Exports ─────────────────────────────────────────────────────────

export { VERSION, MODULE_ID };
export { capture, restore, compare };
export { get, getAll, getLatest, getByLabel, count };
export { remove, clear, exportSnapshot, exportAll, importSnapshot };
export { startAutoSnapshot, stopAutoSnapshot, isAutoSnapshotRunning };
export { configure, getConfig, subscribe, getMetrics, healthCheck, info };


export default {
  VERSION,
  MODULE_ID,
  capture,
  restore,
  compare,
  get,
  getAll,
  getLatest,
  getByLabel,
  count,
  remove,
  clear,
  exportSnapshot,
  exportAll,
  importSnapshot,
  startAutoSnapshot,
  stopAutoSnapshot,
  isAutoSnapshotRunning,
  configure,
  getConfig,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
