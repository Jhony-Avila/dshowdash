/**
 * @file Focus Manager - Focus Guard
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/focus-manager/guard
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./state.js (focusGuards)
 * @provides createGuard, removeGuard
 * 
 * @description
 * Creates and manages focus guards that prevent focus on specific elements.
 * Guards intercept focusin events and blur matching elements.
 * 
 * @example
 * import { createGuard, removeGuard } from './guard.js';
 * createGuard('modal-guard', '[aria-hidden="true"] *');
 * removeGuard('modal-guard');
 * ============================================================================
 */
'use strict';

import { focusGuards } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.guard';

export function createGuard(id: DynObj, selector: string) {
  if (focusGuards.has(id)) {
    return { ok: false, error: 'Guard already exists' };
  }
  
  const handleFocusin = (e: DynObj) => {
    if (e.target.matches(selector)) {
      e.preventDefault();
      e.target.blur();
    }
  };
  
  document.addEventListener('focusin', handleFocusin, true);
  
  focusGuards.set(id, {
    id,
    selector,
    handler: handleFocusin
  });
  
  return { ok: true };
}

export function removeGuard(id: DynObj) {
  const guard = focusGuards.get(id);
  if (!guard) return false;
  
  document.removeEventListener('focusin', guard.handler, true);
  focusGuards.delete(id);
  return true;
}
