// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-detector
// PURPOSE: Theme Manager - Detector v2.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getSystemTheme() — exported function
//   watch() — exported function
//   unwatch() — exported function
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
export const MODULE_ID = 'theme-manager-detector';
let _listener: ((e: MediaQueryListEvent) => void) | null = null;
export function getSystemTheme() { const mq = window.matchMedia?.('(prefers-color-scheme: dark)'); return mq?.matches ? 'dark' : 'light'; }
export function watch(callback: (theme: string) => void) { if (_listener) unwatch(); const mq = window.matchMedia('(prefers-color-scheme: dark)'); _listener = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light'); mq.addEventListener('change', _listener); return true; }
export function unwatch() { if (!_listener) return; const mq = window.matchMedia('(prefers-color-scheme: dark)'); mq.removeEventListener('change', _listener); _listener = null; }
export function healthCheck() { const checks = { mediaQuerySupported: !!window.matchMedia }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/1`, checks, systemTheme: getSystemTheme(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, systemTheme: getSystemTheme(), watching: !!_listener, timestamp: Date.now() }; }
export const ThemeDetector = { getSystemTheme, watch, unwatch, healthCheck, info };
export default { getSystemTheme, watch, unwatch, healthCheck, info, VERSION, MODULE_ID };
