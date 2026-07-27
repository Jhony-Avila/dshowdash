// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: network-monitor-detector
// PURPOSE: Network Monitor - Detector v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isOnline() — exported function
//   watch() — exported function
//   unwatch() — exported function
//   unwatchAll() — exported function
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
export const MODULE_ID = 'network-monitor-detector';
type ListenerPair = { onlineHandler: () => void; offlineHandler: () => void };
let _listeners: ListenerPair[] = [];
export function isOnline() { return navigator.onLine ?? true; }
export function watch(callback: (online: boolean) => void) { const onlineHandler = () => callback(true); const offlineHandler = () => callback(false); window.addEventListener('online', onlineHandler); window.addEventListener('offline', offlineHandler); _listeners.push({ onlineHandler, offlineHandler }); return () => unwatch(onlineHandler, offlineHandler); }
export function unwatch(onlineHandler: () => void, offlineHandler: () => void) { window.removeEventListener('online', onlineHandler); window.removeEventListener('offline', offlineHandler); _listeners = _listeners.filter(l => l.onlineHandler !== onlineHandler); }
export function unwatchAll() { for (let i = 0; i < _listeners.length; i++) { window.removeEventListener('online', _listeners[i].onlineHandler); window.removeEventListener('offline', _listeners[i].offlineHandler); } _listeners = []; }
export function healthCheck() { const checks = { navigatorOnlineSupported: 'onLine' in navigator }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, online: isOnline(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, online: isOnline(), listenerCount: _listeners.length, timestamp: Date.now() }; }
export default { isOnline, watch, unwatch, unwatchAll, healthCheck, info, VERSION, MODULE_ID };
