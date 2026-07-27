

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04-ui-helpers
// PURPOSE: Panel 04 - UI Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   createElement() — exported function
//   removeElement() — exported function
//   clearElement() — exported function
//   toggleClass() — exported function
//   hasClass() — exported function
//   addClass() — exported function
//   removeClass() — exported function
//   escapeHtml() — exported function
//   truncate() — exported function
//   capitalize() — exported function
//   camelToKebab() — exported function
//   kebabToCamel() — exported function
//   slugify() — exported function
//   ... and 21 more exports
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

export const MODULE_ID = 'panel-04-ui-helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';

// ══════════════════════════════════════════════════════════════
// DOM HELPERS
// ══════════════════════════════════════════════════════════════

export function $(selector: string, context: Document | Element = document) {
  return context.querySelector(selector);
}

export function $$(selector: string, context: Document | Element = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function createElement(tag: string, attrs: Record<string, unknown> = {}, children: (string | Node)[] = []) {
  const el = document.createElement(tag);
  for (const key in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, key)) {
      if (key === 'className') el.className = attrs[key] as string;
      else if (key === 'innerHTML') el.innerHTML = attrs[key] as string;
      else if (key === 'textContent') el.textContent = attrs[key] as string;
      else if (key.startsWith('data-')) el.setAttribute(key, attrs[key] as string);
      else if (key.startsWith('on') && typeof attrs[key] === 'function') {
        el.addEventListener(key.substring(2).toLowerCase(), attrs[key] as EventListener);
      } else el.setAttribute(key, attrs[key] as string);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  }
  return el;
}

export function removeElement(el: Element) {
  if (el?.parentNode) el.parentNode.removeChild(el);
}

export function clearElement(el: Element) {
  if (el) el.innerHTML = '';
}

export function toggleClass(el: Element, className: string, force?: boolean) {
  if (!el) return;
  if (typeof force === 'boolean') el.classList.toggle(className, force);
  else el.classList.toggle(className);
}

export function hasClass(el: Element, className: string) {
  return el?.classList?.contains(className) || false;
}

export function addClass(el: Element, ...classNames: string[]) {
  if (el?.classList) el.classList.add(...classNames);
}

export function removeClass(el: Element, ...classNames: string[]) {
  if (el?.classList) el.classList.remove(...classNames);
}

// ══════════════════════════════════════════════════════════════
// STRING HELPERS
// ══════════════════════════════════════════════════════════════

export function escapeHtml(str: string) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function truncate(str: string, maxLen = 50, suffix = '...') {
  if (!str || str.length <= maxLen) return str || '';
  return str.substring(0, maxLen - suffix.length) + suffix;
}

export function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function camelToKebab(str: string) {
  if (!str) return '';
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function kebabToCamel(str: string) {
  if (!str) return '';
  return str.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
}

export function slugify(str: string) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

// ══════════════════════════════════════════════════════════════
// NUMBER HELPERS
// ══════════════════════════════════════════════════════════════

export function formatNumber(num: number, locale = 'pt-BR') {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString(locale);
}

export function formatCurrency(num: number, currency = 'BRL', locale = 'pt-BR') {
  if (typeof num !== 'number' || isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString(locale, { style: 'currency', currency });
}

export function formatPercent(num: number, decimals = 1) {
  if (typeof num !== 'number' || isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ══════════════════════════════════════════════════════════════
// DATE HELPERS
// ══════════════════════════════════════════════════════════════

export function formatDate(date: string | Date | number, locale = 'pt-BR') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale);
}

export function formatDateTime(date: string | Date | number, locale = 'pt-BR') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(locale);
}

export function formatTime(date: string | Date | number, locale = 'pt-BR') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(date: string | Date | number, locale = 'pt-BR') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay < 7) return `${diffDay}d atrás`;
  return formatDate(d, locale);
}

// ══════════════════════════════════════════════════════════════
// OBJECT HELPERS
// ══════════════════════════════════════════════════════════════

export function deepClone(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map((item: unknown) => deepClone(item));
  const clone: Record<string, unknown> = {};
  for (const key in (obj as Record<string, unknown>)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return clone;
}

export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>) {
  if (!source) return target;
  const output = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = deepMerge((output[key] as Record<string, unknown>) || {}, source[key] as Record<string, unknown>);
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
}

export function pick(obj: Record<string, unknown>, keys: string[]) {
  if (!obj) return {};
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit(obj: Record<string, unknown>, keys: string[]) {
  if (!obj) return {};
  const keysSet = new Set(keys);
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !keysSet.has(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// DEBOUNCE / THROTTLE
// ══════════════════════════════════════════════════════════════

export function debounce(fn: (...args: unknown[]) => void, delay = 300) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId ?? undefined);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn: (...args: unknown[]) => void, limit = 300) {
  let inThrottle = false;
  return (...args: unknown[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

// ══════════════════════════════════════════════════════════════
// UNIQUE ID
// ══════════════════════════════════════════════════════════════

let _idCounter = 0;

export function uniqueId(prefix = 'p04') {
  _idCounter += 1;
  return `${prefix}_${Date.now()}_${_idCounter}`;
}

// ══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ══════════════════════════════════════════════════════════════

export function isEmpty(val: unknown) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') return val.trim() === '';
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
}

export function isNumeric(val: unknown) {
  return !isNaN(parseFloat(val as string)) && isFinite(val as number);
}

export function isValidEmail(email: string) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, idCounter: _idCounter };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { domReady: typeof document !== 'undefined' } };
}

// ══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY ALIASES
// ══════════════════════════════════════════════════════════════

/** @alias truncate — backward compat export */
export const truncateText = truncate;

/** Returns alert display config (label, color, bg, icon) for a given alert type key */
export function getAlertConfig(type: string): { label: string; color: string; bg: string; icon: string; order: number } {
  const ALERT_TYPES: Record<string, { label: string; color: string; bg: string; icon: string; order: number }> = {
    'alert-critical': { label: 'Crítico', color: '#dc2626', bg: 'rgba(220,38,38,0.15)', icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#dc2626"/></svg>', order: 0 },
    'alert-high':     { label: 'Alto',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>', order: 1 },
    'alert-medium':   { label: 'Médio',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f59e0b"/></svg>', order: 2 },
    'alert-low':      { label: 'Baixo',   color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/></svg>', order: 3 },
  };
  return ALERT_TYPES[type] || { label: type || 'Info', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#6366f1"/></svg>', order: 99 };
}

/** Returns true if date is within the last `minutes` minutes */
export function isRecent(date: string | Date | number, minutes = 5): boolean {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  return (Date.now() - d.getTime()) < minutes * 60 * 1000;
}

/** Triggers a browser file download with the given content, filename, and MIME type */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): boolean {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Returns a lightweight hash string of the given data for change detection */
export function hashData(data: unknown): string {
  try {
    const str = JSON.stringify(data);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return String(h >>> 0);
  } catch {
    return String(Date.now());
  }
}

export default {
  MODULE_ID, VERSION,
  $, $$, createElement, removeElement, clearElement, toggleClass, hasClass, addClass, removeClass,
  escapeHtml, truncate, capitalize, camelToKebab, kebabToCamel, slugify,
  formatNumber, formatCurrency, formatPercent, clamp, randomInt,
  formatDate, formatDateTime, formatTime, timeAgo,
  deepClone, deepMerge, pick, omit,
  debounce, throttle, uniqueId,
  isEmpty, isNumeric, isValidEmail,
  info, healthCheck
};
