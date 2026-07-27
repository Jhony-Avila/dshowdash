import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { StoragePort } from "../ports/storage-port.js";
const VERSION = "5.3.0-P17WI";
const MODULE_ID = "session-persistence";
const STORAGE_KEY = "dshowdash.session.meta";
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
const _metrics = { saves: 0, savesSuccess: 0, savesFailed: 0, restores: 0, restoresSuccess: 0, restoresFailed: 0, clears: 0 };
function getTracker() {
  _initPorts();
  const sm = _getPort("sessionManager");
  if (sm && sm.debug && sm.debug.tracker) return sm.debug.tracker;
  return { track() {
  } };
}
function save(sessionId, lastActivity) {
  _metrics.saves++;
  try {
    const result = StoragePort.set(STORAGE_KEY, { sessionId, lastActivity, savedAt: Date.now() });
    if (result) {
      _metrics.savesSuccess++;
      const tracker = getTracker();
      if (tracker.track) tracker.track("session:persistence:saved");
      return true;
    }
    _metrics.savesFailed++;
    return false;
  } catch (e) {
    _metrics.savesFailed++;
    const tracker = getTracker();
    if (tracker.track) tracker.track("session:persistence:save-error", { error: e.message });
    return false;
  }
}
function restore() {
  _metrics.restores++;
  try {
    const data = StoragePort.get(STORAGE_KEY);
    if (!data) return null;
    _metrics.restoresSuccess++;
    const tracker = getTracker();
    if (tracker.track) tracker.track("session:persistence:restored");
    return data;
  } catch (e) {
    _metrics.restoresFailed++;
    const tracker = getTracker();
    if (tracker.track) tracker.track("session:persistence:restore-error", { error: e.message });
    return null;
  }
}
function clear() {
  _metrics.clears++;
  try {
    StoragePort.remove(STORAGE_KEY);
    const tracker = getTracker();
    if (tracker.track) tracker.track("session:persistence:cleared");
    return true;
  } catch (e) {
    const tracker = getTracker();
    if (tracker.track) tracker.track("session:persistence:clear-error", { error: e.message });
    return false;
  }
}
function hasPersisted() {
  return StoragePort.has(STORAGE_KEY);
}
function getVersion() {
  return VERSION;
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, storageKey: STORAGE_KEY, hasPersisted: hasPersisted(), storageAdapter: StoragePort.getAdapterType(), portsInitialized: ps._initialized, metrics: Object.assign({}, _metrics), saveSuccessRate: _metrics.saves > 0 ? `${(_metrics.savesSuccess / _metrics.saves * 100).toFixed(1)}%` : "N/A", restoreSuccessRate: _metrics.restores > 0 ? `${(_metrics.restoresSuccess / _metrics.restores * 100).toFixed(1)}%` : "N/A", timestamp: Date.now() };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const storageHealth = StoragePort.healthCheck();
  const checks = { storagePortHealthy: storageHealth.status === "HEALTHY", lowSaveFailRate: _metrics.saves === 0 || _metrics.savesFailed / _metrics.saves < 0.2, lowRestoreFailRate: _metrics.restores === 0 || _metrics.restoresFailed / _metrics.restores < 0.2, portsInitialized: ps._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed >= 3, checks, hasPersisted: hasPersisted(), storageAdapter: StoragePort.getAdapterType(), version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized, timestamp: Date.now() };
}
const SessionPersistence = { save, restore, clear, hasPersisted, getVersion, info, healthCheck };
var persistence_default = SessionPersistence;
export {
  MODULE_ID,
  SessionPersistence,
  VERSION,
  persistence_default as default,
  getPorts,
  injectPorts
};
