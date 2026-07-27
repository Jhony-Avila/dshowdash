// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - List
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   templates from ./state.js
//
// PROVIDES:
//   list() — exported function
//   listCustom() — exported function
//   listBuiltin() — exported function
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

import { templates } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.template-registry.list';

export function list() {
  return Object.keys(templates).map(id => ({
    id,
    type: (templates as DynObj)[id].type,
    builtin: !!(templates as DynObj)[id]._builtin,
    custom: !!(templates as DynObj)[id]._custom
  }));
}

export function listCustom() {
  return list().filter(t => t.custom);
}

export function listBuiltin() {
  return list().filter(t => t.builtin);
}
