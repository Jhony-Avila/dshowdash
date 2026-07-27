// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-charts/utils/helpers
// PURPOSE: Charts - Helper Functions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   uuid() — exported function
//   sleep() — exported function
//   clamp() — exported function
//   pick() — exported function
//   omit() — exported function
//   deepClone() — exported function
//   isEmpty() — exported function
//   isEqual() — exported function
//   capitalize() — exported function
//   slugify() — exported function
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
export const MODULE_ID = 'panels/panel-charts/utils/helpers';

export function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); }
export function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
export function clamp(n: number, min: number, max: number) { return Math.min(Math.max(n, min), max); }
export function pick(obj: Record<string, unknown>, keys: string[]) { return keys.reduce((r: Record<string, unknown>, k: string) => { if (k in obj) r[k] = obj[k]; return r; }, {}); }
export function omit(obj: Record<string, unknown>, keys: string[]) { return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k))); }
export function deepClone(obj: unknown) { return JSON.parse(JSON.stringify(obj)); }
export function isEmpty(obj: unknown) { return obj == null || (typeof obj === 'object' && Object.keys(obj as object).length === 0); }
export function isEqual(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }
export function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { uuid, sleep, clamp, pick, omit, deepClone, isEmpty, isEqual, capitalize, slugify, healthCheck, info, VERSION, MODULE_ID };
