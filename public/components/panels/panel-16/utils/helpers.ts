// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16/utils/helpers
// PURPOSE: Panel-16 Helpers - Fornecedores 360º
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   generateId() — exported function
//   sleep() — exported function
//   clamp() — exported function
//   deepClone() — exported function
//   isEmpty() — exported function
//   pick() — exported function
//   omit() — exported function
//   groupBy() — exported function
//   sortBy() — exported function
//   filterBy() — exported function
//   paginate() — exported function
//   calcularRisco() — exported function
//   info() — exported function
//   ... and 1 more exports
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
export const MODULE_ID = 'panel-16/utils/helpers';

export function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
export function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
export function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }
export function deepClone(obj: unknown) { if (!obj) return obj; return JSON.parse(JSON.stringify(obj)); }
export function isEmpty(obj: unknown) { if (!obj) return true; if (Array.isArray(obj)) return obj.length === 0; if (typeof obj === 'object') return Object.keys(obj as object).length === 0; return false; }
export function pick(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return keys.reduce((acc: Record<string, unknown>, key: string) => { if (key in obj) acc[key] = obj[key]; return acc; }, {}); }
export function omit(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => { if (!keys.includes(key)) acc[key] = (obj as Record<string, unknown>)[key]; return acc; }, {}); }

export function groupBy(arr: unknown[], key: string | ((item: unknown) => string)) {
  if (!arr || !Array.isArray(arr)) return {};
  return arr.reduce((acc: Record<string, unknown[]>, item: unknown) => { const k = typeof key === 'function' ? key(item) : (item as Record<string, unknown>)[key] as string; (acc[k] = acc[k] || []).push(item); return acc; }, {});
}

export function sortBy(arr: unknown[], key: string | ((item: unknown) => unknown), order = 'asc') {
  if (!arr || !Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : (a as Record<string, unknown>)[key];
    const bVal = typeof key === 'function' ? key(b) : (b as Record<string, unknown>)[key];
    // @ts-expect-error strict migration — TS18046
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    // @ts-expect-error strict migration — TS18046
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function filterBy(arr: unknown[], filters: Record<string, unknown>) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.filter(item => Object.entries(filters).every(([key, value]) => {
    if (value === null || value === undefined || value === '') return true;
    const itemVal = String((item as Record<string, unknown>)[key] || '').toLowerCase();
    return itemVal.includes(String(value).toLowerCase());
  }));
}

export function paginate(arr: unknown[], page = 1, limit = 30) {
  if (!arr || !Array.isArray(arr)) return { data: [], total: 0, page, limit, pages: 0 };
  const total = arr.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = arr.slice(start, start + limit);
  return { data, total, page, limit, pages };
}

export function calcularRisco(fornecedor: Record<string, unknown>) {
  let score = 100;
  if (!fornecedor.cnpj) score -= 20;
  if (!fornecedor.email) score -= 10;
  if (!fornecedor.telefone) score -= 10;
  if ((fornecedor.pendencias as number) > 0) score -= (fornecedor.pendencias as number) * 5;
  if ((fornecedor.dias_sem_pedido as number) > 90) score -= 15;
  if ((fornecedor.dias_sem_pedido as number) > 180) score -= 15;
  score = clamp(score, 0, 100);
  let nivel = 'baixo';
  if (score < 40) nivel = 'critico';
  else if (score < 60) nivel = 'alto';
  else if (score < 80) nivel = 'medio';
  return { score, nivel };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { generateId, sleep, clamp, deepClone, isEmpty, pick, omit, groupBy, sortBy, filterBy, paginate, calcularRisco };
