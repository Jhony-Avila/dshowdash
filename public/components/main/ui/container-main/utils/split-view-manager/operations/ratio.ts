// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ratio
// PURPOSE: Split View Manager - Ratio Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getCurrentRatio from ../state.js
//   _log, _emit from ../helpers/logger.js
//   _saveState from ../helpers/storage.js
//   _applyRatio from ../dom/ratio.js
//
// PROVIDES:
//   setRatio() — exported function
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

import { getCurrentRatio } from '../state.js';
import { _log, _emit } from '../helpers/logger.js';
import { _saveState } from '../helpers/storage.js';
import { _applyRatio } from '../dom/ratio.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.operations.ratio';

export function setRatio(ratio: number) {
  if (ratio < 0 || ratio > 1) {
    _log('error', 'Ratio must be between 0 and 1');
    return false;
  }
  
  _applyRatio(ratio);
  _saveState();
  _emit('ratioChanged', { ratio: getCurrentRatio() });
  
  return true;
}
