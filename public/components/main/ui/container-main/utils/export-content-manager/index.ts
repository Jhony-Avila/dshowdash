// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Export Content Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_QUALITY from ./constants.js
//   createExportContentManager, exportElement from ./manager.js
//   getExportContentManager, configure, subscribe, healthCheck, info from ./api.js
//   exportToPNG from ./exports/png.js
//   exportToJPEG from ./exports/jpeg.js
//   exportToPDF from ./exports/pdf.js
//   exportToSVG from ./exports/svg.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EXPORT_FORMATS — exported value
//   EXPORT_QUALITY — exported value
//   createExportContentManager — exported value
//   exportElement — exported value
//   getExportContentManager — exported value
//   configure — exported value
//   subscribe — exported value
//   healthCheck — exported value
//   info — exported value
//   exportToPNG — exported value
//   exportToJPEG — exported value
//   exportToPDF — exported value
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

export { VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_QUALITY } from './constants.js';
export { createExportContentManager, exportElement } from './manager.js';
export { getExportContentManager, configure, subscribe, healthCheck, info } from './api.js';
export { exportToPNG } from './exports/png.js';
export { exportToJPEG } from './exports/jpeg.js';
export { exportToPDF } from './exports/pdf.js';
export { exportToSVG } from './exports/svg.js';

import { VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_QUALITY } from './constants.js';
import { createExportContentManager, exportElement } from './manager.js';
import { getExportContentManager, configure, subscribe, healthCheck, info } from './api.js';
import { exportToPNG } from './exports/png.js';
import { exportToJPEG } from './exports/jpeg.js';
import { exportToPDF } from './exports/pdf.js';
import { exportToSVG } from './exports/svg.js';

export default {
  VERSION,
  MODULE_ID,
  EXPORT_FORMATS,
  EXPORT_QUALITY,
  createExportContentManager,
  getExportContentManager,
  configure,
  exportToPNG,
  exportToJPEG,
  exportToPDF,
  exportToSVG,
  exportElement,
  subscribe,
  healthCheck,
  info
};
