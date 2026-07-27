// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: text-scale
// PURPOSE: Accessibility Manager - Text Scale
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   updateConfig, updateUserPreferences, incrementMetric from ../state.js
//   _emit from ../helpers/logger.js
//   _savePreferences from ../helpers/storage.js
//
// PROVIDES:
//   setTextScale() — exported function
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

import { updateConfig, updateUserPreferences, incrementMetric } from '../state.js';
import { _emit } from '../helpers/logger.js';
import { _savePreferences } from '../helpers/storage.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.features.text-scale';

export function setTextScale(scale: number) {
  if (scale < 0.8 || scale > 2.0) return false;

  const root = document.documentElement;
  root.style.setProperty('--dsd-text-scale', String(scale));
  root.style.fontSize = `${scale * 100}%`;

  if (scale > 1.1) {
    root.classList.add('dsd-large-text');
  } else {
    root.classList.remove('dsd-large-text');
  }

  updateConfig({ textScale: scale });
  updateUserPreferences({ textScale: scale });
  incrementMetric('preferencesChanged');
  _savePreferences();

  _emit('textScaleChanged', { scale });
  return true;
}
