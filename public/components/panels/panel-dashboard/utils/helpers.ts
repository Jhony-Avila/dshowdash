// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-dashboard/utils/helpers
// PURPOSE: Panel Dashboard - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   generateId() — exported function
//   sleep() — exported function
//   deepClone() — exported function
//   isEmpty() — exported function
//   pick() — exported function
//   omit() — exported function
//   merge() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-dashboard/utils/helpers';

export function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
export function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
export function deepClone(obj: unknown) { if (!obj) return obj; return JSON.parse(JSON.stringify(obj)); }
export function isEmpty(obj: unknown) { if (!obj) return true; if (Array.isArray(obj)) return obj.length === 0; if (typeof obj === 'object') return Object.keys(obj as object).length === 0; return false; }
export function pick(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return keys.reduce((a: Record<string, unknown>, k: string) => { if (k in obj) a[k] = obj[k]; return a; }, {}); }
export function omit(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return Object.keys(obj).reduce((a: Record<string, unknown>, k: string) => { if (!keys.includes(k)) a[k] = obj[k]; return a; }, {}); }
export function merge(target: Record<string, unknown>, source: Record<string, unknown>) { return Object.assign({}, target, source); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { generateId, sleep, deepClone, isEmpty, pick, omit, merge };
