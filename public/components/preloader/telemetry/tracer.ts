// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader.telemetry.tracer
// PURPOSE: Preloader Tracer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createTracer() — exported function
//   healthCheck() — exported function
//   BootTracer — exported class
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'preloader.telemetry.tracer';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const DEFAULT_MAX_ENTRIES = 100;
class BootTracer { [key: string]: any; constructor(bootId: string, maxEntries = DEFAULT_MAX_ENTRIES) { this.bootId = bootId; this.bootStartTs = Date.now(); this.maxEntries = maxEntries; this.trace = []; } add(action: string, data: Record<string, unknown> | null = null) { const entry = { action, data, timestamp: Date.now(), elapsed: Date.now() - this.bootStartTs }; this.trace.push(entry); if (this.trace.length > this.maxEntries) { this.trace.shift(); } return entry; } getTrace() { return [...this.trace]; } getRecent(count = 10) { return this.trace.slice(-count); } clear() { this.trace = []; } getPerformanceMarks() { if (typeof performance === 'undefined') return {}; const marks: Record<string, number> = {}; performance.getEntriesByType('measure').forEach(entry => { if (entry.name.startsWith('preloader:')) { marks[entry.name] = Math.round(entry.duration); } }); return marks; } markStart(name: string) { if (typeof performance !== 'undefined') { performance.mark(`preloader:${name}:start`); } } markEnd(name: string) { if (typeof performance !== 'undefined') { performance.mark(`preloader:${name}:end`); try { performance.measure(`preloader:${name}`, `preloader:${name}:start`, `preloader:${name}:end`); } catch {} } } getDuration() { return Date.now() - this.bootStartTs; } getStatus() { return { bootId: this.bootId, entries: this.trace.length, maxEntries: this.maxEntries, durationMs: this.getDuration() }; } }
export function createTracer(bootId: string, maxEntries?: number) { return new BootTracer(bootId, maxEntries); }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, hasPerformanceAPI: typeof performance !== 'undefined', portsInitialized: Ports.isInitialized() }; }
export { BootTracer };
export default { VERSION, MODULE_ID, createTracer, BootTracer, healthCheck, injectPorts, getPorts };
