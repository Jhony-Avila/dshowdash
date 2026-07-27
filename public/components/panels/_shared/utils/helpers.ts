// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/_shared/utils/helpers
// PURPOSE: Panels Shared - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   debounce() — exported function
//   throttle() — exported function
//   sleep() — exported function
//   retry() — exported function
//   timeout() — exported function
//   generateId() — exported function
//   deepClone() — exported function
//   deepMerge() — exported function
//   isEmpty() — exported function
//   formatDate() — exported function
//   formatNumber() — exported function
//   formatCurrency() — exported function
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
export const MODULE_ID = 'panels/_shared/utils/helpers';

export function debounce(this: any, fn: (...args: unknown[]) => unknown, ms = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function throttle(this: any, fn: (...args: unknown[]) => unknown, ms = 300) {
  let lastCall = 0;
  return (...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry(fn: (...args: unknown[]) => Promise<unknown>, maxRetries = 3, delay = 1000, backoff = 2) {
  return async (...args: unknown[]) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try { return await fn(...args); }
      catch (error) {
        lastError = error;
        if (i < maxRetries - 1) await sleep(delay * Math.pow(backoff, i));
      }
    }
    throw lastError;
  };
}

export function timeout(promise: Promise<unknown>, ms: number, message = 'Timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map(deepClone) as unknown as T;
  return Object.fromEntries(Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, deepClone(v)])) as unknown as T;
}

export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge((result[key] || {}) as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export function isEmpty(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function formatDate(date: string | number | Date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return format

    // @ts-expect-error TS migration - TS2769
    .replace('YYYY', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
}

export function formatNumber(num: number, decimals = 2) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
}

export function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

export default { debounce, throttle, sleep, retry, timeout, generateId, deepClone, deepMerge, isEmpty, formatDate, formatNumber, formatCurrency, VERSION, MODULE_ID };

