// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: trap
// PURPOSE: Accessibility Manager - Focus Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   incrementMetric from ../state.js
//   _emit from ../helpers/logger.js
//   announce from ../api.js
//
// PROVIDES:
//   setFocus() — exported function
//   trapFocus() — exported function
//   releaseFocus() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { incrementMetric } from '../state.js';
import { _emit } from '../helpers/logger.js';
import { announce } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.focus.trap';

export function setFocus(element: Element | string, options: Record<string, unknown> = {}) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return false;

  const { preventScroll = false, announce: shouldAnnounce = false } = options;

  (el as HTMLElement).focus({ preventScroll: preventScroll as boolean });
  incrementMetric('focusChanges');

  if (shouldAnnounce) {
    const label = el.getAttribute('aria-label') || (el as HTMLElement).textContent?.trim() || (el as HTMLElement).tagName;
    announce(`Foco em: ${label}`);
  }

  _emit('focusChanged', { element: el });
  return true;
}

export function trapFocus(container: Element | string) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return () => {};

  const focusableSelectors = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  const focusableElements = el.querySelectorAll(focusableSelectors);
  const firstFocusable = focusableElements[0] as HTMLElement | undefined;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement | undefined;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  el.addEventListener('keydown', handleKeyDown as EventListener);
  firstFocusable?.focus();

  _emit('focusTrapped', { container: el });

  return function releaseTrap() {
    el.removeEventListener('keydown', handleKeyDown as EventListener);
    _emit('focusReleased', { container: el });
  };
}

export function releaseFocus() {
  _emit('focusReleased', {});
}
