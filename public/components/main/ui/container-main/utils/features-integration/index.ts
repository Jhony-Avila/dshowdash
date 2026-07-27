// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.2-LOTE11-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: features-integration/index
// PURPOSE: Features Integration - Command Palette, Split View, Tour
// @changelog v1.1.2-LOTE11-FIX: Corrigido re-export incorreto do main.bundle.js
// @changelog v1.1.1-LOG-VERBOSITY: Plumbing logs info→debug
// ═══════════════════════════════════════════════════════════════
'use strict';

// Constants
export { VERSION as CONST_VERSION, MODULE_ID } from './constants.js';

// API
export { startWelcomeTour, openCommandPalette, toggleSplitView } from './api.js';

// Health
export { info, healthCheck } from './health.js';

// Internal imports for init/destroy
import { MODULE_ID } from './constants.js';
import { initialized, resetManagers } from './state.js';
import { registerDefaultCommands } from './commands.js';
import { registerWelcomeTour } from './tour.js';
import { initializeSplitView } from './split-view.js';
import { setupKeyboardShortcuts } from './shortcuts.js';
import { startWelcomeTour, openCommandPalette, toggleSplitView } from './api.js';
import { info, healthCheck } from './health.js';
import { createLogger } from '../logger.js';

export const VERSION = '1.1.2-LOTE11-FIX';

const logger = createLogger(MODULE_ID);

export function init(options: Record<string, unknown>) {
  if (initialized.value) return { ok: true, alreadyInitialized: true };

  logger.debug('Initializing features integration...');

  setTimeout(() => {
    registerDefaultCommands();
    registerWelcomeTour();
    initializeSplitView();
    setupKeyboardShortcuts();
  }, 500);

  initialized.value = true;
  logger.debug('Initialized', { version: VERSION });

  return { ok: true, version: VERSION };
}

export function destroy() {
  initialized.value = false;
  resetManagers();
  return { ok: true };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  destroy,
  startWelcomeTour,
  openCommandPalette,
  toggleSplitView,
  info,
  healthCheck
};
