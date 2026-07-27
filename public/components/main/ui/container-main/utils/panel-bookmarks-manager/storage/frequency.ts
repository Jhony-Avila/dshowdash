// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: frequency
// PURPOSE: Panel Bookmarks Manager - Frequency Storage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FREQUENCY_KEY from ../constants.js
//   getConfig, getPanelFrequency from ../state.js
//
// PROVIDES:
//   saveFrequency() — exported function
//   loadFrequency() — exported function
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

import { FREQUENCY_KEY } from '../constants.js';
import { getConfig, getPanelFrequency } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.storage.frequency';

export function saveFrequency() {
  const config = getConfig();
  if (!config.trackFrequency) return;
  try {
    localStorage.setItem(FREQUENCY_KEY, JSON.stringify(getPanelFrequency()));
  } catch (e) {}
}

export function loadFrequency() {
  const config = getConfig();
  if (!config.trackFrequency) return {};
  try {
    const raw = localStorage.getItem(FREQUENCY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
