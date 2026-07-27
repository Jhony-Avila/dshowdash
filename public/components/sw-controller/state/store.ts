// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sw-controller-store
// PURPOSE: SW Controller - Store v2.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   setRegistered() — exported function
//   setUpdateAvailable() — exported function
//   setStatus() — exported function
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
export const VERSION = '2.1.0-ENTERPRISE';
export const MODULE_ID = 'sw-controller-store';
let _state: { registered: boolean; registration: ServiceWorkerRegistration | null; updateAvailable: boolean; status: string } = { registered: false, registration: null, updateAvailable: false, status: 'idle' };
let _subscribers: ((state: unknown) => void)[] = [];
const _validStatuses = ['idle', 'registering', 'registered', 'error'];
export function getState() { return { ..._state }; }
export function setRegistered(val: boolean, reg: ServiceWorkerRegistration | null = null) { _state.registered = val; _state.registration = reg; _notify(); }
export function setUpdateAvailable(val: boolean) { _state.updateAvailable = val; _notify(); }
export function setStatus(status: string) { _state.status = status; _notify(); }
export function subscribe(fn: (state: unknown) => void) { if (typeof fn === 'function') _subscribers.push(fn); return () => { _subscribers = _subscribers.filter(s => s !== fn); }; }
function _notify() { _subscribers.forEach(s => { try { s(_state); } catch (e) {} }); }
export function healthCheck() { const checks = { hasState: true, validStatus: _validStatuses.includes(_state.status) }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, swStatus: _state.status, registered: _state.registered, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, registered: _state.registered, updateAvailable: _state.updateAvailable, status: _state.status, timestamp: Date.now() }; }
export const swStore = { getState, setRegistered, setUpdateAvailable, setStatus, subscribe, healthCheck, info };
export default { getState, setRegistered, setUpdateAvailable, setStatus, subscribe, healthCheck, info, VERSION, MODULE_ID };
