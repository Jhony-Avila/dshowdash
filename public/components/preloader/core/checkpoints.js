import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "boot-checkpoints";
const hasWindow = typeof window !== "undefined";
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
function _log(level, msg, ctx) {
  const logger = _getPort("logger");
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (level === "warn") {
    if (logger.warn) logger.warn(msg, ctx);
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(msg, ctx);
    return;
  }
  if (logger.debug) logger.debug(msg, ctx);
}
const _config = { enabled: true, persistToStorage: true, storageKey: "boot_checkpoints", maxCheckpoints: 20, ttlMs: 36e5, autoCleanup: true };
const _checkpoints = /* @__PURE__ */ new Map();
let _currentBootId = null;
let _currentCheckpoint = null;
function startBoot(bootId) {
  _initPorts();
  _currentBootId = bootId || `boot_${Date.now()}`;
  _currentCheckpoint = null;
  const bootData = { bootId: _currentBootId, startedAt: Date.now(), checkpoints: [], status: "in_progress", lastCheckpoint: null, metadata: {} };
  _checkpoints.set(_currentBootId, bootData);
  _saveToStorage();
  _log("info", "Boot started", { bootId: _currentBootId });
  return _currentBootId;
}
function checkpoint(name, data) {
  if (!_currentBootId) {
    _log("warn", "No active boot for checkpoint");
    return null;
  }
  const bootData = _checkpoints.get(_currentBootId);
  if (!bootData) return null;
  const cp = { name, timestamp: Date.now(), duration: bootData.checkpoints.length > 0 ? Date.now() - bootData.checkpoints[bootData.checkpoints.length - 1].timestamp : Date.now() - bootData.startedAt, data: data || {}, index: bootData.checkpoints.length };
  bootData.checkpoints.push(cp);
  bootData.lastCheckpoint = name;
  _currentCheckpoint = name;
  _saveToStorage();
  _log("debug", "Checkpoint reached", { bootId: _currentBootId, checkpoint: name });
  return cp;
}
function completeBoot(metadata) {
  if (!_currentBootId) return null;
  const bootData = _checkpoints.get(_currentBootId);
  if (!bootData) return null;
  bootData.status = "completed";
  bootData.completedAt = Date.now();
  bootData.totalDuration = bootData.completedAt - bootData.startedAt;
  bootData.metadata = Object.assign({}, bootData.metadata, metadata || {});
  _saveToStorage();
  _log("info", "Boot completed", { bootId: _currentBootId, duration: bootData.totalDuration });
  const result = Object.assign({}, bootData);
  _currentBootId = null;
  _currentCheckpoint = null;
  return result;
}
function failBoot(error, metadata) {
  if (!_currentBootId) return null;
  const bootData = _checkpoints.get(_currentBootId);
  if (!bootData) return null;
  bootData.status = "failed";
  bootData.failedAt = Date.now();
  bootData.error = { message: error && error.message ? error.message : String(error), name: error ? error.name : void 0, stack: error ? error.stack : void 0 };
  bootData.metadata = Object.assign({}, bootData.metadata, metadata || {});
  _saveToStorage();
  _log("warn", "Boot failed", { bootId: _currentBootId, checkpoint: _currentCheckpoint, error: bootData.error.message });
  return Object.assign({}, bootData);
}
function canResume() {
  const lastBoot = getLastIncompleteBoot();
  return lastBoot !== null && lastBoot.checkpoints.length > 0;
}
function getResumePoint() {
  const lastBoot = getLastIncompleteBoot();
  if (!lastBoot) return null;
  return { bootId: lastBoot.bootId, checkpoint: lastBoot.lastCheckpoint, checkpointIndex: lastBoot.checkpoints.length - 1, data: lastBoot.checkpoints.length > 0 ? lastBoot.checkpoints[lastBoot.checkpoints.length - 1].data : {}, startedAt: lastBoot.startedAt, timeSinceFailed: Date.now() - (lastBoot.failedAt || lastBoot.startedAt) };
}
function resumeBoot(bootId) {
  const targetBoot = bootId ? _checkpoints.get(bootId) : getLastIncompleteBoot();
  if (!targetBoot) {
    _log("warn", "No boot to resume");
    return null;
  }
  _currentBootId = targetBoot.bootId;
  _currentCheckpoint = targetBoot.lastCheckpoint;
  targetBoot.status = "resumed";
  targetBoot.resumedAt = Date.now();
  _saveToStorage();
  _log("info", "Boot resumed", { bootId: _currentBootId, fromCheckpoint: _currentCheckpoint });
  return { bootId: _currentBootId, resumeFrom: _currentCheckpoint, checkpoints: targetBoot.checkpoints };
}
function clearResume(bootId) {
  const targetId = bootId || _currentBootId;
  if (targetId) {
    _checkpoints.delete(targetId);
    _saveToStorage();
  }
}
function getCurrentBoot() {
  return _currentBootId ? _checkpoints.get(_currentBootId) : null;
}
function getBoot(bootId) {
  return _checkpoints.get(bootId) || null;
}
function getLastIncompleteBoot() {
  const boots = Array.from(_checkpoints.values()).filter((b) => b.status === "failed" || b.status === "in_progress").sort((a, b) => b.startedAt - a.startedAt);
  return boots[0] || null;
}
function getCheckpoint(name) {
  const bootData = getCurrentBoot();
  if (!bootData) return null;
  return bootData.checkpoints.find((cp) => cp.name === name) || null;
}
function getAllCheckpoints() {
  const bootData = getCurrentBoot();
  return bootData ? bootData.checkpoints.slice() : [];
}
function getHistory(limit = 10) {
  return Array.from(_checkpoints.values()).sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
}
function _saveToStorage() {
  if (!_config.persistToStorage) return;
  if (typeof localStorage === "undefined") return;
  try {
    const data = Array.from(_checkpoints.entries());
    localStorage.setItem(_config.storageKey, JSON.stringify(data));
  } catch (e) {
    _log("warn", "Failed to save checkpoints", { error: e.message });
  }
}
function loadFromStorage() {
  if (typeof localStorage === "undefined") return 0;
  try {
    const data = localStorage.getItem(_config.storageKey);
    if (!data) return 0;
    const entries = JSON.parse(data);
    entries.forEach((entry) => {
      const key = entry[0];
      const value = entry[1];
      if (_config.autoCleanup && Date.now() - value.startedAt > _config.ttlMs) return;
      _checkpoints.set(key, value);
    });
    return _checkpoints.size;
  } catch (e) {
    _log("warn", "Failed to load checkpoints", { error: e.message });
    return 0;
  }
}
function clearStorage() {
  _checkpoints.clear();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(_config.storageKey);
  }
}
function cleanup() {
  const now = Date.now();
  let cleaned = 0;
  _checkpoints.forEach((bootData, bootId) => {
    if (now - bootData.startedAt > _config.ttlMs) {
      _checkpoints.delete(bootId);
      cleaned++;
      return;
    }
    if (bootData.status === "completed" && bootData.completedAt && now - bootData.completedAt > 36e5) {
      _checkpoints.delete(bootId);
      cleaned++;
    }
  });
  while (_checkpoints.size > _config.maxCheckpoints) {
    const oldest = Array.from(_checkpoints.entries()).sort((a, b) => a[1].startedAt - b[1].startedAt)[0];
    if (oldest) {
      _checkpoints.delete(oldest[0]);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    _saveToStorage();
    _log("debug", "Checkpoints cleaned", { cleaned });
  }
  return cleaned;
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, currentBootId: _currentBootId, currentCheckpoint: _currentCheckpoint, totalBoots: _checkpoints.size, canResume: canResume(), portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  const checks = { storageWorking: _config.persistToStorage, hasLogger: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, features: ["checkpointing", "resume-from-failure", "persistence", "auto-cleanup", "history"], portsInitialized: Ports.isInitialized(), status: getStatus() };
}
if (typeof localStorage !== "undefined") {
  loadFromStorage();
  if (_config.autoCleanup) {
    cleanup();
  }
}
var checkpoints_default = { VERSION, MODULE_ID, startBoot, checkpoint, completeBoot, failBoot, canResume, getResumePoint, resumeBoot, clearResume, getCurrentBoot, getBoot, getLastIncompleteBoot, getCheckpoint, getAllCheckpoints, getHistory, loadFromStorage, clearStorage, cleanup, getStatus, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  canResume,
  checkpoint,
  cleanup,
  clearResume,
  clearStorage,
  completeBoot,
  checkpoints_default as default,
  failBoot,
  getAllCheckpoints,
  getBoot,
  getCheckpoint,
  getCurrentBoot,
  getHistory,
  getLastIncompleteBoot,
  getPorts,
  getResumePoint,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  loadFromStorage,
  resumeBoot,
  startBoot
};
