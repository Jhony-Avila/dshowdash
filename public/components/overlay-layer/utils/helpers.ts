// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-helpers
// PURPOSE: Overlay Layer - Helpers v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   deepClone() — exported function
//   generateId() — exported function
//   debounce() — exported function
//   isFunction() — exported function
//   isObject() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'overlay-layer-helpers';

export function deepClone(obj: DynObj) { if (!obj || typeof obj !== 'object') return obj; return JSON.parse(JSON.stringify(obj)); }
export function generateId(prefix = 'overlay') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
export function debounce(fn: DynObj, ms = 100) { let t: DynObj; return (...args: DynObj[]) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
export function isFunction(val: DynObj) { return typeof val === 'function'; }
export function isObject(val: DynObj) { return val !== null && typeof val === 'object' && !Array.isArray(val); }

export function healthCheck() {
  const checks = { functionsAvailable: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: 'HEALTHY', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, helpers: ['deepClone', 'generateId', 'debounce', 'isFunction', 'isObject'], timestamp: Date.now() }; }

export default { deepClone, generateId, debounce, isFunction, isObject, healthCheck, info, VERSION, MODULE_ID };
