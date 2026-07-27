// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: contrast
// PURPOSE: Accessibility Manager - Contrast
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTRAST_MODES from ../constants.js
//   updateConfig, updateUserPreferences, incrementMetric from ../state.js
//   _emit from ../helpers/logger.js
//   _savePreferences from ../helpers/storage.js
//
// PROVIDES:
//   setContrastMode() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTRAST_MODES } from '../constants.js';
import { updateConfig, updateUserPreferences, incrementMetric } from '../state.js';
import { _emit } from '../helpers/logger.js';
import { _savePreferences } from '../helpers/storage.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.features.contrast';

export function setContrastMode(mode: string) {
  if (!(Object.values(CONTRAST_MODES) as string[]).includes(mode)) return false;

  const root = document.documentElement;
  root.classList.remove('dsd-high-contrast', 'dsd-highest-contrast');

  if (mode === CONTRAST_MODES.HIGH) {
    root.classList.add('dsd-high-contrast');
  } else if (mode === CONTRAST_MODES.HIGHEST) {
    root.classList.add('dsd-high-contrast', 'dsd-highest-contrast');
  }

  updateConfig({ contrastMode: mode });
  updateUserPreferences({ contrastMode: mode });
  incrementMetric('preferencesChanged');
  _savePreferences();

  _emit('contrastModeChanged', { mode });
  return true;
}
