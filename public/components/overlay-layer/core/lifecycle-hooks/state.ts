// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lifecycle Hooks - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HOOK_TYPES, DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   config — exported value
//   hooks — exported value
//   state — exported value
//   logger — exported value
//   setLogger() — exported function
//   initHooks() — exported function
//   updateConfig() — exported function
//   logError() — exported function
//   isValidHookType() — exported function
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

import { HOOK_TYPES, DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lifecycle-hooks.state';

export let config = { ...DEFAULT_CONFIG };

export const hooks = {};
export const state = {
  totalCalls: 0,
  cancelledByHook: 0,
  errors: 0,
  hookExecutions: {}
};

export let logger: DynObj = null;

export function setLogger(l: DynObj) {
  logger = l;
}

export function initHooks() {
  for (const type of HOOK_TYPES) {
    if (!(hooks as DynObj)[type]) {
      (hooks as DynObj)[type] = [];
    }
    if (!(state.hookExecutions as DynObj)[type]) {
      (state.hookExecutions as DynObj)[type] = { calls: 0, cancelled: 0, errors: 0 };
    }
  }
}

export function updateConfig(newConfig: DynObj) {
  config = { ...config, ...newConfig };
  if (config.timeoutMs < 100) config.timeoutMs = 100;
}

export function logError(message: string, error: DynObj) {
  if (config.logErrors && logger?.error) {
    logger.error(`[${MODULE_ID}]`, message, error?.message || error);
  }
}

export function isValidHookType(type: DynObj) {
  return HOOK_TYPES.includes(type);
}

// Initialize on load
initHooks();
