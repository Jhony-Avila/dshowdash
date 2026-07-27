// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: helpers
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   debounce() — exported function
//   throttle() — exported function
//   deepClone() — exported function
//   isEmpty() — exported function
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

export const MODULE_ID = 'panel-enterprise.utils.helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Enterprise - Helper Functions
 * @module panel-enterprise/utils/helpers
 * @version 1.1.0-AAA
 */

export function debounce(this: any, fn: (...args: unknown[]) => unknown, delay = 300) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function(...args: unknown[]) {
        // @ts-expect-error strict migration — TS2769
        clearTimeout(timer);
        // @ts-expect-error strict migration — TS2683
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function throttle(this: any, fn: (...args: unknown[]) => unknown, limit = 100) {
    let inThrottle = false;
    return function(...args: unknown[]) {
        if (!inThrottle) {
            // @ts-expect-error strict migration — TS2683
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function deepClone(obj: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(value: unknown) {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

export default { debounce, throttle, deepClone, isEmpty };
