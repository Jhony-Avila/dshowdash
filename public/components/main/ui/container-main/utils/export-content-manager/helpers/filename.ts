// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: filename
// PURPOSE: Export Content Manager - Filename Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//
// PROVIDES:
//   generateFilename() — exported function
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

import { getConfig } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.helpers.filename';

export function generateFilename(format: string) {
  const config = getConfig();
  let name = config.filename;
  if (config.includeDateInFilename) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    name += `_${dateStr}_${timeStr}`;
  }
  return `${name}.${format}`;
}
