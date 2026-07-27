import { TELEMETRY_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "1.1.0-EVENT-CONSTANTS";
const MODULE_ID = "container-telemetry";
let _injectedEventBus = null;
let _enabled = true;
let _buffer = [];
let _flushTimer = null;
const FLUSH_INTERVAL = 5e3;
const BUFFER_SIZE = 50;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function enable() {
  _enabled = true;
}
function disable() {
  _enabled = false;
}
function isEnabled() {
  return _enabled;
}
function _getTimestamp() {
  return Date.now();
}
function _getSessionId() {
  return window.__DSD_SESSION_ID__ || (window.__DSD_SESSION_ID__ = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
}
function _createEvent(category, action, label, value, meta = {}) {
  return {
    category,
    action,
    label,
    value,
    timestamp: _getTimestamp(),
    sessionId: _getSessionId(),
    url: window.location?.href || "",
    userAgent: navigator?.userAgent || "",
    ...meta
  };
}
function track(category, action, label = "", value = null, meta = {}) {
  if (!_enabled) return false;
  const event = _createEvent(category, action, label, value, meta);
  _buffer.push(event);
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(TELEMETRY_EVENT_NAMES.TRACK, { source: MODULE_ID, event });
  }
  if (_buffer.length >= BUFFER_SIZE) flush();
  return true;
}
function trackTiming(category, variable, timeMs, label = "") {
  return track(category, "timing", label, timeMs, { variable, unit: "ms" });
}
function trackError(error, context = {}) {
  return track("error", error.name || "Error", error.message, null, {
    // @ts-expect-error TS migration - TS2339
    stack: error.stack?.substring(0, 500),
    ...context
  });
}
function trackComponentInit(componentName, durationMs) {
  return trackTiming("component", componentName, durationMs, "init");
}
function trackUserAction(action, target, value = null) {
  return track("user", action, target, value);
}
function trackNavigation(from, to) {
  return track("navigation", "navigate", `${from} -> ${to}`);
}
function trackPerformance(metric, value, unit = "ms") {
  return track("performance", metric, unit, value);
}
function flush() {
  if (_buffer.length === 0) return [];
  const batch = [..._buffer];
  _buffer = [];
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(TELEMETRY_EVENT_NAMES.FLUSH, { source: MODULE_ID, events: batch, count: batch.length });
  }
  return batch;
}
function startAutoFlush(interval = FLUSH_INTERVAL) {
  stopAutoFlush();
  _flushTimer = setInterval(() => {
    if (_buffer.length > 0) flush();
  }, interval);
}
function stopAutoFlush() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
}
function getBuffer() {
  return [..._buffer];
}
function getBufferSize() {
  return _buffer.length;
}
function clearBuffer() {
  _buffer = [];
}
const _marks = /* @__PURE__ */ new Map();
function mark(name) {
  _marks.set(name, performance.now());
  return true;
}
function measure(name, startMark, endMark) {
  const start = _marks.get(startMark);
  const end = endMark ? _marks.get(endMark) : performance.now();
  if (start === void 0) return null;
  const duration = Math.round((end - start) * 100) / 100;
  trackTiming("measure", name, duration);
  return duration;
}
function clearMarks() {
  _marks.clear();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, bufferSize: _buffer.length, hasEventBus: !!_injectedEventBus };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, enabled: _enabled, bufferSize: _buffer.length, hasEventBus: !!_injectedEventBus };
}
var telemetry_default = {
  track,
  trackTiming,
  trackError,
  trackComponentInit,
  trackUserAction,
  trackNavigation,
  trackPerformance,
  flush,
  startAutoFlush,
  stopAutoFlush,
  getBuffer,
  getBufferSize,
  clearBuffer,
  mark,
  measure,
  clearMarks,
  enable,
  disable,
  isEnabled,
  injectEventBus,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearBuffer,
  clearMarks,
  telemetry_default as default,
  disable,
  enable,
  flush,
  getBuffer,
  getBufferSize,
  healthCheck,
  info,
  injectEventBus,
  isEnabled,
  mark,
  measure,
  startAutoFlush,
  stopAutoFlush,
  track,
  trackComponentInit,
  trackError,
  trackNavigation,
  trackPerformance,
  trackTiming,
  trackUserAction
};
