// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-wechat-integration/utils/timers
// PURPOSE: Status  - Timer Utilities
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
export const MODULE_ID = 'panels/panel-status-wechat-integration/utils/timers';

export function debounce(fn: (...args: unknown[]) => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: unknown[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export function throttle(fn: (...args: unknown[]) => void, limit = 300) {
  let inThrottle: boolean;
  return (...args: unknown[]) => { if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } };
}

export function delay(fn: () => void, ms: number) { return setTimeout(fn, ms); }
export function interval(fn: () => void, ms: number) { return setInterval(fn, ms); }
export function cancelDelay(id: ReturnType<typeof setTimeout>) { clearTimeout(id); }
export function cancelInterval(id: ReturnType<typeof setInterval>) { clearInterval(id); }

export function retry(fn: () => Promise<unknown>, retries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = (n: number) => {
      fn().then(resolve).catch((err: unknown) => {
        if (n <= 1) reject(err);
        else setTimeout(() => attempt(n - 1), delay);
      });
    };
    attempt(retries);
  });
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { debounce, throttle, delay, interval, cancelDelay, cancelInterval, retry, healthCheck, info, VERSION, MODULE_ID };
