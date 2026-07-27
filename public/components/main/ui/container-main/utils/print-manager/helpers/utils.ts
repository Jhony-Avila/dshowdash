// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils
// PURPOSE: Print Manager - Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PRINT_SIZES from ../constants.js
//
// PROVIDES:
//   _getPageSizeCSS() — exported function
//   _formatDate() — exported function
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

import { PRINT_SIZES } from '../constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.print-manager.helpers.utils';

export function _getPageSizeCSS(size: string) {
  const sizes = {
    [PRINT_SIZES.A4]: '210mm 297mm',
    [PRINT_SIZES.A3]: '297mm 420mm',
    [PRINT_SIZES.LETTER]: '8.5in 11in',
    [PRINT_SIZES.LEGAL]: '8.5in 14in',
    [PRINT_SIZES.AUTO]: 'auto'
  };
  return (sizes as Record<string, unknown>)[size] || sizes[PRINT_SIZES.A4];
}

export function _formatDate() {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
