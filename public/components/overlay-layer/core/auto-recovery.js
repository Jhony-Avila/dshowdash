import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { OVERLAY_EVENTS } from "/core/runtime/events/catalog/overlay.events.js";
import * as ReferenceCounter from "./reference-counter.js";
import * as FocusGovernance from "./focus-governance.js";
const VERSION = "1.4.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.auto-recovery";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const hasWindow = typeof window !== "undefined";
const _config = { enabled: true, maxOverlayAge: 3e5, checkInterval: 3e4, maxStackSize: 5, autoCleanupOrphans: true };
let _checkTimer = null;
let _recoveryLog = [];
let _metrics = { checksPerformed: 0, recoveries: 0, orphansCleared: 0, scrollLockRestores: 0, focusRestores: 0 };
function _setScrollLock(locked) {
  const lm = hasWindow ? window.LayoutManager : null;
  if (lm && lm.setScrollLocked) {
    lm.setScrollLocked(locked);
    return true;
  }
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? "scroll-lock" : "scroll-unlock", source: MODULE_ID, timestamp: Date.now() });
    return true;
  }
  return false;
}
function start(config) {
  if (!config) config = {};
  if (config.maxOverlayAge) _config.maxOverlayAge = config.maxOverlayAge;
  if (config.checkInterval) _config.checkInterval = config.checkInterval;
  if (config.maxStackSize) _config.maxStackSize = config.maxStackSize;
  if (config.autoCleanupOrphans !== void 0) _config.autoCleanupOrphans = config.autoCleanupOrphans;
  if (_checkTimer) clearInterval(_checkTimer);
  _config.enabled = true;
  _checkTimer = setInterval(performHealthCheck, _config.checkInterval);
  setTimeout(performHealthCheck, 5e3);
  return { ok: true, config: Object.assign({}, _config) };
}
function stop() {
  if (_checkTimer) {
    clearInterval(_checkTimer);
    _checkTimer = null;
  }
  _config.enabled = false;
  return { ok: true };
}
function performHealthCheck() {
  if (!_config.enabled) return { ok: false, reason: "disabled" };
  _metrics.checksPerformed++;
  const issues = [];
  const actions = [];
  const activeOverlays = ReferenceCounter.getActiveOverlays();
  const now = Date.now();
  for (let i = 0; i < activeOverlays.length; i++) {
    const overlay = activeOverlays[i];
    const age = now - overlay.timestamp;
    if (age > _config.maxOverlayAge) {
      issues.push({ type: "stale-overlay", id: overlay.id, age });
      if (_config.autoCleanupOrphans) {
        ReferenceCounter.release(overlay.id);
        FocusGovernance.disengageFocusGovernance(overlay.id);
        actions.push({ action: "released-stale", id: overlay.id });
        _metrics.recoveries++;
        _logRecovery("stale-overlay", overlay.id, age);
      }
    }
  }
  if (activeOverlays.length > _config.maxStackSize) {
    issues.push({ type: "stack-overflow", count: activeOverlays.length });
    const sorted = activeOverlays.slice().sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = sorted.slice(0, activeOverlays.length - _config.maxStackSize);
    for (let j = 0; j < toRemove.length; j++) {
      const ov = toRemove[j];
      ReferenceCounter.release(ov.id);
      FocusGovernance.disengageFocusGovernance(ov.id);
      actions.push({ action: "released-overflow", id: ov.id });
      _metrics.recoveries++;
      _logRecovery("stack-overflow", ov.id);
    }
  }
  const counts = ReferenceCounter.getCounts();
  if (counts.isScrollLocked && counts.activeOverlays === 0) {
    issues.push({ type: "orphan-scroll-lock" });
    _setScrollLock(false);
    actions.push({ action: "restored-scroll" });
    _metrics.scrollLockRestores++;
    _logRecovery("orphan-scroll-lock");
  }
  const orphanBackdrops = document.querySelectorAll(".overlay-backdrop:not([data-overlay-id])");
  if (orphanBackdrops.length > 0 && _config.autoCleanupOrphans) {
    for (let k = 0; k < orphanBackdrops.length; k++) {
      orphanBackdrops[k].remove();
      _metrics.orphansCleared++;
    }
    issues.push({ type: "orphan-backdrops", count: orphanBackdrops.length });
    actions.push({ action: "removed-orphan-backdrops", count: orphanBackdrops.length });
    _logRecovery("orphan-backdrops", null, orphanBackdrops.length);
  }
  const focusHealth = FocusGovernance.healthCheck();
  if (focusHealth.status !== "HEALTHY" && counts.activeOverlays === 0) {
    FocusGovernance.forceCleanup();
    actions.push({ action: "focus-cleanup" });
    _metrics.focusRestores++;
    issues.push({ type: "orphan-focus-state" });
    _logRecovery("orphan-focus-state");
  }
  return { ok: issues.length === 0, issues, actions, timestamp: Date.now() };
}
function forceRecovery(reason) {
  if (!reason) reason = "manual";
  const results = { referenceCounter: ReferenceCounter.releaseAll(reason), focusGovernance: FocusGovernance.forceCleanup(), scrollLock: _setScrollLock(false) };
  _metrics.recoveries++;
  _logRecovery("force-recovery", null, reason);
  const els = document.querySelectorAll(".overlay-backdrop, [data-overlay-backdrop]");
  for (let i = 0; i < els.length; i++) {
    els[i].remove();
    _metrics.orphansCleared++;
  }
  return { ok: true, results };
}
function _logRecovery(type, overlayId, extra) {
  _recoveryLog.push({ type, overlayId: overlayId || null, extra: extra || null, timestamp: Date.now() });
  if (_recoveryLog.length > 50) _recoveryLog = _recoveryLog.slice(-50);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.RECOVERY, { type, overlayId, extra });
}
function getRecoveryLog() {
  return _recoveryLog.slice();
}
function clearRecoveryLog() {
  const count = _recoveryLog.length;
  _recoveryLog = [];
  return { ok: true, cleared: count };
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  if (newConfig.maxOverlayAge) _config.maxOverlayAge = newConfig.maxOverlayAge;
  if (newConfig.checkInterval) _config.checkInterval = newConfig.checkInterval;
  if (newConfig.maxStackSize) _config.maxStackSize = newConfig.maxStackSize;
  if (newConfig.autoCleanupOrphans !== void 0) _config.autoCleanupOrphans = newConfig.autoCleanupOrphans;
  if (newConfig.checkInterval && _checkTimer) {
    clearInterval(_checkTimer);
    _checkTimer = setInterval(performHealthCheck, _config.checkInterval);
  }
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { checksPerformed: 0, recoveries: 0, orphansCleared: 0, scrollLockRestores: 0, focusRestores: 0 };
  return { ok: true };
}
function healthCheck() {
  const eb = _getPort("eventBus");
  const checks = { monitoringActive: _config.enabled && _checkTimer !== null, lowRecoveryRate: _metrics.checksPerformed === 0 || _metrics.recoveries / _metrics.checksPerformed < 0.1, logNotOverflowing: _recoveryLog.length < 40, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const checkKeys = Object.keys(checks);
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, checks, metrics: getMetrics(), config: getConfig(), recentRecoveries: _recoveryLog.slice(-5), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _config.enabled, monitoring: _checkTimer !== null, config: getConfig(), metrics: getMetrics(), recoveryLogSize: _recoveryLog.length, timestamp: Date.now() };
}
var auto_recovery_default = { start, stop, performHealthCheck, forceRecovery, getRecoveryLog, clearRecoveryLog, getConfig, setConfig, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearRecoveryLog,
  auto_recovery_default as default,
  forceRecovery,
  getConfig,
  getMetrics,
  getPorts,
  getRecoveryLog,
  healthCheck,
  info,
  injectPorts,
  performHealthCheck,
  resetMetrics,
  setConfig,
  start,
  stop
};
