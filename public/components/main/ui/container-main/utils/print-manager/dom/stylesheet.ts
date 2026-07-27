// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: stylesheet
// PURPOSE: Print Manager - Stylesheet Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getPrintStylesheet, setPrintStylesheet from ../state.js
//   _generatePrintStyles from ../styles/print-styles.js
//
// PROVIDES:
//   _injectPrintStylesheet() — exported function
//   _removePrintStylesheet() — exported function
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

import { getPrintStylesheet, setPrintStylesheet } from '../state.js';
import { _generatePrintStyles } from '../styles/print-styles.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.print-manager.dom.stylesheet';

export function _injectPrintStylesheet() {
  _removePrintStylesheet();
  
  const stylesheet = document.createElement('style');
  stylesheet.id = 'dsd-print-styles';
  stylesheet.textContent = _generatePrintStyles();
  document.head.appendChild(stylesheet);
  setPrintStylesheet(stylesheet);
}

export function _removePrintStylesheet() {
  const currentStylesheet = getPrintStylesheet();
  if (currentStylesheet) {
    (currentStylesheet as HTMLElement).remove();
    // @ts-expect-error strict migration — TS2345
    setPrintStylesheet(null);
  }
  
  const existing = document.getElementById('dsd-print-styles');
  if (existing) existing.remove();
}
