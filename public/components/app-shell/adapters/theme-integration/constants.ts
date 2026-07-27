// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Theme Integration — Constants
 * @version 1.3.0-FIX-MISSING-EXPORTS
 * @module app-shell/adapters/theme-integration/constants
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides VERSION, MODULE_ID, THEMES
 * @provides THEME_ATTRIBUTE, THEME_CLASS_PREFIX, THEME_VARIABLES
 * @provides CSS_VARS (alias), STORAGE_KEY
 * 
 * @description
 * Constants and CSS variables for theme integration.
 * v1.3.0: Added CSS_VARS alias and STORAGE_KEY for theme-engine.js compatibility.
 * ============================================================================
 */
'use strict';

export const VERSION = '1.3.0-FIX-MISSING-EXPORTS';
export const MODULE_ID = 'app-shell-theme-integration';

export const THEMES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
});

export const THEME_ATTRIBUTE = 'data-theme';
export const THEME_CLASS_PREFIX = 'dsd-theme--';
export const STORAGE_KEY = 'app-shell-theme';

// v1.2.0-BLACK-BG: Dark theme uses pure black background
export const THEME_VARIABLES = {
  light: {
    '--dsd-bg-primary': '#ffffff',
    '--dsd-bg-secondary': '#f8fafc',
    '--dsd-bg-tertiary': '#f1f5f9',
    '--dsd-text-primary': '#1e293b',
    '--dsd-text-secondary': '#64748b',
    '--dsd-text-muted': '#94a3b8',
    '--dsd-border-color': '#e2e8f0',
    '--dsd-shadow-color': 'rgba(0, 0, 0, 0.1)',
    '--dsd-primary': '#3b82f6',
    '--dsd-primary-hover': '#2563eb',
    '--dsd-success': '#22c55e',
    '--dsd-warning': '#f59e0b',
    '--dsd-error': '#ef4444'
  },
  dark: {
    '--dsd-bg-primary': '#000000',
    '--dsd-bg-secondary': '#0a0a0a',
    '--dsd-bg-tertiary': '#141414',
    '--dsd-text-primary': '#f8fafc',
    '--dsd-text-secondary': '#cbd5e1',
    '--dsd-text-muted': '#64748b',
    '--dsd-border-color': '#1f1f1f',
    '--dsd-shadow-color': 'rgba(0, 0, 0, 0.5)',
    '--dsd-primary': '#60a5fa',
    '--dsd-primary-hover': '#3b82f6',
    '--dsd-success': '#4ade80',
    '--dsd-warning': '#fbbf24',
    '--dsd-error': '#f87171'
  }
};

// Alias for backward compatibility
export const CSS_VARS = THEME_VARIABLES;

export default {
  VERSION, MODULE_ID, THEMES,
  THEME_ATTRIBUTE, THEME_CLASS_PREFIX, THEME_VARIABLES,
  CSS_VARS, STORAGE_KEY
};
