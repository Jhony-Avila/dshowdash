import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const MODULE_ID = "main.feature.persistence-sync";
const VERSION = "1.1.0-ENTERPRISE";
const STORAGE_KEYS = Object.freeze({
  NAVIGATION_STATE: "dsd:main:navigation",
  CONTAINER_STATE: "dsd:main:containers",
  USER_PREFERENCES: "dsd:main:preferences"
});
const SYNC_DEBOUNCE_MS = 500;
const MAX_HISTORY_SIZE = 20;
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _enabled = false;
let _cleanups = [];
let _syncTimeoutId = null;
let _pendingChanges = /* @__PURE__ */ new Map();
let _metrics = {
  inits: 0,
  saves: 0,
  loads: 0,
  syncs: 0,
  errors: 0,
  navigationsTracked: 0
};
function _getStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch (e) {
  }
  return null;
}
function _save(key, data) {
  const storage = _getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(data));
    _metrics.saves++;
    return true;
  } catch (e) {
    _metrics.errors++;
    return false;
  }
}
function _load(key) {
  const storage = _getStorage();
  if (!storage) return null;
  try {
    const json = storage.getItem(key);
    if (json) {
      _metrics.loads++;
      return JSON.parse(json);
    }
  } catch (e) {
    _metrics.errors++;
  }
  return null;
}
function _flushPending() {
  if (_pendingChanges.size === 0) return;
  _pendingChanges.forEach((data, key) => _save(key, data));
  _metrics.syncs++;
  _pendingChanges.clear();
}
function _scheduleSync() {
  clearTimeout(_syncTimeoutId);
  _syncTimeoutId = setTimeout(() => {
    _flushPending();
    _syncTimeoutId = null;
  }, SYNC_DEBOUNCE_MS);
}
function _trackNavigation(path) {
  const navState = _load(STORAGE_KEYS.NAVIGATION_STATE) || { history: [], current: null };
  navState.current = path;
  navState.history.push({
    path,
    timestamp: Date.now()
  });
  if (navState.history.length > MAX_HISTORY_SIZE) {
    navState.history.shift();
  }
  _pendingChanges.set(STORAGE_KEYS.NAVIGATION_STATE, navState);
  _metrics.navigationsTracked++;
  _scheduleSync();
}
function init(options = {}) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  try {
    _initPorts();
    _metrics.inits++;
    const eb = _getPort("eventBus");
    if (eb?.on) {
      const navCompleteHandler = (data) => {
        const path = data?.path || data?.route || data?.panelId || "unknown";
        _trackNavigation(path);
      };
      if (MAIN_EVENTS?.NAVIGATION_COMPLETE) {
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        _cleanups.push(() => eb.off?.(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler));
      }
      if (ROUTER_EVENTS?.ROUTE_CHANGED) {
        eb.on(ROUTER_EVENTS.ROUTE_CHANGED, navCompleteHandler);
        _cleanups.push(() => eb.off?.(ROUTER_EVENTS.ROUTE_CHANGED, navCompleteHandler));
      }
    }
    _enabled = true;
    return { ok: true, version: VERSION };
  } catch (e) {
    _metrics.errors++;
    return { ok: false, error: e.message };
  }
}
function destroy() {
  _flushPending();
  clearTimeout(_syncTimeoutId);
  _syncTimeoutId = null;
  for (const fn of _cleanups) {
    try {
      fn();
    } catch (e) {
      _metrics.errors++;
    }
  }
  _cleanups = [];
  _pendingChanges.clear();
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function forceSync() {
  _flushPending();
  return { ok: true, synced: true };
}
function save(key, data) {
  if (!_enabled) return { ok: false, error: "Not initialized" };
  return { ok: _save(key, data) };
}
function load(key) {
  if (!_enabled) return { ok: false, error: "Not initialized", data: null };
  return { ok: true, data: _load(key) };
}
function remove(key) {
  if (!_enabled) return { ok: false, error: "Not initialized" };
  const storage = _getStorage();
  if (storage) {
    try {
      storage.removeItem(key);
      return { ok: true };
    } catch (e) {
      _metrics.errors++;
    }
  }
  return { ok: false, error: "Storage unavailable" };
}
function getNavigationHistory() {
  return _load(STORAGE_KEYS.NAVIGATION_STATE)?.history || [];
}
function getLastRoute() {
  return _load(STORAGE_KEYS.NAVIGATION_STATE)?.current || null;
}
function hasPendingChanges() {
  return _pendingChanges.size > 0;
}
function getMetrics() {
  return {
    ..._metrics,
    pendingChanges: _pendingChanges.size
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    storageAvailable: !!_getStorage(),
    pendingChanges: _pendingChanges.size,
    metrics: getMetrics()
  };
}
function healthCheck() {
  const storage = _getStorage();
  const checks = {
    enabled: _enabled,
    storageAvailable: !!storage
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_enabled) status = "NOT_INITIALIZED";
  else if (!storage) status = "DEGRADED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var persistence_sync_default = {
  MODULE_ID,
  VERSION,
  STORAGE_KEYS,
  init,
  destroy,
  cleanup,
  forceSync,
  save,
  load,
  remove,
  getNavigationHistory,
  getLastRoute,
  hasPendingChanges,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  persistence_sync_default as default,
  destroy,
  forceSync,
  getLastRoute,
  getMetrics,
  getNavigationHistory,
  getPorts,
  hasPendingChanges,
  healthCheck,
  info,
  init,
  injectPorts,
  load,
  remove,
  save
};
