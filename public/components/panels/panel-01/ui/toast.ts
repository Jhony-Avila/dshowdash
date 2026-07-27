// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/toast
// PURPOSE: Panel-01 Toast Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   success() — exported function
//   error() — exported function
//   warning() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'transitionend'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/toast';

const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
};

let container: HTMLElement | null = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'p01-toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function show(message: string, type = 'info', duration = 4000) {
  const cont = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `p01-toast p01-toast--${type}`;
  toast.innerHTML = `
    <span class="p01-toast-icon">${(ICONS as Record<string, string>)[type] || ICONS.info}</span>
    <span class="p01-toast-message">${message}</span>
    <button class="p01-toast-close" aria-label="Fechar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  `;
  
  // @ts-expect-error strict migration — TS2531
  toast.querySelector('.p01-toast-close').addEventListener('click', () => remove(toast));
  cont.appendChild(toast);
  
  requestAnimationFrame(() => toast.classList.add('p01-toast--show'));
  if (duration > 0) setTimeout(() => remove(toast), duration);
  return toast;
}

function remove(toast: HTMLElement) {
  toast.classList.remove('p01-toast--show');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

export const success = (msg: string, dur?: number) => show(msg, 'success', dur);
export const error = (msg: string, dur?: number) => show(msg, 'error', dur);
export const warning = (msg: string, dur?: number) => show(msg, 'warning', dur);
export const info = (msg: string, dur?: number) => show(msg, 'info', dur);

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { show, success, error, warning, info };
