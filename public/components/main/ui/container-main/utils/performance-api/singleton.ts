// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: singleton
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPerformanceAPI from ./factory.js
//
// PROVIDES:
//   getPerformanceAPI() — exported function
//   resetPerformanceAPI() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Performance API - Singleton
 * @module performance-api/singleton
 */
'use strict';

import { createPerformanceAPI } from './factory.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.singleton';

let _instance: Record<string, unknown> | null = null;

export function getPerformanceAPI(options: Record<string, unknown> = {}) {
  if (!_instance) {
    _instance = createPerformanceAPI(options);
  }
  return _instance;
}

export function resetPerformanceAPI() {
  if (_instance) {
    (_instance.reset as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}
