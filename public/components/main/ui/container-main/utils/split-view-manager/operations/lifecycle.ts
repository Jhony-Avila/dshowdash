// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: lifecycle
// PURPOSE: Split View Manager - Lifecycle Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, setContainer, isActive, setIsActive, getCurrentRatio, incrementMet...
//   _log, _emit from ../helpers/logger.js
//   _saveState from ../helpers/storage.js
//   _createDOM, _destroyDOM from ../dom/builder.js
//
// PROVIDES:
//   activate() — exported function
//   deactivate() — exported function
//   toggle() — exported function
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

import { getConfig, setContainer, isActive, setIsActive, getCurrentRatio, incrementMetric } from '../state.js';
import { _log, _emit } from '../helpers/logger.js';
import { _saveState } from '../helpers/storage.js';
import { _createDOM, _destroyDOM } from '../dom/builder.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.operations.lifecycle';

export function activate(container: HTMLElement) {
  if (isActive()) {
    _log('warn', 'Split view already active');
    return false;
  }
  
  const resolvedContainer = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!resolvedContainer) {
    _log('error', 'Container not found');
    incrementMetric('errors');
    return false;
  }
  
  setContainer(resolvedContainer);
  _createDOM();
  setIsActive(true);
  incrementMetric('activations');
  _saveState();
  
  const config = getConfig();
  _emit('activated', { orientation: config.orientation, ratio: getCurrentRatio() });
  _log('debug', 'Split view activated');
  
  return true;
}

export function deactivate() {
  if (!isActive()) return false;
  
  _destroyDOM();
  setIsActive(false);
  _saveState();
  
  _emit('deactivated', {});
  _log('debug', 'Split view deactivated');
  
  return true;
}

export function toggle(container: HTMLElement) {
  return isActive() ? deactivate() : activate(container);
}
