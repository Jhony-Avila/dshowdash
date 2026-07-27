// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-lifecycle-hooks
// PURPOSE: Lifecycle Hooks - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   HOOK_TYPES — exported value
//   DEFAULT_CONFIG — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-lifecycle-hooks';

export const HOOK_TYPES = [
  'beforeOpen',
  'afterOpen',
  'beforeClose',
  'afterClose',
  'beforeUpdate',
  'afterUpdate',
  'beforeCloseAll',
  'afterCloseAll',
  'beforeCloseMany',
  'afterCloseMany'
];

export const DEFAULT_CONFIG = {
  enabled: true,
  asyncHooks: true,
  timeoutMs: 5000,
  continueOnError: true,
  logErrors: true
};
