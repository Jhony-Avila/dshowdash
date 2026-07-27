// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-pipedrive/utils/timers
// PURPOSE: panel-pipedrive - Timers Manager (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setTimeout() — exported function
//   clearTimeout() — exported function
//   setInterval() — exported function
//   clearInterval() — exported function
//   clearAll() — exported function
//   getActiveCount() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.clearInterval
//   window.clearTimeout
//   window.setInterval
//   window.setTimeout
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-pipedrive/utils/timers';

const _timers = new Map();
const _intervals = new Map();
const _metrics = { timersCreated: 0, intervalsCreated: 0, cleared: 0 };

// @ts-expect-error strict migration — TS2322
export function setTimeout(fn: Function, delay: number, id: string = null) {
  const timerId = window.setTimeout(fn, delay);
  const key = id || `timer-${timerId}`;
  _timers.set(key, timerId);
  _metrics.timersCreated++;
  return key;
}

export function clearTimeout(id: string) {
  if (_timers.has(id)) { window.clearTimeout(_timers.get(id)); _timers.delete(id); _metrics.cleared++; return true; }
  return false;
}

// @ts-expect-error strict migration — TS2322
export function setInterval(fn: Function, delay: number, id: string = null) {
  const intervalId = window.setInterval(fn, delay);
  const key = id || `interval-${intervalId}`;
  _intervals.set(key, intervalId);
  _metrics.intervalsCreated++;
  return key;
}

export function clearInterval(id: string) {
  if (_intervals.has(id)) { window.clearInterval(_intervals.get(id)); _intervals.delete(id); _metrics.cleared++; return true; }
  return false;
}

export function clearAll() {
  _timers.forEach((id) => window.clearTimeout(id)); _timers.clear();
  _intervals.forEach((id) => window.clearInterval(id)); _intervals.clear();
}

export function getActiveCount() { return { timers: _timers.size, intervals: _intervals.size }; }
export function getMetrics() { return { ..._metrics, active: _timers.size + _intervals.size }; }
export function resetMetrics() { _metrics.timersCreated = 0; _metrics.intervalsCreated = 0; _metrics.cleared = 0; }

export function healthCheck() {
  const checks = { ready: true, noLeaks: (_timers.size + _intervals.size) < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, active: getActiveCount(), metrics: getMetrics() }; }
export default { setTimeout, clearTimeout, setInterval, clearInterval, clearAll, getActiveCount };
