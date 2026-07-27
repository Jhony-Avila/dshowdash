// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:navigation-history
// PURPOSE: Navigation History - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NAVIGATION_TYPES — exported value
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
export const MODULE_ID = 'container-main:navigation-history';

export const NAVIGATION_TYPES = Object.freeze({
  PUSH: 'push',
  REPLACE: 'replace',
  POP: 'pop',
  GO: 'go'
});

export const DEFAULT_CONFIG = Object.freeze({
  maxHistorySize: 50,
  persistHistory: true,
  useBrowserHistory: false,
  baseUrl: '/app',
  onNavigate: null,
  debug: false
});
