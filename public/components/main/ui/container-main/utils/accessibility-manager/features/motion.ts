// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: motion
// PURPOSE: Accessibility Manager - Motion Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   A11Y_FEATURES from ../constants.js
//   getMediaQueries, updateUserPreferences from ../state.js
//   _emit from ../helpers/logger.js
//   setContrastMode from ./contrast.js
//   CONTRAST_MODES from ../constants.js
//
// PROVIDES:
//   _applyReducedMotion() — exported function
//   _setupMediaQueries() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

import { A11Y_FEATURES } from '../constants.js';
import { getMediaQueries, updateUserPreferences } from '../state.js';
import { _emit } from '../helpers/logger.js';
import { setContrastMode } from './contrast.js';
import { CONTRAST_MODES } from '../constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.features.motion';

export function _applyReducedMotion(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) {
    root.style.setProperty('--cm-transition-normal', '0.01ms');
    root.style.setProperty('--cm-transition-fast', '0.01ms');
    root.style.setProperty('--cm-transition-slow', '0.01ms');
    root.classList.add('dsd-reduced-motion');
  } else {
    root.style.removeProperty('--cm-transition-normal');
    root.style.removeProperty('--cm-transition-fast');
    root.style.removeProperty('--cm-transition-slow');
    root.classList.remove('dsd-reduced-motion');
  }
}

export function _setupMediaQueries() {
  const mediaQueries = getMediaQueries();

  (mediaQueries as Record<string, MediaQueryList>).reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  (mediaQueries as Record<string, MediaQueryList>).reducedMotion.addEventListener('change', (e: MediaQueryListEvent) => {
    updateUserPreferences({ reducedMotion: e.matches });
    _applyReducedMotion(e.matches);
    _emit('preferenceChanged', { feature: A11Y_FEATURES.REDUCED_MOTION, value: e.matches });
  });

  // @ts-expect-error TS migration - TS2339
  updateUserPreferences({ reducedMotion: mediaQueries.reducedMotion.matches });

  mediaQueries.highContrast = window.matchMedia('(prefers-contrast: more)');
  (mediaQueries as Record<string, MediaQueryList>).highContrast.addEventListener('change', (e: MediaQueryListEvent) => {
    updateUserPreferences({ highContrast: e.matches });
    if (e.matches) setContrastMode((CONTRAST_MODES as Record<string, string>).HIGH);
    _emit('preferenceChanged', { feature: A11Y_FEATURES.HIGH_CONTRAST, value: e.matches });
  });

  // @ts-expect-error TS migration - TS2339
  updateUserPreferences({ highContrast: mediaQueries.highContrast.matches });
}
