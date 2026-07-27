// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accessibility-manager.utils.helpers
// PURPOSE: Accessibility helper functions for media queries and announcements
// ───────────────────────────────────────────────────────────────
// @contract PREFERS_REDUCED_MOTION - prefersReducedMotion() detects reduced motion preference
// @contract PREFERS_HIGH_CONTRAST - prefersHighContrast() detects high contrast preference
// @contract ANNOUNCE - announce(message, priority) creates accessible announcements
// @contract DETECT_SYSTEM_PREFERENCES - detectSystemPreferences() detects all system a11y preferences
// @contract VALID_FLAGS - VALID_FLAGS array of valid accessibility flags
// @contract VALID_COLOR_BLIND_MODES - VALID_COLOR_BLIND_MODES array of color blind modes
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: prefersReducedMotion, prefersHighContrast, announce, detectSystemPreferences,
//           VALID_FLAGS, VALID_COLOR_BLIND_MODES, healthCheck, info, getVersion, VERSION, MODULE_ID
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.0-ENTERPRISE-AAA: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accessibility-manager.utils.helpers';

export const VALID_FLAGS = [
  'highContrast',
  'reducedMotion',
  'largeText',
  'screenReaderOptimized',
  'keyboardNavigation',
  'focusIndicators'
];

export const VALID_COLOR_BLIND_MODES = [
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia'
];

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function prefersHighContrast() {
  return window.matchMedia?.('(prefers-contrast: high)').matches ?? false;
}

export function detectSystemPreferences() {
  return {
    reducedMotion: prefersReducedMotion(),
    highContrast: prefersHighContrast(),
    darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  };
}

export function announce(message: string, priority = 'polite') {
  const el = document.createElement('div');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

export function getVersion() {
  return VERSION;
}

export function healthCheck() {
  const checks = {
    available: true,
    mediaQuerySupport: typeof window !== 'undefined' && !!window.matchMedia
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    helpers: ['prefersReducedMotion', 'prefersHighContrast', 'announce', 'detectSystemPreferences'],
    validFlags: VALID_FLAGS,
    validColorBlindModes: VALID_COLOR_BLIND_MODES,
    timestamp: Date.now()
  };
}

export default {
  prefersReducedMotion,
  prefersHighContrast,
  detectSystemPreferences,
  announce,
  VALID_FLAGS,
  VALID_COLOR_BLIND_MODES,
  healthCheck,
  info,
  getVersion,
  VERSION,
  MODULE_ID
};
