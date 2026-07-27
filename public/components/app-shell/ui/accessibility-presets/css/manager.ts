/**
 * @file Accessibility Presets - CSS Manager
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/accessibility-presets/css/manager
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../state.js (appliedCssVars)
 * @provides applyCssVars, removeCssVars, applyBodyClasses
 * 
 * @description
 * Manages CSS custom properties and body classes for accessibility presets.
 * Applies/removes CSS variables to document root and toggles body classes.
 * 
 * @example
 * import { applyCssVars, removeCssVars, applyBodyClasses } from './manager.js';
 * applyCssVars({ '--font-size-base': '18px' });
 * applyBodyClasses(['a11y-large-text'], true);
 * ============================================================================
 */
'use strict';

import { appliedCssVars } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.css.manager';

export function applyCssVars(vars: DynObj) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const keys = Object.keys(vars);
  for (let i = 0; i < keys.length; i++) {
    root.style.setProperty(keys[i], vars[keys[i]]);
    (appliedCssVars as DynObj)[keys[i]] = vars[keys[i]];
  }
}

export function removeCssVars(vars: DynObj) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const keys = Object.keys(vars);
  for (let i = 0; i < keys.length; i++) {
    root.style.removeProperty(keys[i]);
    delete (appliedCssVars as DynObj)[keys[i]];
  }
}

export function applyBodyClasses(classes: DynObj, add: DynObj) {
  if (typeof document === 'undefined') return;
  
  for (let i = 0; i < classes.length; i++) {
    if (add) {
      document.body.classList.add(classes[i]);
    } else {
      document.body.classList.remove(classes[i]);
    }
  }
}
