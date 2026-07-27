// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: png
// PURPOSE: Export Content Manager - PNG Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EXPORT_FORMATS from ../constants.js
//   exportElement from ../manager.js
//
// PROVIDES:
//   (none)
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

import { EXPORT_FORMATS } from '../constants.js';
import { exportElement } from '../manager.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.exports.png';

export async function exportToPNG(element: HTMLElement, options: Record<string, unknown> = {}) {
  return exportElement(element, { ...options, format: EXPORT_FORMATS.PNG });
}
