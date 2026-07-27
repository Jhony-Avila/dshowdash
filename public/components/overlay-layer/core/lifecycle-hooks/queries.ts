// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lifecycle Hooks - Queries
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HOOK_TYPES from ./constants.js
//   hooks, isValidHookType from ./state.js
//
// PROVIDES:
//   hasHooks() — exported function
//   countHooks() — exported function
//   listHooks() — exported function
//   getHookTypes() — exported function
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

import { HOOK_TYPES } from './constants.js';
import { hooks, isValidHookType } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lifecycle-hooks.queries';

export function hasHooks(type: DynObj) {
  if (!isValidHookType(type)) return false;
  return (hooks as DynObj)[type] && (hooks as DynObj)[type].length > 0;
}

export function countHooks(type?: DynObj) {
  if (type) {
    if (!isValidHookType(type)) return 0;
    return (hooks as DynObj)[type]?.length || 0;
  }
  
  let total = 0;
  for (const t of HOOK_TYPES) {
    total += (hooks as DynObj)[t]?.length || 0;
  }
  return total;
}

export function listHooks(type?: DynObj) {
  if (type) {
    if (!isValidHookType(type)) return [];
    return (hooks as DynObj)[type].map((h: DynObj) => ({
      id: h.id,
      name: h.name,
      priority: h.priority,
      once: h.once
    }));
  }
  
  const result = {};
  for (const t of HOOK_TYPES) {
    (result as DynObj)[t] = (hooks as DynObj)[t].map((h: DynObj) => ({
      id: h.id,
      name: h.name,
      priority: h.priority,
      once: h.once
    }));
  }
  return result;
}

export function getHookTypes() {
  return [...HOOK_TYPES];
}
