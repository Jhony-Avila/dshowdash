// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUpdateNotifier from ./manager.js
//
// PROVIDES:
//   getUpdateNotifier() — exported function
//   resetUpdateNotifier() — exported function
//   checkForUpdates() — exported function
//   hasUpdate() — exported function
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
 * Update Notifier - Singleton State
 * @module update-notifier/state
 */
'use strict';

import { createUpdateNotifier } from './manager.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.update-notifier.state';

let _instance: Record<string, unknown> | null = null;

export function getUpdateNotifier(options: Record<string, unknown> = {}) {
  if (!_instance) {
    _instance = createUpdateNotifier(options);
  }
  return _instance;
}

export function resetUpdateNotifier() {
  if (_instance) {
    (_instance.destroy as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

export function checkForUpdates() {
  return (getUpdateNotifier().check as (...args: unknown[]) => unknown)();
}

export function hasUpdate() {
  return (getUpdateNotifier().hasUpdate as (...args: unknown[]) => unknown)();
}
