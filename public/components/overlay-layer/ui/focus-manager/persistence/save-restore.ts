// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Focus Manager - Save/Restore
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   saveFocus() — exported function
//   restoreFocus() — exported function
//   getSavedFocus() — exported function
//   getFocusHistory() — exported function
//   clearHistory() — exported function
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

import { 

  getConfig,
  getSavedFocus as _getSavedFocus,
  setSavedFocus,
  addToFocusHistory,
  getFocusHistory as _getFocusHistory,
  clearFocusHistory,
  incrementTotalRestores
} from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer.ui.focus-manager.persistence.save-restore';

// ============================================================================
// SAVE FOCUS
// ============================================================================

/**
 * Salva o foco atual
 * @returns {Object}
 */
export function saveFocus() {
  if (typeof document === 'undefined') {
    return { ok: false, error: 'no-document' };
  }
  
  const activeElement = document.activeElement;
  
  if (activeElement && activeElement !== document.body) {
    setSavedFocus(activeElement as DynObj);
    
    // Adicionar ao histórico
    addToFocusHistory({
      element: activeElement,
      timestamp: Date.now()
    });
    
    return { ok: true, element: activeElement.tagName, id: activeElement.id };
  }
  
  return { ok: false, error: 'no-active-element' };
}

// ============================================================================
// RESTORE FOCUS
// ============================================================================

/**
 * Restaura o foco salvo
 * @param {Object} options
 * @returns {Object|Promise}
 */
export function restoreFocus(options: DynObj) {
  options = options || {};
  const config = getConfig();
  
  if (!config.restoreFocus && !options.force) {
    return { ok: false, skipped: true, reason: 'restore-disabled' };
  }
  
  const target = options.element || _getSavedFocus();
  
  if (!target) {
    return { ok: false, error: 'no-saved-focus' };
  }
  
  // Verificar se elemento ainda está no DOM
  if (typeof document !== 'undefined' && !document.contains(target)) {
    // @ts-expect-error strict migration — TS2345
    setSavedFocus(null);
    return { ok: false, error: 'element-removed-from-dom' };
  }
  
  const delay = options.delay !== undefined ? options.delay : config.focusDelay;
  
  const doRestore = () => {
    try {
      target.focus({ preventScroll: options.preventScroll });
      // @ts-expect-error strict migration — TS2345
      setSavedFocus(null);
      incrementTotalRestores();
      return { ok: true, element: target.tagName };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  };
  
  if (delay > 0) {
    return new Promise(resolve => {
      setTimeout(() => { resolve(doRestore()); }, delay);
    });
  }
  
  return doRestore();
}

// ============================================================================
// FOCUS HISTORY
// ============================================================================

/**
 * Retorna foco salvo
 * @returns {HTMLElement|null}
 */
export function getSavedFocus() {
  return _getSavedFocus();
}

/**
 * Retorna histórico de foco formatado
 * @returns {Array}
 */
export function getFocusHistory() {
  const history = _getFocusHistory();
  
  return history.map((entry: DynObj) => ({
    tagName: entry.element ? entry.element.tagName : null,
    id: entry.element ? entry.element.id : null,
    timestamp: entry.timestamp,
    inDOM: typeof document !== 'undefined' && document.contains(entry.element)
  }));
}

/**
 * Limpa histórico de foco
 * @returns {Object}
 */
export function clearHistory() {
  clearFocusHistory();
  return { ok: true };
}

export default {
  saveFocus,
  restoreFocus,
  getSavedFocus,
  getFocusHistory,
  clearHistory
};
