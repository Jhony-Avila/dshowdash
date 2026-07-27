/**
 * @file Debug Presets — Backward Compatibility Wrapper
 * @version 1.2.0-P2-ENTERPRISE
 * @module app-shell/devtools/debug-presets
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./debug-presets/index.js (all exports)
 * @provides Re-exports all from debug-presets/index.js
 * 
 * @description
 * Backward compatibility wrapper that re-exports from the modular structure.
 * Allows existing code to import from the original path.
 * 
 * @example
 * import DebugPresets from './debug-presets.js';
 * import { apply, disable, getCurrent } from './debug-presets.js';
 * ============================================================================
 */
'use strict';

export { default } from './debug-presets/index.js';
export {
  VERSION,
  MODULE_ID,
  PRESETS,
  apply,
  applyCustom,
  disable,
  revert,
  getCurrent,
  getCurrentConfig,
  getPrevious,
  isEnabled,
  getPresetConfig,
  listPresets,
  getHistory,
  configure,
  getConfig,
  subscribe,
  minimal,
  standard,
  verbose,
  performance,
  network,
  memory,
  events,
  regions,
  getMetrics,
  healthCheck,
  info,
  injectPorts,
  getPortsSnapshot
} from './debug-presets/index.js';
