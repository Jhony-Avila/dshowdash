// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - Config
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
//   stopAutoProcess from ./process.js
//
// PROVIDES:
//   configure() — exported function
//   getConfig() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
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
import { stopAutoProcess } from './process.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.pending-queue.config';

export function configure(newConfig: DynObj) {
  if (!newConfig || typeof newConfig !== 'object') return false;
  
  Object.assign(config, newConfig);
  
  if (config.maxSize < 1) config.maxSize = 1;
  if (config.maxAge < 1000) config.maxAge = 1000;
  if (config.processInterval < 1000) config.processInterval = 1000;
  
  return true;
}

export function getConfig() {
  return { ...config };
}

export function enable() {
  config.enabled = true;
}

export function disable() {
  config.enabled = false;
  stopAutoProcess();
}

export function isEnabled() {
  return config.enabled;
}
