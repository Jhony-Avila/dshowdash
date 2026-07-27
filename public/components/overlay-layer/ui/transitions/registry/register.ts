// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer Transitions - Register
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BUILTIN_TRANSITIONS from ../constants.js
//   _transitions, getConfig from ../state.js
//
// PROVIDES:
//   register() — exported function
//   unregister() — exported function
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

import { BUILTIN_TRANSITIONS } from '../constants.js';
import { _transitions, getConfig } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.transitions.registry.register';

export function register(name: string, config: DynObj) {
  if (!name || typeof name !== 'string') {
    return { ok: false, error: 'invalid-name' };
  }
  
  if (!config || typeof config !== 'object') {
    return { ok: false, error: 'invalid-config' };
  }
  
  (_transitions as DynObj)[name] = {
    enter: config.enter || null,
    exit: config.exit || null,
    duration: config.duration || getConfig().defaultDuration,
    easing: config.easing || 'ease-out',
    _builtin: false,
    _custom: true
  };
  
  return { ok: true, name };
}

export function unregister(name: string) {
  if (!(_transitions as DynObj)[name]) {
    return { ok: false, error: 'not-found' };
  }
  
  if ((_transitions as DynObj)[name]._builtin) {
    return { ok: false, error: 'cannot-remove-builtin' };
  }
  
  delete (_transitions as DynObj)[name];
  
  if ((BUILTIN_TRANSITIONS as DynObj)[name]) {
    (_transitions as DynObj)[name] = { ...(BUILTIN_TRANSITIONS as DynObj)[name], _builtin: true };
  }
  
  return { ok: true, name };
}
