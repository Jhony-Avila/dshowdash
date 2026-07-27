// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/helpers
// PURPOSE: Panel-01 Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   groupBy() — exported function
//   sortBy() — exported function
//   filterBy() — exported function
//   paginate() — exported function
//   uniqueBy() — exported function
//   sum() — exported function
//   average() — exported function
//   pick() — exported function
//   omit() — exported function
//   deepClone() — exported function
//   isEmpty() — exported function
//   sleep() — exported function
//   retry() — exported function
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
export const MODULE_ID = 'panel-01/utils/helpers';

export function groupBy(array: Record<string, unknown>[], key: string | ((item: Record<string, unknown>) => unknown)) {
  return array.reduce((groups: Record<string, unknown[]>, item: Record<string, unknown>) => {
    const value = typeof key === 'function' ? key(item) : item[key];
    const groupKey = String(value);
    (groups[groupKey] = groups[groupKey] || []).push(item);
    return groups;
  }, {});
}

export function sortBy(array: Record<string, unknown>[], key: string | ((item: Record<string, unknown>) => unknown), order = 'ASC') {
  const sorted = [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal as string, 'pt-BR', { numeric: true });
    }
    return (aVal as number) - (bVal as number);
  });
  
  return order === 'DESC' ? sorted.reverse() : sorted;
}

export function filterBy(array: Record<string, unknown>[], filters: Record<string, unknown>) {
  return array.filter((item: Record<string, unknown>) => Object.entries(filters).every(([key, value]) => {
    if (!value) return true;
    const itemValue = item[key];
    if (typeof value === 'string') {
      return String(itemValue).toLowerCase().includes(value.toLowerCase());
    }
    return itemValue === value;
  }));
}

export function paginate(array: unknown[], page: number, limit: number) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: array.slice(start, end),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit)
    }
  };
}

export function uniqueBy(array: Record<string, unknown>[], key: string | ((item: Record<string, unknown>) => unknown)) {
  const seen = new Set();
  return array.filter((item: Record<string, unknown>) => {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function sum(array: Record<string, unknown>[], key: string | ((item: Record<string, unknown>) => unknown)) {
  return array.reduce((total: number, item: Record<string, unknown>) => {
    const value = typeof key === 'function' ? key(item) : (key ? item[key] : item);
    return total + (parseFloat(String(value)) || 0);
  }, 0);
}

export function average(array: Record<string, unknown>[], key: string | ((item: Record<string, unknown>) => unknown)) {
  if (!array.length) return 0;
  return sum(array, key) / array.length;
}

export function pick(obj: Record<string, unknown>, keys: string[]) {
  return keys.reduce((result: Record<string, unknown>, key: string) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
}

export function omit(obj: Record<string, unknown>, keys: string[]) {
  const keysSet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysSet.has(key))
  );
}

export function deepClone(obj: unknown) {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(obj: unknown) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry(fn: () => Promise<unknown>, retries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = async (remaining: number) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (remaining <= 0) {
          reject(error);
        } else {
          await sleep(delay);
          attempt(remaining - 1);
        }
      }
    };
    attempt(retries);
  });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { groupBy, sortBy, filterBy, paginate, uniqueBy, sum, average, pick, omit, deepClone, isEmpty, sleep, retry };
