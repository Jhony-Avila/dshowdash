// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer Transitions - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG, BUILTIN_TRANSITIONS from ./constants.js
//
// PROVIDES:
//   _config — exported value
//   _transitions — exported value
//   _state — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   updateConfig() — exported function
//   incrementTotalApplied() — exported function
//   getTotalApplied() — exported function
//   getActiveTransitions() — exported function
//   initBuiltinTransitions() — exported function
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

import { DEFAULT_CONFIG, BUILTIN_TRANSITIONS } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.transitions.state';

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
export function setConfig(cfg: DynObj) { _config = cfg; }
export function updateConfig(updates: DynObj) { _config = { ..._config, ...updates }; }

export const _transitions = {};

export const _state = {
  totalApplied: 0,
  activeTransitions: new Map()
};

export function incrementTotalApplied() { _state.totalApplied++; }
export function getTotalApplied() { return _state.totalApplied; }
export function getActiveTransitions() { return _state.activeTransitions; }

// Inicializar built-ins
export function initBuiltinTransitions() {
  for (const [name, transition] of Object.entries(BUILTIN_TRANSITIONS)) {
    (_transitions as DynObj)[name] = { ...transition, _builtin: true };
  }
}

// Auto-inicializar
initBuiltinTransitions();
