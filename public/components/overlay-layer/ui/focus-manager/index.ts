// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer - Focus Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, FOCUSABLE_SELECTORS from ./constants.js
//   getConfig as _getConfig, setConfig, getStateSnapshot from ./state.js
//
// PROVIDES:
//   configure() — exported function
//   getConfig() — exported function
//   getState() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   FOCUSABLE_SELECTORS — exported value
//   getFocusableElements — exported value
//   getFirstFocusable — exported value
//   getLastFocusable — exported value
//   focusElement — exported value
//   focusFirst — exported value
//   focusLast — exported value
//   focusNext — exported value
//   focusPrevious — exported value
//   trap — exported value
//   release — exported value
//   isTrapped — exported value
//   getTrapElement — exported value
//   saveFocus — exported value
//   restoreFocus — exported value
//   getSavedFocus — exported value
//   getFocusHistory — exported value
//   clearHistory — exported value
//   healthCheck — exported value
//   getMetrics — exported value
//   info — exported value
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

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION, MODULE_ID, FOCUSABLE_SELECTORS } from './constants.js';
import { getConfig as _getConfig, setConfig, getStateSnapshot } from './state.js';

import { 
  getFocusableElements, 
  getFirstFocusable, 
  getLastFocusable 
} from './core/queries.js';

import { 
  focusElement, 
  focusFirst, 
  focusLast, 
  focusNext, 
  focusPrevious 
} from './core/actions.js';

import { 
  trap, 
  release, 
  isTrapped, 
  getTrapElement 
} from './core/trap.js';

import { 
  saveFocus, 
  restoreFocus, 
  getSavedFocus, 
  getFocusHistory, 
  clearHistory 
} from './persistence/save-restore.js';

import { 
  healthCheck, 
  getMetrics, 
  info 
} from './diagnostics/health.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Atualiza configuração
 * @param {Object} config
 * @returns {boolean}
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  setConfig(config);
  return true;
}

/**
 * Retorna configuração
 * @returns {Object}
 */
export function getConfig() {
  return Object.assign({}, _getConfig());
}

/**
 * Retorna estado atual
 * @returns {Object}
 */
export function getState() {
  return getStateSnapshot();
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { VERSION, MODULE_ID, FOCUSABLE_SELECTORS };

// Queries
export { getFocusableElements, getFirstFocusable, getLastFocusable };

// Actions
export { focusElement, focusFirst, focusLast, focusNext, focusPrevious };

// Trap
export { trap, release, isTrapped, getTrapElement };

// Save/Restore
export { saveFocus, restoreFocus, getSavedFocus, getFocusHistory, clearHistory };

// Diagnostics
export { healthCheck, getMetrics, info };


// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Queries
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  // Actions
  focusFirst,
  focusLast,
  focusElement,
  focusNext,
  focusPrevious,
  // Save/Restore
  saveFocus,
  restoreFocus,
  getSavedFocus,
  getFocusHistory,
  clearHistory,
  // Trap
  trap,
  release,
  isTrapped,
  getTrapElement,
  // Config/State
  getState,
  configure,
  getConfig,
  getMetrics,
  // Diagnostics
  healthCheck,
  info,
  // Constants
  FOCUSABLE_SELECTORS,
  VERSION,
  MODULE_ID
};
