// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-bling/utils/timers
// PURPOSE: Integration Bling - Timer Utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   debounce() — exported function
//   throttle() — exported function
//   delay() — exported function
//   interval() — exported function
//   cancelDelay() — exported function
//   cancelInterval() — exported function
//   retry() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-integration-bling/utils/timers';
export const debounce = (fn: (...args: unknown[]) => void, delay = 300) => { let timer: ReturnType<typeof setTimeout>; return (...args: unknown[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; };
export const throttle = (fn: (...args: unknown[]) => void, limit = 300) => { let inThrottle: boolean; return (...args: unknown[]) => { if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; };
export const delay = (fn: () => void, ms: number) => setTimeout(fn, ms);
export const interval = (fn: () => void, ms: number) => setInterval(fn, ms);
export const cancelDelay = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
export const cancelInterval = (id: ReturnType<typeof setInterval>) => clearInterval(id);
export const retry = (fn: () => Promise<unknown>, retries = 3, delayMs = 1000) => new Promise((resolve, reject) => { const attempt = (n: number) => { fn().then(resolve).catch((err: unknown) => { if (n <= 1) reject(err); else setTimeout(() => attempt(n - 1), delayMs); }); }; attempt(retries); });
export const healthCheck = () => ({ status: 'healthy', version: VERSION, moduleId: MODULE_ID });
export const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
export default { debounce, throttle, delay, interval, cancelDelay, cancelInterval, retry, healthCheck, info, VERSION, MODULE_ID };
