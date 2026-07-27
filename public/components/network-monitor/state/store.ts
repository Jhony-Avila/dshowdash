// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: network-monitor-store
// PURPOSE: Network Monitor - Store v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   setOnline() — exported function
//   updateConnection() — exported function
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
export const MODULE_ID = 'network-monitor-store';
let _state: { online: boolean; connectionType: string; downlink: number | null; rtt: number | null; lastCheck: number | null } = { online: true, connectionType: 'unknown', downlink: null, rtt: null, lastCheck: null };
let _subscribers: ((state: unknown) => void)[] = [];
export function getState() { return { ..._state }; }
export function setOnline(val: boolean) { _state.online = val; _state.lastCheck = Date.now(); _notify(); }
export function updateConnection(info: Partial<typeof _state>) { Object.assign(_state, info, { lastCheck: Date.now() }); _notify(); }
export function subscribe(fn: (state: unknown) => void) { if (typeof fn === 'function') _subscribers.push(fn); return () => { _subscribers = _subscribers.filter(s => s !== fn); }; }
function _notify() { _subscribers.forEach(fn => { try { fn(_state); } catch (e) {} }); }
export function healthCheck() { const checks = { hasState: true, recentCheck: _state.lastCheck && (Date.now() - _state.lastCheck) < 60000 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, online: _state.online, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, online: _state.online, connectionType: _state.connectionType, timestamp: Date.now() }; }
export default { getState, setOnline, updateConnection, subscribe, healthCheck, info, VERSION, MODULE_ID };
