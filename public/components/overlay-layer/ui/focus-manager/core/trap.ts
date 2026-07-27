// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Focus Manager - Focus Trap
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getFocusableElements, getFirstFocusable from ./queries.js
//   focusElement from ./actions.js
//   saveFocus, restoreFocus from ../persistence/save-restore.js
//
// PROVIDES:
//   trap() — exported function
//   release() — exported function
//   isTrapped() — exported function
//   getTrapElement() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   document.addEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { 
  getConfig, 
  isTrapped as _isTrapped, 
  setTrapped, 
  getTrapElement as _getTrapElement,
  setTrapElement,
  getTrapHandler,
  setTrapHandler,
  incrementTotalTraps
} from '../state.js';
import { getFocusableElements, getFirstFocusable } from './queries.js';
import { focusElement } from './actions.js';
import { saveFocus, restoreFocus } from '../persistence/save-restore.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer.ui.focus-manager.core.trap';

// ============================================================================
// FOCUS TRAP
// ============================================================================

/**
 * Inicia trap de foco em um container
 * @param {HTMLElement} container
 * @param {Object} options
 * @returns {Object}
 */
export function trap(container: HTMLElement, options: DynObj) {
  options = options || {};
  const config = getConfig();
  
  if (!config.enabled || !config.trapFocus) {
    return { ok: false, skipped: true, reason: 'trap-disabled' };
  }
  
  if (!container || typeof container !== 'object') {
    return { ok: false, error: 'invalid-container' };
  }
  
  // Liberar trap anterior se existir
  if (_isTrapped()) {
    release();
  }
  
  // Salvar foco atual
  if (options.saveFocus !== false) {
    saveFocus();
  }
  
  // Handler para interceptar Tab
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    
    const focusables = getFocusableElements(container);
    if (focusables.length === 0) return;
    
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    
    if (event.shiftKey) {
      // Shift+Tab: se no primeiro, ir para último
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        (last as any).focus();
      }
    } else {
      // Tab: se no último, ir para primeiro
      if (active === last || !container.contains(active)) {
        event.preventDefault();
        (first as any).focus();
      }
    }
  };
  
  // Adicionar listener
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeyDown, true);
  }
  
  setTrapped(true);
  setTrapElement(container);
  setTrapHandler(handleKeyDown);
  incrementTotalTraps();
  
  // Focar no primeiro elemento se configurado
  if (config.autoFocusFirst && options.autoFocus !== false) {
    const focusTarget = options.initialFocus 
      ? container.querySelector(options.initialFocus)
      : getFirstFocusable(container);
    
    if (focusTarget) {
      setTimeout(() => { focusElement(focusTarget); }, config.focusDelay);
    }
  }
  
  return { 
    ok: true, 
    trapped: true, 
    container: container.tagName,
    focusableCount: getFocusableElements(container).length
  };
}

/**
 * Libera o trap de foco
 * @param {Object} options
 * @returns {Object}
 */
export function release(options?: DynObj) {
  options = options || {};
  
  if (!_isTrapped()) {
    return { ok: false, error: 'not-trapped' };
  }
  
  // Remover listener
  const handler = getTrapHandler();
  if (typeof document !== 'undefined' && handler) {
    document.removeEventListener('keydown', handler, true);
  }
  
  setTrapped(false);
  // @ts-expect-error strict migration — TS2345
  setTrapElement(null);
  setTrapHandler(null);
  
  // Restaurar foco se configurado
  if (options.restoreFocus !== false) {
    restoreFocus({ delay: options.restoreDelay });
  }
  
  return { ok: true, released: true };
}

/**
 * Verifica se há trap ativo
 * @returns {boolean}
 */
export function isTrapped() {
  return _isTrapped();
}

/**
 * Retorna elemento com trap ativo
 * @returns {HTMLElement|null}
 */
export function getTrapElement() {
  return _getTrapElement();
}

export default {
  trap,
  release,
  isTrapped,
  getTrapElement
};
