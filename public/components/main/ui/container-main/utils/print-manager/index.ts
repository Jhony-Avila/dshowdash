// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Print Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES from ./...
//   createPrintManager, getPrintManager, configure, print, printElement, printPre...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PRINT_ORIENTATIONS — exported value
//   PRINT_SIZES — exported value
//   PAGE_BREAK_MODES — exported value
//   createPrintManager — exported value
//   getPrintManager — exported value
//   configure — exported value
//   print — exported value
//   printElement — exported value
//   printPreview — exported value
//   addPageBreak — exported value
//   removePageBreaks — exported value
//   markAvoidBreak — exported value
//   markKeepTogether — exported value
//   subscribe — exported value
//   healthCheck — exported value
//   info — exported value
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

export { VERSION, MODULE_ID, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES } from './constants.js';

export {
  createPrintManager,
  getPrintManager,
  configure,
  print,
  printElement,
  printPreview,
  addPageBreak,
  removePageBreaks,
  markAvoidBreak,
  markKeepTogether,
  subscribe,
  healthCheck,
  info
} from './api.js';

import { VERSION, MODULE_ID, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES } from './constants.js';
import {
  createPrintManager,
  getPrintManager,
  configure,
  print,
  printElement,
  printPreview,
  addPageBreak,
  removePageBreaks,
  markAvoidBreak,
  markKeepTogether,
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  PRINT_ORIENTATIONS,
  PRINT_SIZES,
  PAGE_BREAK_MODES,
  createPrintManager,
  getPrintManager,
  configure,
  print,
  printElement,
  printPreview,
  addPageBreak,
  removePageBreaks,
  markAvoidBreak,
  markKeepTogether,
  subscribe,
  healthCheck,
  info
};
