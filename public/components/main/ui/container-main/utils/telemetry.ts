// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-telemetry
// PURPOSE: Container-Main Telemetry Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TELEMETRY_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   track() — exported function
//   trackTiming() — exported function
//   trackError() — exported function
//   trackComponentInit() — exported function
//   trackUserAction() — exported function
//   trackNavigation() — exported function
//   trackPerformance() — exported function
//   flush() — exported function
//   startAutoFlush() — exported function
//   stopAutoFlush() — exported function
//   getBuffer() — exported function
//   getBufferSize() — exported function
//   clearBuffer() — exported function
//   mark() — exported function
//   ... and 4 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TELEMETRY_EVENT_NAMES.FLUSH
//   TELEMETRY_EVENT_NAMES.TRACK
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).__DSD_SESSION_ID__
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TELEMETRY_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '1.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'container-telemetry';

let _injectedEventBus: Record<string, unknown> | null = null;
let _enabled = true;
let _buffer: unknown[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 5000;
const BUFFER_SIZE = 50;

export function injectEventBus(eventBus: unknown) { _injectedEventBus = eventBus as Record<string, unknown>; }

export function enable() { _enabled = true; }
export function disable() { _enabled = false; }
export function isEnabled() { return _enabled; }

function _getTimestamp() { return Date.now(); }
function _getSessionId() { return (window as any).__DSD_SESSION_ID__ || ((window as any).__DSD_SESSION_ID__ = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`); }

function _createEvent(category: string, action: string, label: string, value: unknown, meta: Record<string, unknown> = {}) {
  return {
    category, action, label, value,
    timestamp: _getTimestamp(),
    sessionId: _getSessionId(),
    url: window.location?.href || '',
    userAgent: navigator?.userAgent || '',
    ...meta
  };
}

export function track(category: string, action: string, label = '', value: unknown = null, meta: Record<string, unknown> = {}) {
  if (!_enabled) return false;
  const event = _createEvent(category, action, label, value, meta);
  _buffer.push(event);
  
  if (_injectedEventBus?.emit) {
    (_injectedEventBus.emit as (...args: unknown[]) => unknown)(TELEMETRY_EVENT_NAMES.TRACK, { source: MODULE_ID, event });
  }
  
  if (_buffer.length >= BUFFER_SIZE) flush();
  return true;
}

export function trackTiming(category: string, variable: unknown, timeMs: unknown, label = '') {
  return track(category, 'timing', label, timeMs, { variable, unit: 'ms' });
}

export function trackError(error: Record<string, unknown>, context: Record<string, unknown> = {}) {
  return track('error', (error.name as string) || 'Error', (error.message as string), null, {
    // @ts-expect-error TS migration - TS2339
    stack: error.stack?.substring(0, 500),
    ...context
  });
}

export function trackComponentInit(componentName: unknown, durationMs: unknown) {
  return trackTiming('component', componentName, durationMs, 'init');
}

export function trackUserAction(action: string, target: HTMLElement, value: unknown = null) {
  // @ts-expect-error TS migration - TS2345
  return track('user', action, target, value);
}

export function trackNavigation(from: unknown, to: unknown) {
  return track('navigation', 'navigate', `${from} -> ${to}`);
}

export function trackPerformance(metric: string, value: unknown, unit = 'ms') {
  return track('performance', metric, unit, value);
}

export function flush() {
  if (_buffer.length === 0) return [];
  const batch = [..._buffer];
  _buffer = [];
  
  if (_injectedEventBus?.emit) {
    (_injectedEventBus.emit as (...args: unknown[]) => unknown)(TELEMETRY_EVENT_NAMES.FLUSH, { source: MODULE_ID, events: batch, count: batch.length });
  }
  
  return batch;
}

export function startAutoFlush(interval = FLUSH_INTERVAL) {
  stopAutoFlush();
  _flushTimer = setInterval(() => { if (_buffer.length > 0) flush(); }, interval);
}

export function stopAutoFlush() {
  if (_flushTimer) { clearInterval(_flushTimer); _flushTimer = null; }
}

export function getBuffer() { return [..._buffer]; }
export function getBufferSize() { return _buffer.length; }
export function clearBuffer() { _buffer = []; }

const _marks = new Map();

export function mark(name: string) {
  _marks.set(name, performance.now());
  return true;
}

export function measure(name: string, startMark: unknown, endMark: unknown) {
  const start = _marks.get(startMark);
  const end = endMark ? _marks.get(endMark) : performance.now();
  if (start === undefined) return null;
  const duration = Math.round((end - start) * 100) / 100;
  trackTiming('measure', name, duration);
  return duration;
}

export function clearMarks() { _marks.clear(); }

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, bufferSize: _buffer.length, hasEventBus: !!_injectedEventBus };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, enabled: _enabled, bufferSize: _buffer.length, hasEventBus: !!_injectedEventBus };
}

export default {
  track, trackTiming, trackError, trackComponentInit, trackUserAction, trackNavigation, trackPerformance,
  flush, startAutoFlush, stopAutoFlush, getBuffer, getBufferSize, clearBuffer,
  mark, measure, clearMarks, enable, disable, isEnabled,
  injectEventBus, info, healthCheck, VERSION, MODULE_ID
};
