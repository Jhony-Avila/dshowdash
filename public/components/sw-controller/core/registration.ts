// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sw-controller-registration
// PURPOSE: SW Controller - Registration v2.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   register() — exported function
//   unregister() — exported function
//   getRegistration() — exported function
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
export const MODULE_ID = 'sw-controller-registration';
let _registration: ServiceWorkerRegistration | null = null;
export async function register(swPath = '/sw.js') { if (!('serviceWorker' in navigator)) return { ok: false, reason: 'not-supported' }; try { _registration = await navigator.serviceWorker.register(swPath); return { ok: true, registration: _registration }; } catch (e: any) { return { ok: false, reason: e.message }; } }
export function unregister() { if (!_registration) return Promise.resolve(false); return _registration.unregister(); }
export function getRegistration() { return _registration; }
export function healthCheck() { const checks = { swSupported: 'serviceWorker' in navigator, hasRegistration: !!_registration }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, hasRegistration: !!_registration, timestamp: Date.now() }; }
export default { register, unregister, getRegistration, healthCheck, info, VERSION, MODULE_ID };
