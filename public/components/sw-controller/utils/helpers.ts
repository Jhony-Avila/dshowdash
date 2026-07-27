// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sw-controller-helpers
// PURPOSE: SW Controller - Helpers v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isServiceWorkerSupported() — exported function
//   isSecureContext() — exported function
//   canRegisterSW() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.isSecureContext
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'sw-controller-helpers';
export function isServiceWorkerSupported() { return 'serviceWorker' in navigator; }
export function isSecureContext() { return window.isSecureContext === true; }
export function canRegisterSW() { return isServiceWorkerSupported() && isSecureContext(); }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, helpers: ['isServiceWorkerSupported', 'isSecureContext', 'canRegisterSW'], swSupported: isServiceWorkerSupported(), timestamp: Date.now() }; }
export async function getCacheNames() { try { return await caches.keys(); } catch(e) { return []; } }
export async function clearAllCaches() { const names = await getCacheNames(); await Promise.all(names.map(function(n) { return caches.delete(n); })); }
export async function getCacheSize(cacheName: string) { try { const cache = await caches.open(cacheName); const keys = await cache.keys(); return keys.length; } catch(e) { return 0; } }
export function formatBytes(bytes: number) { if (bytes === 0) return "0 B"; const k = 1024; const sizes = ["B", "KB", "MB", "GB"]; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]; }
export async function getStorageEstimate() { if (navigator.storage && navigator.storage.estimate) { return navigator.storage.estimate(); } return { quota: 0, usage: 0 }; }
export default { isServiceWorkerSupported, isSecureContext, canRegisterSW, healthCheck, info, VERSION, MODULE_ID };
