// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:utils:data-utils
// PURPOSE: Panel-05 Dashboard Utils - Data Utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   groupBy() — exported function
//   sortBy() — exported function
//   sumBy() — exported function
//   avgBy() — exported function
//   minBy() — exported function
//   maxBy() — exported function
//   unique() — exported function
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

type KeyFn = string | ((item: unknown) => unknown);

function getVal(item: unknown, key: KeyFn): unknown {
  if (typeof key === 'function') return key(item);
  return (item as Record<string, unknown>)[key];
}

export function groupBy(array: unknown[], key: KeyFn) {
  if (!Array.isArray(array)) return {};
  return array.reduce((groups: Record<string, unknown[]>, item) => {
    const value = String(getVal(item, key));
    (groups[value] = groups[value] || []).push(item);
    return groups;
  }, {});
}

export function sortBy(array: unknown[], key: KeyFn, direction = 'asc') {
  if (!Array.isArray(array)) return [];
  const sorted = [...array].sort((a, b) => {
    const aVal = getVal(a, key);
    const bVal = getVal(b, key);
    // @ts-expect-error strict migration — TS18046
    if (aVal < bVal) return -1;
    // @ts-expect-error strict migration — TS18046
    if (aVal > bVal) return 1;
    return 0;
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function sumBy(array: unknown[], key: KeyFn): number {
  if (!Array.isArray(array)) return 0;
  return (array as unknown[]).reduce((sum: number, item: unknown) => {
    const val = getVal(item, key);
    return sum + (Number(val) || 0);
  }, 0) as number;
}

export function avgBy(array: unknown[], key: KeyFn) {
  if (!Array.isArray(array) || !array.length) return 0;
  return sumBy(array, key) / array.length;
}

export function minBy(array: unknown[], key: KeyFn) {
  if (!Array.isArray(array) || !array.length) return null;
  return array.reduce((min, item) => {
    const val = getVal(item, key);
    const minVal = getVal(min, key);
    // @ts-expect-error strict migration — TS18046
    return val < minVal ? item : min;
  });
}

export function maxBy(array: unknown[], key: KeyFn) {
  if (!Array.isArray(array) || !array.length) return null;
  return array.reduce((max, item) => {
    const val = getVal(item, key);
    const maxVal = getVal(max, key);
    // @ts-expect-error strict migration — TS18046
    return val > maxVal ? item : max;
  });
}

export function unique(array: unknown[], key: KeyFn | null = null) {
  if (!Array.isArray(array)) return [];
  if (!key) return [...new Set(array)];
  const seen = new Set();
  return array.filter(item => {
    const val = getVal(item, key);
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

export default { groupBy, sortBy, sumBy, avgBy, minBy, maxBy, unique };

export const MODULE_ID = 'panel-05:utils:data-utils';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { dataUtilsReady: true } }; }
