// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Focus Manager - Queries
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FOCUSABLE_SELECTORS from ../constants.js
//
// PROVIDES:
//   getFocusableElements() — exported function
//   getFirstFocusable() — exported function
//   getLastFocusable() — exported function
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

import { FOCUSABLE_SELECTORS } from '../constants.js';

export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.focus-manager.core.queries';

// ============================================================================
// FOCUS QUERIES
// ============================================================================

/**
 * Retorna elementos focáveis dentro de um container
 * @param {HTMLElement} container
 * @returns {Array}
 */
export function getFocusableElements(container: HTMLElement) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return [];
  }
  
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
  
  // Filtrar elementos visíveis e acessíveis
  // @ts-expect-error strict migration — TS2769
  return elements.filter((el: HTMLElement) => {
    // Verificar visibilidade
    if (el.offsetParent === null && el.style.position !== 'fixed') {
      return false;
    }

    // Verificar aria-hidden
    if (el.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    // Verificar se está em elemento aria-hidden
    let parent = el.parentElement;
    while (parent) {
      if (parent.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      parent = parent.parentElement;
    }

    return true;
  });
}

/**
 * Retorna primeiro elemento focável
 * @param {HTMLElement} container
 * @returns {HTMLElement|null}
 */
export function getFirstFocusable(container: HTMLElement) {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}

/**
 * Retorna último elemento focável
 * @param {HTMLElement} container
 * @returns {HTMLElement|null}
 */
export function getLastFocusable(container: HTMLElement) {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] || null;
}

export default {
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable
};
