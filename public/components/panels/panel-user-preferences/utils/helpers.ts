// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences/utils/helpers
// PURPOSE: Panel User Preferences - Helpers
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
//   deepEqual() — exported function
//   isEmpty() — exported function
//   pick() — exported function
//   omit() — exported function
//   merge() — exported function
//   deepMerge() — exported function
//   getSystemTheme() — exported function
//   getSystemReducedMotion() — exported function
//   applyThemeToDocument() — exported function
//   applyDensityToDocument() — exported function
//   ... and 4 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences/utils/helpers';

export function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
export function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
export function deepClone(obj: unknown) { if (!obj) return obj; return JSON.parse(JSON.stringify(obj)); }
export function deepEqual(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }
export function isEmpty(obj: unknown) { if (!obj) return true; if (Array.isArray(obj)) return obj.length === 0; if (typeof obj === 'object') return Object.keys(obj as object).length === 0; return false; }
export function pick(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return keys.reduce((acc: Record<string, unknown>, key: string) => { if (key in obj) acc[key] = obj[key]; return acc; }, {}); }
export function omit(obj: Record<string, unknown>, keys: string[]) { if (!obj) return {}; return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => { if (!keys.includes(key)) acc[key] = obj[key]; return acc; }, {}); }
export function merge(target: Record<string, unknown>, source: Record<string, unknown>) { return Object.assign({}, target, source); }
export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> { const result = deepClone(target) as Record<string, unknown>; for (const key in source) { if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) { result[key] = deepMerge((result[key] || {}) as Record<string, unknown>, source[key] as Record<string, unknown>); } else { result[key] = source[key]; } } return result; }

export function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSystemReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyThemeToDocument(theme: string) {
  if (typeof document === 'undefined') return;
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(`theme-${resolved}`);
}

export function applyDensityToDocument(density: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-density', density);
  document.documentElement.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
  document.documentElement.classList.add(`density-${density}`);
}

export function applyFontSizeToDocument(size: string) {
  if (typeof document === 'undefined') return;
  const sizes: Record<string, string> = { small: '14px', medium: '16px', large: '18px', 'x-large': '20px' };
  document.documentElement.style.setProperty('--base-font-size', sizes[size] || '16px');
}

export function getDiff(original: Record<string, unknown>, current: Record<string, unknown>) {
  const diff: Record<string, unknown> = {};
  for (const key in current) { if (!deepEqual(original[key], current[key])) diff[key] = current[key]; }
  return diff;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { generateId, sleep, deepClone, deepEqual, isEmpty, pick, omit, merge, deepMerge, getSystemTheme, getSystemReducedMotion, applyThemeToDocument, applyDensityToDocument, applyFontSizeToDocument, getDiff };
