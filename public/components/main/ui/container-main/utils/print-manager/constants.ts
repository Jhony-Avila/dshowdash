// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:print-manager
// PURPOSE: Print Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PRINT_ORIENTATIONS — exported value
//   PRINT_SIZES — exported value
//   PAGE_BREAK_MODES — exported value
//   DEFAULT_CONFIG — exported value
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

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:print-manager';

export const PRINT_ORIENTATIONS = Object.freeze({
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape'
});

export const PRINT_SIZES = Object.freeze({
  A4: 'A4',
  A3: 'A3',
  LETTER: 'letter',
  LEGAL: 'legal',
  AUTO: 'auto'
});

export const PAGE_BREAK_MODES = Object.freeze({
  AUTO: 'auto',
  AVOID: 'avoid',
  ALWAYS: 'always'
});

export const DEFAULT_CONFIG = Object.freeze({
  orientation: PRINT_ORIENTATIONS.PORTRAIT,
  pageSize: PRINT_SIZES.A4,
  margins: { top: 15, right: 15, bottom: 15, left: 15 },
  showHeader: true,
  showFooter: true,
  headerContent: null,
  footerContent: null,
  showPageNumbers: true,
  showDate: true,
  showTitle: true,
  title: null,
  excludeSelectors: ['.dsd-no-print', '.dsd-debug-panel', 'nav', 'aside'],
  includeOnlySelector: null,
  grayscale: false,
  removeBackgrounds: false,
  optimizeImages: true,
  scale: 1.0
});
