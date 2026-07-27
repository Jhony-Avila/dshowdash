// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Export Content Manager - Exports Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   exportToPNG — exported value
//   exportToJPEG — exported value
//   exportToPDF — exported value
//   internalExportToPDF — exported value
//   exportToSVG — exported value
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.exports';

export { exportToPNG } from './png.js';
export { exportToJPEG } from './jpeg.js';
export { exportToPDF, internalExportToPDF } from './pdf.js';
export { exportToSVG } from './svg.js';
