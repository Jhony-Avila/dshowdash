// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:skeleton-manager
// PURPOSE: Skeleton Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SKELETON_TYPES — exported value
//   DELAY_VARIANTS — exported value
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
export const MODULE_ID = 'container-main:skeleton-manager';

export const SKELETON_TYPES = Object.freeze({
  DASHBOARD: 'dashboard',
  TABLE: 'table',
  LIST: 'list',
  PROFILE: 'profile',
  FORM: 'form',
  CARDS: 'cards',
  CHART: 'chart',
  GENERIC: 'generic',
  CUSTOM: 'custom'
});

export const DELAY_VARIANTS = Object.freeze({
  INSTANT: 'instant',
  NORMAL: 'normal',
  SLOW: 'slow'
});

export default {
  VERSION,
  MODULE_ID,
  SKELETON_TYPES,
  DELAY_VARIANTS
};
