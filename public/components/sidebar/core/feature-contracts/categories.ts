// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-categories
// PURPOSE: Sidebar Feature Categories - Enterprise Enum Definitions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CATEGORIES — exported value
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

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar-feature-categories';

export const CATEGORIES = Object.freeze({
  CORE: 'core',
  UI: 'ui',
  SEARCH: 'search',
  NAVIGATION: 'navigation',
  DATA: 'data',
  ACCESSIBILITY: 'accessibility',
  VISUAL: 'visual',
  PERFORMANCE: 'performance',
  DEBUG: 'debug'
});

export default CATEGORIES;
