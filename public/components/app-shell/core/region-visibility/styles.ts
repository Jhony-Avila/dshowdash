/**
 * @file Region Visibility — Styles Injection
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/core/region-visibility/styles
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (CSS_CLASSES)
 * @requires ./state.js (_state, _config)
 * 
 * @provides injectStyles, removeStyles
 * 
 * @browserAPI document.createElement, document.head.appendChild
 * 
 * @description
 * Injects CSS styles for region visibility animations.
 * ============================================================================
 */
'use strict';

import { CSS_CLASSES } from './constants.js';
import { _state, _config } from './state.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-visibility.styles';

const STYLE_ID = 'app-shell-region-visibility-styles';

export function injectStyles() {
  if (_state.stylesInjected) return;
  if (typeof document === 'undefined') return;
  
  if (document.getElementById(STYLE_ID)) {
    _state.stylesInjected = true;
    return;
  }
  
  const duration = _config.animationDuration;
  
  const css = `
    .${CSS_CLASSES.HIDDEN} {
      display: none !important;
    }
    
    .${CSS_CLASSES.SHOWING} {
      animation: appShellFadeIn ${duration}ms ease-out;
    }
    
    .${CSS_CLASSES.HIDING} {
      animation: appShellFadeOut ${duration}ms ease-out;
    }
    
    @keyframes appShellFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes appShellFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
  
  _state.stylesInjected = true;
}

export function removeStyles() {
  if (typeof document === 'undefined') return;
  
  const style = document.getElementById(STYLE_ID);
  if (style && style.parentNode) {
    style.parentNode.removeChild(style);
  }
  
  _state.stylesInjected = false;
}
