// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: page-breaks
// PURPOSE: Print Manager - Page Breaks
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   addPageBreak() — exported function
//   removePageBreaks() — exported function
//   markAvoidBreak() — exported function
//   markKeepTogether() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.print-manager.operations.page-breaks';

export function addPageBreak(element: HTMLElement) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return false;
  
  el.classList.add('dsd-print-page-break');
  return true;
}

// @ts-expect-error strict migration — TS2322
export function removePageBreaks(container: HTMLElement = null) {
  const scope = container 
    ? (typeof container === 'string' ? document.querySelector(container) : container)
    : document;
  
  if (!scope) return;
  
  // @ts-expect-error strict migration — TS2345
  scope.querySelectorAll('.dsd-print-page-break').forEach((el: HTMLElement) => {
    el.classList.remove('dsd-print-page-break');
  });
}

export function markAvoidBreak(element: HTMLElement) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return false;
  
  el.classList.add('dsd-print-avoid-break');
  return true;
}

export function markKeepTogether(element: HTMLElement) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return false;
  
  el.classList.add('dsd-print-keep-together');
  return true;
}
