// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: performance-monitor-store
// PURPOSE: Performance Monitor - Store v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   getMeasurements() — exported function
//   addMeasurement() — exported function
//   clear() — exported function
//   subscribe() — exported function
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
export const MODULE_ID = 'performance-monitor-store';
let _state: { measurements: Record<string, unknown>[]; config: { sampleRate: number } } = { measurements: [], config: { sampleRate: 100 } };
let _subscribers: ((state: typeof _state) => void)[] = [];
export function getState() { return { ..._state }; }
export function getMeasurements() { return [..._state.measurements]; }
export function addMeasurement(m: Record<string, unknown>) { _state.measurements.push({ ...m, timestamp: Date.now() }); if (_state.measurements.length > 100) _state.measurements.shift(); _notify(); }
export function clear() { _state.measurements = []; _notify(); }
export function subscribe(fn: (state: typeof _state) => void) { if (typeof fn === 'function') _subscribers.push(fn); return () => { _subscribers = _subscribers.filter(s => s !== fn); }; }
function _notify() { _subscribers.forEach(fn => { try { fn(_state); } catch (e) {} }); }
export function healthCheck() { const checks = { hasState: true, bufferHealthy: _state.measurements.length < 100 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, measurementCount: _state.measurements.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, measurementCount: _state.measurements.length, timestamp: Date.now() }; }
export const performanceStore = { getState, getMeasurements, addMeasurement, clear, subscribe, healthCheck, info };
export default { getState, getMeasurements, addMeasurement, clear, subscribe, healthCheck, info, VERSION, MODULE_ID };
