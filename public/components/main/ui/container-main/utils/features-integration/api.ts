// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-SPLIT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   commandPalette, splitView, tourManager from ./state.js
//   getCM from ./helpers.js
//
// PROVIDES:
//   startWelcomeTour() — exported function
//   openCommandPalette() — exported function
//   toggleSplitView() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Features Integration - Public API
 * @module features-integration/api
 * @version 1.3.0-SPLIT-AAA-CONTAINER-FIX-ES6
 * @changelog v1.3.0-SPLIT-CONTAINER-FIX - toggleSplitView usa .dsd-container__body em vez de #container-main
 * @changelog v1.2.0-SPLIT-FIX - toggleSplitView agora passa container para activate()
 * @changelog v1.1.0-LOGGER-INTEGRATED - Initial modular API
 */
'use strict';

import { commandPalette, splitView, tourManager } from './state.js';
import { getCM } from './helpers.js';

export const VERSION = '1.1.1-LOG-VERBOSITY';
export const MODULE_ID = 'main.ui.container-main.utils.features-integration.api';

export function startWelcomeTour() {
  const CM = getCM();
  tourManager.value = tourManager.value || (CM && CM.getTourManager ? CM.getTourManager() : null);
  if (tourManager.value && tourManager.value.startTour) (tourManager.value.startTour as (...args: unknown[]) => unknown)('welcome');
}

export function openCommandPalette() {
  const CM = getCM();
  commandPalette.value = commandPalette.value || (CM && CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : null);
  if (commandPalette.value && commandPalette.value.open) (commandPalette.value.open as (...args: unknown[]) => unknown)();
}

export function toggleSplitView() {
  const CM = getCM();
  splitView.value = splitView.value || (CM && CM.getSplitViewManager ? CM.getSplitViewManager() : null);
  if (splitView.value && splitView.value.toggle) {
    let body = document.querySelector('.dsd-container__body');
    if (!body) {
      const container = document.getElementById('container-main');
      body = container;
    }
    (splitView.value.toggle as (...args: unknown[]) => unknown)(body);
  }
}
