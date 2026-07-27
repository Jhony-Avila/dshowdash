// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: performance-monitor-lifecycle
// PURPOSE: Performance Monitor - Lifecycle v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   mount() — exported function
//   unmount() — exported function
//   startCollecting() — exported function
//   stopCollecting() — exported function
//   isInitialized() — exported function
//   isMounted() — exported function
//   isCollecting() — exported function
//   getState() — exported function
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
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'performance-monitor-lifecycle';
let _state = { initialized: false, mounted: false, ready: false, collecting: false };
export function init() { _state.initialized = true; return true; }
export function mount() { _state.mounted = true; return true; }
export function unmount() { _state.mounted = false; _state.collecting = false; return true; }
export function startCollecting() { _state.collecting = true; }
export function stopCollecting() { _state.collecting = false; }
export function isInitialized() { return _state.initialized; }
export function isMounted() { return _state.mounted; }
export function isCollecting() { return _state.collecting; }
export function getState() { return { ..._state }; }
export function healthCheck() { const checks = { initialized: _state.initialized, mounted: _state.mounted }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, collecting: _state.collecting, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, state: getState(), timestamp: Date.now() }; }
export const PerformanceLifecycle = { init, mount, unmount, startCollecting, stopCollecting, isInitialized, isMounted, isCollecting, getState, healthCheck, info };
export default { init, mount, unmount, startCollecting, stopCollecting, isInitialized, isMounted, isCollecting, getState, healthCheck, info, VERSION, MODULE_ID };
