// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-UX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-ux-enhancements
// PURPOSE: UX Enhancements - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SAVE_ICONS — exported value
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

export const VERSION = '1.0.0-UX-ENHANCED';
export const MODULE_ID = 'container-ux-enhancements';

export const SAVE_ICONS = {
  check: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spinner: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="2" stroke-dasharray="20" stroke-dashoffset="10" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 6 6" to="360 6 6" dur="0.8s" repeatCount="indefinite"/></circle></svg>'
};
