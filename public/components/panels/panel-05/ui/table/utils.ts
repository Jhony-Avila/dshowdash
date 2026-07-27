// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:utils
// PURPOSE: Panel-05 Table Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   escapeHtml() — exported function
//   copyToClipboard() — exported function
//   debounce() — exported function
//   throttleRAF() — exported function
//   createElement() — exported function
//   removeElement() — exported function
//   toggleClass() — exported function
//   hashData() — exported function
//   arrayMove() — exported function
//   downloadCSV() — exported function
//   getRelativePosition() — exported function
//   adjustMenuPosition() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

// ═══════════════════════════════════════════════════════════════
// HTML ESCAPE
// ═══════════════════════════════════════════════════════════════
export function escapeHtml(s: unknown) {
  if (!s) return '';
  // @ts-expect-error strict migration — TS2769
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// ═══════════════════════════════════════════════════════════════
// CLIPBOARD
// ═══════════════════════════════════════════════════════════════
export function copyToClipboard(text: string, onSuccess: (() => void) | null = null) {
  if (!text) return;
  navigator.clipboard?.writeText(text).then(() => {
    if (onSuccess) onSuccess();
  }).catch(err => {

    // @ts-expect-error TS migration - TS2304
    Logger?.error?.('[panel-05:table:utils] Clipboard error:', err);
  });
}

// ═══════════════════════════════════════════════════════════════
// DEBOUNCE
// ═══════════════════════════════════════════════════════════════
export function debounce(this: any, fn: (...args: unknown[]) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: unknown[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      // @ts-expect-error strict migration — TS2683
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

// ═══════════════════════════════════════════════════════════════
// THROTTLE WITH RAF
// ═══════════════════════════════════════════════════════════════
export function throttleRAF(this: any, fn: (...args: unknown[]) => void) {
  let rafId: number | null = null;
  return function (...args: unknown[]) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      // @ts-expect-error strict migration — TS2683
      fn.apply(this, args);
      rafId = null;
    });
  };
}

// ═══════════════════════════════════════════════════════════════
// DOM HELPERS
// ═══════════════════════════════════════════════════════════════
export function createElement(tag: string, className: string, innerHTML: string) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

export function removeElement(el: HTMLElement | null) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

export function toggleClass(el: HTMLElement | null, className: string, force?: boolean) {
  if (el) el.classList.toggle(className, force);
}

// ═══════════════════════════════════════════════════════════════
// DATA HASH (for change detection)
// ═══════════════════════════════════════════════════════════════
export function hashData(data: Array<Record<string, unknown>>) {
  if (!data || !data.length) return 'empty';
  // Simple hash based on length and first/last items
  const first = data[0];
  const last = data[data.length - 1];
  return `${data.length}-${first?.id || 0}-${last?.id || 0}`;
}

// ═══════════════════════════════════════════════════════════════
// ARRAY HELPERS
// ═══════════════════════════════════════════════════════════════
export function arrayMove(arr: unknown[], fromIndex: number, toIndex: number) {
  const newArr = [...arr];
  const element = newArr.splice(fromIndex, 1)[0];
  newArr.splice(toIndex, 0, element);
  return newArr;
}

// ═══════════════════════════════════════════════════════════════
// CSV EXPORT HELPER
// ═══════════════════════════════════════════════════════════════
export function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════
// POSITION HELPERS
// ═══════════════════════════════════════════════════════════════
export function getRelativePosition(event: { clientX: number; clientY: number }, container: HTMLElement) {
  const rect = container.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    containerWidth: rect.width,
    containerHeight: rect.height
  };
}

export function adjustMenuPosition(x: number, y: number, menuWidth: number, menuHeight: number, containerWidth: number, containerHeight: number) {
  let posX = x;
  let posY = y;

  if (posX + menuWidth > containerWidth) {
    posX = containerWidth - menuWidth - 8;
  }
  if (posY + menuHeight > containerHeight) {
    posY = posY - menuHeight;
  }

  return { x: Math.max(0, posX), y: Math.max(0, posY) };
}

export const MODULE_ID = 'panel-05:table:utils';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { utilsReady: true } }; }
