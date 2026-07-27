// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer Transitions - Query
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _transitions, getConfig, updateConfig from ../state.js
//
// PROVIDES:
//   get() — exported function
//   has() — exported function
//   list() — exported function
//   setDefault() — exported function
//   getDefault() — exported function
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

import { _transitions, getConfig, updateConfig } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.transitions.registry.query';

export function get(name: string) {
  const transition = (_transitions as DynObj)[name];
  if (!transition) return null;
  
  const { _builtin, _custom, ...rest } = transition;
  return { ...rest };
}

export function has(name: string) {
  return !!(_transitions as DynObj)[name];
}

export function list() {
  return Object.keys(_transitions).map(name => ({
    name,
    duration: (_transitions as DynObj)[name].duration,
    builtin: !!(_transitions as DynObj)[name]._builtin,
    custom: !!(_transitions as DynObj)[name]._custom
  }));
}

export function setDefault(name: string) {
  if (!(_transitions as DynObj)[name]) {
    return { ok: false, error: 'transition-not-found' };
  }
  updateConfig({ defaultTransition: name });
  return { ok: true, default: name };
}

export function getDefault() {
  return getConfig().defaultTransition;
}
