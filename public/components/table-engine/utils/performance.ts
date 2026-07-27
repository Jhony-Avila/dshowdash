// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.table-engine.utils.performance
// PURPOSE: Table Engine - Performance Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   startMeasure() — exported function
//   endMeasure() — exported function
//   measureAsync() — exported function
//   getTimings() — exported function
//   clearTimings() — exported function
//   debounce() — exported function
//   throttle() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.table-engine.utils.performance';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { measurements: 0, avgRenderTime: 0, peakRenderTime: 0 };
let _timings: Array<{ label: string; duration: number; timestamp: number }> = [];
const MAX_TIMINGS = 100;

function startMeasure(label: string) { return { label, start: performance.now() }; }

function endMeasure(measure: { label: string; start: number } | null) { if (!measure || !measure.start) return null; const duration = performance.now() - measure.start; _metrics.measurements++; _timings.push({ label: measure.label, duration, timestamp: Date.now() }); if (_timings.length > MAX_TIMINGS) _timings.shift(); if (duration > _metrics.peakRenderTime) _metrics.peakRenderTime = duration; const total = _timings.reduce((sum, t) => sum + t.duration, 0); _metrics.avgRenderTime = Math.round(total / _timings.length); return { label: measure.label, duration }; }

function measureAsync(label: string, fn: () => unknown) { const measure = startMeasure(label); return Promise.resolve().then(fn).then(result => { endMeasure(measure); return result; }); }

function getTimings(limit?: number) { return _timings.slice(-(limit || 20)); }
function clearTimings() { _timings = []; _metrics.peakRenderTime = 0; _metrics.avgRenderTime = 0; return { ok: true }; }

// @ts-expect-error strict migration — TS2683, TS2345
function debounce(this: any, fn: (...args: unknown[]) => void, delay: number) { let timer: ReturnType<typeof setTimeout> | null = null; return function() { const args = arguments; const ctx = this; if (timer) clearTimeout(timer); timer = setTimeout(() => { fn.apply(ctx, args); }, delay); }; }

// @ts-expect-error strict migration — TS2683, TS2345
function throttle(this: any, fn: (...args: unknown[]) => void, limit: number) { let inThrottle = false; return function() { const args = arguments; const ctx = this; if (!inThrottle) { fn.apply(ctx, args); inThrottle = true; setTimeout(() => { inThrottle = false; }, limit); } }; }

function init(ctx: { ports?: Record<string, unknown> } | null) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, timingsCount: _timings.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, startMeasure, endMeasure, measureAsync, getTimings, clearTimings, debounce, throttle, healthCheck, info };
export default { MODULE_ID, VERSION, init, startMeasure, endMeasure, measureAsync, getTimings, clearTimings, debounce, throttle, healthCheck, info, injectPorts, getPorts };
