// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:export-content
// PURPOSE: Export Content Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EXPORT_FORMATS — exported value
//   EXPORT_QUALITY — exported value
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
export const MODULE_ID = 'container-main:export-content';

export const EXPORT_FORMATS = Object.freeze({
  PNG: 'png',
  JPEG: 'jpeg',
  PDF: 'pdf',
  SVG: 'svg'
});

export const EXPORT_QUALITY = Object.freeze({
  LOW: 0.6,
  MEDIUM: 0.8,
  HIGH: 0.92,
  MAXIMUM: 1.0
});

export const DEFAULT_CONFIG = Object.freeze({
  format: 'png',
  quality: 0.92,
  scale: 2,
  backgroundColor: null,
  filename: 'export',
  includeDateInFilename: true,
  maxWidth: null,
  maxHeight: null,
  watermark: null,
  excludeSelectors: ['.dsd-no-export', '.dsd-debug-panel'],
  onProgress: null
});
