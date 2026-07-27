// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-cards/utils/helpers
// PURPOSE: Panel Cards - Helpers
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
//   groupBy() — exported function
//   sortBy() — exported function
//   getCardById() — exported function
//   filterActiveCards() — exported function
//   sortCardsByOrder() — exported function
//   getCardsByType() — exported function
//   calculateGridLayout() — exported function
//   ... and 2 more exports
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
export const MODULE_ID = 'panel-cards/utils/helpers';

export function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
export function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
export function deepClone(obj: unknown) { if (!obj) return obj; return JSON.parse(JSON.stringify(obj)); }
export function isEmpty(obj: unknown) { if (!obj) return true; if (Array.isArray(obj)) return obj.length === 0; if (typeof obj === 'object') return Object.keys(obj as object).length === 0; return false; }
export function pick(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return keys.reduce((a: Record<string, unknown>, k: string) => { if (k in obj) a[k] = obj[k]; return a; }, {}); }
export function omit(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return Object.keys(obj).reduce((a: Record<string, unknown>, k: string) => { if (!keys.includes(k)) a[k] = (obj as Record<string, unknown>)[k]; return a; }, {}); }
export function groupBy(arr: Record<string, unknown>[], key: string | ((item: Record<string, unknown>) => string)) { if (!arr) return {}; return arr.reduce((a: Record<string, Record<string, unknown>[]>, i: Record<string, unknown>) => { const k = typeof key === 'function' ? key(i) : String(i[key]); (a[k] = a[k] || []).push(i); return a; }, {}); }
// @ts-expect-error strict migration — TS18046
export function sortBy(arr: Record<string, unknown>[], key: string | ((item: Record<string, unknown>) => unknown), order = 'asc') { if (!arr) return []; return [...arr].sort((a: Record<string, unknown>, b: Record<string, unknown>) => { const av = typeof key === 'function' ? key(a) : a[key]; const bv = typeof key === 'function' ? key(b) : b[key]; return order === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1); }); }

export function getCardById(cards: Record<string, unknown>[], id: string) { return cards.find((c: Record<string, unknown>) => c.id === id) || null; }
export function filterActiveCards(cards: Record<string, unknown>[]) { return cards.filter((c: Record<string, unknown>) => c.active !== false); }
export function sortCardsByOrder(cards: Record<string, unknown>[]) { return sortBy(cards, 'order', 'asc'); }
export function getCardsByType(cards: Record<string, unknown>[], type: string) { return cards.filter((c: Record<string, unknown>) => c.type === type); }

export function calculateGridLayout(count: number, maxColumns = 4) {
  if (count <= 2) return { columns: count, rows: 1 };
  if (count <= 4) return { columns: 2, rows: Math.ceil(count / 2) };
  if (count <= 9) return { columns: 3, rows: Math.ceil(count / 3) };
  return { columns: maxColumns, rows: Math.ceil(count / maxColumns) };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { generateId, sleep, deepClone, isEmpty, pick, omit, groupBy, sortBy, getCardById, filterActiveCards, sortCardsByOrder, getCardsByType, calculateGridLayout };
