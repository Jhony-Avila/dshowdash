// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: jpeg
// PURPOSE: Export Content Manager - JPEG Export
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
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.exports.jpeg';

export async function exportToJPEG(element: HTMLElement, options: Record<string, unknown> = {}) {
  return exportElement(element, { 
    ...options, 
    format: EXPORT_FORMATS.JPEG,
    backgroundColor: options.backgroundColor || '#ffffff'
  });
}
