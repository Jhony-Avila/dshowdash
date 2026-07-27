// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-SPLIT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: shortcuts
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//   commandPalette, splitView, panelSearchManager from ./state.js
//   getCM from ./helpers.js
//   createLogger from ../logger.js
//
// PROVIDES:
//   setupKeyboardShortcuts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Features Integration - Keyboard Shortcuts
 * @module features-integration/shortcuts
 * @version 1.2.0-SPLIT-AAA-CONTAINER-FIX-ES6
 * @changelog v1.2.0-SPLIT-CONTAINER-FIX - splitView.toggle() agora passa .dsd-container__body
 * @changelog v1.1.0 - Migrated from console.info to centralized Logger
 */
'use strict';

import { MODULE_ID } from './constants.js';
import { commandPalette, splitView, panelSearchManager } from './state.js';
import { getCM } from './helpers.js';
import { createLogger } from '../logger.js';

export const VERSION = '1.1.1-LOG-VERBOSITY';

const logger = createLogger(`${MODULE_ID}:shortcuts`);

export function setupKeyboardShortcuts() {
  const CM = getCM();
  
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      commandPalette.value = commandPalette.value || (CM && CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : null);
      if (commandPalette.value && commandPalette.value.open) (commandPalette.value.open as (...args: unknown[]) => unknown)();
      return;
    }

    if (e.ctrlKey && e.key === '\\') {
      e.preventDefault();
      splitView.value = splitView.value || (CM && CM.getSplitViewManager ? CM.getSplitViewManager() : null);
      if (splitView.value && splitView.value.toggle) {
        const body = document.querySelector('.dsd-container__body') || document.getElementById('container-main');
        (splitView.value.toggle as (...args: unknown[]) => unknown)(body);
      }
      return;
    }

    if (e.ctrlKey && e.key === 'f') {
      panelSearchManager.value = panelSearchManager.value || (CM && CM.getPanelSearchManager ? CM.getPanelSearchManager() : null);
      if (panelSearchManager.value) {
        e.preventDefault();
        if (panelSearchManager.value.open) (panelSearchManager.value.open as (...args: unknown[]) => unknown)();
      }
      return;
    }

    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      if (CM && CM.goBack) CM.goBack();
      return;
    }

    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      if (CM && CM.goForward) CM.goForward();
      return;
    }
  });

  logger.debug('Keyboard shortcuts registered');
}
