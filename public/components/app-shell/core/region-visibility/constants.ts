/**
 * @file Region Visibility — Constants
 * @version 1.0.0
 * @module app-shell/core/region-visibility/constants
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides VERSION, MODULE_ID, REGION_MAP, CSS_CLASSES, DEFAULT_CONFIG
 * 
 * @description
 * Constants for region visibility module including region configuration
 * and CSS class names for animations.
 * ============================================================================
 */
'use strict';

export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-region-visibility';

export const REGION_MAP = Object.freeze({
  header: { id: 'app-shell-header', defaultVisible: true },
  sidebar: { id: 'app-shell-sidebar', defaultVisible: true },
  'nav-rail': { id: 'app-shell-nav-rail', defaultVisible: true },
  main: { id: 'app-shell-main', defaultVisible: true },
  footer: { id: 'app-shell-footer', defaultVisible: true },
  ticker: { id: 'app-shell-ticker', defaultVisible: false },
  preloader: { id: 'app-shell-preloader', defaultVisible: true },
  login: { id: 'app-shell-login', defaultVisible: false },
  toast: { id: 'app-shell-toast', defaultVisible: true }
});

export const CSS_CLASSES = Object.freeze({
  HIDDEN: 'app-shell-hidden',
  SHOWING: 'app-shell-showing',
  HIDING: 'app-shell-hiding',
  FULLSCREEN: 'app-shell-fullscreen'
});

export const DEFAULT_CONFIG = Object.freeze({
  animationDuration: 200,
  defaultAnimate: true
});
