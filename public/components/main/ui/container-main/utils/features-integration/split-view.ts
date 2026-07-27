// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.1-WARN-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: split-view
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//   metrics, splitView from ./state.js
//   getCM from ./helpers.js
//   createLogger from ../logger.js
//
// PROVIDES:
//   initializeSplitView() — exported function
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
 * Features Integration - Split View
 * @module features-integration/split-view
 * @version 1.1.1-WARN-FIX
 * @changelog v1.1.1-WARN-FIX - SplitViewManager warn→debug (optional feature, not an error)
 * @changelog v1.1.0 - Migrated from console.* to centralized Logger
 */
'use strict';

import { MODULE_ID } from './constants.js';
import { metrics, splitView } from './state.js';
import { getCM } from './helpers.js';
import { createLogger } from '../logger.js';

export const VERSION = '1.1.1-WARN-FIX';

const logger = createLogger(`${MODULE_ID}:split-view`);

export function initializeSplitView() {
  const CM = getCM();
  if (!CM) return;

  splitView.value = CM.getSplitViewManager ? CM.getSplitViewManager() : null;
  if (!splitView.value) {
    logger.debug('SplitViewManager not available (optional feature)');
    return;
  }

  const container = document.getElementById('container-main');
  if (container) {
    try {
      if (splitView.value.init) (splitView.value.init as (...args: unknown[]) => unknown)({ container });
      logger.debug('SplitView initialized');
    } catch (e) {
      metrics.errors++;
      logger.warn('Failed to init SplitView', { error: (e as Error).message });
    }
  }
}
