// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   initialized, commandPalette, splitView, tourManager, metrics from ./state.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
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
 * Features Integration - Health
 * @module features-integration/health
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { initialized, commandPalette, splitView, tourManager, metrics } from './state.js';

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: initialized.value,
    metrics: { 
      commandsRegistered: metrics.commandsRegistered,
      toursRegistered: metrics.toursRegistered,
      errors: metrics.errors
    }
  };
}

export function healthCheck() {
  return {
    status: initialized.value ? 'HEALTHY' : 'NOT_INITIALIZED',
    version: VERSION,
    moduleId: MODULE_ID,
    hasCommandPalette: !!commandPalette.value,
    hasSplitView: !!splitView.value,
    hasTourManager: !!tourManager.value,
    metrics: {
      commandsRegistered: metrics.commandsRegistered,
      toursRegistered: metrics.toursRegistered,
      errors: metrics.errors
    }
  };
}
