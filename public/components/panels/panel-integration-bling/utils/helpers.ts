// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-bling/utils/helpers
// PURPOSE: Integration Bling - Helper Functions
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
export const MODULE_ID = 'panels/panel-integration-bling/utils/helpers';
export const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
export const pick = (obj: Record<string, unknown>, keys: string[]) => keys.reduce((r: Record<string, unknown>, k: string) => { if (k in obj) r[k] = obj[k]; return r; }, {});
export const omit = (obj: Record<string, unknown>, keys: string[]) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
export const deepClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
export const isEmpty = (obj: unknown) => obj == null || (typeof obj === 'object' && Object.keys(obj as object).length === 0);
export const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const healthCheck = () => ({ status: 'healthy', version: VERSION, moduleId: MODULE_ID });
export const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
export default { uuid, sleep, clamp, pick, omit, deepClone, isEmpty, isEqual, capitalize, slugify, healthCheck, info, VERSION, MODULE_ID };
