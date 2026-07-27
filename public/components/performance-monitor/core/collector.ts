// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: performance-monitor-collector
// PURPOSE: Performance Monitor - Collector v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   start() — exported function
//   stop() — exported function
//   getEntries() — exported function
//   clear() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.PerformanceObserver
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'performance-monitor-collector';
let _entries: PerformanceEntry[] = [];
let _observer: PerformanceObserver | null = null;
export function start() { if (_observer) return; if (!window.PerformanceObserver) return false; _observer = new PerformanceObserver((list) => { _entries.push(...list.getEntries()); if (_entries.length > 200) _entries = _entries.slice(-200); }); _observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] }); return true; }
export function stop() { if (_observer) { _observer.disconnect(); _observer = null; } }
export function getEntries() { return [..._entries]; }
export function clear() { _entries = []; }
export function healthCheck() { const checks = { observerSupported: !!window.PerformanceObserver, collecting: !!_observer }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, entryCount: _entries.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, collecting: !!_observer, entryCount: _entries.length, timestamp: Date.now() }; }
export const MetricsCollector = { start, stop, getEntries, clear, healthCheck, info, enableDetailedTracking: function() {} };
export default { start, stop, getEntries, clear, healthCheck, info, VERSION, MODULE_ID };
