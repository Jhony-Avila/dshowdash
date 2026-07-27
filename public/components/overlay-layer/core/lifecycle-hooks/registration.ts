// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lifecycle Hooks - Registration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HOOK_TYPES from ./constants.js
//   hooks, isValidHookType from ./state.js
//
// PROVIDES:
//   on() — exported function
//   once() — exported function
//   off() — exported function
//   offAll() — exported function
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
export const MODULE_ID = 'overlay-layer.core.lifecycle-hooks.registration';

export function on(type: DynObj, handler: DynObj, options: { priority?: number; once?: boolean; name?: string; async?: boolean } = {}) {
  if (!isValidHookType(type)) {
    throw new Error(`Invalid hook type: ${type}. Valid types: ${HOOK_TYPES.join(', ')}`);
  }
  
  if (typeof handler !== 'function') {
    throw new Error('Hook handler must be a function');
  }
  
  const hookEntry = {
    id: `hook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    handler,
    priority: options.priority || 0,
    once: options.once || false,
    name: options.name || null,
    async: options.async !== false
  };
  
  (hooks as DynObj)[type].push(hookEntry);
  (hooks as DynObj)[type].sort((a: DynObj, b: DynObj) => b.priority - a.priority);
  
  return () => off(type, hookEntry.id);
}

export function once(type: DynObj, handler: DynObj, options: { priority?: number; name?: string; async?: boolean } = {}) {
  return on(type, handler, { ...options, once: true });
}

export function off(type: DynObj, handlerOrId: string) {
  if (!isValidHookType(type)) return false;
  
  const initialLength = (hooks as DynObj)[type].length;
  
  if (typeof handlerOrId === 'string') {
    (hooks as DynObj)[type] = (hooks as DynObj)[type].filter((h: DynObj) => h.id !== handlerOrId);
  } else if (typeof handlerOrId === 'function') {
    (hooks as DynObj)[type] = (hooks as DynObj)[type].filter((h: DynObj) => h.handler !== handlerOrId);
  }
  
  return (hooks as DynObj)[type].length < initialLength;
}

export function offAll(type: DynObj) {
  if (type) {
    if (!isValidHookType(type)) return false;
    (hooks as DynObj)[type] = [];
    return true;
  }
  
  for (const t of HOOK_TYPES) {
    (hooks as DynObj)[t] = [];
  }
  return true;
}
