// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-debug-panel.constants
// PURPOSE: Debug Panel - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_CONFIG — exported value
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

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-debug-panel.constants';

export const DEFAULT_CONFIG = Object.freeze({
  enabled: false,
  position: 'bottom-right',
  collapsed: true,
  opacity: 0.95,
  showMetrics: true,
  showStack: true,
  showEvents: true,
  showHealth: true,
  maxEvents: 50,
  refreshInterval: 1000,
  hotkey: 'ctrl+shift+o'
});

export default {
  VERSION,
  MODULE_ID,
  DEFAULT_CONFIG
};
