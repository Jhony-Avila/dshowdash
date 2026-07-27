import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "1.4.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.reference-counter";
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
let _backdropCount = 0;
let _scrollLockCount = 0;
let _activeOverlays = {};
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
function acquire(id, options) {
  if (!options) options = {};
  if (_activeOverlays[id]) return { ok: true, action: "already-acquired", counts: getCounts() };
  _activeOverlays[id] = { type: options.type || "modal", priority: options.priority || 7500, blocking: options.blocking !== false, timestamp: Date.now() };
  const wasBackdropActive = _backdropCount > 0;
  _backdropCount++;
  if (options.blocking !== false) {
    const wasScrollLocked = _scrollLockCount > 0;
    _scrollLockCount++;
    if (!wasScrollLocked) _setScrollLock(true);
  }
  return { ok: true, action: "acquired", backdropCreated: !wasBackdropActive, counts: getCounts() };
}
function release(id) {
  const overlay = _activeOverlays[id];
  if (!overlay) return { ok: false, reason: "not-found", counts: getCounts() };
  delete _activeOverlays[id];
  _backdropCount = Math.max(0, _backdropCount - 1);
  const backdropRemoved = _backdropCount === 0;
  if (overlay.blocking) {
    _scrollLockCount = Math.max(0, _scrollLockCount - 1);
    if (_scrollLockCount === 0) _setScrollLock(false);
  }
  return { ok: true, action: "released", backdropRemoved, scrollUnlocked: _scrollLockCount === 0, counts: getCounts() };
}
function releaseAll(reason) {
  if (!reason) reason = "force-cleanup";
  const released = Object.keys(_activeOverlays).length;
  _activeOverlays = {};
  _backdropCount = 0;
  _scrollLockCount = 0;
  _setScrollLock(false);
  return { ok: true, released, reason, counts: getCounts() };
}
function getCounts() {
  const size = Object.keys(_activeOverlays).length;
  return { activeOverlays: size, backdropCount: _backdropCount, scrollLockCount: _scrollLockCount, hasBackdrop: _backdropCount > 0, isScrollLocked: _scrollLockCount > 0 };
}
function getActiveOverlays() {
  const list = [];
  const keys = Object.keys(_activeOverlays);
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i];
    list.push(Object.assign({ id }, _activeOverlays[id]));
  }
  return list.sort((a, b) => b.priority - a.priority);
}
function isActive(id) {
  return !!_activeOverlays[id];
}
function getTopOverlay() {
  let top = null;
  let maxPriority = -1;
  const keys = Object.keys(_activeOverlays);
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i];
    const data = _activeOverlays[id];
    if (data.priority > maxPriority) {
      maxPriority = data.priority;
      top = Object.assign({ id }, data);
    }
  }
  return top;
}
function healthCheck() {
  const eb = _getPort("eventBus");
  const counts = getCounts();
  const checks = { countsConsistent: counts.activeOverlays === Object.keys(_activeOverlays).length, backdropValid: counts.backdropCount >= 0 && counts.backdropCount <= counts.activeOverlays, scrollLockValid: counts.scrollLockCount >= 0, noOrphans: counts.backdropCount === 0 || counts.activeOverlays > 0, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const checkKeys = Object.keys(checks);
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, checks, counts, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), counts: getCounts(), activeOverlays: getActiveOverlays(), topOverlay: getTopOverlay(), timestamp: Date.now() };
}
var reference_counter_default = { acquire, release, releaseAll, getCounts, getActiveOverlays, isActive, getTopOverlay, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  acquire,
  reference_counter_default as default,
  getActiveOverlays,
  getCounts,
  getPorts,
  getTopOverlay,
  healthCheck,
  info,
  injectPorts,
  isActive,
  release,
  releaseAll
};
