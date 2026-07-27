// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-google-drive/utils/helpers
// PURPOSE: panel-google-drive - Helpers (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   debounce() — exported function
//   throttle() — exported function
//   deepClone() — exported function
//   deepMerge() — exported function
//   isObject() — exported function
//   isEmpty() — exported function
//   generateId() — exported function
//   sleep() — exported function
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

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-google-drive/utils/helpers';

export function debounce(this: any, fn: Function, delay = 300) {
  // @ts-expect-error strict migration — TS7034
  let timeoutId;
  // @ts-expect-error strict migration — TS7005, TS2683
  return function(...args: unknown[]) { clearTimeout(timeoutId); timeoutId = setTimeout(() => fn.apply(this, args), delay); };
}

export function throttle(this: any, fn: Function, limit = 300) {
  // @ts-expect-error strict migration — TS7034
  let inThrottle;
  // @ts-expect-error strict migration — TS7005, TS2683
  return function(...args: unknown[]) { if (!inThrottle) { fn.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } };
}

export function deepClone(obj: Record<string,unknown>) { return JSON.parse(JSON.stringify(obj)); }
// @ts-expect-error TS migration - TS2407, TS2352, TS2345
export function deepMerge(target: HTMLElement|null, source: string) { for (const key in source) { if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) { (target as Record<string,unknown>)[key] = (target as Record<string,unknown>)[key] || {}; deepMerge((target as Record<string,unknown>)[key], source[key]); } else { (target as Record<string,unknown>)[key] = source[key]; } } return target; }
export function isObject(val: unknown) { return val !== null && typeof val === 'object' && !Array.isArray(val); }
export function isEmpty(val: unknown) { if (val == null) return true; if (Array.isArray(val) || typeof val === 'string') return val.length === 0; if (isObject(val)) return Object.keys(val).length === 0; return false; }
export function generateId(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
// @ts-expect-error TS migration - TS2769
export function sleep(ms: unknown) { return new Promise(resolve => setTimeout(resolve, ms)); }
export function retry(fn: Function, attempts = 3, delay = 1000) { return fn().catch((err: unknown) => attempts > 1 ? sleep(delay).then(() => retry(fn, attempts - 1, delay * 2)) : Promise.reject(err)); }

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { ready: true } }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID }; }
export default { debounce, throttle, deepClone, deepMerge, isObject, isEmpty, generateId, sleep, retry };
