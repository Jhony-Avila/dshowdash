// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Focus Manager - Actions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//   getFocusableElements, getFirstFocusable, getLastFocusable from ./queries.js
//
// PROVIDES:
//   focusElement() — exported function
//   focusFirst() — exported function
//   focusLast() — exported function
//   focusNext() — exported function
//   focusPrevious() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getConfig } from '../state.js';
import { getFocusableElements, getFirstFocusable, getLastFocusable } from './queries.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.focus-manager.core.actions';

// ============================================================================
// FOCUS ACTIONS
// ============================================================================

/**
 * Foca em um elemento específico
 * @param {HTMLElement} element
 * @param {Object} options
 * @returns {Object|Promise}
 */
export function focusElement(element: DynObj, options?: DynObj) {
  options = options || {};
  
  if (!element || typeof element.focus !== 'function') {
    return { ok: false, error: 'invalid-element' };
  }
  
  const config = getConfig();
  const delay = options.delay !== undefined ? options.delay : config.focusDelay;
  
  const doFocus = () => {
    try {
      element.focus({ preventScroll: !config.scrollIntoView });
      
      if (config.scrollIntoView && options.scrollIntoView !== false) {
        if (element.scrollIntoView) {
          element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
      
      return { ok: true, element: element.tagName };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  };
  
  if (delay > 0) {
    return new Promise(resolve => {
      setTimeout(() => { resolve(doFocus()); }, delay);
    });
  }
  
  return doFocus();
}

/**
 * Foca no primeiro elemento focável
 * @param {HTMLElement} container
 * @param {Object} options
 * @returns {Object|Promise}
 */
export function focusFirst(container: HTMLElement, options: DynObj) {
  const element = getFirstFocusable(container);
  if (!element) {
    return { ok: false, error: 'no-focusable-element' };
  }
  
  return focusElement(element, options);
}

/**
 * Foca no último elemento focável
 * @param {HTMLElement} container
 * @param {Object} options
 * @returns {Object|Promise}
 */
export function focusLast(container: HTMLElement, options: DynObj) {
  const element = getLastFocusable(container);
  if (!element) {
    return { ok: false, error: 'no-focusable-element' };
  }
  
  return focusElement(element, options);
}

/**
 * Move foco para próximo elemento
 * @param {HTMLElement} container
 * @returns {Object|Promise}
 */
export function focusNext(container: HTMLElement) {
  const searchContainer = container || document.body;
  const focusables = getFocusableElements(searchContainer);
  // @ts-expect-error strict migration — TS2345
  const activeIndex = focusables.indexOf(document.activeElement);
  
  if (activeIndex === -1 || activeIndex === focusables.length - 1) {
    return focusElement(focusables[0]);
  }
  
  return focusElement(focusables[activeIndex + 1]);
}

/**
 * Move foco para elemento anterior
 * @param {HTMLElement} container
 * @returns {Object|Promise}
 */
export function focusPrevious(container: HTMLElement) {
  const searchContainer = container || document.body;
  const focusables = getFocusableElements(searchContainer);
  // @ts-expect-error strict migration — TS2345
  const activeIndex = focusables.indexOf(document.activeElement);
  
  if (activeIndex <= 0) {
    return focusElement(focusables[focusables.length - 1]);
  }
  
  return focusElement(focusables[activeIndex - 1]);
}

export default {
  focusElement,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious
};
