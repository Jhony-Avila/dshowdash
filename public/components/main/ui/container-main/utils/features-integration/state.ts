// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   initialized — exported value
//   commandPalette — exported value
//   splitView — exported value
//   tourManager — exported value
//   navigationHistory — exported value
//   zoomManager — exported value
//   printManager — exported value
//   bookmarksManager — exported value
//   exportManager — exported value
//   accessibilityManager — exported value
//   panelSearchManager — exported value
//   metrics — exported value
//   resetManagers() — exported function
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
 * Features Integration - State
 * @module features-integration/state
 */
'use strict';

export const VERSION = '1.1.1-LOG-VERBOSITY';
export const MODULE_ID = 'main.ui.container-main.utils.features-integration.state';

export let initialized = { value: false };
export let commandPalette = { value: null as Record<string, unknown> | null };
export let splitView = { value: null as Record<string, unknown> | null };
export let tourManager = { value: null as Record<string, unknown> | null };
export let navigationHistory = { value: null as Record<string, unknown> | null };
export let zoomManager = { value: null as Record<string, unknown> | null };
export let printManager = { value: null as Record<string, unknown> | null };
export let bookmarksManager = { value: null as Record<string, unknown> | null };
export let exportManager = { value: null as Record<string, unknown> | null };
export let accessibilityManager = { value: null as Record<string, unknown> | null };
export let panelSearchManager = { value: null as Record<string, unknown> | null };

export const metrics = {
  commandsRegistered: 0,
  toursRegistered: 0,
  errors: 0
};

export function resetManagers() {
  commandPalette.value = null;
  splitView.value = null;
  tourManager.value = null;
  navigationHistory.value = null;
  zoomManager.value = null;
  printManager.value = null;
  bookmarksManager.value = null;
  exportManager.value = null;
  accessibilityManager.value = null;
  panelSearchManager.value = null;
}
