// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lifecycle Hooks - Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, updateConfig, setLogger from ./state.js
//
// PROVIDES:
//   inject() — exported function
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

import { config, updateConfig, setLogger } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lifecycle-hooks.config';

export function inject(dependencies: DynObj) {
  if (dependencies.logger) setLogger(dependencies.logger);
}

export function configure(newConfig: DynObj) {
  if (!newConfig || typeof newConfig !== 'object') return false;
  updateConfig(newConfig);
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
}

export function isEnabled() {
  return config.enabled;
}
