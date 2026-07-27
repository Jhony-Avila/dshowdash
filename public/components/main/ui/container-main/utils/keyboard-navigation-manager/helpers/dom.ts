// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom
// PURPOSE: Keyboard Navigation Manager - DOM Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   _getFocusableElements() — exported function
//   _getItemLabel() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.getComputedStyle
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.helpers.dom';

export function _getFocusableElements(container: HTMLElement) {
  const selectors = [
    'a[href]:not([disabled]):not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(selectors))
    .filter(el => {

      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

export function _getItemLabel(element: HTMLElement) {
  return element.getAttribute('aria-label') ||
         element.getAttribute('data-label') ||
         element.textContent?.trim() ||
         // @ts-expect-error TS migration - TS2339
         element.value ||
         '';
}
