import { VERSION, MODULE_ID } from "./constants.js";
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
} from "./core.js";
const _snapshots = [];
const _subscribers = [];
let _autoSnapshotInterval = null;
const _config = {
  maxSnapshots: 50,
  autoSnapshot: false,
  autoSnapshotInterval: 3e4,
  includeDOM: false,
  includePerformance: true,
  includeAdapters: true,
  compressData: false,
  persistToStorage: false,
  storageKey: "app-shell-snapshots"
};
const _metrics = {
  snapshotsTaken: 0,
  snapshotsRestored: 0,
  comparisons: 0,
  errors: 0
};
function _notifySubscribers(event) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](event);
    } catch (e) {
    }
  }
}
const _stateProxy = {
  get snapshots() {
    return _snapshots;
  },
  get config() {
    return _config;
  },
  get metrics() {
    return _metrics;
  },
  notify: _notifySubscribers
};
function capture(label, metadata) {
  return _capture(label, metadata, _stateProxy);
}
function restore(snapshotId, options) {
  return _restore(snapshotId, options, _stateProxy);
}
function compare(snapshotId1, snapshotId2) {
  return _compare(snapshotId1, snapshotId2, _stateProxy);
}
function get(snapshotId) {
  return getSnapshot(snapshotId, _stateProxy);
}
function getAll() {
  return getAllSnapshots(_stateProxy);
}
function getLatest() {
  return getLatestSnapshot(_stateProxy);
}
function getByLabel(label) {
  return _getByLabel(label, _stateProxy);
}
function count() {
  return countSnapshots(_stateProxy);
}
function remove(snapshotId) {
  return removeSnapshot(snapshotId, _stateProxy);
}
function clear() {
  clearSnapshots(_stateProxy);
}
function exportSnapshot(snapshotId) {
  return _exportSnapshot(snapshotId, _stateProxy);
}
function exportAll() {
  return exportAllSnapshots(_stateProxy);
}
function importSnapshot(data) {
  return _importSnapshot(data, _stateProxy);
}
function startAutoSnapshot(interval) {
  stopAutoSnapshot();
  _config.autoSnapshot = true;
  _config.autoSnapshotInterval = interval || _config.autoSnapshotInterval;
  _autoSnapshotInterval = setInterval(() => {
    capture("Auto Snapshot", { auto: true });
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
function configure(options) {
  if (options.maxSnapshots !== void 0) _config.maxSnapshots = options.maxSnapshots;
  if (options.includeDOM !== void 0) _config.includeDOM = !!options.includeDOM;
  if (options.includePerformance !== void 0) _config.includePerformance = !!options.includePerformance;
  if (options.includeAdapters !== void 0) _config.includeAdapters = !!options.includeAdapters;
  if (options.autoSnapshotInterval !== void 0) _config.autoSnapshotInterval = options.autoSnapshotInterval;
}
function getConfig() {
  return Object.assign({}, _config);
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const totalSize = _snapshots.reduce((acc, s) => acc + (s.size || 0), 0);
  const checks = {
    hasCapacity: _snapshots.length < _config.maxSnapshots,
    reasonableSize: totalSize < 5e6,
    noExcessiveErrors: _metrics.errors < 10
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
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
var state_snapshots_default = {
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
export {
  MODULE_ID,
  VERSION,
  capture,
  clear,
  compare,
  configure,
  count,
  state_snapshots_default as default,
  exportAll,
  exportSnapshot,
  get,
  getAll,
  getByLabel,
  getConfig,
  getLatest,
  getMetrics,
  healthCheck,
  importSnapshot,
  info,
  isAutoSnapshotRunning,
  remove,
  restore,
  startAutoSnapshot,
  stopAutoSnapshot,
  subscribe
};
