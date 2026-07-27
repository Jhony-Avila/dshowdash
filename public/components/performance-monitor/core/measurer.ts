// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: performance-monitor-measurer
// PURPOSE: Performance Monitor - Measurer v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   mark() — exported function
//   measure() — exported function
//   clearMarks() — exported function
//   getMarks() — exported function
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
export const MODULE_ID = 'performance-monitor-measurer';
const _marks = new Map();
export function mark(name: string) { _marks.set(name, performance.now()); }
export function measure(name: string, startMark: string) { const start = _marks.get(startMark) ?? 0; return { name, duration: performance.now() - start, timestamp: Date.now() }; }
export function clearMarks() { _marks.clear(); }
export function getMarks() { return Object.fromEntries(_marks); }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, markCount: _marks.size, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, markCount: _marks.size, timestamp: Date.now() }; }
export default { mark, measure, clearMarks, getMarks, healthCheck, info, VERSION, MODULE_ID };
