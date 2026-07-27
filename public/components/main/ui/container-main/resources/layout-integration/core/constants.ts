// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:layout-integration
// PURPOSE: Layout Integration - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   INTEGRATION_MODES — exported value
//   LAYOUT_EVENTS — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:layout-integration';

// Modos de integração
export const INTEGRATION_MODES = Object.freeze({
  FULL: 'full',
  PARTIAL: 'partial',
  LEGACY: 'legacy',
  DISABLED: 'disabled'
});

// Eventos de layout padronizados
export const LAYOUT_EVENTS = Object.freeze({
  RESIZE_START: 'layout:resize-start',
  RESIZE_END: 'layout:resize-end',
  MOVE_START: 'layout:move-start',
  MOVE_END: 'layout:move-end',
  DOCK: 'layout:dock',
  UNDOCK: 'layout:undock',
  FULLSCREEN_ENTER: 'layout:fullscreen-enter',
  FULLSCREEN_EXIT: 'layout:fullscreen-exit',
  SPLIT: 'layout:split',
  UNSPLIT: 'layout:unsplit',
  STATE_CHANGE: 'layout:state-change'
});

export default {
  VERSION,
  MODULE_ID,
  INTEGRATION_MODES,
  LAYOUT_EVENTS
};
