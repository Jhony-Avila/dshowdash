// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: performance-monitor-helpers
// PURPOSE: Performance Monitor - Helpers v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   now() — exported function
//   measure() — exported function
//   formatDuration() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'performance-monitor-helpers';
export function now() { return performance?.now?.() ?? Date.now(); }
export function measure(name: string, fn: () => unknown) { const start = now(); const result = fn(); return { result, duration: now() - start, name }; }
export function formatDuration(ms: number) { return ms < 1000 ? `${ms.toFixed(2)}ms` : `${(ms / 1000).toFixed(2)}s`; }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, helpers: ['now', 'measure', 'formatDuration'], timestamp: Date.now() }; }
export function calculatePercentile(values: number[], p: number) { if (!values || !values.length) return 0; const sorted = values.slice().sort(function(a: number, b: number) { return a - b; }); const idx = Math.ceil(p / 100 * sorted.length) - 1; return sorted[Math.max(0, idx)]; }
export function getMemoryUsage() { const perf = performance as any; return perf.memory ? { usedJSHeapSize: perf.memory.usedJSHeapSize, totalJSHeapSize: perf.memory.totalJSHeapSize } : null; }
let _fpsValue = 0;
let _fpsFrameCount = 0;
let _fpsLastTime = 0;
let _fpsRafId: number | null = null;

function _fpsLoop(timestamp: number) {
  _fpsFrameCount++;
  if (!_fpsLastTime) _fpsLastTime = timestamp;
  const elapsed = timestamp - _fpsLastTime;
  if (elapsed >= 1000) {
    _fpsValue = Math.round((_fpsFrameCount * 1000) / elapsed);
    _fpsFrameCount = 0;
    _fpsLastTime = timestamp;
  }
  _fpsRafId = requestAnimationFrame(_fpsLoop);
}

export function startFPSMonitor() {
  if (_fpsRafId !== null) return;
  _fpsLastTime = 0;
  _fpsFrameCount = 0;
  _fpsRafId = requestAnimationFrame(_fpsLoop);
}

export function stopFPSMonitor() {
  if (_fpsRafId !== null) { cancelAnimationFrame(_fpsRafId); _fpsRafId = null; }
}

export function getFPS() { return _fpsValue; }

if (typeof requestAnimationFrame !== 'undefined') { startFPSMonitor(); }
export default { now, measure, formatDuration, healthCheck, info, VERSION, MODULE_ID };
