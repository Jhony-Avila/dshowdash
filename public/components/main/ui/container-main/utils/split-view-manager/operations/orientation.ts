// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orientation
// PURPOSE: Split View Manager - Orientation Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SPLIT_ORIENTATIONS from ../constants.js
//   getConfig, updateConfig, getContainer, isActive, getCurrentRatio from ../stat...
//   _log, _emit from ../helpers/logger.js
//   _saveState from ../helpers/storage.js
//   _applyRatio from ../dom/ratio.js
//
// PROVIDES:
//   setOrientation() — exported function
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

import { SPLIT_ORIENTATIONS } from '../constants.js';
import { getConfig, updateConfig, getContainer, isActive, getCurrentRatio } from '../state.js';
import { _log, _emit } from '../helpers/logger.js';
import { _saveState } from '../helpers/storage.js';
import { _applyRatio } from '../dom/ratio.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.operations.orientation';

export function setOrientation(orientation: string) {
  if (orientation !== SPLIT_ORIENTATIONS.HORIZONTAL && orientation !== SPLIT_ORIENTATIONS.VERTICAL) {
    _log('error', 'Invalid orientation:', orientation);
    return false;
  }
  
  const config = getConfig();
  if (config.orientation === orientation) return true;
  
  updateConfig({ orientation });
  
  if (isActive()) {
    const container = getContainer();
    const wrapper = container!.querySelector('.dsd-split-view');
    wrapper!.classList.remove('dsd-split-view--horizontal', 'dsd-split-view--vertical');
    wrapper!.classList.add(`dsd-split-view--${orientation}`);
    _applyRatio(getCurrentRatio());
  }
  
  _saveState();
  _emit('orientationChanged', { orientation });
  
  return true;
}
