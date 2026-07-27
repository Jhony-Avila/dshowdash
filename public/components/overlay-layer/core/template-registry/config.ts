// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - Config
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
//
// PROVIDES:
//   configure() — exported function
//   getConfig() — exported function
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

import { config } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.template-registry.config';

export function configure(newConfig: DynObj) {
  if (!newConfig || typeof newConfig !== 'object') return false;
  Object.assign(config, newConfig);
  return true;
}

export function getConfig() {
  return { ...config };
}
