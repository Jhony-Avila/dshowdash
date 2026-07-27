// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:utils:helpers
// PURPOSE: Panel-05 Dashboard Utils - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   debounce() — exported function
//   throttle() — exported function
//   deepClone() — exported function
//   deepMerge() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

export function debounce(fn: (...args: unknown[]) => void, delay = 300) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: unknown[]) {
    // @ts-expect-error strict migration — TS2769
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn: (...args: unknown[]) => void, limit = 300) {
  let inThrottle = false;
  return function (this: unknown, ...args: unknown[]) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

export function deepClone(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, deepClone(v)]));
}

export function deepMerge(target: unknown, source: unknown): unknown {
  if (!source) return target;
  const result = deepClone(target) as Record<string, unknown>;
  const src = source as Record<string, unknown>;
  for (const key of Object.keys(src)) {
    if (src[key] && typeof src[key] === 'object' && !Array.isArray(src[key])) {
      result[key] = deepMerge(result[key] || {}, src[key]);
    } else {
      result[key] = src[key];
    }
  }
  return result;
}

export default { debounce, throttle, deepClone, deepMerge };

export const MODULE_ID = 'panel-05:utils:helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } }; }
