// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: helpers
// PURPOSE: Accessibility Manager - ARIA Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setAriaLabel() — exported function
//   setAriaDescribedBy() — exported function
//   setAriaLive() — exported function
//   setRole() — exported function
//   markAsLandmark() — exported function
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
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.aria.helpers';

export function setAriaLabel(element: Element | string, label: string) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) el.setAttribute('aria-label', label);
}

export function setAriaDescribedBy(element: Element | string, describedById: string) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) el.setAttribute('aria-describedby', describedById);
}

export function setAriaLive(element: Element | string, value: string) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) el.setAttribute('aria-live', value);
}

export function setRole(element: Element | string, role: string) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) el.setAttribute('role', role);
}

export function markAsLandmark(element: Element | string, landmark: string, label: string | null = null) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return;

  el.setAttribute('role', landmark);
  if (label) el.setAttribute('aria-label', label);
}
