// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: frequency
// PURPOSE: Panel Bookmarks Manager - Frequency Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getPanelFrequency from ../state.js
//   saveFrequency from ../storage/frequency.js
//
// PROVIDES:
//   getMostFrequent() — exported function
//   trackPanelAccess() — exported function
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

import { getConfig, getPanelFrequency } from '../state.js';
import { saveFrequency } from '../storage/frequency.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.operations.frequency';

export function getMostFrequent(limit = 10) {
  const frequency = getPanelFrequency();
  return Object.entries(frequency)

    // @ts-expect-error TS migration - TS2362, TS2363
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([panelId, count]) => ({ panelId, count }));
}

export function trackPanelAccess(panelId: string) {
  const config = getConfig();
  if (!config.trackFrequency) return;
  
  const frequency = getPanelFrequency();
  // @ts-expect-error TS migration - TS2365
  (frequency as Record<string, unknown>)[panelId] = ((frequency as Record<string, unknown>)[panelId] || 0) + 1;
  saveFrequency();
}
